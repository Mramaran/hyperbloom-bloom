import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useReducedMotion } from 'motion/react';

/*
  The plant is driven by two motion values:
    p: growth from 0 (seed) to 3 (bloom). Springs overshoot past 3, which makes petals bounce.
    w: wilt from 0 (healthy) to 1 (drooping).
  Either can come from outside (scroll-linked on the landing page) or from the stage/wilted props.
  Attributes are written straight to the SVG so every pivot point is exact.
*/

const C = {
  leaf: '#3FA06A', leaf2: '#2E8A57', stem: '#2E7D52', wiltLeaf: '#A39B5E', wiltStem: '#8A8350',
  petal: '#E06B9A', petalWilt: '#B9908F', inner: '#F6B3CD', core: '#F2B83B'
};
const LEAVES = [
  { o: [99, 188], d: 'M99 188 C 80 184, 62 170, 56 148 C 78 150, 95 165, 99 188 Z', v: 'M98 185 C 86 174, 72 162, 61 152', range: [0.35, 1.0], droop: -34, fill: 'leaf' },
  { o: [101, 166], d: 'M101 166 C 120 162, 138 148, 144 126 C 122 128, 105 143, 101 166 Z', v: 'M102 163 C 114 152, 128 140, 139 130', range: [0.6, 1.5], droop: 30, fill: 'leaf2' },
  { o: [99, 140], d: 'M99 140 C 84 137, 72 125, 68 110 C 84 112, 96 123, 99 140 Z', v: 'M98 137 C 89 129, 80 121, 72 114', range: [1.15, 1.75], droop: -28, fill: 'leaf' },
  { o: [101, 114], d: 'M101 114 C 114 111, 124 101, 128 89 C 115 91, 104 100, 101 114 Z', v: 'M102 111 C 109 104, 117 98, 124 93', range: [1.35, 1.95], droop: 26, fill: 'leaf2' }
];
const PETALS = [0, 60, 120, 180, 240, 300];

