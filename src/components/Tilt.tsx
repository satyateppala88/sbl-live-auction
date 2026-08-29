import { useRef, type ReactNode, type CSSProperties } from "react";

/**
 * Pointer-tracked 3D tilt wrapper. Desktop pointers only — on touch devices and
 * for prefers-reduced-motion users it renders a plain static div. Pure CSS
 * transforms, no animation library.
 */
export function Tilt({
  children,
  className = "",
  max = 10,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** max tilt in degrees */
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const canTilt = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !canTilt()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform 180ms ease", willChange: "transform", ...style }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </div>
  );
}
