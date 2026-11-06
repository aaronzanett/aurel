/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unused-vars */
// @ts-nocheck -- This is a direct port of the design's motion engine (scroll parallax, reveals,
// glide/teleport navigation, detail overlay). It drives the DOM imperatively and hangs bookkeeping
// fields on elements (__m, __revealed, ...), so it is deliberately left untyped to stay identical
// to the design. All content and markup live in render() below.
"use client";

import React, { Fragment } from "react";
import { Icon } from "@/components/ds/Icon";
import { Mist } from "@/components/ds/Mist";
import { Pill } from "@/components/ds/Pill";
import { StarField } from "@/components/ds/StarField";
import { TextReveal } from "@/components/ds/TextReveal";
import { s } from "@/lib/style";

export type GalleryProps = { motion?: "full" | "calm" | "off"; mediaSide?: "alternate" | "left" | "right"; chapterRail?: boolean };

const ARTWORKS = [
  { id: 'moss-protocol', sequence: 1, title: 'Moss Protocol', artist: 'Halden Studio (fictional)', year: '2025', medium: 'Generative video loop', summary: 'A carpet of moss grows, dies back and regrows under rules written by a cellular automaton.', curatorialNote: 'The opening work sets the collection’s premise: the pattern looks alive, but every frame is computed. Watch for the moment the growth repeats.', tone: 'linear-gradient(160deg,var(--teal-700) 0%,var(--indigo-800) 70%,var(--night-950) 100%)', hue: 'var(--teal-600)', type: 'video', w: 1600, h: 1000 },
  { id: 'tidal-index', sequence: 2, title: 'Tidal Index', artist: 'Ines Marrow (fictional)', year: '2024', medium: 'Real-time fluid simulation', summary: 'A year of tide data from one harbour, replayed as a single shoreline breathing in and out.', curatorialNote: 'Marrow keeps the data intact and lets the simulation do the rest. Nature appears here as a measurement before it becomes an image.', tone: 'linear-gradient(170deg,var(--tide-500) 0%,var(--tide-700) 55%,var(--night-900) 100%)', hue: 'var(--tide-500)', type: 'interactive', w: 1600, h: 900 },
  { id: 'lichen-weather', sequence: 3, title: 'Lichen Weather', artist: 'Okon & Reyes (fictional)', year: '2023', medium: 'Procedural image series, archival print', summary: 'Twelve lichen maps, each grown from a different city’s air-quality readings.', curatorialNote: 'Lichen is a living pollution sensor. Here software inherits that role, and the maps become portraits of the air.', tone: 'linear-gradient(150deg,var(--moon-300) 0%,var(--ember-400) 30%,var(--violet-600) 75%,var(--night-900) 100%)', hue: 'var(--ember-400)', type: 'image', w: 1200, h: 1500 },
  { id: 'seed-bank-rendered', sequence: 4, title: 'Seed Bank, Rendered', artist: 'Tomasz Vey (fictional)', year: '2025', medium: 'Photogrammetry and neural upscaling', summary: 'Seeds from a frozen archive are scanned, then enlarged by a model until they look like planets.', curatorialNote: 'The midpoint of the journey. Preservation turns into invention as the model fills in detail no seed ever had.', tone: 'radial-gradient(circle at 50% 45%,var(--moon-100) 0%,var(--dawn-300) 22%,var(--violet-500) 55%,var(--night-950) 100%)', hue: 'var(--dawn-300)', type: 'image', w: 1400, h: 1400 },
  { id: 'the-grafted-hour', sequence: 5, title: 'The Grafted Hour', artist: 'Lumen Collective (fictional)', year: '2024', medium: 'Interactive browser work', summary: 'Two trees, one real and one simulated, share a single root system that visitors can prune.', curatorialNote: 'Grafting is an old human technology for joining living things. The work asks whether a branch of code can take.', tone: 'linear-gradient(165deg,var(--mint-100) 0%,var(--teal-500) 35%,var(--indigo-700) 80%,var(--night-900) 100%)', hue: 'var(--teal-500)', type: 'interactive', w: 1600, h: 1000 },
  { id: 'murmuration-for-servers', sequence: 6, title: 'Murmuration for Servers', artist: 'Ada Ferro (fictional)', year: '2026', medium: 'Data-driven particle animation', summary: 'Ten thousand starlings fly to the rhythm of a data centre’s cooling fans.', curatorialNote: 'The flock is the oldest image of distributed intelligence. Ferro gives it a new body, and a new kind of weather to flee.', tone: 'linear-gradient(180deg,var(--dawn-300) 0%,var(--violet-400) 35%,var(--indigo-800) 75%,var(--night-950) 100%)', hue: 'var(--violet-400)', type: 'video', w: 1920, h: 1080 },
  { id: 'fern-memory', sequence: 7, title: 'Fern Memory', artist: 'Halden Studio (fictional)', year: '2022', medium: 'Neural reconstruction of herbarium scans', summary: 'A model trained on Victorian fern collections dreams species that were never pressed.', curatorialNote: 'The collection closes where it began, with Halden Studio. Here the archive itself becomes a seed for something new.', tone: 'linear-gradient(155deg,var(--teal-600) 0%,var(--tide-700) 50%,var(--night-950) 100%)', hue: 'var(--teal-700)', type: 'image', w: 1200, h: 1600 },
].sort((a, b) => a.sequence - b.sequence);

