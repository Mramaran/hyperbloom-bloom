import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { on } from './store';

/* Icons (Lucide paths) */
const ICONS = {
  check: <path d="M20 6 9 17l-5-5" />,
  copy: <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  rewind: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  alert: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></>,
  branch: <><line x1="6" x2="6" y1="3" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  loader: <path d="M21 12a9 9 0 1 1-6.22-8.56" />,
  sprout: <><path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" /></>,
  seed: <><ellipse cx="12" cy="14" rx="6" ry="4.5" /><path d="M9 13.5c2-1.5 4-1.5 6 0" /></>,
  leaf: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
  flower: <><circle cx="12" cy="12" r="3" /><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" /><path d="M12 7.5V9" /><path d="M7.5 12H9" /><path d="M16.5 12H15" /><path d="M12 16.5V15" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>,
  cpu: <><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></>,
  pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  arrowLeft: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  arrowDown: <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>,
  code: <><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  grip: <><path d="M15 18l6-6-6-6" /><path d="M9 6l-6 6 6 6" /></>
};

export function Icon({ name, className = 'icon', spin = false }) {
  return (
    <svg className={`${className}${spin ? ' spin' : ''}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

/* A button or link that leans toward the pointer. */
export function Magnetic({ as = 'button', strength = 0.35, className = '', children, ...rest }) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.6 });
  const Comp = as === 'a' ? motion.a : motion.button;
  return (
    <Comp
      className={className}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      {...rest}
    >
      <motion.span className="btn-inner" style={{ x: useSpringHalf(x), y: useSpringHalf(y) }}>{children}</motion.span>
    </Comp>
  );
}
function useSpringHalf(src) {
  const v = useMotionValue(0);
  useEffect(() => src.on('change', (n) => v.set(n * 0.35)), [src, v]);
  return v;
}

/* Masked line-by-line reveal for display type. */
export function RevealLines({ lines, as = 'h1', className = '', delay = 0, inView = false }) {
  const Tag = motion[as];
  const variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: delay } } };
  const line = {
    hidden: { y: '108%', rotate: 2 },
    show: { y: '0%', rotate: 0, transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] } }
  };
  const props = inView
    ? { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.6 } }
    : { initial: 'hidden', animate: 'show' };
  return (
    <Tag className={className} variants={variants} {...props} aria-label={lines.join(' ')}>
      {lines.map((l, i) => (
        <span className="line-mask" key={i} aria-hidden="true">
          <motion.span className="line" variants={line}>{l}</motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* Toasts and screen-reader announcements */
export function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => on('toast', (t) => {
    const id = Math.random();
    setItems((s) => [...s.slice(-2), { ...t, id }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3400);
  }), []);
  return (
    <div className="toast-region" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} className="toast" layout
            initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
            <Icon name={t.icon || 'check'} /><span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function Announcer() {
  const [msg, setMsg] = useState('');
  useEffect(() => on('announce', (m) => { setMsg(''); setTimeout(() => setMsg(m), 30); }), []);
  return <p className="sr-only" aria-live="polite">{msg}</p>;
}

/* Pollen and petal particles on one fixed canvas */
let burstImpl = () => {};
let driftImpl = () => {};
let pointImpl = () => {};
let sparkImpl = () => {};
export const burstFrom = (el, n) => burstImpl(el, n);
export const driftFrom = (el) => driftImpl(el);
export const burstAt = (x, y, n, power, only) => pointImpl(x, y, n, power, only);
export const sparkAt = (x, y) => sparkImpl(x, y);
let rainImpl = () => {};
export const petalRain = (n) => rainImpl(n);
// Live bee position, read by effects that react to the cursor (headline lift, pollination).
export const beePos = { x: -999, y: -999, speed: 0, on: false };

export function Pollen() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    let parts = [];
    let raf = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    addEventListener('resize', size);
    const COLORS = { petal: '#E06B9A', pollen: '#F2B83B', leaf: '#3FA06A' };
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((q) => q.life > 0);
      for (const q of parts) {
        q.wob += 0.06;
        if (q.float) { q.x += q.vx + Math.sin(q.wob) * 0.4; q.y += q.vy; }
        else { q.vx *= 0.975; q.vy = q.vy * 0.975 + 0.09; q.x += q.vx + Math.sin(q.wob) * (q.kind === 'petal' ? 0.9 : 0.2); q.y += q.vy; }
        q.rot += q.vr; q.life -= q.decay;
        ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 1.4));
        ctx.fillStyle = COLORS[q.kind];
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.beginPath();
        if (q.kind === 'pollen') ctx.arc(0, 0, q.r, 0, 6.283);
        else ctx.ellipse(0, 0, q.r * 0.55, q.r, 0, 0, 6.283);
        ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    pointImpl = (x, y, count = 80, power = 1, only) => {
      if (reduce) return;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 6.5) * power;
        const kind = only || (Math.random() < 0.45 ? 'petal' : Math.random() < 0.8 ? 'pollen' : 'leaf');
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3.5 * power, life: 1, decay: (0.008 + Math.random() * 0.01) / Math.max(power, 0.5),
          r: (kind === 'pollen' ? 1.6 + Math.random() * 2.4 : 4 + Math.random() * 5) * (0.6 + power * 0.4), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.25, kind, wob: Math.random() * 6.28 });
      }
      kick();
    };
    burstImpl = (el, count = 80) => {
      if (reduce || !el) return;
      const r = el.getBoundingClientRect();
      pointImpl(r.left + r.width / 2, r.top + r.height / 2, count, 1);
    };
    // Petals shaken loose by fast scrolling: they drift down from above the viewport.
    rainImpl = (n = 2) => {
      if (reduce || document.hidden) return;
      for (let i = 0; i < n; i++) {
        parts.push({ x: Math.random() * innerWidth, y: -16 - Math.random() * 40, vx: (Math.random() - 0.3) * 0.9, vy: 1.3 + Math.random() * 1.4,
          life: 1, decay: 0.0022 + Math.random() * 0.0012, r: 5 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.06,
          kind: Math.random() < 0.85 ? 'petal' : 'leaf', wob: Math.random() * 6.28, float: true });
      }
      kick();
    };
    sparkImpl = (x, y) => {
      if (reduce || document.hidden) return;
      parts.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: (Math.random() - 0.5) * 0.6, vy: -0.3 - Math.random() * 0.5,
        life: 0.9, decay: 0.022, r: 1.2 + Math.random() * 1.6, rot: 0, vr: 0, kind: Math.random() < 0.7 ? 'pollen' : 'petal', wob: Math.random() * 6.28, float: true });
      kick();
    };
    driftImpl = (el) => {
      if (reduce || !el || document.hidden) return;
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
      parts.push({ x: r.left + r.width / 2 + (Math.random() - 0.5) * r.width, y: r.top + r.height / 2, vx: (Math.random() - 0.5) * 0.5, vy: -0.35 - Math.random() * 0.6,
        life: 1, decay: 0.005, r: 1.4 + Math.random() * 1.8, rot: 0, vr: 0, kind: 'pollen', wob: Math.random() * 6.28, float: true });
      kick();
    };
    return () => { removeEventListener('resize', size); cancelAnimationFrame(raf); burstImpl = () => {}; driftImpl = () => {}; pointImpl = () => {}; sparkImpl = () => {}; rainImpl = () => {}; };
  }, [reduce]);
  return <canvas ref={ref} className="pollen" aria-hidden="true" />;
}

/*
  Ambient scene: a live-rendered stand-in for background footage.
  Layers of grass blades sway in a slow wind and lean away from the pointer;
  soft bokeh lights drift above them with depth parallax.
*/
export function AmbientField({ className = '', blades: bladeDensity = 1, orbs: orbCount = 26 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    // Soft, blurry content: a lower backing resolution is invisible and much cheaper to fill.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    let w = 0, h = 0, raf = 0, visible = true, rect = { left: 0, top: 0 };
    let orbs = [], blades = [], layerFill = [];
    const sprites = {};
    const ptr = { x: -9999, y: -9999, sx: -9999, sy: -9999 };
    const ORB = ['224,107,154', '242,184,59', '63,160,106', '246,179,205'];
    const LAYERS = [
      { color: '31,92,61', alpha: 0.28, hMin: 0.2, hMax: 0.62, amp: 10, gap: 22 },
      { color: '46,125,82', alpha: 0.5, hMin: 0.14, hMax: 0.44, amp: 14, gap: 17 },
      { color: '63,160,106', alpha: 0.8, hMin: 0.06, hMax: 0.28, amp: 18, gap: 14 }
    ];

    // One pre-rendered glow per colour; orbs are drawn as scaled copies instead of fresh gradients.
    const sprite = (c) => {
      if (sprites[c]) return sprites[c];
      const s = document.createElement('canvas');
      s.width = s.height = 128;
      const g = s.getContext('2d');
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, `rgba(${c},1)`);
      grad.addColorStop(0.55, `rgba(${c},0.35)`);
      grad.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      return (sprites[c] = s);
    };

    const build = () => {
      layerFill = LAYERS.map((L) => {
        const g = ctx.createLinearGradient(0, h, 0, h * (1 - L.hMax));
        g.addColorStop(0, `rgba(${L.color},${L.alpha})`);
        g.addColorStop(1, `rgba(${L.color},${L.alpha * 0.55})`);
        return g;
      });
      orbs = Array.from({ length: orbCount }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.85,
        r: 18 + Math.random() * 110, z: 0.2 + Math.random() * 0.8,
        c: ORB[(Math.random() * ORB.length) | 0], a: 0.05 + Math.random() * 0.16,
        vx: (Math.random() - 0.5) * 0.18, vy: -0.05 - Math.random() * 0.12, ph: Math.random() * 6.28
      }));
      blades = [];
      LAYERS.forEach((L, li) => {
        const gap = L.gap / bladeDensity;
        for (let x = -20; x < w + 20; x += gap * (0.6 + Math.random() * 0.8)) {
          const hgt = h * (L.hMin + Math.pow(Math.random(), 1.6) * (L.hMax - L.hMin));
          blades.push({ li, x, hgt, wd: 4 + Math.random() * 6 + li * 1.5, lean: (Math.random() - 0.5) * hgt * 0.45, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.6, bend: 0 });
        }
      });
    };
    const size = () => {
      const r = cv.getBoundingClientRect();
      rect = r;
      w = r.width; h = r.height;
      cv.width = Math.max(1, w * dpr); cv.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      ptr.sx += (ptr.x - ptr.sx) * 0.08; ptr.sy += (ptr.y - ptr.sy) * 0.08;
      const px = ptr.sx > -999 ? (ptr.sx / w - 0.5) : 0, py = ptr.sy > -999 ? (ptr.sy / h - 0.5) : 0;

      // bokeh
      ctx.globalCompositeOperation = 'lighter';
      for (const o of orbs) {
        if (!reduce) {
          o.x += o.vx; o.y += o.vy;
          if (o.y < -o.r) { o.y = h + o.r; o.x = Math.random() * w; }
          if (o.x < -o.r) o.x = w + o.r; if (o.x > w + o.r) o.x = -o.r;
        }
        const ox = o.x - px * 60 * o.z, oy = o.y - py * 40 * o.z;
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.0006 + o.ph);
        ctx.globalAlpha = o.a * pulse;
        ctx.drawImage(sprite(o.c), ox - o.r, oy - o.r, o.r * 2, o.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // grass: every blade of a layer goes into one path and one fill
      const wind = Math.sin(t * 0.00035) * 0.6 + Math.sin(t * 0.0011) * 0.25;
      let li = -1;
      for (const b of blades) {
        const L = LAYERS[b.li];
        if (b.li !== li) {
          if (li >= 0) ctx.fill();
          li = b.li;
          ctx.fillStyle = layerFill[li];
          ctx.beginPath();
        }
        const sway = reduce ? 0 : (Math.sin(t * 0.0012 * b.sp + b.ph + b.x * 0.004) * 0.6 + wind) * L.amp;
        const dx = b.x - ptr.sx, near = Math.abs(dx) < 140 && ptr.sy > h - b.hgt - 80;
        const push = near ? Math.sign(dx || 1) * (1 - Math.abs(dx) / 140) * 46 * (b.li + 1) / 3 : 0;
        b.bend += (push - b.bend) * 0.09;
        const tipX = b.x + b.lean + sway + b.bend + px * 14 * (b.li + 1);
        const tipY = h - b.hgt + Math.abs(b.lean) * 0.25;
        const midX = b.x + (b.lean + sway + b.bend) * 0.3;
        ctx.moveTo(b.x - b.wd / 2, h);
        ctx.quadraticCurveTo(midX - b.wd * 0.4, h - b.hgt * 0.55, tipX, tipY);
        ctx.quadraticCurveTo(midX + b.wd * 0.4, h - b.hgt * 0.55, b.x + b.wd / 2, h);
        ctx.closePath();
      }
      if (li >= 0) ctx.fill();
    };
    const loop = (t) => { draw(t); raf = visible && !reduce ? requestAnimationFrame(loop) : 0; };

    size();
    draw(0);
    const ro = new ResizeObserver(() => { size(); draw(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(cv);
    // Use the rect cached at resize/scroll instead of measuring layout on every pointer move.
    const move = (e) => { ptr.x = e.clientX - rect.left; ptr.y = e.clientY - rect.top; };
    const remeasure = () => { rect = cv.getBoundingClientRect(); };
    window.addEventListener('scroll', remeasure, { passive: true });
    const leave = () => { ptr.x = -9999; ptr.y = -9999; };
    // Listen on the window: the canvas sits behind the content, so it never receives pointer events itself.
    const host = window;
    host.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); host.removeEventListener('pointermove', move); window.removeEventListener('scroll', remeasure); document.documentElement.removeEventListener('pointerleave', leave); };
  }, [reduce, bladeDensity, orbCount]);
  return <canvas ref={ref} className={`ambient ${className}`} aria-hidden="true" />;
}

/*
  Page-wide background footage. Crossfades when the source changes, zooms slowly with scroll,
  and carries a state-coloured accent wash. Reduced motion shows a still first frame.
*/
const FIREFLIES = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 37 + 11) % 100, y: 35 + ((i * 53) % 60), d: (i * 0.7) % 6, t: 9 + (i % 5) * 2
}));

export function BackgroundVideo({ src, accent = 'rgba(0,0,0,0)' }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, 1.16]);
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-3%']);
  // Dawn at the top of a page, night (with fireflies) by the bottom.
  // Function transforms keep these on the JS path; Motion's native scroll-timeline
  // shortcut maps partial ranges like [0.4, 1] incorrectly for opacity.
  const ramp = (a, b) => (v) => Math.min(1, Math.max(0, (v - a) / (b - a)));
  const dawn = useTransform(scrollYProgress, (v) => 1 - ramp(0, 0.45)(v));
  const night = useTransform(scrollYProgress, ramp(0.4, 1));
  const flies = useTransform(scrollYProgress, ramp(0.6, 0.95));
  return (
    <div className="bgv" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div key={src} className="bgv-layer" style={reduce ? undefined : { scale, y }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
          <LoopVideo src={src} reduce={reduce} />
        </motion.div>
      </AnimatePresence>
      <div className="bgv-tint" />
      <motion.div className="bgv-accent" animate={{ backgroundColor: accent }} transition={{ duration: 1.2 }} />
      <motion.div className="bgv-dawn" style={{ opacity: dawn }} />
      <motion.div className="bgv-night" style={{ opacity: night }} />
      <motion.div className="fireflies" style={{ opacity: flies }}>
        {FIREFLIES.map((f, i) => (
          <span key={i} className="firefly" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${f.d}s, ${f.d * 0.6}s`, animationDuration: `${f.t}s, ${2 + (i % 3)}s` }} />
        ))}
      </motion.div>
      <div className="bgv-grain" />
    </div>
  );
}

