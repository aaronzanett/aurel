import type { CSSProperties } from "react";

const TONES = {
  dusk: ["rgba(179,161,240,.75)", "rgba(242,167,211,.6)", "rgba(110,79,214,.55)"],
  dawn: ["rgba(255,223,158,.7)", "rgba(242,167,211,.7)", "rgba(217,207,250,.8)"],
  night: ["rgba(63,85,184,.55)", "rgba(86,56,184,.6)", "rgba(28,19,64,.7)"],
  grove: ["rgba(42,174,138,.4)", "rgba(217,247,233,.8)", "rgba(179,161,240,.4)"],
} as const;

type MistProps = { tone?: keyof typeof TONES; blobs?: number; speed?: number; blur?: number; style?: CSSProperties };

export function Mist({ tone = "dusk", blobs = 5, speed = 1, blur = 60, style }: MistProps) {
  const c = TONES[tone] ?? TONES.dusk;
  const items = Array.from({ length: blobs }, (_, i) => ({
    left: ((i * 97) % 100) - 15,
    top: 30 + ((i * 53) % 60),
    w: 40 + ((i * 37) % 35),
    h: 26 + ((i * 29) % 20),
    col: c[i % c.length],
    dur: (18 + i * 5) / speed,
    delay: -i * 3.7,
  }));
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", ...style }}>
      {items.map((b, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: b.left + "%",
            top: b.top + "%",
            width: b.w + "%",
            height: b.h + "%",
            borderRadius: "50%",
            background: "radial-gradient(closest-side," + b.col + ",transparent)",
            filter: "blur(" + blur + "px)",
            animation: "aurel-drift " + b.dur + "s var(--ease-float) " + b.delay + "s infinite",
          }}
        />
      ))}
    </div>
  );
}
