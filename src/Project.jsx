import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import Plant from './Plant';
import { Icon, Magnetic, burstFrom, driftFrom } from './ui';
import { StateChip } from './Garden';
import { deploy, emit, on, rewindTo, update, useProjects } from './store';
import { STEPS, visualFor } from './data';

const EASE = [0.16, 1, 0.3, 1];
const spring = { type: 'spring', stiffness: 260, damping: 26 };

export default function Project({ id }) {
  const projects = useProjects();
  const p = projects.find((x) => x.id === id);
  const reduce = useReducedMotion();
  const heroRef = useRef(null);
  const [override, setOverride] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, []);

  useEffect(() => on('bloom', (pid) => {
    if (pid === id) setTimeout(() => burstFrom(heroRef.current?.querySelector('.p-core'), 110), reduce ? 0 : 1300);
  }), [id, reduce]);

  useEffect(() => on('rewind', (pid) => {
    if (pid !== id || reduce) return;
    setOverride(2.35);
    setTimeout(() => setOverride(null), 650);
    setTimeout(() => burstFrom(heroRef.current?.querySelector('.p-core'), 50), 1500);
  }), [id, reduce]);

  useEffect(() => {
    const t = setInterval(() => { if (p?.state === 'live') driftFrom(heroRef.current?.querySelector('.p-core')); }, 480);
    return () => clearInterval(t);
  }, [p?.state]);

  if (!p) return null;
  const v = visualFor(p);

  return (
    <main id="main" tabIndex={-1} className="app-main project">
      <motion.a className="back-link" href="#/garden" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <Icon name="arrowLeft" />Back to your garden
      </motion.a>

      <div className="project-layout">
        <motion.div className="greenhouse" data-state={p.state} layout
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <motion.div className="greenhouse-glow" aria-hidden="true"
            animate={{ background: p.state === 'wilted' ? 'radial-gradient(closest-side, rgba(194,59,82,.32), transparent)' : p.state === 'live' ? 'radial-gradient(closest-side, rgba(224,107,154,.32), transparent)' : p.state === 'running' ? 'radial-gradient(closest-side, rgba(242,184,59,.30), transparent)' : 'radial-gradient(closest-side, rgba(63,160,106,.28), transparent)' }}
            transition={{ duration: 1.2 }} />
          <div className="hero-plant" ref={heroRef} data-pollinate>
            <motion.div layoutId={`plant-${p.id}`} className="plant-frame" transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
              <Plant stage={override ?? v.stage} wilted={v.wilted} busy={v.busy}
                label={`${p.name}: ${p.state === 'live' ? 'in bloom, live' : p.state === 'wilted' ? 'drooping, needs attention' : p.state === 'running' ? 'growing' : 'a seed, not online yet'}`} />
            </motion.div>
            <GrowRipples p={p} />
          </div>
          <Stepper p={p} />
        </motion.div>

        <motion.div className="story-col" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}>
          <motion.header className="story-head" variants={item}>
            <h1 className="proj-name" ref={titleRef} tabIndex={-1}>{p.name}</h1>
            <ul className="proj-meta" role="list">
              <li><Icon name="branch" />{p.repo}</li>
              <li><Icon name="cpu" />{p.framework}</li>
              {p.tool && <li><Icon name="sprout" />Built with {p.tool}</li>}
              <li><StateChip state={p.state} /></li>
            </ul>
          </motion.header>
          <motion.div variants={item}><Status p={p} /></motion.div>
          <motion.section variants={item} aria-labelledby="feedTitle">
            <h2 className="section-title" id="feedTitle">What's happening</h2>
            <Feed p={p} />
            <Tech p={p} />
          </motion.section>
          <motion.section variants={item} aria-labelledby="historyTitle">
            <h2 className="section-title" id="historyTitle">Past versions</h2>
            <p className="section-help">Every time your app goes live, a version is saved. Pick one to rewind to it.</p>
            <Vine p={p} />
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}

