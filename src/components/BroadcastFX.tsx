import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { TeamCrest } from "./TeamCrest";
import type { Bid, Player, Team } from "@/lib/auction-data";

type RecordHit = { key: number; amount: number; teamName: string };

/**
 * Watches all bids and fires a short-lived event whenever a new highest bid of
 * the night lands (beats every previous bid amount).
 */
export function useRecordBreaker(bids: Bid[], teams: Team[]): RecordHit | null {
  const maxSeen = useRef<number | null>(null);
  const [hit, setHit] = useState<RecordHit | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (bids.length === 0) return;
    const top = bids.reduce((a, b) => (Number(b.amount) > Number(a.amount) ? b : a));
    const amount = Number(top.amount);
    if (maxSeen.current === null) {
      maxSeen.current = amount; // baseline on first load — no flash for history
      return;
    }
    if (amount > maxSeen.current) {
      maxSeen.current = amount;
      seq.current += 1;
      const team = teams.find((t) => t.id === top.team_id);
      setHit({ key: seq.current, amount, teamName: team?.name ?? "A team" });
    }
  }, [bids, teams]);

  useEffect(() => {
    if (!hit) return;
    const t = setTimeout(() => setHit(null), 2400);
    return () => clearTimeout(t);
  }, [hit]);

  return hit;
}

/** Slanted "NEW RECORD" ribbon that sweeps across the top of the screen. */
export function RecordFlash({ hit }: { hit: RecordHit | null }) {
  if (!hit) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-50 flex justify-center" aria-live="polite">
      <div
        key={hit.key}
        className="animate-record-sweep border-gold-line flex items-center gap-2 rounded-full border-2 bg-background/90 px-5 py-2 backdrop-blur"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <span className="text-gold font-heavy text-xl uppercase tracking-wide sm:text-2xl">
          New record · {hit.amount} pts
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {hit.teamName}
        </span>
      </div>
    </div>
  );
}

/**
 * True while the current player is in a bidding war: 3+ bids in the last 15
 * seconds from 2+ different teams. Re-evaluated on every bids change.
 */
export function useBiddingWar(bids: Bid[], playerId: string | null | undefined): boolean {
  const [war, setWar] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setWar(false);
      return;
    }
    const evaluate = () => {
      const cutoff = Date.now() - 15000;
      const recent = bids.filter(
        (b) => b.player_id === playerId && new Date(b.created_at).getTime() >= cutoff,
      );
      const distinctTeams = new Set(recent.map((b) => b.team_id));
      setWar(recent.length >= 3 && distinctTeams.size >= 2);
    };
    evaluate();
    const t = setInterval(evaluate, 3000);
    return () => clearInterval(t);
  }, [bids, playerId]);

  return war;
}

/** Pulsing flame badge shown on the block panel during a bidding war. */
export function BiddingWarBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="animate-flame bg-smash/15 text-smash border-smash/50 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest">
      <Flame className="h-3 w-3" />
      Bidding war
    </span>
  );
}

/**
 * Lower-third broadcast ticker: an infinite scrolling strip of recent sales
 * ("Ravi → Smash Kings · 24 pts"). Hidden until at least one player is sold.
 */
export function SalesTicker({ players, teams }: { players: Player[]; teams: Team[] }) {
  const sold = players.filter((p) => p.status === "sold");
  if (sold.length === 0) return null;

  const items = sold.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.sold_price),
    team: teams.find((t) => t.id === p.sold_to_team_id),
  }));

  const strip = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center" key={keyPrefix}>
      {items.map((it) => (
        <span
          key={`${keyPrefix}-${it.id}`}
          className="flex items-center gap-1.5 whitespace-nowrap px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {it.team && <TeamCrest team={it.team} size={16} />}
          <span className="text-foreground">{it.name}</span>
          <span style={{ color: it.team?.color }}>→ {it.team?.name ?? "sold"}</span>
          <span className="text-gold-solid tabular-nums">{it.price} pts</span>
          <span className="pl-4 text-border">•</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee-mask shrink-0 overflow-hidden border-t border-border bg-background/80 py-1.5 backdrop-blur">
      <div className="animate-marquee flex w-max">
        {strip("a")}
        {strip("b")}
      </div>
    </div>
  );
}
