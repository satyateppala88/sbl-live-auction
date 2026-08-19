import { PlayerAvatar } from "./PlayerAvatar";
import { rosterOf, type Player, type Team } from "@/lib/auction-data";

export function RosterSlots({
  team,
  players,
  size = "md",
}: {
  team: Team;
  players: Player[];
  size?: "sm" | "md";
}) {
  const roster = rosterOf(players, team.id);
  const total = Math.max(team.max_roster_size, roster.length + 1);
  const emptyCount = Math.max(0, total - 1 - roster.length);
  const box = size === "sm" ? "h-14 w-14 text-sm" : "h-20 w-20 text-lg";

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <PlayerAvatar
            name={team.captain_name || "Captain"}
            photoUrl={team.captain_photo_url}
            className={box}
            accent={team.color}
          />
          <span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-background"
            style={{ backgroundColor: team.color }}
          >
            Captain
          </span>
        </div>
        <span className="max-w-[5rem] truncate text-[11px] text-muted-foreground">
          {team.captain_name || "—"}
        </span>
      </div>

      {roster.map((p) => (
        <div key={p.id} className="animate-slot-in flex flex-col items-center gap-1">
          <PlayerAvatar name={p.name} photoUrl={p.photo_url} className={box} />
          <span className="max-w-[5rem] truncate text-[11px]">
            {p.name}
            <span className="text-gold-solid ml-1 font-mono">{Number(p.sold_price)}</span>
          </span>
        </div>
      ))}

      {Array.from({ length: emptyCount }).map((_, i) => (
        <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
          <div
            className={`${box} flex items-center justify-center rounded-xl border-2 border-dashed border-border/70 text-muted-foreground/50 transition-colors`}
          >
            +
          </div>
          <span className="text-[11px] text-muted-foreground/60">Empty</span>
        </div>
      ))}
    </div>
  );
}
