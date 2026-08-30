import { ShuttleIcon } from "./ShuttleIcon";

const RATING: Record<string, number> = { Icon: 3, Challenger: 2, "Game Changer": 1 };

/** Visual tier rating: 3 shuttles, filled by tier (Icon 3 / Challenger 2 / Game Changer 1). */
export function TierRating({
  tier,
  size = "h-3.5 w-3.5",
  className = "",
}: {
  tier?: string | null | undefined;
  size?: string;
  className?: string;
}) {
  const r = tier ? (RATING[tier] ?? 0) : 0;
  if (!r) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 align-middle ${className}`}
      title={`${tier} · ${r}/3`}
    >
      {[0, 1, 2].map((i) => (
        <ShuttleIcon
          key={i}
          className={`${size} ${i < r ? "text-gold-solid" : "text-muted-foreground/25"}`}
        />
      ))}
    </span>
  );
}
