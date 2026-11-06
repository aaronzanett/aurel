import type { CSSProperties } from "react";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type StarFieldProps = { count?: number; seed?: number; color?: string; maxSize?: number; glow?: boolean; style?: CSSProperties };

export function StarField({ count = 60, seed = 7, color = "var(--cream-100)", maxSize = 3, glow = true, style }: StarFieldProps) {
  const r = rng(seed);
  const stars = Array.from({ length: count }, () => ({
    x: r() * 100,
    y: r() * 100,
    s: 0.8 + r() * (maxSize - 0.8),
    d: 2 + r() * 4,
    o: r() * 4,
  }));
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", ...style }}>
      {stars.map((st, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: st.x + "%",
            top: st.y + "%",
            width: st.s,
            height: st.s,
            borderRadius: "50%",
            background: color,
            boxShadow: glow && st.s > 2 ? "0 0 " + st.s * 3 + "px " + color : "none",
            animation: "aurel-twinkle " + st.d.toFixed(2) + "s var(--ease-float) " + st.o.toFixed(2) + "s infinite",
          }}
        />
      ))}
    </div>
  );
}