/* Each finished deploy step sends a soft ring out across the soil; going live sends a petal-pink one. */
function GrowRipples({ p }) {
  const reduce = useReducedMotion();
  const [rings, setRings] = useState([]);
  const done = p.feed.filter((f) => f.state === 'done').length;
  const prev = useRef({ done, state: p.state });
  useEffect(() => {
    const was = prev.current;
    prev.current = { done, state: p.state };
    if (reduce) return;
    const add = (kind) => {
      const id = Math.random();
      setRings((r) => [...r, { id, kind }]);
      setTimeout(() => setRings((r) => r.filter((x) => x.id !== id)), 1800);
    };
    if (p.state === 'live' && was.state !== 'live') { add('bloom'); setTimeout(() => add('bloom'), 220); }
    else if (p.state === 'wilted' && was.state !== 'wilted') add('fail');
    else if (done > was.done) add('step');
  }, [done, p.state, reduce]);
  return (
    <div className="ripples" aria-hidden="true">
      <AnimatePresence>
        {rings.map((r) => (
          <motion.span key={r.id} className={`ripple ripple-${r.kind}`}
            initial={{ scale: 0.15, opacity: 0.9 }} animate={{ scale: r.kind === 'bloom' ? 2.6 : 1.9, opacity: 0 }}
            transition={{ duration: r.kind === 'bloom' ? 1.6 : 1.3, ease: [0.16, 1, 0.3, 1] }} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };

function stepStates(p) {
  return STEPS.map((_, i) => {
    if (p.state === 'live') return 'done';
    if (p.state === 'wilted') return i < p.failStage ? 'done' : i === p.failStage ? 'failed' : 'todo';
    if (p.state === 'running') return i < p.runStage ? 'done' : i === p.runStage ? 'active' : 'todo';
    return 'todo';
  });
}

function Stepper({ p }) {
  const states = stepStates(p);
  const reached = states.reduce((n, s, i) => (s !== 'todo' ? i : n), 0);
  const word = { done: 'done', active: 'in progress', failed: 'needs attention', todo: 'not started' };
  return (
    <div className="stepper-wrap">
    <div className="stepper-track" aria-hidden="true">
      <motion.div className="stepper-fill" data-failed={p.state === 'wilted'} animate={{ scaleX: reached / 3 }} transition={{ type: 'spring', stiffness: 60, damping: 16 }} />
    </div>
    <ol className="stepper" aria-label="Deploy progress">
      {STEPS.map((s, i) => (
        <li key={s.name} className="step" data-state={states[i]}>
          <motion.span className="step-dot" layout animate={{ scale: states[i] === 'active' ? 1.12 : 1 }} transition={spring}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={states[i]} className="step-icon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}>
                <Icon name={states[i] === 'done' ? 'check' : states[i] === 'active' ? 'loader' : states[i] === 'failed' ? 'alert' : s.glyph} spin={states[i] === 'active'} />
              </motion.span>
            </AnimatePresence>
          </motion.span>
          <span className="step-name">{s.name}</span>
          <span className="step-desc">{s.desc}</span>
          <span className="sr-only">, {word[states[i]]}</span>
        </li>
      ))}
    </ol>
    </div>
  );
}

function GrewCounter({ value }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { ref.current.textContent = value.toFixed(1); return; }
    const c = animate(0, value, { duration: 1.6, ease: 'easeOut', onUpdate: (n) => { if (ref.current) ref.current.textContent = n.toFixed(1); } });
    return () => c.stop();
  }, [value, reduce]);
  return <strong ref={ref}>{value.toFixed(1)}</strong>;
}

function Status({ p }) {
  const [copied, setCopied] = useState(false);
  let body;
  if (p.state === 'new') {
    body = (
      <>
        <div className="status-head"><span className="status-icon"><Icon name="seed" /></span><h2 className="status-title">Ready when you are</h2></div>
        <p className="status-body">Bloom copies your code, builds it, checks it starts, then gives it a web address. It takes about a minute, and you can watch every step.</p>
        <div className="status-actions">
          <Magnetic className="btn btn-primary" onClick={() => deploy(p.id)} strength={0.2}><Icon name="sprout" />Put it online</Magnetic>
        </div>
      </>
    );
  } else if (p.state === 'running') {
    const i = Math.min(p.runStage, 3);
    body = (
      <>
        <div className="status-head">
          <span className="status-icon"><Icon name="loader" spin /></span>
          <div><h2 className="status-title">Growing {p.name}</h2><p className="status-sub">Step {i + 1} of 4: {STEPS[i].desc.toLowerCase()}</p></div>
        </div>
        <div className="progress" aria-hidden="true"><motion.div className="progress-fill" animate={{ scaleX: (i + 0.5) / 4 }} transition={{ type: 'spring', stiffness: 50, damping: 14 }} /></div>
        <p className="status-body">{p.hadLive ? "Your current version stays live until this one is ready, so visitors won't notice a thing." : 'You can leave this page. Bloom keeps going, and your garden shows the progress.'}</p>
      </>
    );
  } else if (p.state === 'wilted') {
    body = (
      <>
        <div className="status-head"><span className="status-icon"><Icon name="alert" /></span><h2 className="status-title">Your app needs a database address</h2></div>
        <p className="status-body">It stopped while starting because it's looking for a setting called <code>DATABASE_URL</code>, and none has been added yet. Your code is fine.{p.hadLive ? " Your previous version is still live, so visitors haven't noticed anything." : ''}</p>
        <div className="status-actions">
          <Magnetic className="btn btn-berry" onClick={() => emit('openFix', p.id)} strength={0.2}><Icon name="database" />Add a database</Magnetic>
          <button className="btn btn-quiet" type="button" onClick={() => deploy(p.id)}><Icon name="refresh" />Try again</button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className="status-head"><span className="status-icon"><Icon name="flower" /></span><h2 className="status-title">{p.name} is live</h2></div>
        <div className="live-url">
          <a href={`https://${p.url}`} target="_blank" rel="noopener noreferrer"><Icon name="globe" />{p.url}</a>
          <motion.button className="icon-btn" type="button" aria-label={`Copy link to ${p.name}`} whileTap={{ scale: 0.88 }}
            onClick={async () => {
              try { await navigator.clipboard.writeText('https://' + p.url); setCopied(true); setTimeout(() => setCopied(false), 1600); emit('toast', { msg: 'Link copied' }); }
              catch { emit('toast', { msg: 'Copy failed. Select the link and copy it yourself.', icon: 'alert' }); }
            }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={copied ? 'y' : 'n'} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Icon name={copied ? 'check' : 'copy'} /></motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
        <div className="stats">
          <span><Icon name="clock" />Grew in <GrewCounter value={p.grewIn || 0} /> seconds</span>
          <span><Icon name="pulse" />Answering in <strong>118</strong> ms</span>
        </div>
        <div className="status-actions"><button className="btn btn-quiet" type="button" onClick={() => deploy(p.id)}><Icon name="refresh" />Redeploy latest code</button></div>
      </>
    );
  }
  return (
    <motion.div className="status" data-kind={p.state} layout transition={{ layout: { type: 'spring', stiffness: 200, damping: 26 } }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={p.state} className="status-inner"
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: EASE }}>
          {body}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function Feed({ p }) {
  if (!p.feed.length) {
    return <p className="feed-empty">{p.state === 'live' ? 'Everything is calm. Your last deploy went smoothly.' : 'Nothing yet. Each step appears here in plain words as it happens.'}</p>;
  }
  return (
    <motion.ol className="feed" layout>
      <AnimatePresence initial={false}>
        {p.feed.map((f, i) => (
          <motion.li key={i + f.text} className="feed-item" data-state={f.state} layout
            initial={{ opacity: 0, x: -24, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <span className="feed-mark">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={f.state} initial={{ scale: 0, rotate: -120 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                  <Icon name={f.state === 'done' ? 'check' : f.state === 'failed' ? 'alert' : 'loader'} spin={f.state === 'active'} />
                </motion.span>
              </AnimatePresence>
            </span>
            <span>{f.text}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ol>
  );
}

function Tech({ p }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [p.log.length, open]);
  return (
    <div className="tech">
      <button type="button" className="tech-toggle" aria-expanded={open} aria-controls="buildLog" onClick={() => setOpen((o) => !o)}>
        <Icon name="code" />{open ? 'Hide technical details' : 'Show technical details'}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id="buildLog" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} style={{ overflow: 'hidden' }}>
            <pre className="log" ref={ref} tabIndex={0} aria-label="Build log">
              {p.log.length ? p.log.map((l, i) => <span key={i} className={l.startsWith('!') ? 'err' : undefined}>{l.startsWith('!') ? l.slice(1) : l}{'\n'}</span>) : 'No build output yet.'}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Vine({ p }) {
  if (!p.versions.length) {
    return <p className="vine-empty">No versions yet. Once your app goes live, each version appears here so you can rewind to it in one click.</p>;
  }
  const picked = p.picked && p.versions.find((v) => v.id === p.picked) ? p.picked : (p.versions.find((v) => v.current) || p.versions[p.versions.length - 1]).id;
  const pick = p.versions.find((v) => v.id === picked);
  const setPick = (vid) => update(p.id, (q) => ({ ...q, picked: vid }));
  const onKey = (e, i) => {
    const n = p.versions.length;
    const j = e.key === 'ArrowRight' ? Math.min(i + 1, n - 1) : e.key === 'ArrowLeft' ? Math.max(i - 1, 0) : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (j === null) return;
    e.preventDefault();
    setPick(p.versions[j].id);
    requestAnimationFrame(() => document.querySelector(`[data-vid="${p.versions[j].id}"]`)?.focus());
  };
  return (
    <>
      <div className="vine-wrap">
      <div className="vine-line" aria-hidden="true" />
      <ul className="vine" role="list" aria-label="Versions, oldest first">
        {p.versions.map((v, i) => (
          <li key={v.id} className="vine-node">
            <button type="button" className="vine-btn" data-vid={v.id} aria-pressed={v.id === picked} tabIndex={v.id === picked ? 0 : -1}
              aria-label={`${v.when}: ${v.note}${v.current ? ', live now' : ''}`} onClick={() => setPick(v.id)} onKeyDown={(e) => onKey(e, i)}>
              {v.id === picked && <motion.span layoutId={`vine-ring-${p.id}`} className="vine-ring" transition={{ type: 'spring', stiffness: 400, damping: 28 }} />}
              <svg viewBox="0 0 24 24" aria-hidden="true" data-current={!!v.current}>
                {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} className="v-petal" cx="12" cy="6.5" rx="3.6" ry="5.5" transform={`rotate(${a} 12 12)`} />)}
                <circle className="v-core" cx="12" cy="12" r="3" />
              </svg>
            </button>
            <span className="vine-label">{v.when}{v.current && <strong>Live now</strong>}</span>
          </li>
        ))}
      </ul>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={pick.id + String(pick.current)} className="vine-detail"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
          <div className="vine-detail-text"><strong>{pick.note}</strong><span>{pick.when}{pick.current ? ', the version visitors see now' : ''}</span></div>
          {!pick.current && (
            <button className="btn btn-primary" type="button" disabled={p.state === 'running'} onClick={() => rewindTo(p.id, pick.id)}>
              <Icon name="rewind" />Rewind to this version
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
