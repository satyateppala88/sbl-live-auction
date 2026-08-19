/**
 * Badminton player in a jump-smash / lunge pose. Built from a filled torso + head
 * plus round-capped limb strokes so it reads as a clean, human silhouette (not the
 * old blobby figure). Single currentColor so it can be tinted/faded anywhere.
 */
export function PlayerSilhouette({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 260" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="currentColor">
        {/* head */}
        <circle cx="116" cy="34" r="15" stroke="none" />
        {/* neck */}
        <path d="M116 47 L115 58" strokeWidth="9" />
        {/* torso */}
        <path d="M103 58 Q116 52 130 60 L125 116 Q114 122 103 114 Z" stroke="none" />
        {/* racket arm, raised high */}
        <path d="M126 63 Q150 52 160 30" strokeWidth="12" fill="none" />
        {/* off arm, out for balance */}
        <path d="M105 64 Q86 78 72 96" strokeWidth="11" fill="none" />
        {/* front (lunging) leg, bent */}
        <path d="M120 112 L140 168 L156 206" strokeWidth="15" fill="none" />
        {/* back leg, driven back */}
        <path d="M106 114 L92 176 L66 216" strokeWidth="15" fill="none" />
        {/* front foot */}
        <path d="M156 206 L172 210" strokeWidth="9" fill="none" />
        {/* back foot */}
        <path d="M66 216 L52 224" strokeWidth="9" fill="none" />
        {/* racket: head above the hand + short shaft */}
        <ellipse
          cx="171"
          cy="17"
          rx="12"
          ry="16"
          transform="rotate(24 171 17)"
          fill="none"
          strokeWidth="4.5"
        />
      </g>
    </svg>
  );
}
