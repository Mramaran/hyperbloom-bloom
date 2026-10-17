import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'motion/react';
import Plant from './Plant';
import { Icon, RevealLines, spotlight } from './ui';
import { emit, useProjects } from './store';
import { visualFor } from './data';

const EASE = [0.16, 1, 0.3, 1];

export function StateChip({ state }) {
  const map = {
    live: ['flower', 'Live'],
    wilted: ['alert', 'Needs one thing'],
    running: ['loader', 'Growing'],
    new: ['seed', 'Not online yet']
  };
  const [ic, label] = map[state];
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={state} className={`chip chip-${state}`}
        initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
        <Icon name={ic} spin={state === 'running'} />{label}
      </motion.span>
    </AnimatePresence>
  );
}

let gardenVisited = false;

export default function Garden() {
  const projects = useProjects();
  const [grow, setGrow] = useState(gardenVisited);
  useEffect(() => {
    if (gardenVisited) return;
    const t = setTimeout(() => { setGrow(true); gardenVisited = true; }, 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <main id="main" tabIndex={-1} className="app-main">
      <div className="garden-intro">
        <RevealLines lines={['Your garden']} className="garden-title" />
        <motion.p className="garden-lede" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.9, ease: EASE }}>
          Every app you put online grows here. A flower means it's live. A drooping plant means it needs one thing from you, and Bloom tells you exactly what.
        </motion.p>
      </div>
      <motion.ul className="beds" role="list" initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.11, delayChildren: 0.3 } } }}>
        {projects.map((p, i) => (
          <motion.li key={p.id} variants={{ hidden: { y: 70, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 110, damping: 17 } } }}>
            <Bed p={p} grow={grow} index={i} />
          </motion.li>
        ))}
        <motion.li variants={{ hidden: { y: 70, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 110, damping: 17 } } }}>
          <motion.button type="button" className="bed bed-empty" data-cursor="Plant" onClick={() => emit('openNew')} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}>
            <motion.span className="empty-icon" whileHover={{ rotate: 90 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}><Icon name="plus" /></motion.span>
            <span className="bed-name">Plant a new app</span>
            <span className="bed-tool">Paste a link to your code and watch it grow.</span>
          </motion.button>
        </motion.li>
      </motion.ul>
    </main>
  );
}

function Bed({ p, grow, index }) {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 180, damping: 18 });
  const ry = useSpring(0, { stiffness: 180, damping: 18 });
  const [delayed, setDelayed] = useState(grow);
  useEffect(() => {
    if (!grow || delayed) return;
    const t = setTimeout(() => setDelayed(true), index * 320);
    return () => clearTimeout(t);
  }, [grow, delayed, index]);
  const v = visualFor(p);

  return (
    <motion.a href={`#/p/${p.id}`} className="bed spot" data-state={p.state} data-cursor="Open"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      whileHover={{ y: -8 }} whileTap={{ scale: 0.985 }}
      onPointerMove={(e) => {
        spotlight(e);
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
      }}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}>
      <div className="bed-plant" data-pollinate>
        <motion.div layoutId={`plant-${p.id}`} className="plant-frame" transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
          <Plant stage={delayed ? v.stage : 0} wilted={delayed && v.wilted} busy={v.busy} />
        </motion.div>
      </div>
      <div className="bed-info">
        <span className="bed-name">{p.name}</span>
        <span className="bed-tool">{p.tool ? `Built with ${p.tool}` : 'Imported from Git'}</span>
        <span className="bed-chip"><StateChip state={p.state} /></span>
      </div>
    </motion.a>
  );
}
