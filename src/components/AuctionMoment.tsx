import { useEffect, useRef, useState } from "react";
import type { Player, Team } from "@/lib/auction-data";

type Moment = {
  key: number;
  kind: "sold" | "unsold";
  name: string;
  detail: string;
};

/**
 * Watches the players list for status flips and returns a short-lived
 * "moment" to celebrate (SOLD) or note (UNSOLD). Purely presentational.
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
    const t = setTimeout(() => setMoment(null), moment.kind === "sold" ? 1100 : 800);
    return () => clearTimeout(t);
  }, [moment]);

  return moment;
}

export function AuctionMomentOverlay({ moment }: { moment: Moment | null }) {
  if (!moment) return null;
  const sold = moment.kind === "sold";
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-live="polite"
    >
      <div
        key={moment.key}
        className={`${sold ? "animate-stamp border-gold-line text-gold-solid" : "animate-shake-out border-destructive text-destructive"} rounded-2xl border-4 bg-background/85 px-8 py-5 text-center backdrop-blur-sm`}
      >
        <p className="font-display text-6xl uppercase leading-none tracking-tight sm:text-8xl">
          {sold ? "Sold!" : "Unsold"}
        </p>
        <p className="mt-2 text-lg font-bold uppercase tracking-wide text-foreground">
          {moment.name}
        </p>
        <p className="text-sm text-muted-foreground">{moment.detail}</p>
      </div>
    </div>
  );
}
