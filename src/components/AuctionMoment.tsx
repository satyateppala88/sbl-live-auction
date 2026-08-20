import { useEffect, useRef, useState } from "react";
import { Confetti } from "./Confetti";
import type { Player, Team } from "@/lib/auction-data";

type Moment = {
  key: number;
  kind: "sold" | "unsold";
  name: string;
  teamName?: string;
  captains?: string;
  price?: number;
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
        const captains = team
          ? [team.captain_name, team.captain2_name].filter(Boolean).join(" & ")
          : "";
        seq.current += 1;
        setMoment({
          key: seq.current,
          kind: "sold",
          name: p.name,
          teamName: team?.name ?? "the team",
          captains,
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
    const t = setTimeout(() => setMoment(null), moment.kind === "sold" ? 2600 : 900);
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
        <div
          key={moment.key}
          className="animate-shake-out rounded-2xl border-4 border-destructive bg-background/85 px-8 py-5 text-center text-destructive backdrop-blur-sm"
        >
          <p className="font-display text-6xl uppercase leading-none tracking-tight sm:text-8xl">
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

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-live="polite"
    >
      <Confetti />
      <div
        key={moment.key}
        className="animate-congrats border-gold-line mx-4 max-w-lg rounded-3xl border-4 bg-background/90 px-8 py-6 text-center backdrop-blur-sm"
      >
        <p className="text-gold-solid text-xs font-bold uppercase tracking-[0.35em]">
          🎉 Congratulations 🎉
        </p>
        <p className="text-gold font-display mt-2 text-5xl uppercase leading-none tracking-tight sm:text-7xl">
          Sold!
        </p>
        <p className="mt-3 text-2xl font-black uppercase leading-tight text-foreground">
          {moment.name}
        </p>
        <p className="mt-1 text-base text-muted-foreground">
          goes to <span className="font-bold text-foreground">{moment.teamName}</span>
          {moment.captains ? ` (${moment.captains})` : ""}
        </p>
        <p className="text-gold-solid font-display mt-1 text-3xl tabular-nums">
          {moment.price} pts
        </p>
      </div>
    </div>
  );
}
