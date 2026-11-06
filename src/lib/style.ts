import type { CSSProperties } from "react";

const cache = new Map<string, CSSProperties>();

/**
 * Turns an inline-style string ("a-b:c; --x:y") into a React style object.
 * The design is authored as inline style strings; parsing them keeps every value
 * exactly as designed. Results are memoised per string.
 */
export function s(css: string): CSSProperties {
  const hit = cache.get(css);
  if (hit) return hit;
  const out: Record<string, string> = {};
  let depth = 0;
  let quote = "";
  let buf = "";
  const parts: string[] = [];
  for (const ch of css) {
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === ";" && depth === 0 && !quote) {
      parts.push(buf);
      buf = "";
    } else buf += ch;
  }
  parts.push(buf);
  for (const part of parts) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const rawName = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (!rawName || !value) continue;
    const name = rawName.startsWith("--")
      ? rawName
      : rawName.replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[name] = value;
  }
  cache.set(css, out as CSSProperties);
  return out as CSSProperties;
}
