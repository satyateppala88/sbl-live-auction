import { Eye } from "lucide-react";

/** Hotstar-style live viewer count pill. */
export function ViewerCount({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-smash/50 bg-background/60 px-2.5 py-1 text-xs font-bold tabular-nums backdrop-blur ${className}`}
      title="People watching live"
    >
      <span className="animate-energy-pulse h-1.5 w-1.5 rounded-full bg-smash" />
      <Eye className="h-3.5 w-3.5 text-smash" />
      {count.toLocaleString()}
    </span>
  );
}
