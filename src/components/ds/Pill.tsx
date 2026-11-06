import type { CSSProperties, ReactNode } from "react";

const TONES = {
  outline: { bg: "transparent", fg: "var(--ink-700)", border: "var(--violet-300)" },
  soft: { bg: "var(--lavender-100)", fg: "var(--indigo-700)", border: "transparent" },
  mint: { bg: "var(--mint-100)", fg: "var(--teal-700)", border: "transparent" },
  dawn: { bg: "var(--dawn-100)", fg: "#9A3F78", border: "transparent" },
  glass: { bg: "rgba(255,247,240,.14)", fg: "var(--cream-100)", border: "var(--border-on-dark)" },
} as const;

type PillProps = {
  tone?: keyof typeof TONES;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  glow?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
};

export function Pill({ tone = "outline", size = "md", icon, glow = false, children, style }: PillProps) {
  const t = TONES[tone] ?? TONES.outline;
  const lg = size === "lg";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: lg ? "12px 28px" : size === "sm" ? "4px 12px" : "8px 20px",
        borderRadius: "var(--radius-pill)",
        background: t.bg,
        color: t.fg,
        border: "1.25px solid " + t.border,
        fontFamily: "var(--font-body)",
        fontSize: lg ? 22 : size === "sm" ? 13 : 16,
        fontWeight: 500,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        backdropFilter: tone === "glass" ? "var(--blur-glass)" : undefined,
        WebkitBackdropFilter: tone === "glass" ? "var(--blur-glass)" : undefined,
        boxShadow: glow ? "var(--glow-violet)" : "none",
        ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children}
    </span>
  );
}
