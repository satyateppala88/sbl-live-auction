import { useMemo, useState } from "react";
import { Target, X, ChevronDown } from "lucide-react";
import {
  CATEGORY_LABEL,
  REQUIREMENT,
  rosterOf,
  categoryCounts,
  type Cat,
  type Player,
  type Tier,
  type Team,
} from "@/lib/auction-data";

export type TargetMap = Record<string, { min: number | null; max: number | null }>;

const CATS: Cat[] = ["male", "female", "kid"];

/**
 * Pre-auction (and live) planner. Captains browse the roster grouped by category then
 * tier, and set the most they'd pay per player. A live budget panel keeps the maths
 * honest — purse, planned spend to complete the squad, and whether they're over budget
 * or haven't planned enough targets to fill a required slot. Only their team sees this.
 */
export function TargetPlanner({
  players,
  tiers,
  targets,
  onSave,
  team,
}: {
  players: Player[];
  tiers: Tier[];
  targets: TargetMap;
  onSave: (playerId: string, min: number | null, max: number | null) => void;
  team: Team;
}) {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState<Cat | null>("male");

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.sort_order - b.sort_order),
    [tiers],
  );
  const floorBase = tiers.length ? Math.min(...tiers.map((t) => Number(t.base_price))) : 1;

  const bought = categoryCounts(rosterOf(players, team.id));
  const purse = Number(team.remaining_budget);

  const availOf = (c: Cat) => players.filter((p) => p.category === c && p.status === "available");
  const cheapestBase = (c: Cat) => {
    const bs = availOf(c).map((p) => Number(p.base_price));
    return bs.length ? Math.min(...bs) : floorBase;
  };

  const plan = useMemo(() => {
    const per = CATS.map((c) => {
      const need = Math.max(0, REQUIREMENT[c] - bought[c]);
      const tg = availOf(c)
        .filter((p) => targets[p.id]?.max != null)
        .map((p) => Number(targets[p.id]!.max))
        .sort((a, b) => a - b);
      let spend = 0;
      let covered = 0;
      for (let i = 0; i < need; i++) {
        if (i < tg.length) {
          spend += tg[i];
          covered++;
        } else {
          spend += cheapestBase(c);
        }
      }
      return { c, need, covered, planned: tg.length, spend };
    });
    const total = per.reduce((s, p) => s + p.spend, 0);
    return { per, total, left: purse - total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets, players, tiers, team.id, team.remaining_budget]);

  const over = plan.left < 0;
  const under = plan.per.some((p) => p.covered < p.need);
  const setCount = Object.values(targets).filter((t) => t.min !== null || t.max !== null).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent transition hover:bg-accent/20"
      >
        <Target className="h-3.5 w-3.5" /> My targets{setCount > 0 ? ` (${setCount})` : ""}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-background/95 backdrop-blur">
          <div className="arena-bg star-field min-h-full px-4 py-6">
            <div className="star-field-layer" aria-hidden />
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3">
                <Target className="text-accent h-6 w-6" />
                <div className="flex-1">
                  <h1 className="font-display text-2xl uppercase leading-none sm:text-3xl">
                    My target plan
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Plan by category. Set the most you'd pay for each player — the maths stays live
                    so you don't over- or under-spend. Only your team sees this.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Close planner"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="sticky top-2 z-10 mt-4 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Purse
                    </p>
                    <p className="font-display text-gold-solid text-xl tabular-nums">{purse}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Planned
                    </p>
                    <p className="font-display text-xl tabular-nums">~{plan.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Left
                    </p>
                    <p
                      className={`font-display text-xl tabular-nums ${over ? "text-smash" : "text-success"}`}
                    >
                      ~{plan.left}
                    </p>
                  </div>
                </div>
                <p
                  className={`mt-2 text-center text-xs font-semibold ${
                    over ? "text-smash" : under ? "text-primary" : "text-success"
                  }`}
                >
                  {over
                    ? `Over budget by ${-plan.left} pts — trim a target.`
                    : under
                      ? "Under-planned — set a max for the categories marked amber."
                      : `On track — about ${plan.left} pts to spare.`}
                </p>
              </div>

              <div className="mt-3 space-y-2 pb-8">
                {CATS.map((c) => {
                  const pc = plan.per.find((x) => x.c === c)!;
                  const isOpen = openCat === c;
                  const catPlayers = availOf(c);
                  const taken = players.filter((p) => p.category === c && p.status === "sold").length;
                  const done = pc.need === 0 || pc.covered >= pc.need;
                  return (
                    <div
                      key={c}
                      className="overflow-hidden rounded-2xl border border-border bg-card/60"
                    >
                      <button
                        onClick={() => setOpenCat(isOpen ? null : c)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${done ? "bg-success" : "bg-primary"}`}
                        />
                        <span className="font-display text-sm uppercase tracking-wide">
                          {CATEGORY_LABEL[c]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {bought[c]}/{REQUIREMENT[c]} bought · {pc.planned} planned
                          {taken > 0 ? ` · ${taken} taken` : ""}
                        </span>
                        <span className="ml-auto flex items-center gap-2">
                          <span className="font-display text-gold-solid text-sm tabular-nums">
                            ~{pc.spend}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border px-3 pb-3 pt-2">
                          {pc.need > 0 && pc.covered < pc.need && (
                            <p className="mb-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] text-primary">
                              Set a max on {pc.need - pc.covered} more {CATEGORY_LABEL[c]} target
                              {pc.need - pc.covered === 1 ? "" : "s"} to cover this slot.
                            </p>
                          )}
                          {sortedTiers.map((tier) => {
                            const group = catPlayers.filter((p) => p.tier_id === tier.id);
                            if (group.length === 0) return null;
                            return (
                              <div key={tier.id} className="mb-2">
                                <p className="px-1 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  {tier.label} · base {Number(tier.base_price)}
                                </p>
                                <div className="space-y-1.5">
                                  {group.map((p) => (
                                    <PlayerRow key={p.id} p={p} t={targets[p.id]} onSave={onSave} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {catPlayers.filter((p) => !tiers.some((t) => t.id === p.tier_id)).length >
                            0 && (
                            <div className="mb-1">
                              <p className="px-1 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                No tier
                              </p>
                              <div className="space-y-1.5">
                                {catPlayers
                                  .filter((p) => !tiers.some((t) => t.id === p.tier_id))
                                  .map((p) => (
                                    <PlayerRow key={p.id} p={p} t={targets[p.id]} onSave={onSave} />
                                  ))}
                              </div>
                            </div>
                          )}
                          {catPlayers.length === 0 && (
                            <p className="py-4 text-center text-xs text-muted-foreground">
                              No available players left in this category.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlayerRow({
  p,
  t,
  onSave,
}: {
  p: Player;
  t: { min: number | null; max: number | null } | undefined;
  onSave: (playerId: string, min: number | null, max: number | null) => void;
}) {
  const cur = t ?? { min: null, max: null };
  const set = cur.min !== null || cur.max !== null;
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 rounded-xl border px-3 py-2 ${
        set ? "border-accent/50 bg-accent/5" : "border-border bg-card/70"
      }`}
    >
      <p className="truncate text-sm font-semibold">{p.name}</p>
      <label className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        Min
        <input
          type="number"
          min={0}
          defaultValue={cur.min ?? ""}
          placeholder="—"
          onBlur={(e) =>
            onSave(p.id, e.target.value === "" ? null : Number(e.target.value), cur.max)
          }
          className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm text-foreground outline-none focus:border-accent"
        />
      </label>
      <label className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        Max
        <input
          type="number"
          min={0}
          defaultValue={cur.max ?? ""}
          placeholder="—"
          onBlur={(e) =>
            onSave(p.id, cur.min, e.target.value === "" ? null : Number(e.target.value))
          }
          className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm text-foreground outline-none focus:border-accent"
        />
      </label>
    </div>
  );
}
