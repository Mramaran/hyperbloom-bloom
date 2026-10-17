export const STEPS = [
  { name: 'Seed', desc: 'Copy your code', glyph: 'seed' },
  { name: 'Sprout', desc: 'Build it', glyph: 'sprout' },
  { name: 'Bud', desc: 'Check it starts', glyph: 'leaf' },
  { name: 'Bloom', desc: 'Go live', glyph: 'flower' }
];

const HOSTS = { 'github.com': 'GitHub', 'gitlab.com': 'GitLab', 'bitbucket.org': 'Bitbucket' };

export function script(p) {
  return [
    { stage: 0, say: `Copying your code from ${HOSTS[p.repo.split('/')[0]] || 'your repository'}`,
      log: [`$ git clone https://${p.repo}`, 'Cloning into /app ...', 'Received 1,284 files (3.1 MB)'], ms: 1500 },
    { stage: 1, say: 'Installing the packages your app uses',
      log: ['$ npm ci', 'added 412 packages, audited 413 in 8.9s'], ms: 1800 },
    { stage: 1, say: `Building your app. It's ${p.framework}, so Bloom picked the matching recipe`,
      log: ['$ npm run build', `> ${p.framework.toLowerCase().split(' ')[0]} build`, 'Compiled successfully in 14.2s', `Image deployxa/${p.id}:a41f9c ready`], ms: 2100 },
    { stage: 2, say: 'Starting your app and checking it answers',
      log: ['Starting container on port 3000', 'Waiting for GET / to answer ...'], ms: 1700, fail: p.needsDb && !p.dbAdded },
    { stage: 3, say: 'Giving it a web address with a secure lock',
      log: [`Routing https://${p.url}`, 'TLS certificate issued', 'GET / 200 OK in 118ms', 'Live. Previous version kept for rewind.'], ms: 1400 }
  ];
}

export const FAIL_LOG = [
  'Error: DATABASE_URL is not set',
  '    at connect (src/lib/db.ts:7:11)',
  '    at saveSession (src/app/api/sessions/route.ts:12:3)',
  'Health check failed 3 of 3 times',
  'Stopped. Your live version was not touched.'
];

// What the plant should look like for a project's state.
export function visualFor(p) {
  if (p.state === 'live') return { stage: 3, wilted: false, busy: false };
  if (p.state === 'wilted') return { stage: p.failStage ?? 2, wilted: true, busy: false };
  if (p.state === 'running') return p.redeploy ? { stage: 3, wilted: false, busy: true } : { stage: Math.min(p.runStage ?? 0, 2), wilted: false, busy: false };
  return { stage: 0, wilted: false, busy: false };
}

export function initialProjects() {
  const list = [
    {
      id: 'recipe-swap', name: 'recipe-swap', tool: 'Lovable', framework: 'Vite + React',
      repo: 'github.com/meera-k/recipe-swap', url: 'recipe-swap.deployxa.app',
      state: 'live', grewIn: 41.6, hadLive: true, feed: [], log: [],
      versions: [
        { id: 'v1', when: 'Oct 9', note: 'First version online' },
        { id: 'v2', when: 'Oct 12', note: 'Added a shopping list' },
        { id: 'v3', when: 'Oct 15', note: 'New photo layout' },
        { id: 'v4', when: 'Today', note: 'Fixed the search bar', current: true }
      ]
    },
    {
      id: 'study-buddy', name: 'study-buddy', tool: 'Cursor', framework: 'Next.js',
      repo: 'github.com/arun-dev/study-buddy', url: 'study-buddy.deployxa.app',
      state: 'wilted', failStage: 2, needsDb: true, dbAdded: false, hadLive: true, feed: [], log: [],
      versions: [
        { id: 'v1', when: 'Oct 11', note: 'First version online' },
        { id: 'v2', when: 'Oct 14', note: 'Pomodoro timer', current: true }
      ]
    },
    {
      id: 'my-portfolio', name: 'my-portfolio', tool: 'Bolt', framework: 'Astro',
      repo: 'github.com/kavya-designs/my-portfolio', url: 'my-portfolio.deployxa.app',
      state: 'new', feed: [], log: [], versions: []
    }
  ];
  // study-buddy opens mid-story: it failed at the health check.
  const sb = list[1];
  const s = script(sb).slice(0, 4);
  sb.feed = s.map((x, i) => ({ text: x.say, state: i === 3 ? 'failed' : 'done' }));
  sb.log = s.flatMap((x) => x.log).concat(FAIL_LOG.map((l) => '!' + l));
  return list;
}
