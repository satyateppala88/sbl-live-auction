import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The auction start moment, fixed: 10:30am IST on 30 Aug 2026 = 05:00 UTC. */
export const AUCTION_START_ISO = "2026-08-30T05:00:00.000Z";

const START_MS = new Date(AUCTION_START_ISO).getTime();

type Remaining = { days: number; hours: number; mins: number; secs: number; started: boolean };

function calc(): Remaining {
  const now = Date.now();
  let diff = START_MS - now;
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, started: true };
  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const mins = Math.floor(diff / 60000);
  diff -= mins * 60000;
  const secs = Math.floor(diff / 1000);
  return { days, hours, mins, secs, started: false };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Live countdown to the auction start. After start, shows "Auction is Live". */
export function EventCountdown({ className }: { className?: string }) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!remaining) return null;

  if (remaining.started) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-smash/50 bg-smash/15 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-smash",
          className,
        )}
      >
        <span className="animate-energy-pulse h-2 w-2 rounded-full bg-smash" />
        Auction is Live
      </div>
    );
  }

  const cells = [
    { label: "Days", value: remaining.days },
    { label: "Hrs", value: remaining.hours },
    { label: "Min", value: remaining.mins },
    { label: "Sec", value: remaining.secs },
  ];

  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold-solid">
        Auction starts · 10:30 AM IST · 30 Aug
      </p>
      <div className="flex items-end gap-2">
        {cells.map((c, i) => (
          <div key={c.label} className="flex items-end gap-2">
            <div className="flex flex-col items-center">
              <span className="font-display tabular-nums text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
                {pad(c.value)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {c.label}
              </span>
            </div>
            {i < cells.length - 1 && (
              <span className="font-display text-3xl leading-none text-gold-solid/70 sm:text-4xl">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
