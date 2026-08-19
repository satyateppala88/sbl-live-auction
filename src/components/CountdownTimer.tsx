import { useEffect, useState } from "react";
import { secondsLeft, type AuctionState } from "@/lib/auction-data";
import { cn } from "@/lib/utils";

/**
 * Per-player countdown, computed client-side from auction_state.block_started_at +
 * block_seconds (2 min). Ticks locally every second; the source of truth stays on the
 * server timestamp so every device shows the same time even after a late join/reconnect.
 */
export function CountdownTimer({
  state,
  className,
  size = "md",
}: {
  state: AuctionState | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const left = secondsLeft(state);
  if (left === null) return null;

  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const urgent = left <= 15;
  const expired = left === 0;

  const sizeClasses = {
    sm: "text-lg px-2.5 py-1",
    md: "text-2xl px-3.5 py-1.5",
    lg: "font-display text-5xl px-5 py-2 sm:text-6xl",
  }[size];

  return (
    <span
      className={cn(
        "tabular-nums inline-flex items-center gap-1.5 rounded-full border font-bold",
        urgent ? "border-smash text-smash animate-timer-pulse" : "border-border text-foreground",
        expired && "opacity-70",
        sizeClasses,
        className,
      )}
    >
      {expired ? "TIME'S UP" : `${mm}:${String(ss).padStart(2, "0")}`}
    </span>
  );
}