function LoopVideo({ src, reduce }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduce) { v.pause(); return; }
    const play = () => { if (!document.hidden && v.paused) v.play().catch(() => {}); };
    play();
    // Browsers can pause background media while a tab loads hidden; resume whenever we can.
    const vis = () => (document.hidden ? v.pause() : play());
    document.addEventListener('visibilitychange', vis);
    v.addEventListener('canplay', play);
    window.addEventListener('focus', play);
    window.addEventListener('pointerdown', play, { once: true });
    return () => {
      document.removeEventListener('visibilitychange', vis);
      v.removeEventListener('canplay', play);
      window.removeEventListener('focus', play);
      window.removeEventListener('pointerdown', play);
    };
  }, [reduce, src]);
  return (
    <video ref={ref} className="bgv-video" src={src} muted loop playsInline autoPlay={!reduce} preload="auto"
      onLoadedData={() => setReady(true)} style={{ opacity: ready ? 1 : 0 }} />
  );
}

/*
  Botanical cursor (mouse and trackpad only).
    default  a pollen dot with a leaf ring trailing on a spring
    stick    the ring wraps the hovered button or link
    link     the ring blooms into a turning flower
    label    a petal disc with a word, set by data-cursor="..."
    text     hidden, so text fields keep the native caret
*/
const STICK = '.btn, .icon-btn, .vine-btn, .back-link, .l-nav-links a, .appbar-nav a, .tech-toggle, .brand, .modal-close, .scroll-cue, .cmp-handle';

