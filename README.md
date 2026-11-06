# AUREL — Synthetic Nature

A faithful Next.js (App Router, TypeScript) implementation of the "Aurel Gallery v3" design from Claude Design: an immersive, scroll-driven digital art gallery with seven fictional works.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```

Optional: set `NEXT_PUBLIC_SITE_URL` so Open Graph image URLs resolve to your domain.

## How it maps to the design

| Design | Here |
| --- | --- |
| `<helmet>` fonts, tokens, page CSS | `src/app/globals.css` (Newsreader + Nunito files bundled in `public/fonts`) |
| Template + inline styles | `render()` in `src/components/gallery/Gallery.tsx` (`s()` in `src/lib/style.ts` keeps the inline style strings verbatim) |
| Motion engine (parallax, reveals, glide/teleport nav, map, detail overlay, `#/works/:id` deep links) | Class body of `Gallery.tsx`, ported unchanged |
| Aurel design-system components (`Icon`, `Pill`, `StarField`, `Mist`, `TextReveal`) | `src/components/ds/` |
| Images, hero/closing hills, journey stills and videos, logos | `public/assets/` |

The engine is deliberately untyped (`@ts-nocheck`) because it drives the DOM imperatively and mirrors the original line for line.

## Notes

- Detail views use a hash route (`/#/works/<id>`), exactly as in the design.
- Respects `prefers-reduced-motion` (all motion collapses to static states).
- The artists are fictional; works are original procedural artwork (see the footer).
