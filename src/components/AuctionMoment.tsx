import { useEffect, useRef, useState } from "react";
import { Confetti } from "./Confetti";
import { TeamCrest } from "./TeamCrest";
import type { Player, Team } from "@/lib/auction-data";

type Moment = {
  key: number;
  kind: "sold" | "unsold";
  name: string;
  teamName?: string | undefined;
  teamColor?: string | undefined;
  teamLogoUrl?: string | null | undefined;
  price?: number | undefined;
  detail: string;
};

/**
 * Watches the players list for status flips and returns a short-lived
 * "moment" to celebrate (SOLD, with confetti) or note (UNSOLD).
 */
export function useAuctionMoment(players: Player[], teams: Team[]) {
  const prev = useRef<Map<string, string> | null>(null);
  const [moment, setMoment] = useState<Moment | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const next = new Map(players.map((p) => [p.id, p.status]));
    const before = prev.current;
    prev.current = next;
    if (!before) return;

    for (const p of players) {
      const was = before.get(p.id);
      if (!was || was === p.status) continue;
      if (p.status === "sold") {
        const team = teams.find((t) => t.id === p.sold_to_team_id);
        seq.current += 1;
        setMoment({
          key: seq.current,
          kind: "sold",
          name: p.name,
          teamName: team?.name ?? "the team",
          teamColor: team?.color,
          teamLogoUrl: team?.logo_url ?? null,
          price: Number(p.sold_price),
          detail: `${team?.name ?? "Sold"} · ${Number(p.sold_price)} pts`,
        });
        return;
      }
      if (p.status === "unsold" || p.status === "in_unsold_pool") {
        seq.current += 1;
        setMoment({ key: seq.current, kind: "unsold", name: p.name, detail: "No bids" });
        return;
      }
    }
  }, [players, teams]);

  useEffect(() => {
    if (!moment) return;
    const t = setTimeout(() => setMoment(null), moment.kind === "sold" ? 2800 : 1100);
    return () => clearTimeout(t);
  }, [moment]);

  return moment;
}

export function AuctionMomentOverlay({ moment }: { moment: Moment | null }) {
  if (!moment) return null;
  const sold = moment.kind === "sold";

  if (!sold) {
    return (
      <div
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        aria-live="polite"
      >
        {/* red scanline sweeping down the whole screen */}
        <div
          key={`scan-${moment.key}`}
          className="animate-scanline-sweep absolute inset-x-0 top-0 h-24"
          style={{
            background:
              "linear-gradient(to bottom, transparent, oklch(0.6 0.23 27 / 0.35), transparent)",
          }}
          aria-hidden
        />
        <div
          key={moment.key}
          className="animate-shake-out rounded-2xl border-4 border-destructive bg-background/85 px-8 py-5 text-center text-destructive backdrop-blur-sm"
        >
          <p className="font-heavy text-6xl uppercase leading-none tracking-tight sm:text-8xl">
            Unsold
          </p>
          <p className="mt-2 text-lg font-bold uppercase tracking-wide text-foreground">
            {moment.name}
          </p>
          <p className="text-sm text-muted-foreground">{moment.detail}</p>
        </div>
      </div>
    );
  }

  const color = moment.teamColor ?? "oklch(0.83 0.16 85)";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-live="polite"
    >
      <Confetti />
      {/* radial flash flooding the screen in the winning team's colour */}
      <div
        key={`flash-${moment.key}`}
        className="animate-team-flash absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${color}55, transparent 70%)`,
        }}
        aria-hidden
      />
      {/* the whole stage shakes as the stamp slams down */}
      <div className="animate-screen-shake relative flex flex-col items-center">
        {moment.teamLogoUrl && (
          <img
            src={moment.teamLogoUrl}
            alt=""
            aria-hidden
            className="animate-crest-pop absolute -z-10 h-72 w-72 rounded-full object-cover opacity-25 sm:h-96 sm:w-96"
            style={{ boxShadow: `0 0 120px 30px ${color}66` }}
          />
        )}
        <p
          key={`c-${moment.key}`}
          className="text-gold-solid animate-congrats text-xs font-bold uppercase tracking-[0.35em]"
        >
          🎉 Congratulations 🎉
        </p>
        <p
          key={moment.key}
          className="font-heavy animate-stamp-slam text-gold mt-1 text-8xl uppercase leading-none tracking-tight sm:text-[10rem]"
          style={{ textShadow: `0 6px 40px ${color}88` }}
        >
          Sold!
        </p>
        <div
          key={`d-${moment.key}`}
          className="animate-congrats mt-3 flex items-center gap-3 rounded-3xl border border-border bg-background/90 px-8 py-4 backdrop-blur-sm"
        >
          {moment.teamLogoUrl && (
            <TeamCrest
              team={{ name: moment.teamName ?? "", color, logo_url: moment.teamLogoUrl }}
              size={48}
            />
          )}
          <div className="text-left">
            <p className="text-2xl font-black uppercase leading-tight text-foreground">
              {moment.name}
            </p>
            <p className="text-base text-muted-foreground">
              goes to <span className="font-bold" style={{ color }}>{moment.teamName}</span>
            </p>
          </div>
          <p className="text-gold font-heavy pl-3 text-4xl tabular-nums">{moment.price}</p>
        </div>
      </div>
    </div>
  );
}