function lerp(v, inp, out) {
  if (v <= inp[0]) return out[0];
  for (let i = 1; i < inp.length; i++) {
    if (v <= inp[i]) {
      const t = (v - inp[i - 1]) / (inp[i] - inp[i - 1]);
      return out[i - 1] + (out[i] - out[i - 1]) * t;
    }
  }
  return out[out.length - 1];
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
const scaleAt = (x, y, s) => `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;

export default function Plant({ stage = 0, wilted = false, busy = false, progress, wilt, sway = true, className = '', label }) {
  const reduce = useReducedMotion();
  const ownP = useMotionValue(stage);
  const ownW = useMotionValue(wilted ? 1 : 0);
  const swayV = useMotionValue(0);
  const spinV = useMotionValue(0);
  const p = progress || ownP;
  const w = wilt || ownW;
  const r = useRef({});
  const svgRef = useRef(null);
  // Only animate the idle sway while the plant is on screen.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Stage-driven growth with a soft, organic spring.
  useEffect(() => {
    if (progress) return;
    const c = animate(ownP, stage, reduce ? { duration: 0 } : { type: 'spring', stiffness: 26, damping: 8.5, mass: 1.15 });
    return () => c.stop();
  }, [stage, progress, reduce, ownP]);

  useEffect(() => {
    if (wilt) return;
    const c = animate(ownW, wilted ? 1 : 0, reduce ? { duration: 0 } : wilted ? { duration: 1.5, ease: [0.45, 0, 0.55, 1] } : { type: 'spring', stiffness: 55, damping: 5.5 });
    return () => c.stop();
  }, [wilted, wilt, reduce, ownW]);

  // Idle breathing sway.
  useEffect(() => {
    if (reduce || !sway || !onScreen) return;
    swayV.set(-1.4);
    const c = animate(swayV, 1.4, { duration: 2.6 + Math.random(), ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' });
    return () => c.stop();
  }, [reduce, sway, swayV, onScreen]);

  // Petals turn slowly while a redeploy is running.
  useEffect(() => {
    if (reduce) return;
    if (busy) {
      const c = animate(spinV, spinV.get() + 360, { duration: 5, ease: 'linear', repeat: Infinity });
      return () => c.stop();
    }
    const c = animate(spinV, Math.round(spinV.get() / 360) * 360, { type: 'spring', stiffness: 40, damping: 10 });
    return () => c.stop();
  }, [busy, reduce, spinV]);

  useEffect(() => {
    const el = r.current;
    const draw = () => {
      if (!el.stem || !el.core) return;
      const pv = p.get(), wv = w.get(), sv = swayV.get(), spin = spinV.get();
      el.seed.setAttribute('opacity', lerp(pv, [0, 0.45], [1, 0]));
      el.seed.setAttribute('transform', scaleAt(100, 207, lerp(pv, [0, 0.45], [1, 0.4])));
      const len = lerp(pv, [0, 1, 2], [0, 0.46, 1]);
      el.stem.style.strokeDashoffset = String(1 - len);
      el.stem.setAttribute('opacity', pv < 0.03 ? 0 : 1);
      el.stem.setAttribute('stroke', mixHex(C.stem, C.wiltStem, wv));
      LEAVES.forEach((L, i) => {
        const s = lerp(pv, [L.range[0], L.range[1], 3, 3.3], [0, 1, 1, 1.06]);
        el['leaf' + i].setAttribute('transform', `translate(${L.o[0]} ${L.o[1]}) rotate(${L.droop * wv}) scale(${s}) translate(${-L.o[0]} ${-L.o[1]})`);
        el['leafFill' + i].setAttribute('fill', mixHex(C[L.fill], C.wiltLeaf, wv));
      });
      const budS = lerp(pv, [1.6, 2, 2.55, 2.85], [0, 1, 1, 1.18]);
      el.bud.setAttribute('transform', scaleAt(100, 72, budS));
      el.bud.setAttribute('opacity', lerp(pv, [1.6, 1.8, 2.55, 2.85], [0, 1, 1, 0]));
      el.budBase.setAttribute('fill', mixHex(C.leaf2, C.wiltStem, wv));
      PETALS.forEach((_, i) => {
        const s = lerp(pv, [2.45 + i * 0.06, 2.95 + i * 0.01, 3.3], [0, 1, 1.14]);
        el['petal' + i].setAttribute('transform', `scale(${s})`);
      });
      el.petalFill.forEach((e) => e.setAttribute('fill', mixHex(C.petal, C.petalWilt, wv)));
      el.petals.setAttribute('transform', `rotate(${lerp(pv, [2.45, 3], [-55, 0]) + spin})`);
      el.core.setAttribute('transform', `scale(${lerp(pv, [2.7, 3, 3.3], [0, 1, 1.1])})`);
      el.body.setAttribute('transform', `rotate(${6 * wv} 100 208)`);
      el.top.setAttribute('transform', `rotate(${58 * wv} 100 70)`);
      el.sway.setAttribute('transform', `rotate(${sv * (1 - wv * 0.7)} 100 208)`);
    };
    draw();
    const offs = [p.on('change', draw), w.on('change', draw), swayV.on('change', draw), spinV.on('change', draw)];
    return () => offs.forEach((f) => f());
  }, [p, w, swayV, spinV]);

  // Keep the last node on unmount: stopping a spring fires one final update after refs clear.
  const set = (k) => (node) => { if (node) r.current[k] = node; };
  r.current.petalFill = r.current.petalFill || [];

  return (
    <svg ref={svgRef} className={`plant ${className}`} viewBox="0 0 200 240" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <ellipse className="p-shadow" cx="100" cy="226" rx="74" ry="8" />
      <path className="p-soil" d="M28 218 C 52 200, 148 200, 172 218 C 160 231, 40 231, 28 218 Z" />
      <path className="p-soil-top" d="M42 212 C 72 203, 128 203, 158 212" />
      <g ref={set('seed')} className="p-seed"><ellipse cx="100" cy="207" rx="8" ry="5.5" /><path className="p-seed-line" d="M95 206 q5 -3 10 0" /></g>
      <g ref={set('body')}><g ref={set('sway')}>
        <path ref={set('stem')} className="p-stem" pathLength="1" d="M100 208 C 96 180, 106 150, 100 120 C 95 98, 102 82, 100 66" />
        {LEAVES.map((L, i) => (
          <g key={i} ref={set('leaf' + i)}>
            <path ref={set('leafFill' + i)} d={L.d} />
            <path className="leaf-vein" d={L.v} />
          </g>
        ))}
        <g ref={set('top')}>
          <g ref={set('bud')}>
            <path ref={set('budBase')} d="M100 72 C 88 64, 90 46, 100 36 C 110 46, 112 64, 100 72 Z" />
            <path className="bud-tip" d="M100 37 C 105 42, 107 49, 106 54 C 102 50, 98 50, 94 54 C 93 49, 95 42, 100 37 Z" />
          </g>
          <g transform="translate(100 56)">
            <g ref={set('petals')}>
              {PETALS.map((a, i) => (
                <g key={a} transform={`rotate(${a})`}>
                  <g ref={set('petal' + i)}>
                    <ellipse ref={(n) => { if (n) r.current.petalFill[i] = n; }} cx="0" cy="-19" rx="10.5" ry="19" />
                    <ellipse fill={C.inner} opacity="0.65" cx="0" cy="-15" rx="4.5" ry="10" />
                  </g>
                </g>
              ))}
            </g>
            <circle ref={set('core')} className="p-core" r="9" fill={C.core} />
          </g>
        </g>
      </g></g>
    </svg>
  );
}
