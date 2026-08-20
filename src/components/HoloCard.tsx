import { cn } from "@/lib/utils";

function initials(name: string) {
  const cleaned = name.replace(/[^\p{L}\s-]/gu, " ");
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Circular "holographic face medallion" for the player on the block: the photo is
 * cropped to a face-focused circle (object-top so heads sit right), given a gentle
 * 3D tilt/float and a holographic rainbow sheen -- a collectible-card feel without any
 * heavy ML. Falls back to initials when there's no photo. Pure CSS, mobile-safe,
 * respects prefers-reduced-motion.
 */
export function HoloCard({
  name,
  photoUrl,
  className,
  accent,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
  accent?: string;
}) {
  return (
    <div className={cn("holo-stage", className)}>
      <div
        className="holo-medallion smash-card relative h-full w-full overflow-hidden rounded-full bg-muted"
        style={accent ? { boxShadow: `0 0 0 3px ${accent}, var(--shadow-smash)` } : undefined}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="select-none font-black uppercase tracking-tight text-muted-foreground">
              {initials(name)}
            </span>
          </div>
        )}
        <div className="holo-sheen-layer rounded-full" aria-hidden />
      </div>
    </div>
  );
}
