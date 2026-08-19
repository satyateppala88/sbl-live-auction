import smashSrc from "@/assets/badminton-smash.png";
import { cn } from "@/lib/utils";

/**
 * Badminton player mid jump-smash. Rendered as a CSS mask over `currentColor`
 * so callers keep tinting it with text-* utilities (gold watermark, faint
 * background wash, etc.) exactly like the old inline SVG did.
 */
export function PlayerSilhouette({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block bg-current", className)}
      style={{
        WebkitMaskImage: `url(${smashSrc})`,
        maskImage: `url(${smashSrc})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
