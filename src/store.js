import { useSyncExternalStore } from 'react';
import { initialProjects, script, FAIL_LOG, STEPS } from './data';

let projects = initialProjects();
const subs = new Set();
const emitChange = () => subs.forEach((f) => f());

export function useProjects() {
  return useSyncExternalStore((fn) => { subs.add(fn); return () => subs.delete(fn); }, () => projects);
}
export const getProject = (id) => projects.find((p) => p.id === id);

export function update(id, fn) {
  projects = projects.map((p) => (p.id === id ? fn(p) : p));
  emitChange();
}
export function addProject(p) {
  projects = [...projects, p];
  emitChange();
}

/* Tiny event bus for toasts, screen-reader announcements and bloom bursts */
const handlers = {};
export const on = (type, fn) => { (handlers[type] ||= new Set()).add(fn); return () => handlers[type].delete(fn); };
export const emit = (type, data) => handlers[type]?.forEach((fn) => fn(data));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const markLast = (feed, state) => feed.map((f, i) => (i === feed.length - 1 ? { ...f, state } : f));

export async function deploy(id, { from = 0 } = {}) {
  const start = getProject(id);
  if (!start || start.state === 'running') return;
  const token = (start.token || 0) + 1;
  update(id, (q) => ({
    ...q, token, redeploy: q.state === 'live', state: 'running', runStage: from,
    feed: from ? [{ text: 'Reused the build from your last try, so this part is quicker', state: 'done' }] : [],
    log: from ? [...q.log, '', `Retrying from the health check with DATABASE_URL set (${q.dbSource})`] : []
  }));
  const t0 = performance.now();

  for (const s of script(getProject(id)).filter((x) => x.stage >= from)) {
    if (getProject(id).token !== token) return;
    update(id, (q) => ({ ...q, runStage: s.stage, feed: [...q.feed, { text: s.say, state: 'active' }] }));
    emit('announce', `${STEPS[s.stage].name}: ${s.say}`);
    for (const line of s.log) {
      await sleep(s.ms / s.log.length);
      if (getProject(id).token !== token) return;
      update(id, (q) => ({ ...q, log: [...q.log, line] }));
    }
    if (s.fail) {
      update(id, (q) => ({
        ...q, state: 'wilted', failStage: s.stage, redeploy: false,
        log: [...q.log, ...FAIL_LOG.map((l) => '!' + l)], feed: markLast(q.feed, 'failed')
      }));
      emit('announce', 'Your app needs a database address. Use Add a database to fix it.');
      emit('toast', { msg: 'One thing needs your attention', icon: 'alert' });
      return;
    }
    update(id, (q) => ({ ...q, feed: markLast(q.feed, 'done') }));
  }

  const grewIn = (performance.now() - t0) / 1000 + (from ? 12 : 0);
  update(id, (q) => ({
    ...q, state: 'live', redeploy: false, hadLive: true, grewIn, picked: null,
    versions: [
      ...q.versions.map((v) => ({ ...v, current: false })),
      { id: 'v' + Date.now(), when: 'Just now', note: from ? 'Connected the database' : (q.versions.length ? 'Latest code from main' : 'First version online'), current: true }
    ]
  }));
  const p = getProject(id);
  emit('bloom', id);
  emit('announce', `${p.name} is live at ${p.url}`);
  emit('toast', { msg: `${p.name} is online`, icon: 'flower' });
}

export function rewindTo(id, vid) {
  const target = getProject(id).versions.find((v) => v.id === vid);
  if (!target || target.current) return;
  update(id, (q) => ({ ...q, picked: vid, versions: q.versions.map((v) => ({ ...v, current: v.id === vid })) }));
  emit('rewind', id);
  emit('toast', { msg: `Rewound to the ${target.when} version. It's live now.`, icon: 'rewind' });
  emit('announce', `Rewound to the ${target.when} version`);
}
