/**
 * The SMR Vinay Galaxy red star — drawn from the star sculpture at the society's
 * entrance gate. Used as the league emblem / galaxy motif. currentColor by default
 * so callers can tint; defaults to the society red.
 */
export function StarEmblem({
  className = "h-6 w-6",
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      style={glow ? { filter: "drop-shadow(0 0 6px oklch(0.62 0.24 25 / 0.7))" } : undefined}
    >
      <path
        d="M50 4 L61 38 L97 38 L68 60 L79 94 L50 73 L21 94 L32 60 L3 38 L39 38 Z"
        fill="currentColor"
      />
    </svg>
  );
}
