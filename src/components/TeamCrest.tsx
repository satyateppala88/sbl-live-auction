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
      loading="lazy"
      className={`shrink-0 rounded-full object-contain ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 2px ${team.color}`,
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    />
  );
}
