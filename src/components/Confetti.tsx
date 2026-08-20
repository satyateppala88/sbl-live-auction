import { useMemo } from "react";

const COLORS = [
  "oklch(0.83 0.16 85)", // gold
  "oklch(0.65 0.21 32)", // smash
  "oklch(0.62 0.24 25)", // star red
  "oklch(0.74 0.17 155)", // success green
  "oklch(0.97 0.015 95)", // shuttle white
];

/**
 * Lightweight dependency-free confetti burst (CSS-animated pieces). Render it for a
 * couple of seconds when a player is sold. `count` pieces rain down once and fade.
 */
export function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        scale: 0.7 + Math.random() * 0.8,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}
