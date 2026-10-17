import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence, animate, motion, useAnimationFrame, useInView, useMotionTemplate, useMotionValue, useMotionValueEvent,
  useReducedMotion, useScroll, useSpring, useTransform, useVelocity
} from 'motion/react';
import Plant from './Plant';
import { AmbientField, Icon, Magnetic, RevealLines, beePos, burstFrom, driftFrom, petalRain, spotlight } from './ui';

const EASE = [0.16, 1, 0.3, 1];

/*
  Headline whose letters rise one by one on a spring, then lift and tilt
  as the bee flies over them. Words stay unbroken so lines wrap naturally.
*/
function KineticHeadline({ lines, className, delay = 0 }) {
  const reduce = useReducedMotion();
  const chars = useRef([]);
  const lift = useRef([]);
  const h1 = useRef(null);
  // Letter centres relative to the heading, measured once (and again on resize), not every frame.
  const centres = useRef(null);
  const active = useRef(false);
  let n = 0;

  useEffect(() => {
    const invalidate = () => { centres.current = null; };
    const t = setTimeout(invalidate, 2600); // after the intro springs settle
    window.addEventListener('resize', invalidate);
    return () => { clearTimeout(t); window.removeEventListener('resize', invalidate); };
  }, []);

  useAnimationFrame(() => {
    if (reduce || !h1.current) return;
    const box = h1.current.getBoundingClientRect();
    const near = beePos.on && beePos.x > box.left - 120 && beePos.x < box.right + 120 && beePos.y > box.top - 120 && beePos.y < box.bottom + 120;
    if (!near && !active.current) return;
    const list = chars.current;
    if (!centres.current) {
      centres.current = list.map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
    }
    let moving = false;
    for (let i = 0; i < list.length; i++) {
      const el = list[i], c = centres.current[i];
      if (!el || !c) continue;
      const d = near ? Math.hypot(beePos.x - (box.left + c.x), beePos.y - (box.top + c.y)) : 999;
      const target = d < 110 ? 1 - d / 110 : 0;
      const cur = lift.current[i] || 0;
      let next = cur + (target - cur) * 0.18;
      if (target === 0 && next < 0.002) next = 0;
      if (next === cur) continue;
      moving = true;
      lift.current[i] = next;
      el.style.transform = next ? `translateY(${-next * 18}px) rotate(${(i % 2 ? 1 : -1) * next * 7}deg)` : '';
      el.style.color = next > 0.05 ? `color-mix(in srgb, currentColor ${100 - next * 45}%, var(--petal))` : '';
    }
    active.current = moving;
  });

  return (
    <h1 ref={h1} className={`${className} kinetic`} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span className="k-line" key={li} aria-hidden="true">
          {line.split(' ').map((word, wi, words) => (
            <span key={wi}>
            <span className="k-word">
              {[...word].map((ch) => {
                const i = n++;
                return (
                  <motion.span key={i} className="k-char-outer"
                    initial={reduce ? false : { y: '0.9em', opacity: 0, rotateX: -80 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ type: 'spring', stiffness: 170, damping: 16, delay: delay + i * 0.028 }}>
                    <span className="k-char" ref={(el) => { chars.current[i] = el; }}>{ch}</span>
                  </motion.span>
                );
              })}
            </span>
            {wi < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

export default function Landing() {
  usePetalRain();
  return (
    <div className="landing">
      <ScrollBar />
      <ScrollVine />
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <VelocityMarquee />
        <Story />
        <Stats />
        <Compare />
        <Rewind />
        <Finale />
      </main>
      <footer className="l-footer">
        <span className="brand-name">Bloom</span>
        <span>A concept for HyperBloom October, running on Deployxa.</span>
      </footer>
    </div>
  );
}

/* Fast scrolling shakes petals loose; faster scrolling, more petals. */
function usePetalRain() {
  const { scrollY } = useScroll();
  const vel = useVelocity(scrollY);
  const last = useRef(0);
  useMotionValueEvent(vel, 'change', (v) => {
    const speed = Math.abs(v);
    const now = performance.now();
    if (speed < 1400 || now - last.current < 110) return;
    last.current = now;
    petalRain(Math.min(5, Math.round(speed / 1400)));
  });
}

/*
  A vine that draws itself down the left edge as you scroll,
  unfurling a leaf beside each section it reaches.
*/
function ScrollVine() {
  const ref = useRef(null);
  const [geo, setGeo] = useState({ h: 0, d: '', leaves: [] });
  const hRef = useRef(0);
  hRef.current = geo.h;
  const { scrollY } = useScroll();
  const raw = useTransform(scrollY, (y) => (hRef.current ? Math.min(1, (y + innerHeight * 0.62) / hRef.current) : 0));
  const len = useSpring(raw, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const build = () => {
      const h = host.scrollHeight;
      const step = 140;
      let d = 'M20 0';
      for (let y = step, i = 0; y <= h + step; y += step, i++) {
        const x = 20 + Math.sin(i * 0.9) * 9;
        const cx = 20 + Math.sin(i * 0.9 - 0.45) * 15;
        d += ` Q ${cx.toFixed(1)} ${(y - step / 2).toFixed(0)} ${x.toFixed(1)} ${Math.min(y, h).toFixed(0)}`;
      }
      const leaves = [...host.querySelectorAll('main > section')].slice(1).map((s, i) => ({
        y: s.offsetTop + 60, side: i % 2 ? 1 : -1, at: Math.min(1, (s.offsetTop + 60) / h)
      }));
      setGeo({ h, d, leaves });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <svg ref={ref} className="scroll-vine" width="40" height={geo.h} viewBox={`0 0 40 ${geo.h || 1}`} aria-hidden="true">
      <motion.path className="vine-stem" d={geo.d} style={{ pathLength: len }} />
      {geo.leaves.map((l, i) => <VineLeaf key={i} leaf={l} progress={len} />)}
    </svg>
  );
}

function VineLeaf({ leaf, progress }) {
  const s = useTransform(progress, [leaf.at - 0.012, leaf.at + 0.01], [0, 1]);
  const rot = useTransform(progress, [leaf.at - 0.012, leaf.at + 0.02], [leaf.side * -60, 0]);
  return (
    <g transform={`translate(20 ${leaf.y}) scale(${leaf.side} 1)`}>
      <motion.path className="vine-leaf" d="M0 0 C 6 -10, 18 -12, 22 -4 C 14 2, 6 3, 0 0 Z" style={{ scale: s, rotate: rot, originX: 0, originY: 0.5 }} />
    </g>
  );
}

function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  return <motion.div className="scrollbar" style={{ scaleX }} aria-hidden="true" />;
}

function LandingNav() {
  const { scrollY } = useScroll();
  const solid = useTransform(scrollY, [0, 160], [0, 1]);
  return (
    <motion.header className="l-nav"
      initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}>
      <motion.span className="l-nav-bg" style={{ opacity: solid }} aria-hidden="true" />
      <a className="brand" href="#/" aria-label="Bloom home">
        <BrandMark /><span className="brand-name">Bloom</span><span className="brand-by">on Deployxa</span>
      </a>
      <nav className="l-nav-links" aria-label="Main">
        <a href="#how">How it works</a>
        <a href="#compare">Errors, explained</a>
        <Magnetic as="a" href="#/garden" className="btn btn-primary" strength={0.25}>Open your garden</Magnetic>
      </nav>
    </motion.header>
  );
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 29V15" /><path d="M16 20c-5 0-8-3-8.5-8 5 0 8 3 8.5 8Z" /><path d="M16 16c4.5 0 7.5-3 8-7.5-4.5 0-7.5 3-8 7.5Z" /><circle cx="16" cy="8" r="3.2" />
    </svg>
  );
}

/* Hero */
const HERO_CHIPS = [
  { at: 1100, icon: 'branch', text: 'Code copied from GitHub', pos: 'c1' },
  { at: 1900, icon: 'cpu', text: 'Built in 14 seconds', pos: 'c2' },
  { at: 2700, icon: 'pulse', text: 'It answers. All good.', pos: 'c3' },
  { at: 3400, icon: 'lock', text: 'recipe-swap.deployxa.app', pos: 'c4' }
];

function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [chips, setChips] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const plantY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const plantScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const copyO = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const mx = useSpring(0, { stiffness: 50, damping: 18 });
  const my = useSpring(0, { stiffness: 50, damping: 18 });
  const aX = useTransform(mx, (v) => v * 70), aY = useTransform(my, (v) => v * 50);
  const bX = useTransform(mx, (v) => v * -90), bY = useTransform(my, (v) => v * -60);
  const cX = useTransform(mx, (v) => v * 40), cY = useTransform(my, (v) => v * -30);
  const pX = useTransform(mx, (v) => v * -18), pR = useTransform(mx, (v) => v * -3);
  const fieldY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const fieldO = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);
  const fieldScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  useEffect(() => {
    const timers = [setTimeout(() => setStage(3), reduce ? 0 : 900)];
    HERO_CHIPS.forEach((c, i) => timers.push(setTimeout(() => setChips(i + 1), reduce ? 0 : c.at)));
    timers.push(setTimeout(() => burstFrom(ref.current?.querySelector('.p-core'), 80), reduce ? 0 : 3500));
    const drift = setInterval(() => driftFrom(ref.current?.querySelector('.p-core')), 420);
    return () => { timers.forEach(clearTimeout); clearInterval(drift); };
  }, [reduce]);

  return (
    <section ref={ref} className="hero" aria-labelledby="heroTitle"
      onPointerMove={(e) => { mx.set(e.clientX / innerWidth - 0.5); my.set(e.clientY / innerHeight - 0.5); }}>
      <motion.div className="mist mist-a" style={{ x: aX, y: aY }} aria-hidden="true" />
      <motion.div className="mist mist-b" style={{ x: bX, y: bY }} aria-hidden="true" />
      <motion.div className="mist mist-c" style={{ x: cX, y: cY }} aria-hidden="true" />
      <motion.div className="hero-ambient" style={{ y: fieldY, opacity: fieldO, scale: fieldScale }}
        initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} transition={{ duration: 1.8, ease: EASE, delay: 0.2 }}>
        <AmbientField />
      </motion.div>

      <div className="hero-grid">
        <motion.div className="hero-copy" style={{ y: copyY, opacity: copyO }}>
          <KineticHeadline lines={['Ship what you built.', 'Watch it bloom.']} className="hero-title" delay={0.25} />
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 1, ease: EASE }}>
            Bloom puts apps from Lovable, Bolt, Cursor and v0 online on Deployxa. Every step grows in front of you, and every problem comes with a fix in plain words.
          </motion.p>
          <motion.div className="hero-ctas" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 1, ease: EASE }}>
            <Magnetic as="a" href="#/garden" className="btn btn-primary btn-lg">
              <Icon name="sprout" />Open your garden
            </Magnetic>
            <a className="btn btn-ghost btn-lg" href="#how">See how it grows</a>
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" style={{ y: plantY, scale: plantScale }}>
          <motion.div className="hero-halo" aria-hidden="true"
            animate={reduce ? {} : { scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.button type="button" className="hero-plant-wrap" style={{ x: pX, rotate: pR }} data-cursor="Replay" data-pollinate
            aria-label="Replay the plant growing" whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (stage !== 3) return;
              setStage(0);
              setTimeout(() => setStage(3), reduce ? 0 : 650);
              setTimeout(() => burstFrom(ref.current?.querySelector('.hero-plant-wrap .p-core'), 90), reduce ? 0 : 3200);
            }}>
            <Plant stage={stage} label="A plant growing from a seed into a pink flower" />
          </motion.button>
          <ul className="hero-chips" aria-label="Deploy progress">
            <AnimatePresence>
              {HERO_CHIPS.slice(0, chips).map((c, i) => (
                <motion.li key={c.text} className={`hero-chip ${c.pos}`}
                  initial={{ opacity: 0, scale: 0.6, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                  <motion.span className="chip-float" animate={reduce ? {} : { y: [0, -6, 0] }} transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}>
                    <span className={`chip-dot ${i === 3 ? 'is-live' : ''}`}><Icon name={i === 3 ? 'lock' : 'check'} /></span>
                    {c.text}
                  </motion.span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      </div>

      <motion.a href="#how" className="scroll-cue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}>
        <span>Scroll to grow your own</span>
        <motion.span animate={reduce ? {} : { y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}><Icon name="arrowDown" /></motion.span>
      </motion.a>
    </section>
  );
}

/* Marquee whose speed and skew follow scroll velocity */
const TOOLS = ['Lovable', 'Bolt', 'Cursor', 'v0', 'Replit', 'Windsurf', 'Next.js', 'Vite', 'Astro', 'SvelteKit'];
const wrap = (min, max, v) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };

function VelocityMarquee() {
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const secRef = useRef(null);
  const inView = useInView(secRef, { margin: '100px' });
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(vel, [0, 1200], [0, 5], { clamp: false });
  const skew = useTransform(vel, [-2500, 2500], [10, -10]);
  const dir = useRef(-1);
  useAnimationFrame((_, delta) => {
    if (reduce || !inView) return;
    const f = factor.get();
    if (f < 0) dir.current = 1; else if (f > 0) dir.current = -1;
    const move = dir.current * 1.6 * (delta / 1000) * (1 + Math.abs(f));
    base.set(base.get() + move);
  });
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);
  const row = TOOLS.map((t) => (
    <span className="mq-item" key={t}>
      {t}
      <svg className="mq-flower" viewBox="0 0 24 24" aria-hidden="true">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="12" cy="6.5" rx="3.4" ry="5.4" transform={`rotate(${a} 12 12)`} />)}
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    </span>
  ));
  return (
    <section ref={secRef} className="marquee" aria-label={`Works with apps built in ${TOOLS.slice(0, 6).join(', ')}, and frameworks like ${TOOLS.slice(6).join(', ')}`}>
      <p className="mq-caption" aria-hidden="true">Bring an app from anywhere</p>
      <div className="mq-viewport" aria-hidden="true">
        <motion.div className="mq-track" style={{ x, skewX: skew }}>{row}{row}</motion.div>
      </div>
    </section>
  );
}

