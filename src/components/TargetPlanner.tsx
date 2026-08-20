import { useMemo, useState } from "react";
import { Target, X, Search } from "lucide-react";
import { sortForAuction, CATEGORY_LABEL, type Player, type Tier } from "@/lib/auction-data";

export type TargetMap = Record<string, { min: number | null; max: number | null }>;

/**
 * Pre-auction planner: a captain browses the full registered roster and sets a min/max
 * bid per player they want. Opens as a full-screen overlay (own state). Saving is
 * handled by the parent via onSave so it can persist through the PIN-gated server fn
 * and keep the live bidding hint in sync.
 */
export function TargetPlanner({
  players,
  tiers,
  targets,
  onSave,
}: {
  players: Player[];
  tiers: Tier[];
  targets: TargetMap;
  onSave: (playerId: string, min: number | null, max: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const sorted = sortForAuction(players, tiers);
    const needle = q.trim().toLowerCase();
    return needle ? sorted.filter((p) => p.name.toLowerCase().includes(needle)) : sorted;
  }, [players, tiers, q]);

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
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3">
                <Target className="text-accent h-6 w-6" />
                <div className="flex-1">
                  <h1 className="font-display text-2xl uppercase leading-none sm:text-3xl">
                    My target list
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Plan your min &amp; max bid per player. Only your team sees this. During the
                    auction you'll get a nudge when a player you planned for comes up.
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

              <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search players…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Player</span>
                <span className="w-16 text-center">Min</span>
                <span className="w-16 text-center">Max</span>
              </div>

              <div className="mt-1 space-y-1.5 pb-6">
                {list.map((p) => {
                  const t = targets[p.id] ?? { min: null, max: null };
                  const tier = tiers.find((x) => x.id === p.tier_id)?.label ?? "—";
                  const set = t.min !== null || t.max !== null;
                  return (
                    <div
                      key={p.id}
                      className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 rounded-xl border px-3 py-2 ${
                        set ? "border-accent/50 bg-accent/5" : "border-border bg-card/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {CATEGORY_LABEL[p.category]} · {tier} · base {Number(p.base_price)}
                        </p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        defaultValue={t.min ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          onSave(p.id, v, t.max);
                        }}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:border-accent"
                      />
                      <input
                        type="number"
                        min={0}
                        defaultValue={t.max ?? ""}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          onSave(p.id, t.min, v);
                        }}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:border-accent"
                      />
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No players found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
