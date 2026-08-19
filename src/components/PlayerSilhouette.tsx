import { useId } from "react";

/**
 * Badminton player mid jump-smash — a dynamic, airborne figure with a properly drawn
 * racket (oval frame + string bed + shaft/handle) so it reads unmistakably as badminton
 * rather than "holding a ring". A couple of motion streaks convey the speed of the shot.
 * Single currentColor so callers tint/fade it anywhere.
 */
export function PlayerSilhouette({ className = "h-40 w-40" }: { className?: string }) {
  const uid = useId();
  const clip = `racketface-${uid}`;

  // string bed lines inside the (un-rotated) racket ellipse
  const verticals = [];
  for (let x = 180; x <= 214; x += 6) verticals.push(x);
  const horizontals = [];
  for (let y = 16; y <= 64; y += 6) horizontals.push(y);

  return (
    <svg viewBox="0 0 240 240" fill="none" className={className} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <ellipse cx="197" cy="40" rx="19" ry="25" />
        </clipPath>
      </defs>

      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
      >
        {/* speed streaks trailing the swing */}
        <g fill="none" opacity="0.3" strokeWidth="3">
          <path d="M40 150 q46 12 92 -8" />
          <path d="M32 170 q54 16 104 -6" />
        </g>

        {/* head */}
        <circle cx="150" cy="64" r="15" stroke="none" />
        {/* torso, arched into the shot */}
        <path d="M137 78 Q152 71 167 80 L172 126 Q155 134 139 126 Z" stroke="none" />

        {/* non-racket arm, thrown forward for balance */}
        <path d="M139 84 Q110 90 90 108" strokeWidth="12" fill="none" />
        {/* racket arm, whipping up overhead */}
        <path d="M165 82 Q184 66 193 54" strokeWidth="12" fill="none" />

        {/* lead leg, knee driven up */}
        <path d="M150 124 Q152 150 178 154 Q192 156 198 174" strokeWidth="15" fill="none" />
        {/* trailing leg, extended back */}
        <path d="M161 126 Q150 166 126 194" strokeWidth="15" fill="none" />
        {/* feet */}
        <path d="M198 174 l16 5" strokeWidth="9" fill="none" />
        <path d="M126 194 l-15 7" strokeWidth="9" fill="none" />

        {/* ---- racket ---- */}
        <g transform="rotate(-24 197 40)">
          {/* shaft + handle down to the hand */}
          <path d="M197 63 L197 74" strokeWidth="5" fill="none" />
          {/* frame */}
          <ellipse cx="197" cy="40" rx="19" ry="25" fill="none" strokeWidth="4" />
          {/* string bed */}
          <g clipPath={`url(#${clip})`} fill="none" strokeWidth="1.3" opacity="0.85">
            {verticals.map((x) => (
              <line key={`v${x}`} x1={x} y1="12" x2={x} y2="68" />
            ))}
            {horizontals.map((y) => (
              <line key={`h${y}`} x1="176" y1={y} x2="218" y2={y} />
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
}
