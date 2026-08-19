import { cn } from "@/lib/utils";

function initials(name: string) {
  // Strip anything that isn't a letter/space/hyphen before splitting, so placeholder
  // names like "TBD (lottery)" don't leak stray punctuation into the initials.
  const cleaned = name.replace(/[^\p{L}\s-]/gu, " ");
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function PlayerAvatar({
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
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl bg-muted",
        className,
      )}
      style={accent ? { boxShadow: `inset 0 0 0 2px ${accent}` } : undefined}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="select-none font-black uppercase tracking-tight text-muted-foreground">
          {initials(name)}
        </span>
      )}
    </div>
  );
}