/* Stats band with count-up numbers and cursor spotlights */
const STATS = [
  { value: 1, prefix: '~', suffix: ' min', label: 'from a GitHub link to a live web address' },
  { value: 0, suffix: '', label: 'terminals to open, ever' },
  { value: 4, suffix: '', label: 'plain-English steps instead of a log wall' },
  { value: 1, suffix: ' click', label: 'to rewind an update that broke something' }
];

function CountUp({ to, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView) return;
    if (reduce || to === 0) { ref.current.textContent = `${prefix}${to}${suffix}`; return; }
    const c = animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = `${prefix}${Math.round(v)}${suffix}`; } });
    return () => c.stop();
  }, [inView, to, prefix, suffix, reduce]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

function Stats() {
  return (
    <section className="stats-sec" aria-labelledby="statsTitle">
      <h2 id="statsTitle" className="sr-only">Bloom in numbers</h2>
      <motion.ul className="stats-grid" role="list" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
        {STATS.map((s) => (
          <motion.li key={s.label} className="stat spot" onPointerMove={spotlight}
            variants={{ hidden: { opacity: 0, y: 50, rotateX: -25 }, show: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', stiffness: 90, damping: 16 } } }}>
            <span className="stat-num"><CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} /></span>
            <span className="stat-label">{s.label}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

/* Pinned scroll story */
const STORY = [
  { title: 'We copy your code', body: "Paste a link to your GitHub repository. Bloom fetches everything your app needs. You don't open a terminal.", tech: 'git clone, handled' },
  { title: 'We build it', body: 'Bloom recognises Next.js, Vite, Astro and more, then picks the right recipe. Nothing to configure.', tech: 'npm ci && npm run build, handled' },
  { title: 'We check it starts', body: "Before anyone sees it, Bloom makes sure your app answers. If it doesn't, your visitors keep the last good version.", tech: 'health checks, handled' },
  { title: "It's live", body: 'Your app gets a web address with a secure lock. Every version is saved, so you can rewind in one click.', tech: 'TLS, routing and rollback, handled' }
];
const STAGE_WORDS = ['Seed', 'Sprout', 'Bud', 'Bloom'];

function Story() {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const raw = useTransform(scrollYProgress, [0.06, 0.82], [0, 3.15]);
  const p = useSpring(raw, { stiffness: 80, damping: 14, mass: 0.7 });
  const rail = useTransform(scrollYProgress, [0.06, 0.82], [0, 1]);
  const glow = useTransform(raw, [0, 1.5, 3], ['rgba(140,111,85,.35)', 'rgba(63,160,106,.35)', 'rgba(224,107,154,.42)']);
  const glowBg = useMotionTemplate`radial-gradient(closest-side, ${glow}, transparent)`;
  const [active, setActive] = useState(0);
  const bloomed = useRef(false);

  useMotionValueEvent(raw, 'change', (v) => {
    const a = Math.max(0, Math.min(3, Math.floor(v + 0.35)));
    setActive(a);
    if (v > 3 && !bloomed.current) {
      bloomed.current = true;
      setTimeout(() => burstFrom(stageRef.current?.querySelector('.p-core'), 90), 350);
    }
    if (v < 2.6) bloomed.current = false;
  });

  return (
    <section id="how" ref={ref} className="story" aria-labelledby="storyTitle">
      <div className="story-sticky">
        <div className="story-grid">
          <div className="story-steps">
            <RevealLines as="h2" inView lines={['From a link to a living app,', 'in four steps.']} className="section-display" />
            <div className="story-list">
              <div className="rail" aria-hidden="true"><motion.div className="rail-fill" style={{ scaleY: rail }} /></div>
              <ol>
                {STORY.map((s, i) => (
                  <motion.li key={s.title} className="story-item" data-active={i === active}
                    animate={{ opacity: i === active ? 1 : i < active ? 0.55 : 0.35, x: i === active ? 0 : -4 }}
                    transition={{ duration: 0.5, ease: EASE }}>
                    <span className="story-num" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h3>{s.title}</h3>
                      <AnimatePresence initial={false}>
                        {i === active && (
                          <motion.div key="b" className="story-body"
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: EASE }}>
                            <p>{s.body}</p>
                            <span className="story-tech"><Icon name="check" />{s.tech}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>

          <div className="story-stage" ref={stageRef}>
            <motion.div className="story-glow" style={{ background: glowBg }} aria-hidden="true" />
            <div className="stage-word-wrap" aria-hidden="true">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={active} className="stage-word"
                  initial={{ y: 80, opacity: 0, filter: 'blur(10px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -80, opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 0.7, ease: EASE }}>
                  {STAGE_WORDS[active]}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="story-plant" data-pollinate>
              <Plant progress={p} label={`The plant at the ${STAGE_WORDS[active].toLowerCase()} stage`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Before / after drag comparison */
const LOG_LINES = [
  ['dim', '[09:41:02] Cloning github.com/arun-dev/study-buddy (main)'],
  ['dim', '[09:41:05] Detected Next.js 15.0.3'],
  ['dim', '[09:41:21] Build completed in 14.2s'],
  ['dim', '[09:41:22] Starting container deployxa-7f3a9c...'],
  ['err', 'Error: DATABASE_URL is not set'],
  ['err', '    at connect (/app/.next/server/chunks/481.js:1:2204)'],
  ['err', '    at async saveSession (/app/.next/server/app/api/sessions/route.js:1:913)'],
  ['err', '    at async /app/node_modules/next/dist/server/base-server.js:1312:9'],
  ['err', 'Unhandled promise rejection. Exiting with code 1'],
  ['warn', '[09:41:24] Health check GET / failed (attempt 1/3): ECONNREFUSED'],
  ['warn', '[09:41:29] Health check GET / failed (attempt 2/3): ECONNREFUSED'],
  ['warn', '[09:41:34] Health check GET / failed (attempt 3/3): ECONNREFUSED'],
  ['err', '[09:41:34] Deployment failed. Container exited (1). See logs above.'],
  ['dim', '[09:41:34] Run `deployxa logs --tail 500` for more output']
];

function Compare() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const pos = useMotionValue(56);
  const smooth = useSpring(pos, { stiffness: 320, damping: 34 });
  const clip = useMotionTemplate`inset(0 0 0 ${smooth}%)`;
  const left = useMotionTemplate`${smooth}%`;
  const [val, setVal] = useState(56);
  const dragging = useRef(false);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  useMotionValueEvent(pos, 'change', (v) => setVal(Math.round(v)));
  // The comparison opens like a window as it scrolls into place.
  const { scrollYProgress: open } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const inset = useTransform(open, [0, 1], [reduce ? 0 : 16, 0]);
  const round = useTransform(open, [0, 1], [reduce ? 36 : 120, 36]);
  const winClip = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round ${round}px)`;
  const tilt = useTransform(open, [0, 1], [reduce ? 0 : 12, 0]);

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(pos, [56, 28, 74, 50], { duration: 2.6, ease: 'easeInOut', delay: 0.4 });
    return () => c.stop();
  }, [inView, reduce, pos]);

  const setFromX = (x) => {
    const r = ref.current.getBoundingClientRect();
    pos.set(Math.max(3, Math.min(97, ((x - r.left) / r.width) * 100)));
  };

  return (
    <section id="compare" className="compare-sec" aria-labelledby="compareTitle">
      <div className="section-head">
        <RevealLines as="h2" inView lines={['The same error.', 'Two very different evenings.']} className="section-display" />
        <motion.p className="section-lede" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}>
          Drag the handle. On the left is what a first-time builder usually sees. On the right is what Bloom shows for the exact same problem.
        </motion.p>
      </div>

      <motion.div ref={ref} className="compare" data-cursor="Drag"
        style={{ clipPath: winClip, rotateX: tilt, transformPerspective: 1400 }}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); pos.stop(); setFromX(e.clientX); }}
        onPointerMove={(e) => dragging.current && setFromX(e.clientX)}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}>
        <div className="cmp-pane cmp-before" aria-hidden="true">
          <span className="cmp-label">A typical build log</span>
          <pre>{LOG_LINES.map(([k, t], i) => <span key={i} className={`log-${k}`}>{t}{'\n'}</span>)}</pre>
        </div>
        <motion.div className="cmp-pane cmp-after" style={{ clipPath: clip }} aria-hidden="true">
          <span className="cmp-label cmp-label-after">Bloom</span>
          <div className="cmp-card">
            <div className="cmp-plant"><Plant stage={2} wilted sway={false} /></div>
            <div className="cmp-copy">
              <span className="cmp-title">Your app needs a database address</span>
              <span className="cmp-text">It stopped while starting because it's looking for a setting called <code>DATABASE_URL</code>. Your code is fine, and your previous version is still live.</span>
              <span className="cmp-btn"><Icon name="database" />Add a database</span>
            </div>
          </div>
        </motion.div>
        <motion.div className="cmp-handle" style={{ left }} role="slider" tabIndex={0}
          aria-label="Compare a typical build log with Bloom" aria-valuemin={0} aria-valuemax={100} aria-valuenow={val}
          aria-valuetext={val > 50 ? 'Mostly the build log' : 'Mostly Bloom'}
          onKeyDown={(e) => {
            const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -5 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 5 : 0;
            if (d) { e.preventDefault(); pos.set(Math.max(3, Math.min(97, pos.get() + d))); }
          }}>
          <span className="cmp-line" />
          <motion.span className="cmp-knob" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}><Icon name="grip" /></motion.span>
        </motion.div>
      </motion.div>
      <p className="sr-only">The build log lists a stack trace, three failed health checks and "Deployment failed". Bloom shows one sentence: your app needs a database address, with a button to add one.</p>
    </section>
  );
}

/* Rewind demo */
const VERSIONS = [
  { when: 'Oct 9', note: 'First version' },
  { when: 'Oct 12', note: 'Shopping list' },
  { when: 'Oct 15', note: 'New photos' },
  { when: 'Yesterday', note: 'Search bar' },
  { when: 'Today', note: 'Dark mode' }
];

function Rewind() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [grown, setGrown] = useState(0);
  const [sel, setSel] = useState(4);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const t = VERSIONS.map((_, i) => setTimeout(() => setGrown((g) => Math.max(g, i + 1)), reduce ? 0 : 200 + i * 260));
    return () => t.forEach(clearTimeout);
  }, [inView, reduce]);

  useEffect(() => {
    if (!inView || reduce || grown < VERSIONS.length) return;
    const seq = [3, 3, 4, 4];
    let i = 0;
    const id = setInterval(() => { setSel(seq[i % seq.length]); i++; }, 1500);
    return () => clearInterval(id);
  }, [inView, reduce, grown]);

  return (
    <section className="rewind-sec" ref={ref} aria-labelledby="rewindTitle">
      <div className="section-head">
        <RevealLines as="h2" inView lines={['Every version, kept.']} className="section-display" />
        <motion.p className="section-lede" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}>
          Each time your app goes live, Bloom keeps that version. If an update breaks something, pick yesterday's flower and you're back in seconds.
        </motion.p>
      </div>
      <ol className="rewind-row" aria-label="Example version history">
        {VERSIONS.map((v, i) => (
          <li key={v.when} className="rewind-item">
            <div className="rewind-plant" data-pollinate><Plant stage={i < grown ? 3 : 0} sway={i === sel} /></div>
            <div className="rewind-meta">
              {sel === i && <motion.span layoutId="rewind-ring" className="rewind-ring" transition={{ type: 'spring', stiffness: 300, damping: 26 }} />}
              <strong>{v.when}</strong>
              <span>{v.note}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="rewind-status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.span key={sel} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.35 }}>
            <Icon name={sel === 4 ? 'flower' : 'rewind'} />
            {sel === 4 ? 'Live now: today’s version' : 'Rewound to yesterday’s version in 3 seconds'}
          </motion.span>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* Finale: a garden blooming in sequence */
const FIELD = [2.2, 3, 1.4, 3, 3, 2.6, 3];

function Finale() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView) return;
    const order = [3, 1, 5, 0, 4, 6, 2];
    const t = order.map((_, i) => setTimeout(() => setN(i + 1), reduce ? 0 : i * 230));
    t.push(setTimeout(() => burstFrom(ref.current?.querySelectorAll('.p-core')[3], 70), reduce ? 0 : 2400));
    return () => t.forEach(clearTimeout);
  }, [inView, reduce]);
  const order = [3, 1, 5, 0, 4, 6, 2];
  const grownSet = new Set(order.slice(0, n));

  return (
    <section className="finale" ref={ref} aria-labelledby="finaleTitle">
      <div className="finale-copy">
        <RevealLines as="h2" inView lines={['Your garden', 'is waiting.']} className="finale-title" />
        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}>
          Paste a link to your code. In about a minute, it's online with its own address.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}>
          <Magnetic as="a" href="#/garden" className="btn btn-primary btn-lg"><Icon name="sprout" />Open your garden</Magnetic>
        </motion.div>
      </div>
      <div className="finale-field" aria-hidden="true">
        {FIELD.map((s, i) => (
          <div key={i} className={`field-plant f${i}`} data-pollinate>
            <Plant stage={grownSet.has(i) ? s : 0} />
          </div>
        ))}
      </div>
    </section>
  );
}
