import { PlayerAvatar } from "./PlayerAvatar";
import { TeamCrest } from "./TeamCrest";
import { TierRating } from "./TierRating";
import { CATEGORY_LABEL, type Player, type Team, type Tier } from "@/lib/auction-data";

function tierRank(p: Player, tiers: Tier[]) {
  return tiers.find((t) => t.id === p.tier_id)?.sort_order ?? 99;
}



function statusMeta(p: Player, teams: Team[]) {
  switch (p.status) {
    case "sold": {
      const t = teams.find((x) => x.id === p.sold_to_team_id);
      return {
        text: `${t?.name ?? "Sold"} · ${Number(p.sold_price)} pts`,
        className: "bg-success/15 text-success",
        accent: t?.color,
        team: t,
      };
    }
    case "on_auction":
      return { text: "On the block", className: "bg-primary/20 text-primary animate-pulse" };
    case "in_unsold_pool":
      return { text: "Unsold pool", className: "bg-amber-500/15 text-amber-400" };
    case "unsold":
      return { text: "Unsold", className: "bg-destructive/15 text-destructive" };
    default:
      return { text: "Available", className: "bg-muted text-muted-foreground" };
  }
}


export function RosterBoard({
  players,
  teams,
  tiers,
}: {
  players: Player[];
  teams: Team[];
  tiers: Tier[];
}) {
  return (
    <div className="grid gap-6">
      {(["male", "female", "kid"] as const).map((cat) => {
        const group = players
          .filter((p) => p.category === cat)
          .slice()
          .sort((a, b) => tierRank(a, tiers) - tierRank(b, tiers));

        return (
          <section key={cat}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {CATEGORY_LABEL[cat]} · {group.length}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {group.map((p) => {
                const meta = statusMeta(p, teams);
                return (
                  <div
                    key={p.id}
                    className="lift-card overflow-hidden rounded-xl border border-border bg-card hover:[transform:translateY(-3px)] hover:[box-shadow:var(--shadow-glow)]"
                    style={meta.accent ? { borderColor: meta.accent } : undefined}
                  >
                    <PlayerAvatar
                      name={p.name}
                      photoUrl={p.photo_url}
                      className="aspect-square w-full rounded-none text-3xl"
                    />
                    <div className="p-2">

                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {tiers.find((t) => t.id === p.tier_id)?.label ?? "No tier"} · base{" "}
                        {Number(p.base_price)}
                      </p>
                      <TierRating tier={tiers.find((t) => t.id === p.tier_id)?.label} size="h-3 w-3" className="mt-0.5" />
                      <span
                        className={`mt-1 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${meta.className}`}
                      >
                        {"team" in meta && meta.team && <TeamCrest team={meta.team} size={16} />}
                        <span className="truncate">{meta.text}</span>
                      </span>

                    </div>
                  </div>
                );
              })}
              {group.length === 0 && (
                <p className="text-sm text-muted-foreground">No players in this category.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