export function Cursor() {
  const reduce = useReducedMotion();
  const [enabled] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches);
  const mx = useMotionValue(-200), my = useMotionValue(-200);
  const tx = useMotionValue(-200), ty = useMotionValue(-200);
  const follow = reduce ? { stiffness: 2000, damping: 120 } : { stiffness: 320, damping: 28, mass: 0.55 };
  const rx = useSpring(tx, follow), ry = useSpring(ty, follow);
  const shape = { stiffness: 300, damping: 26 };
  const w = useSpring(36, shape), h = useSpring(36, shape), rad = useSpring(18, shape);
  const [mode, setMode] = useState('default');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(false);
  const [down, setDown] = useState(false);
  const stuck = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');
    let lx = 0, ly = 0;
    const size = (W, H, R) => { w.set(W); h.set(H); rad.set(R); };
    const wrap = (el) => {
      const r = el.getBoundingClientRect();
      const br = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;
      tx.set(r.left + r.width / 2); ty.set(r.top + r.height / 2);
      size(r.width + 14, r.height + 14, Math.min(br + 7, (r.height + 14) / 2));
    };
    const move = (e) => {
      mx.set(e.clientX); my.set(e.clientY);
      setVisible(true);
      if (stuck.current) wrap(stuck.current);
      else { tx.set(e.clientX); ty.set(e.clientY); }
      if (!reduce && Math.hypot(e.clientX - lx, e.clientY - ly) > 38) { sparkAt(e.clientX, e.clientY); lx = e.clientX; ly = e.clientY; }
    };
    const over = (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) { stuck.current = null; setMode('text'); return; }
      const lab = t.closest('[data-cursor]');
      if (lab) { stuck.current = null; setLabel(lab.dataset.cursor); setMode('label'); size(88, 88, 44); return; }
      const st = t.closest(STICK);
      if (st) { stuck.current = st; setMode('stick'); wrap(st); return; }
      stuck.current = null;
      if (t.closest('a, button, [role="button"], label, summary')) { setMode('link'); size(58, 58, 29); return; }
      setMode('default'); size(36, 36, 18);
    };
    const press = (e) => { setDown(true); if (e.pointerType === 'mouse') burstAt(e.clientX, e.clientY, 9, 0.42); };
    const release = () => setDown(false);
    const leave = () => setVisible(false);
    const scroll = () => { if (stuck.current) wrap(stuck.current); };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    window.addEventListener('scroll', scroll, { passive: true });
    root.addEventListener('pointerleave', leave);
    return () => {
      root.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('scroll', scroll);
      root.removeEventListener('pointerleave', leave);
    };
  }, [enabled, reduce, mx, my, tx, ty, w, h, rad]);

  /*
    The bee flies on its own spring toward a point just behind the pointer, so its
    velocity drives the heading: it faces the way it travels, tilts to climb or dive,
    and bobs while hovering. Over a button or link it perches on top of the ring.
  */
  const beeX = useMotionValue(-200), beeY = useMotionValue(-200);
  const beeRot = useMotionValue(0), beeFlip = useMotionValue(1);
  const fly = useRef({ x: -200, y: -200, vx: 0, vy: 0, rot: 0, dir: 1, flip: 1 });
  const pol = useRef({ frame: 0, el: null, since: 0, cool: 0 });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const landed = mode === 'stick' || mode === 'link' || mode === 'label';

  useAnimationFrame((t, dt) => {
    if (!enabled) return;
    const s = fly.current;
    const perched = ['stick', 'link', 'label'].includes(modeRef.current);
    let gx = perched ? rx.get() + w.get() * 0.3 : mx.get() - 24;
    let gy = perched ? ry.get() - h.get() / 2 - 8 : my.get() - 22;
    if (reduce) {
      s.x = gx; s.y = gy; s.vx = 0; s.vy = 0;
    } else {
      gx += Math.sin(t * 0.0021) * (perched ? 1 : 7);
      gy += Math.sin(t * 0.0043) * (perched ? 1.2 : 4.5);
      const d = Math.min(dt, 40) / 1000;
      const k = perched ? 120 : 60, c = perched ? 16 : 9.5;
      s.vx += (k * (gx - s.x) - c * s.vx) * d;
      s.vy += (k * (gy - s.y) - c * s.vy) * d;
      s.x += s.vx * d; s.y += s.vy * d;
    }
    if (Math.abs(s.vx) > 70) s.dir = s.vx < 0 ? -1 : 1;
    s.flip += (s.dir - s.flip) * 0.18;
    const tilt = Math.max(-35, Math.min(35, s.vy * 0.06)) + (reduce ? 0 : Math.sin(t * 0.003) * 4);
    s.rot += (tilt - s.rot) * 0.15;
    beeX.set(s.x); beeY.set(s.y); beeRot.set(s.rot);
    beePos.x = s.x; beePos.y = s.y; beePos.speed = Math.hypot(s.vx, s.vy);

    // Pollination: hovering slowly over a plant for a moment shakes it and puffs pollen.
    const P = pol.current;
    if (!reduce && beePos.on && ++P.frame % 6 === 0) {
      const el = document.elementFromPoint(s.x, s.y + 14)?.closest('[data-pollinate]') || null;
      if (el !== P.el) { P.el = el; P.since = t; }
      else if (el && beePos.speed < 160 && t - P.since > 380 && t - P.cool > 1500) {
        P.cool = t; P.since = t;
        el.classList.remove('is-pollinated');
        void el.offsetWidth;
        el.classList.add('is-pollinated');
        burstAt(s.x, s.y + 8, 18, 0.42, 'pollen');
      }
    }
    beeFlip.set(Math.abs(s.flip) < 0.15 ? Math.sign(s.flip || 1) * 0.15 : s.flip);
  });

  if (!enabled) return null;
  const show = visible && mode !== 'text';
  beePos.on = show;
  return (
    <>
      <motion.div className="cursor-ring" data-mode={mode} aria-hidden="true"
        style={{ x: rx, y: ry, width: w, height: h, borderRadius: rad }}
        animate={{ opacity: show && mode !== 'default' ? 1 : 0, scale: down ? 0.82 : 1 }}
        transition={{ opacity: { duration: 0.2 }, scale: { type: 'spring', stiffness: 520, damping: 18 } }}>
        <motion.svg className="cursor-flower" viewBox="0 0 24 24"
          animate={{ opacity: mode === 'link' ? 1 : 0, scale: mode === 'link' ? 1 : 0.3, rotate: mode === 'link' ? 72 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="12" cy="6.6" rx="3.3" ry="5.4" transform={`rotate(${a} 12 12)`} />)}
        </motion.svg>
        <AnimatePresence>
          {mode === 'label' && (
            <motion.span key={label} className="cursor-label" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}>{label}</motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div className="cursor-dot" aria-hidden="true" style={{ x: mx, y: my }}
        animate={{ opacity: show && mode !== 'label' ? 1 : 0, scale: down ? 0.45 : mode === 'stick' ? 0.55 : 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 24 }} />
      <motion.div className="cursor-bee" data-landed={landed} aria-hidden="true"
        style={{ x: beeX, y: beeY, rotate: beeRot, scaleX: beeFlip }}
        animate={{ opacity: show ? 1 : 0, scale: down ? 0.82 : landed ? 0.9 : 1 }}
        transition={{ opacity: { duration: 0.25 }, scale: { type: 'spring', stiffness: 500, damping: 16 } }}>
        <Bee />
      </motion.div>
    </>
  );
}