const SCENES = ['welcome', 'statement', 'journey', 'index', 'closing'];
const SCENE_IDS = ['top', 'statement', 'journey', 'index', 'closing'];
const CHAPTERS = ['Welcome', 'Statement', 'Journey', 'Atlas', 'Closing'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const CH_EYEBROW = ['Prologue', 'Chapter I', 'Chapter II', 'Chapter III', 'Epilogue'];
const CH_MARK = ['✦', 'I', 'II', 'III', '✦'];
const NAV = [{ idx: 1, label: 'Statement', scene: 'statement' }, { idx: 2, label: 'Journey', scene: 'journey' }, { idx: 3, label: 'Atlas', scene: 'index' }];
const LIT = 'var(--cream-100)', DARKSIDE = 'rgba(14,9,36,.9)';
const MOONS = [
  { bg: 'transparent', sh: 'inset -4px 0 0 0 ' + LIT },
  { bg: 'transparent', sh: 'inset -7px 0 0 0 ' + LIT },
  { bg: LIT, sh: 'inset 4px 0 0 0 ' + DARKSIDE },
  { bg: LIT, sh: '0 0 12px var(--moon-300)' },
  { bg: LIT, sh: 'inset -4px 0 0 0 ' + DARKSIDE },
  { bg: 'transparent', sh: 'inset 7px 0 0 0 ' + LIT },
  { bg: 'transparent', sh: 'inset 4px 0 0 0 ' + LIT },
];
const E_INOUT = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const E_IN = (t) => t * t * t;
const E_OUT = (t) => 1 - Math.pow(1 - t, 5);
const TILTS = ['-1.6deg', '1.2deg', '-0.6deg', '1.6deg', '-1.2deg', '0.8deg', '-1deg'];
const pad = (n) => String(n).padStart(2, '0');
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const mkMotes = (n, k, y0, y1) => Array.from({ length: n }, (_, i) => ({ x: (rnd(i, k) * 96 + 2).toFixed(1) + '%', y: (y0 + rnd(i, k + 1) * (y1 - y0)).toFixed(1) + '%', anim: 'aurel-firefly ' + (8 + rnd(i, k + 2) * 9).toFixed(1) + 's ease-in-out ' + (-rnd(i, k + 3) * 17).toFixed(1) + 's infinite' }));
const MOTES = mkMotes(18, 1, 25, 95), HILL_MOTES = mkMotes(12, 9, 10, 85);
const METEORS = [['82%', '8%', 11, 2], ['58%', '3%', 15, 7], ['98%', '26%', 19, 12]].map(([x, y, d, del]) => ({ x, y, anim: 'aurel-meteor ' + d + 's linear ' + del + 's infinite' }));
const RUNE_TEXT = 'MOSS ✦ TIDE ✦ LICHEN ✦ SEED ✦ GRAFT ✦ FLOCK ✦ FERN ✦ ';
const RUNES = Array.from(RUNE_TEXT).map((ch, i, all) => ({ ch: ch === ' ' ? '·' : ch, angle: ((360 / all.length) * i).toFixed(2) + 'deg' })).filter((r) => r.ch !== '·');
const ORBS = [['I · Moss', 1, 20], ['II · Tide', 3, 110], ['III · Seed', 2, 200], ['IV · Flock', 4, 290]].map(([label, n, a]) => ({ label, src: '/assets/statement/fragment-' + n + '.webp', angle: a + 'deg', neg: -a + 'deg' }));
const TYPE_LABEL = { image: 'Still image', video: 'Video, muted loop', interactive: 'Interactive (still preview)' };
const ALT = {
  'moss-protocol': 'A grid of moss cells in mint and deep teal grows outward, fades to indigo and grows back, as if run by a cellular automaton.',
  'tidal-index': 'An overhead view of a violet shoreline meeting tide-blue water, with the tide lines drawn as contour plots dotted with data markers.',
  'lichen-weather': 'Lichen colonies in moonlight gold, ember orange and violet spread across a dark grid like a city map or an air-quality chart.',
  'seed-bank-rendered': 'A single seed, scanned and enlarged until it looks like a planet, with a glowing pink-gold core and violet edges in dark space.',
  'the-grafted-hour': 'Two trees, one painted and one in wireframe, joined by a single glowing mint root system below the ground line.',
  'murmuration-for-servers': 'A flock of starlings swirls across a pink-to-indigo dusk sky above faint server-rack shapes on the horizon.',
  'fern-memory': 'Imagined fern species pressed onto a teal-to-blue herbarium sheet with tape and a blank label, broken up by soft glitch bands.',
};
ARTWORKS.forEach((a) => {
  const base = '/assets/journey/' + pad(a.sequence) + '-' + a.id;
  a.alt = ALT[a.id]; a.thumb = base + '-thumb.webp';
  if (a.type === 'video') { a.mp4 = base + '.mp4'; a.webm = base + '.webm'; a.poster = base + '-poster.webp'; } else a.src = base + '.webp';
});
const SPELL = 'cubic-bezier(.16,1,.3,1)', DRIFT = 'cubic-bezier(.22,.61,.36,1)', TURN = 'cubic-bezier(.65,0,.35,1)';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pair = (s) => (s ? s.split(',').map((x) => x.trim()) : null);
const REVEALS = {
  rise: { from: { opacity: 0, transform: 'translate3d(0,36px,0)', filter: 'blur(8px)' }, dur: 1100 },
  fade: { from: { opacity: 0, transform: 'translate3d(0,12px,0)' }, dur: 900, ease: DRIFT },
  mask: { from: { opacity: 0, transform: 'translate3d(0,40px,0)', clipPath: 'inset(0% 0% 100% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' }, dur: 1200 },
  frame: { from: { opacity: 0, clipPath: 'inset(14% 10% 14% 10% round 28px)' }, to: { clipPath: 'inset(0% 0% 0% 0% round 28px)' }, dur: 1500, inner: true },
  card: { from: { opacity: 0, transform: 'translate3d(0,64px,0) rotate(-3deg) scale(.96)' }, dur: 1100 },
};
const IDENT = { opacity: 1, transform: 'none', filter: 'blur(0px)' };

export default class Gallery extends React.Component<GalleryProps> {
  state = { scene: 'welcome', active: 0, route: null, wide: true, scrolledPast: false, headerDark: false, motionOff: false, paused: {}, menu: false };
  overlayRef = React.createRef();
  menuRef = React.createRef();
  mx = 0; my = 0; tmx = 0; tmy = 0; sy = 0; vh = 800; vw = 1200; k = 1; pEls = []; scrubs = []; bars = [];

  componentDidMount() {
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onReduced = () => this.refreshMotion();
    this.reduced.addEventListener && this.reduced.addEventListener('change', this.onReduced);
    this.onResize = () => { const wide = window.innerWidth >= 900; if (wide !== this.state.wide) this.setState({ wide }); this.measure(); this.req(); };
    this.onScroll = () => this.req();
    this.onPop = () => this.syncRoute(false);
    this.onKey = (e) => this.handleKey(e);
    this.onPointer = (e) => { if (!this.pointerOK || e.pointerType !== 'mouse') return; this.tmx = e.clientX / window.innerWidth - 0.5; this.tmy = e.clientY / window.innerHeight - 0.5; this.req(); this.tilt(e); };
    this.onFocusIn = (e) => { const h = document.querySelector('header'); if (h && h.contains(e.target) && this.hdrHidden) { this.hdrHidden = false; h.style.transform = ''; } };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('popstate', this.onPop);
    window.addEventListener('hashchange', this.onPop);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.onUserScroll = (e) => { if (e.type === 'keydown' && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) return; this.cancelGlide(); };
    window.addEventListener('wheel', this.onUserScroll, { passive: true });
    window.addEventListener('touchstart', this.onUserScroll, { passive: true });
    window.addEventListener('keydown', this.onUserScroll);
    document.addEventListener('keydown', this.onKey);
    document.addEventListener('focusin', this.onFocusIn);
    this.ro = new ResizeObserver(() => { this.measure(); this.req(); });
    this.ro.observe(document.body);
    this.onResize(); this.onScroll();
    this.direct = this.parseHash() !== null;
    this.mode = this.computeMode();
    this.setState({ motionOff: this.mode === 'off' }, () => {
      this.collect(); this.measure(); this.setupReveals(); this.playIntro(); this.startCue(); this.setupVideos(); this.req();
      document.fonts && document.fonts.ready.then(() => { this.measure(); this.req(); });
    });
    this.syncRoute(true);
    this.observe();
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('popstate', this.onPop);
    window.removeEventListener('hashchange', this.onPop);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('wheel', this.onUserScroll);
    window.removeEventListener('touchstart', this.onUserScroll);
    window.removeEventListener('keydown', this.onUserScroll);
    this.cancelGlide();
    document.removeEventListener('keydown', this.onKey);
    document.removeEventListener('focusin', this.onFocusIn);
    this.reduced.removeEventListener && this.reduced.removeEventListener('change', this.onReduced);
    this.io && this.io.disconnect(); this.sio && this.sio.disconnect(); this.rio && this.rio.disconnect(); this.vio && this.vio.disconnect(); this.ro && this.ro.disconnect();
    this.raf && cancelAnimationFrame(this.raf);
    clearTimeout(this.fanT);
    document.documentElement.style.overflow = '';
  }
  componentDidUpdate(prevProps) {
    const w = this.state.wide, mo = this.state.motionOff, seen = this._seenWide !== undefined;
    const wideChanged = seen && w !== this._seenWide, moChanged = seen && mo !== this._seenMo;
    this._seenWide = w; this._seenMo = mo;
    if (prevProps && prevProps.motion !== this.props.motion) { this.refreshMotion(); return; }
    if (wideChanged || moChanged) { this.collect(); this.measure(); this.setupReveals(); this.req(); }
    if (wideChanged) { clearTimeout(this.fanT); this.fanT = setTimeout(() => { this.measure(); this.req(); }, 1050); }
  }

  /* ---------- motion engine ---------- */
  computeMode() { if (this.reduced && this.reduced.matches) return 'off'; return this.props.motion ?? 'full'; }
  anim() { return this.mode !== 'off'; }
  refreshMotion() {
    this.mode = this.computeMode();
    if (!this.anim()) {
      this.pEls.forEach((p) => { p.el.style.transform = ''; p.el.style.opacity = ''; p.el.style.filter = ''; });
      document.querySelectorAll('[data-reveal]').forEach((el) => this.clearHidden(el));
      this.scrubs.forEach((s) => s.words.forEach((w) => (w.style.opacity = '')));
      this.cue && this.cue.cancel();
      const h = document.querySelector('header'); if (h) h.style.transform = '';
    }
    this.setState({ motionOff: !this.anim() }, () => { this.collect(); this.measure(); this.setupReveals(); this.startCue(); this.setupVideos(); this.req(); });
  }
  collect() {
    this.pEls = Array.from(document.querySelectorAll('[data-y],[data-o],[data-blur],[data-pointer]')).filter((el) => !el.closest('[role=dialog]')).map((el) => {
      const d = el.dataset;
      return { el, root: el.closest('[data-par-root]') || el.parentElement, y: pair(d.y), o: pair(d.o), b: pair(d.blur), r: d.range ? d.range.split(',').map(Number) : [0, 1], pt: d.pointer ? parseFloat(d.pointer) : 0 };
    });
    this.scrubs = Array.from(document.querySelectorAll('[data-scrub]')).map((el) => ({ el, words: Array.from(el.querySelectorAll('[data-w]')) }));
    this.bars = Array.from(document.querySelectorAll('[data-progress-bar]'));
    this.headerEl = document.querySelector('header');
    this.veil = document.querySelector('[data-veil]');
    this.xfadeEl = document.querySelector('[data-xfade]');
  }
  measure() {
    const sy = window.scrollY;
    this.lastMeasure = performance.now();
    this.vh = window.innerHeight; this.vw = window.innerWidth;
    this.docH = document.documentElement.scrollHeight;
    const roots = new Set();
    this.pEls.forEach((p) => roots.add(p.root));
    this.scrubs.forEach((s) => roots.add(s.el));
    const j = document.getElementById('journey'); if (j) roots.add(j);
    this.bars.forEach((bar) => { if (bar.dataset.progressBar === 'thread' && bar.parentElement) roots.add(bar.parentElement); });
    this.sceneEls = Array.from(document.querySelectorAll('main [data-scene]'));
    this.workEls = Array.from(document.querySelectorAll('main [data-work]'));
    this.sceneEls.concat(this.workEls).forEach((r) => roots.add(r));
    roots.forEach((r) => { const b = r.getBoundingClientRect(); r.__m = { top: b.top + sy, h: b.height, pin: r.getAttribute('data-par-root') === 'pin' }; });
    this.pointerOK = this.anim() && this.mode === 'full' && this.vw >= 900 && window.matchMedia('(pointer: fine)').matches;
    this.k = this.mode === 'calm' ? 0.5 : this.vw < 900 ? 0.65 : 1;
    this.measureThread();
  }
  /* ---------- the atlas: gold thread between the stars ---------- */
  measureThread() {
    this.cvs = document.querySelector('[data-constellation]');
    this.starEls = Array.from(document.querySelectorAll('[data-star]'));
    this.starPts = null; this.lastThread = -1;
    if (!this.cvs) return;
    const cb = this.cvs.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cvs.width = Math.round(cb.width * dpr); this.cvs.height = Math.round(cb.height * dpr);
    this.cvsW = cb.width; this.cvsH = cb.height; this.dpr = dpr;
    if (!this.threadColor) this.threadColor = (getComputedStyle(document.documentElement).getPropertyValue('--moon-300') || '').trim() || '#F2CF78';
    if (this.starEls.length > 1) this.starPts = this.starEls.map((s) => { const r = s.getBoundingClientRect(); return [r.left + r.width / 2 - cb.left, r.top + r.height / 2 - cb.top]; });
  }
  drawThread() {
    if (!this.cvs) return;
    const ix = document.getElementById('index');
    const t = this.anim() ? clamp((this.prog(ix) - 0.2) / 0.32, 0, 1) : 1;
    if (Math.abs(t - this.lastThread) < 0.001) return;
    this.lastThread = t;
    const ctx = this.cvs.getContext('2d'); if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cvsW, this.cvsH);
    const pts = this.starPts; if (!pts) return;
    const drawn = t * (pts.length - 1);
    this.starEls.forEach((s, i) => s.setAttribute('data-lit', drawn >= i - 0.02 ? '1' : '0'));
    if (drawn <= 0) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let head = pts[0];
    const path = () => {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const f = clamp(drawn - (i - 1), 0, 1); if (f <= 0) break;
        const a = pts[i - 1], b = pts[i];
        head = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        ctx.lineTo(head[0], head[1]);
      }
    };
    ctx.strokeStyle = this.threadColor; ctx.shadowColor = this.threadColor;
    ctx.globalAlpha = 0.28; ctx.lineWidth = 5; ctx.shadowBlur = 14; path(); ctx.stroke();
    ctx.globalAlpha = 0.9; ctx.lineWidth = 1.25; ctx.shadowBlur = 6; ctx.setLineDash([1, 7]); path(); ctx.stroke(); ctx.setLineDash([]);
    if (t < 1) { ctx.globalAlpha = 1; ctx.shadowBlur = 18; ctx.fillStyle = '#FFF7F0'; ctx.beginPath(); ctx.arc(head[0], head[1], 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  prog(root) {
    const m = root && root.__m; if (!m) return 0;
    return m.pin ? clamp((this.sy - m.top) / Math.max(1, m.h - this.vh), 0, 1) : clamp((this.sy + this.vh - m.top) / (m.h + this.vh), 0, 1);
  }
  pv(s) { return s.endsWith('v') ? (parseFloat(s) * this.vh) / 100 : parseFloat(s); }
  req() { if (!this.raf) this.raf = requestAnimationFrame(() => this.tick()); }
  tick() {
    this.raf = 0;
    const sy = (this.sy = window.scrollY), vh = this.vh;
    let moving = false;
    if (this.pointerOK) {
      this.mx += (this.tmx - this.mx) * 0.08; this.my += (this.tmy - this.my) * 0.08;
      moving = Math.abs(this.tmx - this.mx) > 0.0008 || Math.abs(this.tmy - this.my) > 0.0008;
    }
    if (this.anim()) {
      for (const p of this.pEls) {
        const t = clamp((this.prog(p.root) - p.r[0]) / (p.r[1] - p.r[0]), 0, 1);
        let tx = 0, ty = 0;
        if (p.y) ty = (this.pv(p.y[0]) + (this.pv(p.y[1]) - this.pv(p.y[0])) * t) * this.k;
        if (p.pt && this.pointerOK) { tx += this.mx * p.pt * 2; ty += this.my * p.pt * 1.4; }
        if (p.y || p.pt) p.el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
        if (p.o) { const a = +p.o[0], b = +p.o[1]; p.el.style.opacity = (a + (b - a) * t).toFixed(3); }
        if (p.b) { const a = +p.b[0], b = +p.b[1]; const v = a + (b - a) * t; p.el.style.filter = v > 0.1 ? 'blur(' + v.toFixed(1) + 'px)' : ''; }
      }
      for (const s of this.scrubs) {
        const lit = clamp((this.prog(s.el) - 0.18) / 0.4, 0, 1) * s.words.length;
        s.words.forEach((w, i) => { w.style.opacity = (0.22 + 0.78 * clamp(lit - i, 0, 1)).toFixed(3); });
      }
      const dy = sy - (this.lastSy || 0);
      if (Math.abs(dy) > 6 && this.headerEl) {
        const hide = dy > 0 && sy > vh * 0.8 && performance.now() > (this.noHideUntil || 0) && this.state.route === null && !this.headerEl.contains(document.activeElement);
        if (hide !== !!this.hdrHidden) { this.hdrHidden = hide; this.headerEl.style.transform = hide ? 'translate3d(0,-100%,0)' : ''; }
        this.lastSy = sy;
      }
    }
    const j = document.getElementById('journey');
    for (const bar of this.bars) {
      let v = 0;
      if (bar.dataset.progressBar === 'page') v = sy / Math.max(1, this.docH - vh);
      else if (j && j.__m) v = (sy + vh * 0.5 - j.__m.top) / j.__m.h;
      if (bar.dataset.progressBar === 'thread') { const m = bar.parentElement.__m; v = m ? (sy + vh * 0.5 - m.top) / Math.max(1, m.h) : 0; bar.style.transform = 'scaleY(' + clamp(v, 0, 1).toFixed(4) + ')'; continue; }
      bar.style.transform = 'scaleX(' + clamp(v, 0, 1).toFixed(4) + ')';
    }
    if (this.xfadeEl) {
      const m = this.xfadeEl.__m;
      this.xfadeEl.style.opacity = this.anim() && m ? clamp((vh - (m.top - sy)) / (vh * 0.65), 0, 1).toFixed(3) : '';
    }
    if (performance.now() - (this.lastMeasure || 0) > 1200) this.measure();
    this.drawThread();
    this.syncScene(sy, vh);
    if (moving) this.req();
  }
  syncScene(sy, vh) {
    if (!this.sceneEls || !this.sceneEls.length) return;
    const mid = sy + vh * 0.5, hdrY = sy + 38;
    let scene = 'welcome', hdrScene = 'welcome';
    for (const s of this.sceneEls) { const m = s.__m; if (!m) continue; if (mid >= m.top) scene = s.dataset.scene; if (hdrY >= m.top) hdrScene = s.dataset.scene; }
    const dark = hdrScene === 'welcome' ? sy > vh * 0.45 : true;
    let active = this.state.active;
    if (scene === 'journey' && this.workEls) this.workEls.forEach((w, i) => { if (w.__m && mid >= w.__m.top) active = i; });
    const scrolledPast = sy > 40;
    if (scene !== this.state.scene || dark !== this.state.headerDark || active !== this.state.active || scrolledPast !== this.state.scrolledPast) this.setState({ scene, headerDark: dark, active, scrolledPast });
  }
  liveHere() {
    const vh = window.innerHeight, mid = vh * 0.5;
    let scene = 'welcome', hdrScene = 'welcome', work = -1;
    (this.sceneEls || []).forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= mid) scene = s.dataset.scene; if (r.top <= 38) hdrScene = s.dataset.scene; });
    if (scene === 'journey') (this.workEls || []).forEach((w, i) => { const r = w.getBoundingClientRect(); if (r.top <= mid) work = i; });
    return { scene, hdrScene, work };
  }
  setupSceneFades() {
    this.sio && this.sio.disconnect();
    const secs = Array.from(document.querySelectorAll('main [data-scene]')).filter((s) => s.dataset.scene !== 'welcome' && !s.hasAttribute('data-xfade'));
    if (!this.anim()) { secs.forEach((s) => { s.__seen = true; s.style.opacity = ''; }); return; }
    this.sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const s = e.target; this.sio.unobserve(s); s.__seen = true;
      s.style.opacity = '';
      s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1400, easing: DRIFT });
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    secs.forEach((s) => {
      if (s.__seen) return;
      const r = s.getBoundingClientRect();
      if (r.top < this.vh * 0.88 && r.bottom > 0) { s.__seen = true; return; }
      s.style.opacity = '0';
      this.sio.observe(s);
    });
  }
  setupReveals() {
    this.setupSceneFades();
    this.rio && this.rio.disconnect();
    const els = Array.from(document.querySelectorAll('[data-reveal]')).filter((el) => !el.closest('[role=dialog]'));
    if (!this.anim()) { els.forEach((el) => { el.__revealed = true; this.clearHidden(el); }); return; }
    this.rio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const list = e.target.__revealTargets || [];
      this.rio.unobserve(e.target); e.target.__revealTargets = null;
      list.forEach((t) => !t.__revealed && this.reveal(t));
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    const watch = (el) => {
      const proxy = el.parentElement || el;
      if (!proxy.__revealTargets) { proxy.__revealTargets = []; this.rio.observe(proxy); }
      proxy.__revealTargets.push(el);
    };
    els.forEach((el) => {
      if (el.__revealed) return;
      const r = el.getBoundingClientRect();
      if (r.top < this.vh * 0.92 && r.bottom > 0) { this.reveal(el); return; }
      const R = REVEALS[el.dataset.reveal] || REVEALS.rise;
      Object.assign(el.style, R.from);
      if (R.inner) el.querySelectorAll('[data-reveal-inner]').forEach((i) => (i.style.transform = 'scale(1.22)'));
      watch(el);
    });
  }
  reveal(el) {
    el.__revealed = true;
    const R = REVEALS[el.dataset.reveal] || REVEALS.rise;
    const to = {}; Object.keys(R.from).forEach((k) => (to[k] = (R.to && R.to[k]) || IDENT[k]));
    this.clearHidden(el);
    const delay = +el.dataset.delay || 0;
    el.animate([R.from, to], { duration: R.dur, delay, easing: R.ease || SPELL, fill: 'backwards' });
    if (R.inner) el.querySelectorAll('[data-reveal-inner]').forEach((i) => i.animate([{ transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: R.dur + 400, delay, easing: SPELL, fill: 'backwards' }));
  }
  clearHidden(el) {
    ['opacity', 'transform', 'filter', 'clipPath'].forEach((k) => (el.style[k] = ''));
    el.querySelectorAll('[data-reveal-inner]').forEach((i) => (i.style.transform = ''));
  }
  playIntro() {
    if (!this.anim()) return;
    document.querySelectorAll('[data-intro]').forEach((el) => {
      const kind = el.dataset.introKind;
      const from = kind === 'hill' ? { transform: 'translate3d(0,45%,0)' } : kind === 'moon' ? { opacity: 0, transform: 'translate3d(0,90px,0) scale(.85)' } : { opacity: 0, transform: 'translate3d(0,28px,0)', filter: 'blur(10px)' };
      const to = {}; Object.keys(from).forEach((k) => (to[k] = IDENT[k]));
      el.animate([from, to], { duration: kind === 'hill' ? 1600 : kind === 'moon' ? 1800 : 1100, delay: +el.dataset.intro || 0, easing: SPELL, fill: 'backwards' });
    });
  }
  startCue() {
    this.cue && this.cue.cancel();
    const dot = document.querySelector('[data-cue-dot]');
    if (dot && this.anim()) this.cue = dot.animate([{ transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: 'translateY(40px)', opacity: 0 }], { duration: 2200, iterations: Infinity, easing: DRIFT });
  }
  tilt(e) {
    const el = e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
    if (this.tiltEl && this.tiltEl !== el) { this.tiltEl.style.transform = ''; const g = this.tiltEl.querySelector('[data-glint]'); if (g) g.style.opacity = '0'; }
    this.tiltEl = el;
    if (!el || !el.__revealed) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.transform = 'perspective(1400px) rotateX(' + ((0.5 - y) * 5).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 7).toFixed(2) + 'deg)';
    const g = el.querySelector('[data-glint]');
    if (g) { g.style.background = 'radial-gradient(circle at ' + (x * 100).toFixed(0) + '% ' + (y * 100).toFixed(0) + '%, rgba(255,247,240,.22), rgba(255,247,240,0) 55%)'; g.style.opacity = '1'; }
  }
  scrollTarget(el) { return el.getBoundingClientRect().top + window.scrollY; }
  /* ---------- navigation: glide for short trips, star-warp for long ones ---------- */
  showHeader(ms) { this.noHideUntil = performance.now() + ms; this.hdrHidden = false; if (this.headerEl) this.headerEl.style.transform = ''; }
  cancelGlide() {
    if (this.glideRaf) cancelAnimationFrame(this.glideRaf);
    this.glideRaf = 0; this.glideToken = (this.glideToken || 0) + 1;
    if (this.veilUp) this.veilOut(0);
  }
  glideTo(top, dur, ease) {
    if (this.glideRaf) cancelAnimationFrame(this.glideRaf);
    const token = (this.glideToken = (this.glideToken || 0) + 1);
    const from = window.scrollY, d = top - from, t0 = performance.now();
    return new Promise((res) => {
      const step = (now) => {
        if (token !== this.glideToken) { res(false); return; }
        const k = clamp((now - t0) / dur, 0, 1);
        window.scrollTo(0, from + d * ease(k));
        if (k < 1) this.glideRaf = requestAnimationFrame(step); else { this.glideRaf = 0; res(true); }
      };
      this.glideRaf = requestAnimationFrame(step);
    });
  }
  veilIn(label, eyebrow) {
    const v = this.veil; if (!v) return;
    const lab = v.querySelector('[data-veil-label]'), num = v.querySelector('[data-veil-num]'), inner = v.querySelector('[data-veil-inner]');
    if (lab) lab.textContent = label || ''; if (num) num.textContent = eyebrow || '';
    this.veilUp = true; v.style.pointerEvents = 'auto';
    this.veilA && this.veilA.cancel();
    this.veilA = v.animate([{ opacity: 0, backdropFilter: 'blur(0px)' }, { opacity: 1, backdropFilter: 'blur(6px)' }], { duration: 380, easing: TURN, fill: 'forwards' });
    inner && inner.animate([{ opacity: 0, transform: 'translate3d(0,24px,0) scale(.96)', filter: 'blur(8px)' }, IDENT], { duration: 620, easing: SPELL, fill: 'backwards' });
  }
  veilOut(delay) {
    const v = this.veil; if (!v) return;
    this.veilUp = false;
    const prevA = this.veilA;
    const inner = v.querySelector('[data-veil-inner]');
    inner && inner.animate([IDENT, { opacity: 0, transform: 'translate3d(0,-20px,0) scale(1.03)', filter: 'blur(6px)' }], { duration: 520, delay, easing: DRIFT, fill: 'forwards' }).finished.then(() => { inner.getAnimations().forEach((a) => a.cancel()); }).catch(() => {});
    this.veilA = v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 760, delay, easing: DRIFT, fill: 'both' });
    prevA && prevA.cancel();
    this.veilA.onfinish = () => { v.style.pointerEvents = 'none'; };
  }
  jump(el, label, after, eyebrow) {
    if (!el) return;
    const top = this.scrollTarget(el), from = window.scrollY, dist = top - from, ad = Math.abs(dist), vh = this.vh;
    if (!this.anim()) { this.cancelGlide(); window.scrollTo(0, top); after && after(); this.focusTarget(el); return; }
    if (ad < 4) { after && after(); this.focusTarget(el); return; }
    if (ad <= vh * 2.4 || !this.veil) {
      const dur = clamp(560 + (ad / vh) * 300, 640, 1250);
      this.showHeader(dur + 600);
      this.glideTo(top, dur, E_INOUT).then((ok) => { if (ok) this.focusTarget(el); });
      after && after();
      return;
    }
    // Long trip: lean into the motion, pass through the star-veil, then drift into place.
    const dir = Math.sign(dist);
    this.showHeader(2400);
    this.veilIn(label, eyebrow);
    this.glideTo(from + dir * vh * 0.55, 400, E_IN).then((ok) => {
      if (!ok) return;
      const land = this.scrollTarget(el);
      window.scrollTo(0, land - dir * vh * 0.9);
      this.measure(); this.tick();
      after && after();
      this.veilOut(80);
      this.glideTo(land, 1150, E_OUT).then((ok2) => { if (ok2) this.focusTarget(el); });
    });
  }
  focusTarget(el) {
    const h = el.querySelector('h1,h2,h3') || el;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.style.outline = 'none';
    h.focus && h.focus({ preventScroll: true });
  }
  stepWork(d) {
    const i = clamp(this.state.active + d, 0, ARTWORKS.length - 1);
    if (i === this.state.active) return;
    const a = ARTWORKS[i];
    this.setState({ active: i });
    this.jump(document.getElementById('work-' + a.id), a.title, null, 'Work ' + ROMAN[i]);
  }

  /* ---------- the map ---------- */
  openMenu() {
    if (this.state.menu) return;
    this.cancelGlide();
    this.menuOpener = document.activeElement;
    const b = document.querySelector('[data-menu-btn]');
    const r = b ? b.getBoundingClientRect() : null;
    this.iris = r ? [r.left + r.width / 2, r.top + r.height / 2] : [window.innerWidth - 60, 38];
    const here = this.liveHere();
    this.setState({ menu: true, mapScene: here.scene, mapWork: here.scene === 'journey' ? here.work : -1 }, () => {
      const main = document.getElementById('main'); if (main) main.inert = true;
      document.documentElement.style.overflow = 'hidden';
      const m = this.menuRef.current;
      if (m && this.anim()) {
        const [x, y] = this.iris;
        m.animate([{ clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(150vmax at ' + x + 'px ' + y + 'px)' }], { duration: 900, easing: SPELL });
        m.querySelectorAll('[data-map-item]').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translate3d(0,28px,0)', filter: 'blur(6px)' }, IDENT], { duration: 900, delay: 160 + i * 55, easing: SPELL, fill: 'backwards' }));
      }
      setTimeout(() => { const c = document.querySelector('[data-menu-close]'); c && c.focus(); }, 30);
    });
  }
  closeMenu(focusEl) {
    if (!this.state.menu || this.menuClosing) return;
    const m = this.menuRef.current;
    const done = () => {
      this.menuClosing = false;
      const main = document.getElementById('main'); if (main && this.state.route === null) main.inert = false;
      document.documentElement.style.overflow = '';
      this.setState({ menu: false }, () => {
        const f = focusEl || (this.menuOpener && document.contains(this.menuOpener) ? this.menuOpener : document.querySelector('[data-menu-btn]'));
        f && f.focus && f.focus({ preventScroll: true });
        this.measure(); this.req();
      });
    };
    if (!m || !this.anim()) { done(); return; }
    this.menuClosing = true;
    const b = document.querySelector('[data-menu-btn]'), r = b ? b.getBoundingClientRect() : null;
    const [x, y] = r && r.bottom > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : this.iris;
    const a = m.animate([{ clipPath: 'circle(150vmax at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }], { duration: 700, easing: TURN, fill: 'forwards' });
    a.onfinish = done;
  }
  // From the map, travel instantly behind the portal, then let it close on the destination.
  teleport(el, after) {
    if (!el) return;
    document.documentElement.style.overflow = '';
    window.scrollTo(0, this.scrollTarget(el));
    this.measure(); this.tick();
    this.showHeader(2400);
    after && after();
    const h = el.querySelector('h1,h2,h3') || el;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.style.outline = 'none';
    this.closeMenu(h);
  }

  setupVideos() {
    this.vio && this.vio.disconnect();
    const vids = Array.from(document.querySelectorAll('[data-video-for]'));
    vids.forEach((v) => { v.muted = true; v.defaultMuted = true; });
    if (!this.anim()) {
      vids.forEach((v) => v.pause());
      this.setState((s) => { const p = { ...s.paused }; vids.forEach((v) => (p[v.dataset.videoFor] = true)); return { paused: p }; });
      return;
    }
    this.vio = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && !this.state.paused[v.dataset.videoFor] && this.state.route === null) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.2 });
    vids.forEach((v) => this.vio.observe(v));
  }
  toggleVideo(id) {
    const v = document.querySelector('[data-video-for="' + id + '"]');
    if (!v) return;
    const paused = !this.state.paused[id];
    this.setState((s) => ({ paused: { ...s.paused, [id]: paused } }));
    if (paused) v.pause(); else { v.muted = true; v.play().catch(() => {}); }
  }
  /* ---------- detail overlay ---------- */
  insetFor(r) {
    const W = window.innerWidth, H = window.innerHeight;
    return 'inset(' + Math.max(0, r.top).toFixed(0) + 'px ' + Math.max(0, W - r.right).toFixed(0) + 'px ' + Math.max(0, H - r.bottom).toFixed(0) + 'px ' + Math.max(0, r.left).toFixed(0) + 'px round 28px)';
  }
  srcRect(id) {
    const s = document.querySelector('[data-media-for="' + id + '"]');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight ? r : null;
  }
  openAnim(id) {
    const ov = this.overlayRef.current;
    if (!ov || !this.anim()) return;
    const r = this.direct ? null : this.srcRect(id);
    const from = r ? this.insetFor(r) : 'inset(10% 10% 10% 10% round 28px)';
    ov.animate([{ clipPath: from, opacity: r ? 1 : 0 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], { duration: r ? 1000 : 800, easing: SPELL });
    ov.querySelectorAll('[data-detail-reveal]').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translate3d(0,32px,0)', filter: 'blur(8px)' }, IDENT], { duration: 1000, delay: 280 + i * 110, easing: SPELL, fill: 'backwards' }));
  }
  closeAnim(id, done) {
    const ov = this.overlayRef.current;
    if (!ov || !this.anim()) { done(); return; }
    const r = this.srcRect(id);
    const a = ov.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: r ? this.insetFor(r) : 'inset(8% 8% 8% 8% round 28px)', opacity: r ? 1 : 0 }], { duration: r ? 760 : 520, easing: TURN, fill: 'forwards' });
    a.onfinish = done;
  }
  applyOverlay(prevRoute, nextRoute) {
    const open = nextRoute !== null, was = prevRoute !== null;
    const main = document.getElementById('main');
    if (main) { main.inert = open; if (open) main.setAttribute('aria-hidden', 'true'); else main.removeAttribute('aria-hidden'); }
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.querySelectorAll('[data-video-for]').forEach((v) => { if (open) v.pause(); else if (this.anim() && !this.state.paused[v.dataset.videoFor]) { const r = v.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight) v.play().catch(() => {}); } });
    if (open) setTimeout(() => { const dv = document.querySelector('[data-detail-video]'); if (dv) { dv.muted = true; if (this.anim()) dv.play().catch(() => {}); } }, 80);
    if (open && !was) {
      let tries = 0;
      const f = () => { const b = document.querySelector('[data-detail-close]'); if (b) { b.focus(); if (document.activeElement !== b && tries++ < 20) setTimeout(f, 30); } else if (tries++ < 20) setTimeout(f, 30); };
      setTimeout(f, 0);
    }
    if (!open && was) {
      const opener = this.opener; this.opener = null;
      setTimeout(() => {
        const back = opener && document.contains(opener) && opener !== document.body ? opener : document.querySelector('[data-open-id="' + prevRoute + '"]');
        back && back.focus && back.focus({ preventScroll: true });
      }, 50);
    }
  }
  observe() {}
  parseHash() { const m = location.hash.match(/^#\/works\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; }
  syncRoute(initial) {
    const id = this.parseHash();
    const prev = this.state.route;
    if (!initial && prev !== null && id === null) {
      if (this.closing) return;
      this.closing = true;
      this.closeAnim(prev, () => { this.closing = false; this.setState({ route: null }, () => this.applyOverlay(prev, null)); });
      return;
    }
    this.setState({ route: id }, () => { this.applyOverlay(prev, id); if (id !== null && prev === null) requestAnimationFrame(() => this.openAnim(id)); });
    if (initial && id) { const i = ARTWORKS.findIndex((a) => a.id === id); if (i >= 0) { this.setState({ active: i }); setTimeout(() => this.scrollToWork(id, true), 60); } }
  }
  open(id) { this.opener = document.activeElement; this.direct = false; history.pushState(null, '', '#/works/' + id); this.syncRoute(false); }
  close(then) {
    if (this.closing) return;
    if (this.direct) {
      const id = this.state.route;
      this.direct = false;
      if (ARTWORKS.some((a) => a.id === id)) this.scrollToWork(id, true);
      this.closing = true;
      requestAnimationFrame(() => this.closeAnim(id, () => {
        this.closing = false;
        history.replaceState(null, '', location.pathname + location.search);
        this.setState({ route: null }, () => { this.applyOverlay(id, null); then && then(); });
      }));
    } else { history.back(); then && setTimeout(then, 900); }
  }
  handleKey(e) {
    const menu = this.state.menu;
    if (this.state.route === null && !menu) return;
    if (e.key === 'Escape') { e.preventDefault(); if (menu) this.closeMenu(); else this.close(); return; }
    const box = menu ? this.menuRef.current : this.overlayRef.current;
    if (e.key === 'Tab' && box) {
      const f = Array.from(box.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  scrollToWork(id, instant) { const el = document.getElementById('work-' + id); if (el) window.scrollTo({ top: this.scrollTarget(el), behavior: instant || !this.anim() ? 'auto' : 'smooth' }); }
  go(idx) { return (e) => { e && e.preventDefault && e.preventDefault(); this.jump(document.getElementById(SCENE_IDS[idx]), CHAPTERS[idx], idx === 0 ? () => this.playIntro() : null, CH_EYEBROW[idx]); }; }
  goMap(idx) { return (e) => { e && e.preventDefault && e.preventDefault(); this.teleport(document.getElementById(SCENE_IDS[idx]), idx === 0 ? () => this.playIntro() : null); }; }

  renderVals() {
    const p = this.props;
    const mediaSide = p.mediaSide ?? 'alternate';
    const { scene, active, route, wide, scrolledPast, headerDark, motionOff, menu } = this.state;
    const total = pad(ARTWORKS.length);
    const onDark = headerDark;
    const railDark = scene !== 'welcome';
    const mid = (ARTWORKS.length - 1) / 2;
    const sceneIdx = SCENES.indexOf(scene);
    const works = ARTWORKS.map((a, i) => {
      const order = !wide ? 1 : mediaSide === 'right' ? 3 : mediaSide === 'alternate' && i % 2 ? 3 : 1;
      return {
        ...a, num: pad(a.sequence), anchor: 'work-' + a.id, headingId: 'work-title-' + a.id,
        ratio: a.w + ' / ' + a.h, mediaSpec: TYPE_LABEL[a.type] + ', ' + a.w + ' × ' + a.h,
        mediaAlt: a.alt, isVideo: a.type === 'video', isStill: a.type !== 'video',
        toggleVideo: () => this.toggleVideo(a.id), videoText: this.state.paused[a.id] ? 'Play' : 'Pause', videoIcon: this.state.paused[a.id] ? 'play' : 'pause', videoLabel: (this.state.paused[a.id] ? 'Play ' : 'Pause ') + a.title,
        mediaOrder: order,
        glow: 'radial-gradient(55% 60% at ' + (order === 1 ? '28%' : '72%') + ' 55%, ' + a.hue + ' 0%, transparent 70%)',
        glowOpacity: scene === 'journey' && i === active ? 0.32 : 0,
        tilt: TILTS[i % TILTS.length], revealDelay: wide ? Math.abs(i - mid) * 120 : (i % 2) * 110,
        roman: ROMAN[i], moonBg: MOONS[i % MOONS.length].bg, moonShadow: MOONS[i % MOONS.length].sh,
        fan: wide ? 'translate3d(0,' + Math.round((i - mid) * (i - mid) * 10) + 'px,0) rotate(' + ((i - mid) * 3.4).toFixed(1) + 'deg)' : 'none',
        showStar: wide, hereFlag: i === active ? '1' : '0',
        nodeLit: sceneIdx > 2 || (sceneIdx === 2 && i <= active) ? '1' : '0',
        arcY: wide ? Math.round(Math.pow(Math.abs(i - mid), 2) * 4) + 'px' : '0px',
        open: () => this.open(a.id), openLabel: 'View ' + a.title + ' in detail',
        select: () => { this.setState({ active: i }); this.jump(document.getElementById('work-' + a.id), a.title, null, 'Work ' + ROMAN[i]); },
        mapHere: i === (this.state.mapWork ?? -1), mapCurrent: i === (this.state.mapWork ?? -1) ? 'location' : 'false',
        fromMap: () => { this.setState({ active: i }); this.teleport(document.getElementById('work-' + a.id)); },
        selectLabel: pad(a.sequence) + ' ' + a.title + ', ' + a.artist + (i === active ? ', current work' : ''),
        isActive: i === active, ariaCurrent: i === active ? 'true' : 'false',
        activeOutline: i === active ? '2px solid var(--violet-500)' : '0 solid transparent',
      };
    });
    const found = route !== null ? works.find((w) => w.id === route) : null;
    const detail = found ? { ...found, mediaType: TYPE_LABEL[found.type], caption: found.type === 'interactive' ? 'Still preview. The interactive version is in development.' : found.type === 'video' ? 'Muted loop. Use the controls to pause or replay.' : found.medium + ', ' + found.year, credits: { creator: 'Aurel studio', source: 'Original procedural artwork made for this site', license: 'Proprietary, © 2026 Aurel', attribution: '“Synthetic Nature series · Aurel”' } } : { credits: {} };
    const hud = scene === 'journey' && route === null && !menu;
    const navLinks = NAV.map((n) => {
      const on = scene === n.scene;
      return { href: '#' + SCENE_IDS[n.idx], label: n.label, go: this.go(n.idx), current: on ? 'true' : 'false', opacity: on ? 1 : 0.72, line: on ? 1 : 0, starOpacity: on ? 1 : 0, starTransform: on ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-90deg)' };
    });
    const mapScene = this.state.mapScene || scene, mapWork = this.state.mapWork ?? -1;
    const mapChapters = CHAPTERS.map((label, i) => ({ label, roman: CH_MARK[i], href: '#' + SCENE_IDS[i], go: this.goMap(i), here: SCENES[i] === mapScene, current: SCENES[i] === mapScene ? 'location' : 'false' }));
    return {
      overlayRef: this.overlayRef,
      wide, works, total, logoLight: !onDark, logoDark: onDark,
      anim: !motionOff, still: motionOff, heroHeight: motionOff ? '100svh' : '170svh', mistBlobs: wide ? 5 : 3,
      headerFg: onDark ? 'var(--cream-100)' : 'var(--indigo-800)',
      headerBg: scrolledPast ? (onDark ? 'var(--glass-dark)' : 'var(--glass-light)') : 'transparent',
      headerBlur: scrolledPast ? 'var(--blur-glass)' : 'none',
      hudOpacity: hud ? 1 : 0, hudVis: hud ? 'visible' : 'hidden', hudHidden: hud ? 'false' : 'true',
      hudTransform: hud ? 'translate3d(-50%,0,0)' : 'translate3d(-50%,24px,0)',
      hudTransition: hud ? 'opacity 520ms var(--ease-drift), transform 900ms var(--ease-spell), visibility 0s' : 'opacity 380ms var(--ease-drift), transform 520ms var(--ease-drift), visibility 0s linear 520ms',
      counter: pad(active + 1) + ' / ' + total, activeTitle: ARTWORKS[active].title,
      showRail: (p.chapterRail ?? true) && wide && route === null && !menu,
      navLinks, mapChapters, menuOpen: menu, menuExpanded: menu ? 'true' : 'false', menuRef: this.menuRef,
      openMenu: () => this.openMenu(), closeMenu: () => this.closeMenu(),
      prevWork: () => this.stepWork(-1), nextWork: () => this.stepWork(1),
      prevDisabled: active === 0, nextDisabled: active === ARTWORKS.length - 1,
      prevOpacity: active === 0 ? 0.35 : 1, nextOpacity: active === ARTWORKS.length - 1 ? 0.35 : 1,
      atlasCols: wide ? 'repeat(7, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
      atlasGap: wide ? 'clamp(14px,1.8vw,26px)' : '36px 16px',
      atlasPad: wide ? '44px 0 96px' : '0',
      spinSlow: motionOff ? 'none' : 'aurel-spin 160s linear infinite',
      spinSlow45: motionOff ? 'none' : 'aurel-spin45 160s linear infinite',
      spinSigil: motionOff ? 'none' : 'aurel-spin 140s linear infinite',
      spinSigilBack: motionOff ? 'none' : 'aurel-spin-back 140s linear infinite',
      pulseAnim: motionOff ? 'none' : 'aurel-pulse 6s ease-in-out infinite',
      auroraAnim: motionOff ? 'none' : 'aurel-aurora 22s ease-in-out infinite',
      stmtOverlap: motionOff ? '0px' : '-40svh',
      shaftAnim: motionOff ? 'none' : 'aurel-shaft 7s ease-in-out infinite',
      swayA: motionOff ? 'none' : 'aurel-sway 6s ease-in-out infinite',
      swayB: motionOff ? 'none' : 'aurel-sway 7.5s ease-in-out -2s infinite',
      swayC: motionOff ? 'none' : 'aurel-sway 5.2s ease-in-out -1s infinite',
      wispA: motionOff ? 'none' : 'aurel-wisp 26s ease-in-out infinite',
      wispB: motionOff ? 'none' : 'aurel-wisp 34s ease-in-out -9s infinite',
      runes: RUNES, orbs: ORBS, motes: MOTES, hillMotes: HILL_MOTES, meteors: METEORS,
      spinBack: motionOff ? 'none' : 'aurel-spin-back 220s linear infinite',
      chapters: CHAPTERS, chapterIndex: Math.max(0, SCENES.indexOf(scene)), railOnDark: railDark,
      goChapter: (i) => this.go(i)(),
      goTop: this.go(0), goStatement: this.go(1), goJourney: this.go(2), goIndex: this.go(3),
      detailOpen: route !== null, detailFound: !!found, detailMissing: route !== null && !found, detail,
      closeText: this.direct ? 'Back to the collection' : 'Close',
      closeLabel: this.direct ? 'Close and go to the collection' : 'Close and return to the journey',
      closeDetail: () => this.close(),
      closeToIndex: () => this.close(() => this.jump(document.getElementById('index'), 'The Atlas', null, 'Chapter III')),
    };
  }

  render() {
    const v = this.renderVals();
    const { detail } = v;
    const scrubWords: [string, boolean][] = [["work", false], ["here", false], ["began", false], ["as", false], ["something", false], ["alive:", false], ["moss,", true], ["tide,", true], ["seed,", true], ["flock.", true], ["Each", false], ["was", false], ["then", false], ["handed", false], ["to", false], ["a", false], ["machine.", false]];
    return (
      <>
        <a className="skip-link" href="#main" style={s("position:fixed;left:16px;top:-80px;z-index:200;padding:12px 20px;border-radius:var(--radius-md);background:var(--indigo-700);color:var(--cream-100);font-weight:600;")}>Skip to the collection</a>

        <div data-progress-bar="page" aria-hidden="true" style={s("position:fixed;top:0;left:0;right:0;height:2px;z-index:60;background:var(--moon-300);transform-origin:left center;transform:scaleX(0);pointer-events:none;")}></div>

        <header style={s(`position:fixed;top:0;left:0;right:0;z-index:50;height:76px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:var(--space-4);padding:0 clamp(20px,5vw,64px);color:${v.headerFg};background:${v.headerBg};backdrop-filter:${v.headerBlur};-webkit-backdrop-filter:${v.headerBlur};transition:background var(--dur-gentle) var(--ease-drift), color var(--dur-gentle) var(--ease-drift), transform var(--dur-tale) var(--ease-spell);`)}>
          <nav aria-label="Primary" style={s("display:flex;gap:var(--space-1);align-items:center;margin-left:-14px;")}>
            {v.wide && v.navLinks.map((n) => (
              <a key={n.label} href={n.href} onClick={n.go} aria-current={n.current as "true" | "false"} className="nav-link" style={s(`opacity:${n.opacity};`)}>
                <span className="nav-star" aria-hidden="true" style={s(`opacity:${n.starOpacity};transform:${n.starTransform};`)}></span>
                <span>{n.label}</span>
                <span className="nav-line" aria-hidden="true" style={s(`transform:scaleX(${n.line});`)}></span>
              </a>
            ))}
          </nav>
          <a href="#top" onClick={v.goTop} aria-label="AUREL, back to the start" style={s("display:flex;align-items:center;line-height:0;")}>
            {v.logoLight && <img src="/assets/brand/aurel-logo.svg" alt="" width={256} height={96} style={s("display:block;height:clamp(34px,4vw,44px);width:auto;")} />}
            {v.logoDark && <img src="/assets/brand/aurel-logo-cream.svg" alt="" width={256} height={96} style={s("display:block;height:clamp(34px,4vw,44px);width:auto;")} />}
          </a>
          <div style={s("display:flex;justify-content:flex-end;")}>
            <button type="button" data-menu-btn="" className="hdr-btn" onClick={v.openMenu} aria-haspopup="dialog" aria-expanded={v.menuExpanded as "true" | "false"}>
              <Icon name="compass" size={16} />
              <span>The map</span>
            </button>
          </div>
        </header>

        <main id="main">
          {/* S1 Welcome — pinned sky, rising hills */}
          <section id="top" data-scene="welcome" data-par-root="pin" aria-labelledby="welcome-title" style={s(`position:relative;height:${v.heroHeight};background:var(--night-900);`)}>
            <div data-o="1,0" data-range="0.55,1" style={s("position:sticky;top:0;height:100svh;overflow:hidden;background:var(--grad-dusk);display:flex;flex-direction:column;")}>
              <img src="/assets/hero/hero-sky.webp" alt="" aria-hidden="true" width={2560} height={1600} fetchPriority="high" data-y="0,-10v" style={s("position:absolute;left:0;top:0;width:100%;height:112%;object-fit:cover;object-position:center top;")} />
              {v.anim && (
                <div data-y="0,-8v" style={s("position:absolute;inset:-10% 0 0 0;")}>
                  <Mist tone="dusk" blobs={v.mistBlobs} />
                </div>
              )}
              <div data-o="0,1" data-range="0.15,0.85" aria-hidden="true" style={s("position:absolute;inset:0;background:var(--night-900);opacity:0;")}></div>
              <div data-o="0,1" data-range="0.1,0.6" aria-hidden="true" style={s("position:absolute;inset:0;opacity:0;")}>
                {v.anim && <StarField count={70} seed={3} />}
              </div>
              <div data-y="0,-38v" data-pointer="10" aria-hidden="true" style={s("position:absolute;top:clamp(40px,8%,110px);right:clamp(-40px,4vw,120px);width:clamp(190px,24vw,380px);aspect-ratio:1 / 1;")}>
                <img data-intro="150" data-intro-kind="moon" src="/assets/hero/hero-moon.webp" alt="" width={600} height={600} style={s("display:block;width:100%;height:auto;")} />
              </div>

              <div data-y="0,-18v" data-o="1,0" data-blur="0,12" data-range="0,0.42" style={s("position:absolute;top:0;bottom:0;left:0;right:0;z-index:8;box-sizing:border-box;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(12px,2.4svh,24px);max-width:920px;margin:0 auto;padding:76px clamp(20px,6vw,64px);")}>
                <p data-intro="80" style={s("font-family:var(--font-display);font-style:italic;font-size:var(--text-h4);color:var(--violet-600);")}>An immersive digital art gallery</p>
                <h1 id="welcome-title" style={s("font-size:clamp(52px,9vw,128px);line-height:var(--leading-display);letter-spacing:var(--tracking-display);color:var(--indigo-800);")}>
                  {v.anim && <TextReveal text="Synthetic Nature" as="span" trigger="mount" delay={220} stagger={110} />}
                  {v.still && "Synthetic Nature"}
                </h1>
                <p data-intro="520" style={s("font-size:clamp(18px,2vw,var(--text-lead));line-height:var(--leading-tight);color:var(--ink-700);max-width:34ch;")}>Seven digital works where living forms meet machine processes.</p>
                <div data-intro="680" style={s("margin-top:var(--space-2);display:flex;gap:var(--space-3);flex-wrap:wrap;justify-content:center;")}>
                  <button type="button" className="spell-btn spell-lg spell-glass" onClick={v.goStatement}><span>Begin the visit</span></button>
                </div>
              </div>

              <div aria-hidden="true" style={s("position:relative;z-index:4;flex:1 0 clamp(120px,24svh,380px);margin-top:clamp(12px,3svh,40px);")}>
                <div data-y="0,-30v" data-pointer="22" style={s("position:absolute;z-index:1;left:50%;width:max(120vw, 1300px);margin-left:calc(-0.5 * max(120vw, 1300px));top:calc(100% - 0.155 * max(120vw, 1300px) - 0.0994 * max(124vw, 1340px) - 13svh + 2px);")}>
                  <div data-intro="60" data-intro-kind="hill">
                    <img src="/assets/hero/hero-hill-back.webp" alt="" width={3200} height={1600} style={s("display:block;width:100%;height:auto;")} />
                    <div style={s("height:120svh;margin-top:-2px;background:#5638B8;")}></div>
                  </div>
                </div>
                <div data-y="0,-64v" data-pointer="44" style={s("position:absolute;z-index:2;left:50%;width:max(126vw, 1360px);margin-left:calc(-0.5 * max(126vw, 1360px));top:calc(100% - 0.0675 * max(126vw, 1360px) - 0.0994 * max(124vw, 1340px) - 11svh + 2px);")}>
                  <div data-intro="180" data-intro-kind="hill">
                    <img src="/assets/hero/hero-hill-mid.webp" alt="" width={3200} height={1800} style={s("display:block;width:100%;height:auto;transform:scaleX(-1);")} />
                    <div style={s("height:120svh;margin-top:-2px;background:#2E1F66;")}></div>
                  </div>
                </div>
                <div data-y="0,-125v" data-pointer="70" style={s("position:absolute;z-index:3;left:50%;width:max(124vw, 1340px);margin-left:calc(-0.5 * max(124vw, 1340px));top:calc(100% - 0.1154 * max(124vw, 1340px) + 2px);")}>
                  <div data-intro="300" data-intro-kind="hill">
                    <img src="/assets/hero/hero-hill-front.webp" alt="" width={3200} height={2600} style={s("display:block;width:100%;height:auto;")} />
                    <div style={s("height:150svh;margin-top:-2px;background:#1C1340;")}></div>
                  </div>
                </div>
              </div>
              <div data-o="1,0" data-range="0,0.12" aria-hidden="true" style={s("position:absolute;z-index:9;left:50%;bottom:clamp(16px,3svh,32px);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:var(--space-2);color:var(--text-on-dark-muted);font-size:var(--text-caption);letter-spacing:.14em;")}>
                <span>SCROLL TO BEGIN</span>
                <span style={s("position:relative;width:1px;height:48px;background:var(--border-on-dark);overflow:hidden;")}>
                  <span data-cue-dot="" style={s("position:absolute;left:-1px;top:0;width:3px;height:10px;border-radius:2px;background:var(--moon-300);")}></span>
                </span>
              </div>
            </div>
          </section>

          {/* S2 Curatorial statement — the grimoire */}
          <section id="statement" data-scene="statement" data-par-root="" data-xfade="" aria-labelledby="statement-title" style={s(`position:relative;z-index:1;margin-top:${v.stmtOverlap};overflow:hidden;background:linear-gradient(180deg,var(--night-900) 0%,#170F35 50%,var(--night-900) 100%);color:var(--text-on-dark);padding:clamp(96px,12vw,160px) clamp(20px,6vw,96px) clamp(110px,14vw,200px);`)}>
            <div className="edge-fade" aria-hidden="true" style={s("position:absolute;inset:0;pointer-events:none;")}>
              <div aria-hidden="true" data-y="-8v,8v" style={s("position:absolute;inset:-6% -12% 35% -12%;pointer-events:none;")}>
                <div className="aurora" style={s(`animation:${v.auroraAnim};`)}></div>
              </div>
              {v.anim && (
                <>
                  <div aria-hidden="true" data-y="-10v,10v" style={s("position:absolute;inset:-15% 0;")}>
                    <Mist tone="night" blobs={v.mistBlobs} />
                  </div>
                  <div aria-hidden="true" data-y="-6v,6v" style={s("position:absolute;inset:-10% 0;")}>
                    <StarField count={70} seed={11} maxSize={2.4} />
                  </div>
                </>
              )}
            </div>

            <div style={s("position:relative;z-index:1;max-width:var(--content-max);margin:0 auto;display:flex;flex-direction:column;gap:clamp(56px,8vw,112px);")}>
              <div style={s("display:flex;flex-direction:column;align-items:center;text-align:center;gap:var(--space-5);")}>
                <div data-reveal="fade" style={s("display:flex;")}>
                  <Pill tone="glass">CHAPTER I · THE STATEMENT</Pill>
                </div>
                <h2 id="statement-title" style={s("font-size:clamp(40px,5.8vw,var(--text-d1));line-height:var(--leading-display);letter-spacing:var(--tracking-display);color:var(--cream-100);max-width:16ch;")}>
                  {v.anim && <TextReveal text="Where the grown meets the made" as="span" />}
                  {v.still && "Where the grown meets the made"}
                </h2>
                <p data-reveal="rise" data-delay="200" className="veil-num" style={s("color:var(--text-on-dark-muted);")}>Collection I · 2022–2026 · Seven works</p>
              </div>

              <div style={s("display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:clamp(56px,7vw,112px);")}>
                {/* The sigil: seven names circle a living seed; four specimens orbit it */}
                <div aria-hidden="true" data-y="9v,-9v" data-pointer="10" style={s("flex:1 1 400px;min-width:0;display:flex;justify-content:center;")}>
                  <div data-reveal="frame" style={s("position:relative;width:min(100%,560px);aspect-ratio:1 / 1;container-type:inline-size;")}>
                    <div className="astro-ring" style={s("inset:0;border:1px solid rgba(255,223,158,.30);")}></div>
                    <div className="astro-ring" style={s("inset:6%;border:1px solid rgba(255,247,240,.08);")}></div>
                    <div className="astro-ring astro-spin" style={s(`inset:13%;background:repeating-conic-gradient(from 0deg,rgba(255,223,158,.5) 0deg .5deg,transparent .5deg 7.5deg);-webkit-mask:radial-gradient(closest-side,transparent calc(100% - 12px),#000 calc(100% - 12px) calc(100% - 2px),transparent calc(100% - 2px));mask:radial-gradient(closest-side,transparent calc(100% - 12px),#000 calc(100% - 12px) calc(100% - 2px),transparent calc(100% - 2px));animation:${v.spinBack};`)}></div>
                    <div className="astro-ring" style={s("inset:24%;border:1px dashed rgba(255,247,240,.14);")}></div>
                    <div className="astro-ring astro-spin" style={s(`inset:30%;border-radius:0;border:1px solid rgba(255,223,158,.22);animation:${v.spinSlow};`)}></div>
                    <div className="astro-ring astro-spin" style={s(`inset:30%;border-radius:0;border:1px solid rgba(255,223,158,.22);transform:rotate(45deg);animation:${v.spinSlow45};`)}></div>
                    <div className="astro-ring" style={s("inset:33%;background:radial-gradient(circle,rgba(142,115,228,.35) 0%,rgba(142,115,228,0) 70%);")}></div>
                    <div className="astro-ring seed-core" style={s(`inset:39%;background:radial-gradient(circle at 50% 50%,#FFFCF8 0%,#FFDF9E 22%,rgba(242,167,211,.55) 45%,rgba(142,115,228,0) 70%);animation:${v.pulseAnim};`)}></div>

                    <div className="astro-ring astro-spin" style={s(`inset:0;animation:${v.spinSigil};`)}>
                      {v.runes.map((r, i) => (
                        <span key={i} className="rune" style={s(`transform:rotate(${r.angle}) translateY(-46.5cqw);`)}>{r.ch}</span>
                      ))}
                      {v.orbs.map((o) => (
                        <div key={o.label} className="orb-pos" style={s(`transform:rotate(${o.angle}) translateY(-33cqw) rotate(${o.neg});`)}>
                          <div className="orb astro-spin" style={s(`animation:${v.spinSigilBack};`)}>
                            <span className="orb-img" style={s(`background-image:url('${o.src}');`)}></span>
                            <span className="orb-label">{o.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={s("flex:1 1 380px;min-width:0;max-width:var(--prose-max);display:flex;flex-direction:column;gap:var(--space-6);")}>
                  <p data-scrub="" style={s("font-family:var(--font-display);font-style:italic;font-size:clamp(24px,2.6vw,var(--text-h3));line-height:var(--leading-tight);color:var(--cream-100);")}>
                    <span data-w=""><span className="dropcap" aria-hidden="true">E</span><span className="sr-only">E</span>very</span>
                    {scrubWords.map(([w, key]) => (
                      <Fragment key={w}>{" "}<span data-w="" className={key ? "scrub-key" : undefined}>{w}</span></Fragment>
                    ))}
                  </p>
                  <div data-reveal="rise" aria-hidden="true" style={s("display:flex;align-items:center;gap:12px;color:var(--moon-300);")}>
                    <span style={s("flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(255,223,158,.5));")}></span>
                    <span className="nav-star" style={s("position:relative;left:auto;top:auto;margin:0;width:10px;height:10px;")}></span>
                    <span style={s("flex:1;height:1px;background:linear-gradient(90deg,rgba(255,223,158,.5),transparent);")}></span>
                  </div>
                  <p data-reveal="rise" style={s("font-size:var(--text-body-lg);color:var(--text-on-dark-muted);")}>Some were grown by code, some simulated, some trained on living archives. None are copies of nature. They ask what remains of a fern, a forest or a flock once software has learned its pattern.</p>
                  <p data-reveal="rise" data-delay="120" style={s("font-size:var(--text-body-lg);color:var(--text-on-dark-muted);")}>Scroll to walk through the works in order, or find any of them on the atlas.</p>
                  <div data-reveal="rise" data-delay="240" style={s("display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-2);")}>
                    <button type="button" className="spell-btn spell-lg" onClick={v.goJourney}><span>Begin exploring</span></button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* S3 Gallery journey — through the gate, along the gold thread */}
          <section id="journey" data-scene="journey" aria-labelledby="journey-title" style={s("position:relative;background:var(--night-900);color:var(--text-on-dark);")}>
            <div aria-hidden="true" style={s("position:sticky;top:0;height:100svh;margin-bottom:-100svh;overflow:hidden;pointer-events:none;")}>
              {v.works.map((w) => (
                <div key={w.id} style={s(`position:absolute;inset:0;background:${w.glow};opacity:${w.glowOpacity};transition:opacity 1400ms var(--ease-drift);`)}></div>
              ))}
              {v.anim && (
                <>
                  <StarField count={36} seed={21} maxSize={2} />
                  {v.motes.map((m, i) => (
                    <span key={i} className="mote" style={s(`left:${m.x};top:${m.y};animation:${m.anim};`)}></span>
                  ))}
                </>
              )}
            </div>

            <div data-par-root="" style={s("position:relative;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:var(--space-6);padding:var(--space-24) clamp(20px,6vw,96px);overflow:hidden;")}>
              <div aria-hidden="true" data-y="10v,-6v" style={s("position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;")}>
                <div data-reveal="fade" style={s("position:relative;")}>
                  <span className="gate-key"></span>
                  <div className="gate">
                    <div className="gate-shaft" style={s(`animation:${v.shaftAnim};`)}></div>
                    <div className="charm" style={s(`left:30%;height:22%;animation:${v.swayA};`)}><span></span></div>
                    <div className="charm" style={s(`left:50%;height:34%;animation:${v.swayB};`)}><span></span></div>
                    <div className="charm" style={s(`left:70%;height:16%;animation:${v.swayC};`)}><span></span></div>
                  </div>
                </div>
              </div>
              <div data-reveal="fade" style={s("position:relative;display:flex;")}>
                <Pill tone="glass">CHAPTER II · THE JOURNEY</Pill>
              </div>
              <h2 id="journey-title" style={s("position:relative;font-size:clamp(40px,6vw,var(--text-d1));line-height:var(--leading-display);letter-spacing:var(--tracking-display);color:var(--cream-100);max-width:14ch;")}>
                {v.anim && <TextReveal text="Step through the gate" as="span" />}
                {v.still && "Step through the gate"}
              </h2>
              <p data-reveal="rise" data-delay="300" style={s("position:relative;font-size:var(--text-body-lg);color:var(--text-on-dark-muted);max-width:40ch;")}>Seven works wait on the other side, strung on one gold thread. Each arrives in turn. Open any of them for a closer look, or keep walking.</p>
            </div>

            <ol style={s("position:relative;list-style:none;margin:0 auto;padding:0 clamp(20px,6vw,96px);max-width:calc(var(--content-max) + 192px);")}>
              {v.wide && (
                <span aria-hidden="true" className="thread-base">
                  <span data-progress-bar="thread" className="thread-fill"></span>
                </span>
              )}
              {v.works.map((w) => (
                <li key={w.id} id={w.anchor} data-work={w.id} data-par-root="" aria-labelledby={w.headingId} style={s("position:relative;min-height:100svh;display:flex;flex-wrap:wrap;align-items:center;align-content:center;gap:clamp(32px,5vw,80px);padding:clamp(72px,10svh,120px) 0;")}>
                  {w.showStar && <span className="path-node" data-lit={w.nodeLit} aria-hidden="true"></span>}
                  <figure style={s(`order:${w.mediaOrder};flex:1 1 520px;min-width:0;margin:0;`)}>
                    <div data-media-for={w.id} data-reveal="frame" data-tilt="" style={s(`position:relative;width:100%;aspect-ratio:${w.ratio};max-height:72svh;border-radius:var(--radius-xl);overflow:hidden;background:var(--night-950);box-shadow:0 0 0 1px rgba(255,223,158,.5),0 0 0 9px rgba(255,223,158,.06),var(--shadow-lg),0 0 90px -24px ${w.hue};display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(20px,3vw,36px);transition:transform 900ms var(--ease-spell);`)}>
                      <div aria-hidden="true" data-y="-7v,7v" style={s("position:absolute;left:0;right:0;top:-12%;bottom:-12%;")}>
                        <div data-reveal-inner="" style={s("position:absolute;inset:0;background:var(--night-950);")}>
                          {w.isVideo && (
                            <video data-video-for={w.id} poster={w.poster} muted loop playsInline preload="metadata" aria-label={w.mediaAlt} style={s("width:100%;height:100%;object-fit:cover;display:block;")}>
                              <source src={w.webm} type="video/webm" />
                              <source src={w.mp4} type="video/mp4" />
                            </video>
                          )}
                          {w.isStill && <img src={w.src} alt={w.mediaAlt} loading="lazy" decoding="async" width={w.w} height={w.h} style={s("width:100%;height:100%;object-fit:cover;display:block;")} />}
                        </div>
                      </div>
                      <span className="frame-inner" aria-hidden="true">
                        <span className="corner-star" style={s("left:-6px;top:-6px;")}></span>
                        <span className="corner-star" style={s("right:-6px;top:-6px;")}></span>
                        <span className="corner-star" style={s("left:-6px;bottom:-6px;")}></span>
                        <span className="corner-star" style={s("right:-6px;bottom:-6px;")}></span>
                      </span>
                      <div data-glint="" aria-hidden="true" style={s("position:absolute;inset:0;opacity:0;transition:opacity 600ms var(--ease-drift);pointer-events:none;")}></div>
                      {w.isVideo && (
                        <button type="button" onClick={w.toggleVideo} aria-label={w.videoLabel} style={s("position:relative;align-self:flex-start;display:inline-flex;align-items:center;gap:var(--space-2);min-height:44px;padding:0 16px 0 12px;border-radius:var(--radius-pill);border:1px solid var(--border-on-dark);background:var(--glass-dark);backdrop-filter:var(--blur-glass);-webkit-backdrop-filter:var(--blur-glass);color:var(--cream-100);font-family:var(--font-body);font-size:var(--text-small);font-weight:600;cursor:pointer;")}>
                          <Icon name={w.videoIcon} size={16} />
                          <span>{w.videoText}</span>
                        </button>
                      )}
                    </div>
                  </figure>
                  <div style={s("position:relative;order:2;flex:1 1 300px;min-width:0;max-width:460px;display:flex;flex-direction:column;gap:var(--space-5);")}>
                    <span aria-hidden="true" data-y="14v,-14v" style={s("position:absolute;z-index:0;top:-0.62em;left:-0.04em;font-family:var(--font-display);font-style:italic;font-size:clamp(120px,15vw,240px);line-height:1;white-space:nowrap;color:transparent;-webkit-text-stroke:1px rgba(255,223,158,.2);pointer-events:none;user-select:none;")}>{w.roman}</span>
                    <p data-reveal="fade" data-delay="200" className="veil-num" style={s("position:relative;")}>Work {w.roman} <span style={s("color:var(--text-on-dark-muted);")}>of VII</span></p>
                    <h3 id={w.headingId} data-reveal="mask" data-delay="280" style={s("position:relative;font-size:clamp(34px,4vw,var(--text-h1));line-height:var(--leading-heading);color:var(--cream-100);")}>{w.title}</h3>
                    <div data-reveal="rise" data-delay="360" aria-hidden="true" style={s("position:relative;display:flex;align-items:center;gap:12px;max-width:240px;")}>
                      <span className="nav-star" style={s("position:relative;left:auto;top:auto;margin:0;width:9px;height:9px;")}></span>
                      <span style={s("flex:1;height:1px;background:linear-gradient(90deg,rgba(255,223,158,.55),transparent);")}></span>
                    </div>
                    <dl data-reveal="rise" data-delay="420" style={s("position:relative;margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--space-2) var(--space-5);font-size:var(--text-small);")}>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Artist</dt><dd style={s("margin:0;color:var(--cream-100);")}>{w.artist}</dd>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Year</dt><dd style={s("margin:0;color:var(--cream-100);")}>{w.year}</dd>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Medium</dt><dd style={s("margin:0;color:var(--cream-100);")}>{w.medium}</dd>
                    </dl>
                    <p data-reveal="rise" data-delay="520" style={s("position:relative;font-size:var(--text-body-lg);color:var(--text-on-dark-muted);")}>{w.summary}</p>
                    <div data-reveal="rise" data-delay="620" style={s("position:relative;display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:var(--space-2);")}>
                      <button type="button" className="spell-btn" onClick={w.open} aria-label={w.openLabel} data-open-id={w.id}><span>View the work</span></button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* S5 The Atlas — seven stars, one sky */}
          <section id="index" data-scene="index" data-par-root="" aria-labelledby="index-title" style={s("position:relative;overflow:hidden;background:radial-gradient(85% 34% at 50% 58%,var(--indigo-700) 0%,var(--indigo-800) 45%,var(--night-900) 100%) var(--night-900);color:var(--text-on-dark);padding:clamp(104px,13vw,176px) clamp(20px,5vw,72px) clamp(120px,14vw,200px);")}>
            <div className="edge-fade" aria-hidden="true" style={s("position:absolute;inset:0;pointer-events:none;")}>
              {v.anim && (
                <>
                  <div aria-hidden="true" data-y="-10v,10v" style={s("position:absolute;inset:-15% 0;")}>
                    <Mist tone="night" blobs={v.mistBlobs} />
                  </div>
                  <div aria-hidden="true" data-y="-5v,5v" style={s("position:absolute;inset:-8% 0;")}>
                    <StarField count={90} seed={5} maxSize={2.4} />
                  </div>
                </>
              )}

              {/* Astrolabe */}
              <div aria-hidden="true" data-y="14v,-14v" style={s("position:absolute;left:50%;top:60%;width:min(1180px,160vw);aspect-ratio:1 / 1;margin-left:calc(-0.5 * min(1180px,160vw));margin-top:calc(-0.5 * min(1180px,160vw));pointer-events:none;opacity:.9;")}>
                <div className="astro-ring" style={s("inset:0;border:1px solid rgba(255,247,240,.10);")}></div>
                <div className="astro-ring astro-spin" style={s(`inset:2.5%;background:repeating-conic-gradient(from 0deg,rgba(242,207,120,.42) 0deg .45deg,transparent .45deg 5deg);-webkit-mask:radial-gradient(closest-side,transparent calc(100% - 16px),#000 calc(100% - 16px) calc(100% - 3px),transparent calc(100% - 3px));mask:radial-gradient(closest-side,transparent calc(100% - 16px),#000 calc(100% - 16px) calc(100% - 3px),transparent calc(100% - 3px));animation:${v.spinSlow};`)}></div>
                <div className="astro-ring astro-spin" style={s(`inset:17%;border:1px dashed rgba(255,247,240,.12);animation:${v.spinBack};`)}></div>
                <div className="astro-ring" style={s("inset:31%;border:1px solid rgba(242,207,120,.16);")}></div>
                <div className="astro-ring" style={s("inset:34% 0;border:1px solid rgba(255,247,240,.08);transform:rotate(-16deg);")}></div>
                <div className="astro-ring" style={s("inset:44%;background:radial-gradient(circle,rgba(242,207,120,.22) 0%,rgba(242,207,120,0) 70%);")}></div>
                <div style={s("position:absolute;left:50%;top:0;bottom:0;width:1px;background:linear-gradient(180deg,transparent,rgba(255,247,240,.10) 20%,rgba(255,247,240,.10) 80%,transparent);")}></div>
                <div style={s("position:absolute;top:50%;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,247,240,.10) 20%,rgba(255,247,240,.10) 80%,transparent);")}></div>
              </div>
            </div>

            <div style={s("position:relative;z-index:1;max-width:760px;margin:0 auto;display:flex;flex-direction:column;align-items:center;text-align:center;gap:var(--space-5);")}>
              <div data-reveal="fade" style={s("display:flex;")}>
                <Pill tone="glass">CHAPTER III · THE ATLAS</Pill>
              </div>
              <h2 id="index-title" style={s("font-size:clamp(40px,5.6vw,var(--text-d1));line-height:var(--leading-display);letter-spacing:var(--tracking-display);color:var(--cream-100);")}>
                {v.anim && <TextReveal text="Seven stars, one sky" as="span" />}
                {v.still && "Seven stars, one sky"}
              </h2>
              <p data-reveal="rise" data-delay="200" style={s("font-size:var(--text-body-lg);color:var(--text-on-dark-muted);max-width:42ch;")}>Every work is a star on the same chart, joined by a gold thread in the order of the journey. Choose one and the night carries you to it.</p>
            </div>

            <div style={s("position:relative;z-index:1;max-width:1240px;margin:clamp(48px,7vw,104px) auto 0;")}>
              <canvas data-constellation="" aria-hidden="true" style={s("position:absolute;inset:0;width:100%;height:100%;pointer-events:none;")}></canvas>
              <ul data-atlas="" style={s(`position:relative;list-style:none;margin:0;padding:${v.atlasPad};display:grid;grid-template-columns:${v.atlasCols};gap:${v.atlasGap};align-items:start;`)}>
                {v.works.map((w) => (
                  <li key={w.id} style={s(`position:relative;min-width:0;transform:${w.fan};transform-origin:50% 130%;transition:transform 1000ms var(--ease-spell);`)}>
                    {w.showStar && <span className="atlas-star" data-star="" data-here={w.hereFlag} aria-hidden="true"></span>}
                    <div data-reveal="card" data-delay={w.revealDelay}>
                      <button type="button" className="atlas-card" onClick={w.select} aria-current={w.ariaCurrent as "true" | "false"} aria-label={w.selectLabel}>
                        <span className="atlas-frame" aria-hidden="true">
                          <span className="atlas-window">
                            <img src={w.thumb} alt="" loading="lazy" decoding="async" width={800} height={1000} />
                            <span className="atlas-shade"></span>
                            <span className="atlas-inner"></span>
                            <span className="atlas-num">{w.roman}</span>
                            <span className="atlas-moon" style={s(`background:${w.moonBg};box-shadow:${w.moonShadow};`)}></span>
                          </span>
                        </span>
                        <span style={s("display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 2px;")}>
                          <span className="atlas-title">{w.title}</span>
                          <span className="atlas-meta">{w.artist}, {w.year}</span>
                          {w.isActive && (
                            <span style={s("margin-top:6px;")}><Pill tone="mint" size="sm">You are here</Pill></span>
                          )}
                        </span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* S6 Closing — the last light */}
          <section id="closing" data-scene="closing" data-par-root="" aria-labelledby="closing-title" style={s("--band:clamp(260px,52svh,560px);position:relative;overflow:hidden;background:linear-gradient(180deg,#1C1340 0,#1F1547 calc(var(--band) * .3),#2E1F66 calc(var(--band) * .7),#3F2C8C var(--band),#33237A calc(var(--band) + 20svh),#2A1C5E calc(var(--band) + 45svh),#1C1340 calc(var(--band) + 85svh),#110B2B 100%);color:var(--text-on-dark);")}>
            <div aria-hidden="true" style={s("position:absolute;left:-10%;right:-10%;top:calc(var(--band) - 34svh);height:68svh;pointer-events:none;background:radial-gradient(50% 50% at 50% 50%,rgba(242,167,211,.34) 0%,rgba(217,107,176,.16) 40%,rgba(217,107,176,0) 72%);")}></div>
            <div aria-hidden="true" style={s("position:absolute;left:-10%;right:-10%;top:calc(var(--band) - 16svh);height:24svh;pointer-events:none;background:linear-gradient(100deg,transparent 15%,rgba(42,174,138,.18) 35%,rgba(242,167,211,.22) 55%,transparent 80%);filter:blur(56px);")}></div>
            <div aria-hidden="true" style={s("position:relative;height:var(--band);")}>
              {v.anim && (
                <div className="edge-fade" style={s("position:absolute;inset:0 0 25% 0;")}>
                  <StarField count={40} seed={17} maxSize={2} />
                </div>
              )}
            </div>
            {v.anim && (
              <div aria-hidden="true" style={s("position:absolute;inset:0 0 45% 0;z-index:1;pointer-events:none;overflow:hidden;")}>
                {v.meteors.map((m, i) => (
                  <span key={i} className="meteor" style={s(`left:${m.x};top:${m.y};animation:${m.anim};`)}></span>
                ))}
              </div>
            )}
            <div style={s("position:relative;min-height:100svh;display:flex;flex-direction:column;align-items:center;text-align:center;padding:clamp(48px,8vw,120px) clamp(20px,6vw,96px) 0;")}>
              {v.anim && <StarField count={60} seed={9} />}
              <div data-y="10v,0" data-range="0.15,0.6" aria-hidden="true" style={s("position:relative;z-index:1;width:clamp(180px,22vw,320px);aspect-ratio:1 / 1;margin:calc(-1 * clamp(40px,6vw,90px)) 0 clamp(28px,4vw,56px);")}>
                <div className="astro-ring seed-core" style={s(`inset:-30%;background:radial-gradient(circle,rgba(255,223,158,.36) 0%,rgba(242,167,211,.16) 40%,rgba(142,115,228,0) 70%);animation:${v.pulseAnim};`)}></div>
                <img alt="" src="/assets/hero/hero-moon.webp" width={600} height={600} loading="lazy" style={s("position:relative;display:block;width:100%;height:auto;")} />
                <div className="wisp" style={s(`top:58%;left:-55%;width:120%;animation:${v.wispA};`)}></div>
                <div className="wisp" style={s(`top:30%;left:35%;width:95%;opacity:.7;animation:${v.wispB};`)}></div>
              </div>
              <div style={s("position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:var(--space-6);max-width:760px;")}>
                <div data-reveal="fade" style={s("display:flex;")}>
                  <Pill tone="glass">EPILOGUE · THE LAST LIGHT</Pill>
                </div>
                <h2 id="closing-title" style={s("font-size:clamp(40px,6vw,var(--text-d1));line-height:var(--leading-display);letter-spacing:var(--tracking-display);color:var(--cream-100);")}>
                  {v.anim && <TextReveal text="The night keeps them now" as="span" />}
                  {v.still && "The night keeps them now"}
                </h2>
                <p data-reveal="rise" data-delay="250" style={s("font-size:var(--text-body-lg);color:var(--text-on-dark-muted);max-width:44ch;")}>The seven works return to the sky. One question stays with you: where does the grown end and the made begin?</p>
                <div data-reveal="rise" data-delay="440" style={s("display:flex;gap:var(--space-3);flex-wrap:wrap;justify-content:center;margin-top:var(--space-2);")}>
                  <button type="button" className="spell-btn spell-lg" onClick={v.goJourney}><span>Revisit the collection</span></button>
                  <button type="button" className="return-btn" onClick={v.goTop} style={s("font-family:var(--font-body);font-size:21px;font-weight:600;color:var(--cream-100);background:transparent;border:1.5px solid var(--border-on-dark);border-radius:var(--radius-lg);padding:20px 36px;cursor:pointer;transition:background var(--dur-quick) var(--ease-drift), transform var(--dur-quick) var(--ease-spell);")}>Return to the first light</button>
                </div>
              </div>
              <div aria-hidden="true" style={s("position:relative;width:100%;height:clamp(160px,26svh,300px);margin-top:var(--space-16);")}>
                <div data-y="22v,0" data-range="0.3,0.9" style={s('position:absolute;left:-14%;right:-14%;bottom:0;height:100%;background:url("/assets/closing/closing-hill-back.webp") center -8vw / 100% auto no-repeat, linear-gradient(#3B2A80,#3B2A80) center 16vw / 100% 100% no-repeat;')}></div>
                <div data-y="34v,0" data-range="0.3,0.9" style={s('position:absolute;left:-18%;right:-18%;bottom:0;height:72%;background:url("/assets/closing/closing-hill-front.webp") center top / 100% auto no-repeat, linear-gradient(#2E1F66,#2E1F66) center 14vw / 100% 100% no-repeat;')}></div>
                {v.anim && v.hillMotes.map((m, i) => (
                  <span key={i} className="mote" style={s(`left:${m.x};top:${m.y};animation:${m.anim};`)}></span>
                ))}
              </div>
              <footer className="site-foot">
                <div className="foot-grid">
                  <div style={s("display:flex;flex-direction:column;gap:var(--space-3);align-items:flex-start;text-align:left;")}>
                    <img src="/assets/brand/aurel-logo-cream.svg" alt="Aurel" width={256} height={96} style={s("display:block;height:44px;width:auto;")} />
                    <p style={s("font-family:var(--font-display);font-style:italic;font-size:var(--text-body-lg);line-height:var(--leading-tight);color:var(--cream-100);max-width:22ch;")}>A gallery of synthetic nature, open after dark.</p>
                  </div>
                  <nav aria-label="Footer" style={s("display:flex;flex-direction:column;gap:var(--space-2);align-items:flex-start;text-align:left;")}>
                    <span className="veil-num" style={s("margin-bottom:var(--space-1);")}>Wander back</span>
                    <a href="#statement" className="foot-link" onClick={v.goStatement}>I · The statement</a>
                    <a href="#journey" className="foot-link" onClick={v.goJourney}>II · The journey</a>
                    <a href="#index" className="foot-link" onClick={v.goIndex}>III · The atlas</a>
                  </nav>
                  <div style={s("display:flex;flex-direction:column;gap:var(--space-2);align-items:flex-start;text-align:left;")}>
                    <span className="veil-num" style={s("margin-bottom:var(--space-1);")}>The collection</span>
                    <span style={s("color:var(--cream-100);")}>Synthetic Nature · Collection I</span>
                    <span>Seven works · 2022–2026</span>
                    <a href="#top" className="foot-link foot-top" onClick={v.goTop}>Return to the first light <span aria-hidden="true">↑</span></a>
                  </div>
                </div>
                <div aria-hidden="true" className="foot-rule"><span></span><span className="nav-star" style={s("position:relative;left:auto;top:auto;margin:0;width:10px;height:10px;")}></span><span></span></div>
                <p style={s("max-width:72ch;margin:0 auto;text-align:center;font-size:var(--text-caption);")}>AUREL is a fictional gallery made as a frontend portfolio piece. Artists named are fictional; all works are original procedural artwork. © 2026 Aurel.</p>
              </footer>
            </div>
          </section>
        </main>

        {/* Progress HUD */}
        <div aria-hidden={v.hudHidden as "true" | "false"} style={s(`position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));z-index:40;display:flex;align-items:center;gap:var(--space-2);padding:6px;border-radius:var(--radius-pill);background:var(--glass-dark);backdrop-filter:var(--blur-glass);-webkit-backdrop-filter:var(--blur-glass);border:1px solid var(--border-on-dark);color:var(--cream-100);max-width:calc(100vw - 32px);overflow:hidden;opacity:${v.hudOpacity};transform:${v.hudTransform};visibility:${v.hudVis};transition:${v.hudTransition};`)}>
          <button type="button" onClick={v.prevWork} disabled={v.prevDisabled} aria-label="Previous work" style={s(`flex:none;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:0;background:transparent;color:var(--cream-100);cursor:pointer;opacity:${v.prevOpacity};`)}>
            <Icon name="chevron-left" size={18} />
          </button>
          <span role="status" aria-live="polite" style={s("display:flex;align-items:center;gap:var(--space-3);min-width:0;")}>
            <span style={s("font-family:var(--font-display);font-size:var(--text-body-lg);white-space:nowrap;")}>{v.counter}</span>
            <span style={s("font-size:var(--text-small);color:var(--text-on-dark-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;")}>{v.activeTitle}</span>
          </span>
          <button type="button" onClick={v.nextWork} disabled={v.nextDisabled} aria-label="Next work" style={s(`flex:none;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:0;background:transparent;color:var(--cream-100);cursor:pointer;opacity:${v.nextOpacity};`)}>
            <Icon name="chevron-right" size={18} />
          </button>
          <button type="button" onClick={v.goIndex} style={s("flex:none;min-height:40px;padding:0 16px;border-radius:var(--radius-pill);border:1px solid var(--border-on-dark);background:rgba(255,247,240,.14);color:var(--cream-100);font-family:var(--font-body);font-size:var(--text-small);font-weight:600;cursor:pointer;")}>Atlas</button>
          <span aria-hidden="true" style={s("position:absolute;left:20px;right:20px;bottom:0;height:2px;border-radius:2px;background:rgba(255,247,240,.14);overflow:hidden;")}>
            <span data-progress-bar="journey" style={s("display:block;height:100%;background:var(--moon-300);transform-origin:left center;transform:scaleX(0);")}></span>
          </span>
        </div>

        {/* Star-veil for long journeys across the page */}
        <div data-veil="" aria-hidden="true" style={s("position:fixed;inset:0;z-index:90;background:radial-gradient(70% 60% at 50% 50%,var(--indigo-800) 0%,var(--night-950) 75%);opacity:0;pointer-events:none;display:flex;align-items:center;justify-content:center;")}>
          <div data-veil-inner="" style={s("display:flex;flex-direction:column;align-items:center;gap:var(--space-3);text-align:center;padding:0 24px;")}>
            <span className="nav-star" style={s("position:relative;left:auto;top:auto;margin:0;width:18px;height:18px;")}></span>
            <span data-veil-num="" className="veil-num"></span>
            <span data-veil-label="" style={s("font-family:var(--font-display);font-style:italic;font-size:clamp(32px,5vw,64px);line-height:1.05;color:var(--cream-100);")}></span>
          </div>
        </div>

        {/* The map — chapter and work navigation */}
        {v.menuOpen && (
          <div ref={v.menuRef} role="dialog" aria-modal="true" aria-label="The map of the visit" style={s("position:fixed;inset:0;z-index:95;overflow-y:auto;overscroll-behavior:contain;background:radial-gradient(110% 80% at 85% 0%,var(--indigo-700) 0%,var(--indigo-800) 30%,var(--night-950) 75%);color:var(--text-on-dark);")}>
            {v.anim && (
              <div aria-hidden="true" style={s("position:fixed;inset:0;pointer-events:none;")}>
                <StarField count={80} seed={13} />
              </div>
            )}
            <div style={s("position:sticky;top:0;z-index:2;height:76px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:var(--space-4);padding:0 clamp(20px,5vw,64px);")}>
              <span className="veil-num" style={s("white-space:nowrap;")}>The map</span>
              <img src="/assets/brand/aurel-logo-cream.svg" alt="" width={256} height={96} style={s("display:block;height:clamp(34px,4vw,44px);width:auto;")} />
              <div style={s("display:flex;justify-content:flex-end;")}>
                <button type="button" data-menu-close="" className="hdr-btn" onClick={v.closeMenu} aria-label="Close the map" style={s("color:var(--cream-100);")}>
                  <Icon name="x" size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>
            <div style={s("position:relative;z-index:1;max-width:var(--content-max);margin:0 auto;display:flex;flex-wrap:wrap;gap:clamp(48px,7vw,120px);padding:clamp(24px,5svh,72px) clamp(20px,5vw,64px) var(--space-16);")}>
              <nav aria-label="Chapters" data-map-reveal="" style={s("flex:999 1 420px;min-width:0;display:flex;flex-direction:column;gap:var(--space-4);")}>
                <span className="veil-num">Chapters</span>
                <ol style={s("list-style:none;margin:0;padding:0;border-top:1px solid var(--border-on-dark);")}>
                  {v.mapChapters.map((c) => (
                    <li key={c.label} data-map-item="">
                      <a href={c.href} className="map-chapter" onClick={c.go} aria-current={c.current as "location" | "false"}>
                        <span className="map-num" aria-hidden="true">{c.roman}</span>
                        <span className="map-name">{c.label}</span>
                        {c.here && (
                          <span style={s("margin-left:auto;align-self:center;")}><Pill tone="mint" size="sm">You are here</Pill></span>
                        )}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <div data-map-reveal="" style={s("flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:var(--space-4);")}>
                <span className="veil-num">The seven works</span>
                <ol style={s("list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;")}>
                  {v.works.map((w) => (
                    <li key={w.id} data-map-item="">
                      <button type="button" className="map-work" onClick={w.fromMap} aria-current={w.mapCurrent as "location" | "false"} aria-label={w.selectLabel}>
                        <span className="map-thumb" aria-hidden="true"><img src={w.thumb} alt="" loading="lazy" width={80} height={112} style={s("width:100%;height:100%;object-fit:cover;display:block;")} /></span>
                        <span style={s("flex:none;width:2.4em;font-family:var(--font-display);font-style:italic;color:var(--moon-300);")}>{w.roman}</span>
                        <span style={s("display:flex;flex-direction:column;min-width:0;")}>
                          <span style={s("font-family:var(--font-display);font-size:var(--text-h4);line-height:var(--leading-tight);")}>{w.title}</span>
                          <span style={s("font-size:var(--text-caption);color:var(--text-on-dark-muted);")}>{w.artist}, {w.year}</span>
                        </span>
                        {w.mapHere && (
                          <span style={s("margin-left:auto;flex:none;")}><Pill tone="mint" size="sm">You are here</Pill></span>
                        )}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* S4 Artwork detail */}
        {v.detailOpen && (
          <div ref={v.overlayRef} role="dialog" aria-modal="true" aria-labelledby="detail-title" style={s("position:fixed;inset:0;z-index:100;overflow-y:auto;overscroll-behavior:contain;background:var(--night-950);color:var(--text-on-dark);")}>
            <div style={s("position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:var(--space-4);padding:var(--space-4) clamp(20px,5vw,64px);background:var(--glass-dark);backdrop-filter:var(--blur-glass);-webkit-backdrop-filter:var(--blur-glass);border-bottom:1px solid var(--border-on-dark);")}>
              <img src="/assets/brand/aurel-logo-cream.svg" alt="Aurel" width={256} height={96} style={s("display:block;height:32px;width:auto;")} />
              <div style={s("display:flex;align-items:center;gap:var(--space-4);")}>
                {v.detailFound && (
                  <span style={s("font-family:var(--font-display);font-size:var(--text-body-lg);color:var(--text-on-dark-muted);")}>{detail.num} / {v.total}</span>
                )}
                <button type="button" data-detail-close="true" onClick={v.closeDetail} aria-label={v.closeLabel} style={s("display:inline-flex;align-items:center;gap:var(--space-2);min-height:48px;padding:0 20px 0 16px;border-radius:var(--radius-pill);border:1px solid var(--border-on-dark);background:rgba(255,247,240,.14);color:var(--cream-100);font-family:var(--font-body);font-size:var(--text-small);font-weight:600;cursor:pointer;")}>
                  <Icon name="x" size={18} />
                  <span>{v.closeText}</span>
                </button>
              </div>
            </div>

            {v.detailFound && (
              <article style={s("max-width:1320px;margin:0 auto;padding:clamp(32px,5vw,72px) clamp(20px,5vw,64px) var(--space-24);display:flex;flex-direction:column;gap:clamp(40px,5vw,72px);")}>
                <figure data-detail-reveal="" style={s("margin:0;display:flex;flex-direction:column;gap:var(--space-3);")}>
                  <div style={s(`position:relative;width:100%;max-height:78svh;aspect-ratio:${detail.ratio};margin:0 auto;border-radius:var(--radius-xl);overflow:hidden;background:var(--night-900);box-shadow:var(--shadow-lg);`)}>
                    {detail.isVideo && (
                      <video data-detail-video="" poster={detail.poster} muted loop playsInline controls aria-label={detail.mediaAlt} style={s("width:100%;height:100%;object-fit:contain;display:block;background:var(--night-950);")}>
                        <source src={detail.webm} type="video/webm" />
                        <source src={detail.mp4} type="video/mp4" />
                      </video>
                    )}
                    {detail.isStill && (
                      <div role="img" aria-label={detail.mediaAlt} style={s(`width:100%;height:100%;background:center / contain no-repeat url(${detail.src});`)}></div>
                    )}
                  </div>
                  <figcaption style={s("font-size:var(--text-caption);color:var(--text-on-dark-muted);")}>{detail.caption}</figcaption>
                </figure>

                <div style={s("display:flex;flex-wrap:wrap;gap:clamp(40px,6vw,96px);")}>
                  <div data-detail-reveal="" style={s("flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:var(--space-6);max-width:var(--prose-max);")}>
                    <h2 id="detail-title" style={s("font-size:clamp(40px,5vw,var(--text-d2));line-height:var(--leading-heading);color:var(--cream-100);")}>{detail.title}</h2>
                    <p style={s("font-family:var(--font-display);font-style:italic;font-size:clamp(20px,2vw,var(--text-lead));line-height:var(--leading-tight);color:var(--cream-100);")}>{detail.summary}</p>
                    <div style={s("display:flex;flex-direction:column;gap:var(--space-3);")}>
                      <h3 style={s("font-size:var(--text-h4);color:var(--moon-300);")}>Curatorial note</h3>
                      <p style={s("font-size:var(--text-body-lg);color:var(--text-on-dark-muted);")}>{detail.curatorialNote}</p>
                    </div>
                  </div>
                  <div data-detail-reveal="" style={s("flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:var(--space-8);")}>
                    <dl style={s("margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--space-3) var(--space-6);font-size:var(--text-small);padding-top:var(--space-2);")}>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Artist</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.artist}</dd>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Year</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.year}</dd>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Medium</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.medium}</dd>
                      <dt style={s("color:var(--text-on-dark-muted);")}>Format</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.mediaType}</dd>
                    </dl>
                    <div style={s("display:flex;flex-direction:column;gap:var(--space-3);padding-top:var(--space-6);border-top:1px solid var(--border-on-dark);")}>
                      <h3 style={s("font-size:var(--text-h4);color:var(--moon-300);")}>Credits and license</h3>
                      <dl style={s("margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:var(--space-3) var(--space-6);font-size:var(--text-small);")}>
                        <dt style={s("color:var(--text-on-dark-muted);")}>Creator</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.credits.creator}</dd>
                        <dt style={s("color:var(--text-on-dark-muted);")}>Source</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.credits.source}</dd>
                        <dt style={s("color:var(--text-on-dark-muted);")}>License</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.credits.license}</dd>
                        <dt style={s("color:var(--text-on-dark-muted);")}>Attribution</dt><dd style={s("margin:0;color:var(--cream-100);")}>{detail.credits.attribution}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {v.detailMissing && (
              <div data-detail-reveal="" style={s("min-height:calc(100svh - 81px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:var(--space-6);padding:var(--space-12) clamp(20px,5vw,64px);")}>
                <h2 id="detail-title" style={s("font-size:clamp(36px,5vw,var(--text-d2));color:var(--cream-100);")}>No work by that name</h2>
                <p style={s("font-size:var(--text-body-lg);color:var(--text-on-dark-muted);max-width:40ch;")}>This link doesn’t match any work in Synthetic Nature. The full collection is one step back.</p>
                <button type="button" className="spell-btn spell-lg" onClick={v.closeToIndex}><span>Back to the collection</span></button>
              </div>
            )}
          </div>
        )}
      </>
    );
  }
}
