import type { Team } from "@/lib/auction-data";

/**
 * Team crest. Renders the team's logo when `logo_url` is set, otherwise falls
 * back to the original colour-bar treatment so nothing looks broken.
 */
export function TeamCrest({
  team,
  size = 40,
  className = "",
}: {
  team: Pick<Team, "name" | "color" | "logo_url">;
  size?: number;
  className?: string;
}) {
  if (!team.logo_url) {
    return (
      <span
        className={`shrink-0 rounded-full ${className}`}
        style={{
          backgroundColor: team.color,
          width: Math.max(4, Math.round(size * 0.16)),
          height: size,
        }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={team.logo_url}
      alt={`${team.name} crest`}
      /* NOTE: no loading="lazy" -- on the client-rendered auction routes the lazy
         IntersectionObserver never resolves, so crest requests were never firing and
         the badges rendered blank. These SVGs are ~2KB, eager loading is correct. */
      className={`animate-crest-pop shrink-0 rounded-full object-cover object-top ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 2px ${team.color}`,
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    />
  );
}