function Bee() {
  return (
    <svg viewBox="0 0 48 40" width="56" height="46">
      <defs>
        <clipPath id="bee-body-clip"><ellipse cx="22" cy="25" rx="13" ry="9" /></clipPath>
      </defs>
      <g transform="rotate(-28 20 15)"><ellipse className="bee-wing" cx="20" cy="10" rx="8.5" ry="6" /></g>
      <path className="bee-ink" d="M10 23.6 L3.5 25.4 L10 27.4 Z" />
      <ellipse className="bee-body" cx="22" cy="25" rx="13" ry="9" />
      <g clipPath="url(#bee-body-clip)">
        <rect className="bee-ink" x="15" y="14" width="4.2" height="24" />
        <rect className="bee-ink" x="23.5" y="14" width="4.2" height="24" />
      </g>
      <ellipse className="bee-shine" cx="20" cy="20.5" rx="6" ry="2" />
      <g transform="rotate(18 27 15)"><ellipse className="bee-wing bee-wing-front" cx="28" cy="10" rx="8" ry="5.6" /></g>
      <path className="bee-antenna" d="M37.5 18 q2.5 -6 6.5 -7.5" />
      <path className="bee-antenna" d="M35 17.5 q0.5 -6 3.5 -9" />
      <circle className="bee-ink" cx="44" cy="10.4" r="1.4" />
      <circle className="bee-ink" cx="38.6" cy="8.4" r="1.3" />
      <circle className="bee-ink" cx="36" cy="23.5" r="6.6" />
      <circle cx="38.4" cy="21.8" r="1.7" fill="#fff" />
      <circle className="bee-blush" cx="38" cy="26.4" r="1.4" />
    </svg>
  );
}

/* Cursor spotlight: sets --mx/--my on the element for a CSS radial highlight. */
export function spotlight(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

/* Hash routing */
export function useHash() {
  const [hash, setHash] = useState(location.hash || '#/');
  useEffect(() => {
    const f = () => setHash(location.hash || '#/');
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return hash;
}
export const go = (h) => { location.hash = h; };
