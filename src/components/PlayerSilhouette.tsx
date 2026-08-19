/**
 * Decorative badminton smash-pose silhouette, extracted from the team crest artwork
 * so the same "player" reads consistently across crests and page backgrounds. Pure
 * currentColor fill so it can be tinted/faded via className wherever it's dropped in.
 */
export function PlayerSilhouette({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      <g fill="currentColor">
        <path d="M 100 150 C 94 156, 84 158, 72 164 C 68 166, 64 168, 61 165 C 65 160, 72 154, 80 148 C 87 143, 94 139, 100 138 Z" />
        <path d="M 108 150 C 112 160, 110 170, 118 182 C 121 187, 126 190, 132 188 C 130 182, 124 174, 122 164 C 120 154, 116 144, 110 138 Z" />
        <path d="M 96 92 C 88 100, 84 112, 88 126 C 91 136, 98 144, 108 148 C 116 150, 122 146, 122 138 C 122 126, 116 114, 112 104 C 109 96, 103 90, 96 92 Z" />
        <path d="M 92 100 C 82 100, 72 96, 62 88 C 58 85, 56 81, 59 78 C 66 80, 76 86, 86 92 C 90 95, 92 98, 92 100 Z" />
        <path d="M 112 96 C 118 84, 124 70, 130 54 C 132 49, 136 46, 140 48 C 139 54, 134 68, 128 82 C 124 92, 120 98, 114 102 Z" />
        <path d="M 138 50 C 141 44, 145 39, 149 35 C 151 33, 154 34, 153 37 C 149 42, 145 47, 141 53 Z" />
        <ellipse
          cx="160"
          cy="26"
          rx="17"
          ry="22"
          transform="rotate(28 160 26)"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
        />
        <circle cx="90" cy="78" r="11" />
      </g>
    </svg>
  );
}
