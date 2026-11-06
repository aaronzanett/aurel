"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type TextRevealProps = {
  text?: string;
  as?: "h1" | "h2" | "h3" | "span";
  by?: "word" | "letter";
  stagger?: number;
  delay?: number;
  trigger?: "view" | "mount";
  style?: CSSProperties;
};

/** Words write in one by one from blur. Plain text is exposed through aria-label. */
export function TextReveal({ text = "", as = "h1", by = "word", stagger = 70, delay = 0, trigger = "view", style }: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (trigger === "mount") {
      const t = setTimeout(() => setOn(true), 30);
      return () => clearTimeout(t);
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setOn(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  const parts = by === "letter" ? Array.from(text) : text.split(/(\s+)/);
  let k = 0;
  const Tag = as as "span";
  return (
    <Tag ref={ref} aria-label={text} style={style}>
      {parts.map((p, i) => {
      if (/^\s+$/.test(p)) return <span key={i}>{p}</span>;
      const d = delay + k++ * stagger;
      return (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            opacity: on ? 1 : 0,
            transform: on ? "none" : "translateY(0.45em) rotate(3deg)",
            filter: on ? "blur(0)" : "blur(8px)",
            transition:
              "opacity 900ms var(--ease-drift) " + d + "ms, transform 1100ms var(--ease-spell) " + d + "ms, filter 900ms var(--ease-drift) " + d + "ms",
          }}
        >
          {p}
        </span>
      );
    })}
    </Tag>
  );
}
