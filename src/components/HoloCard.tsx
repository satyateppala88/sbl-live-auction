import { PlayerAvatar } from "./PlayerAvatar";
import { cn } from "@/lib/utils";

/**
 * Wraps the on-the-block player photo in a slow 3D rotation (quarter-turns, holding
 * briefly at 0/90/180/270deg) with a holographic rainbow sheen layered on top --
 * a "trading card" reveal effect for the current player up for auction.
 *
 * Pure CSS (transform + background-position keyframes), no per-frame JS, so it stays
 * smooth on low-end phones. Respects prefers-reduced-motion globally via styles.css.
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
      <div className="holo-card h-full w-full rounded-xl">
        <PlayerAvatar
          name={name}
          {...(photoUrl !== undefined ? { photoUrl } : {})}
          {...(accent !== undefined ? { accent } : {})}
          className="h-full w-full smash-card"
        />
        <div className="holo-sheen-layer rounded-xl" aria-hidden />
      </div>
    </div>
  );
}
