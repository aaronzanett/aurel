import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Compass, Pause, Play, X, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  x: X,
  play: Play,
  pause: Pause,
};

type IconProps = { name: string; size?: number; stroke?: number; color?: string; style?: CSSProperties };

/** Lucide wrapper from the Aurel design system: 1.75 stroke, rounded caps, decorative. */
export function Icon({ name, size = 20, stroke = 1.75, color = "currentColor", style }: IconProps) {
  const Glyph = ICONS[name];
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", width: size, height: size, flex: "none", ...style }}>
      {Glyph ? <Glyph width={size} height={size} strokeWidth={stroke} stroke={color} /> : null}
    </span>
  );
}
