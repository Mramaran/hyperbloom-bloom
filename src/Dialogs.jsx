import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './ui';
import { addProject, deploy, emit, getProject, on, update, useProjects } from './store';
import { go } from './ui';

/* Accessible modal: focus moves in, Tab stays inside, Escape closes, focus returns. */
function Modal({ open, onClose, labelledBy, children }) {
  const panel = useRef(null);
  const returnTo = useRef(null);
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    const t = setTimeout(() => panel.current?.querySelector('input:not([type=radio]), input:checked, button[type=submit]')?.focus(), 60);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.disabled && el.offsetParent !== null && !(el.type === 'radio' && !el.checked));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); returnTo.current?.focus?.(); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="modal-backdrop" onClick={onClose} />
          <motion.div ref={panel} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}
            initial={{ y: 40, scale: 0.94, opacity: 0, filter: 'blur(6px)' }} animate={{ y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FixDialog() {
  const [pid, setPid] = useState(null);
  const [choice, setChoice] = useState('managed');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => on('openFix', (id) => { setPid(id); setChoice('managed'); setUrl(''); setError(''); }), []);
  const close = () => setPid(null);

  const submit = (e) => {
    e.preventDefault();
    if (choice === 'own' && !/^postgres(ql)?:\/\/\S+/.test(url.trim())) {
      setError("That doesn't look like a database address. It should start with postgres://");
      document.getElementById('dbUrl')?.focus();
      return;
    }
    const id = pid;
    update(id, (q) => ({ ...q, dbAdded: true, dbSource: choice === 'own' ? 'your own database' : 'new Deployxa Postgres' }));
    close();
    emit('toast', { msg: choice === 'own' ? 'Database connected. Trying again.' : 'Database created. Trying again.', icon: 'database' });
    setTimeout(() => deploy(id, { from: 2 }), 600);
  };

  return (
    <Modal open={!!pid} onClose={close} labelledBy="fixTitle">
      <form className="modal-form" onSubmit={submit} noValidate>
        <h2 className="modal-title" id="fixTitle">Add a database</h2>
        <p className="modal-lede">Your app saves study sessions, so it needs somewhere to keep them. Choose one:</p>
        <fieldset className="choices">
          <legend className="sr-only">Database choice</legend>
          {[
            ['managed', 'Create a free database for me', 'Deployxa makes a Postgres database inside this project and connects it. Nothing to copy or paste.'],
            ['own', 'Use a database I already have', 'Paste its address from Supabase, Neon or another provider.']
          ].map(([val, title, help]) => (
            <label key={val} className="choice" data-checked={choice === val}>
              <input type="radio" name="db" value={val} checked={choice === val} onChange={() => { setChoice(val); setError(''); }} />
              <span className="choice-body"><span className="choice-title">{title}</span><span className="choice-help">{help}</span></span>
              {choice === val && <motion.span layoutId="choice-glow" className="choice-glow" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            </label>
          ))}
        </fieldset>
        <AnimatePresence initial={false}>
          {choice === 'own' && (
            <motion.div className="field" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <label htmlFor="dbUrl">Database address</label>
              <input id="dbUrl" type="text" inputMode="url" autoComplete="off" spellCheck="false" placeholder="postgres://user:password@host:5432/db"
                value={url} onChange={(e) => { setUrl(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby="dbUrlError" />
              <p className="field-error" id="dbUrlError" aria-live="polite">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="modal-actions">
          <button className="btn btn-quiet" type="button" onClick={close}>Cancel</button>
          <button className="btn btn-primary" type="submit">Add it and try again</button>
        </div>
      </form>
    </Modal>
  );
}

export function NewDialog() {
  const projects = useProjects();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [error, setError] = useState('');
  useEffect(() => on('openNew', () => { setOpen(true); setVal(''); setError(''); }), []);

  const submit = (e) => {
    e.preventDefault();
    const raw = val.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const m = raw.match(/^(?:https?:\/\/)?(?:www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/([\w.-]+)\/([\w.-]+)$/i);
    if (!m) { setError('Use a full repository link, like https://github.com/you/your-app'); return; }
    let id = m[3].toLowerCase().replace(/[^a-z0-9-]/g, '-');
    while (projects.some((p) => p.id === id)) id += '-2';
    addProject({ id, name: m[3], tool: null, framework: 'Next.js', repo: `${m[1].toLowerCase()}/${m[2]}/${m[3]}`, url: `${id}.deployxa.app`, state: 'new', feed: [], log: [], versions: [] });
    setOpen(false);
    go(`#/p/${id}`);
    setTimeout(() => { if (getProject(id)) deploy(id); }, 1300);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="newTitle">
      <form className="modal-form" onSubmit={submit} noValidate>
        <h2 className="modal-title" id="newTitle">Plant a new app</h2>
        <div className="field">
          <label htmlFor="repoUrl">Where's your code?</label>
          <input id="repoUrl" type="text" inputMode="url" autoComplete="off" spellCheck="false" placeholder="https://github.com/you/your-app"
            value={val} onChange={(e) => { setVal(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby="repoHelp repoError" />
          <p className="field-help" id="repoHelp">Paste the link to your GitHub, GitLab or Bitbucket repository. Apps from Lovable, Bolt, v0 and Cursor all work.</p>
          <AnimatePresence>
            {error && <motion.p className="field-error" id="repoError" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>{error}</motion.p>}
          </AnimatePresence>
        </div>
        <div className="modal-actions">
          <button className="btn btn-quiet" type="button" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary" type="submit"><Icon name="sprout" />Plant it</button>
        </div>
      </form>
    </Modal>
  );
}
