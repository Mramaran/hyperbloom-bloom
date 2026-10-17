import { useEffect } from 'react';
import { LayoutGroup, MotionConfig, motion } from 'motion/react';
import Landing, { BrandMark } from './Landing';
import Garden from './Garden';
import Project from './Project';
import { FixDialog, NewDialog } from './Dialogs';
import { Announcer, BackgroundVideo, Cursor, Icon, Pollen, Toasts, useHash } from './ui';

// One background clip everywhere, with an accent wash that follows the open project's state.
const ACCENT = {
  wilted: 'rgba(194,59,82,0.20)',
  running: 'rgba(242,184,59,0.14)',
  live: 'rgba(224,107,154,0.12)',
  new: 'rgba(63,160,106,0.08)'
};
import { emit, useProjects } from './store';

function AppBar() {
  return (
    <motion.header className="appbar" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      <div className="appbar-inner">
        <a className="brand" href="#/" aria-label="Bloom home">
          <BrandMark /><span className="brand-name">Bloom</span><span className="brand-by">on Deployxa</span>
        </a>
        <nav className="appbar-nav" aria-label="App">
          <a href="#/garden">Your garden</a>
          <motion.button className="btn btn-primary" type="button" onClick={() => emit('openNew')} whileTap={{ scale: 0.96 }}>
            <Icon name="plus" />Plant a new app
          </motion.button>
        </nav>
      </div>
    </motion.header>
  );
}

export default function App() {
  const hash = useHash();
  const projects = useProjects();
  const m = hash.match(/^#\/p\/([\w.-]+)/);
  const id = m && projects.some((p) => p.id === m[1]) ? m[1] : null;
  const isApp = id || hash.startsWith('#/garden');
  const routeKey = id ? `p/${id}` : isApp ? 'garden' : 'landing';

  useEffect(() => {
    if (routeKey !== 'landing') window.scrollTo(0, 0);
    document.title = id ? `${id} in Bloom` : isApp ? 'Your garden in Bloom' : 'Bloom: put your app online and watch it grow';
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = id && projects.find((p) => p.id === id);
  const bgSrc = '/video/leaves.mp4';
  const bgAccent = open ? ACCENT[open.state] : 'rgba(0,0,0,0)';

  return (
    <MotionConfig reducedMotion="user">
      <BackgroundVideo src={bgSrc} accent={bgAccent} />
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <LayoutGroup>
        {isApp ? (
          <div className="app-shell">
            <AppBar />
            {id ? <Project key={id} id={id} /> : <Garden />}
          </div>
        ) : (
          <Landing />
        )}
      </LayoutGroup>
      <FixDialog />
      <NewDialog />
      <Toasts />
      <Announcer />
      <Pollen />
      <Cursor />
    </MotionConfig>
  );
}
