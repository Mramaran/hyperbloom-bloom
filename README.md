# Bloom

**Put your app online and watch it grow.**

**Live:** https://hyperbloom-bloom.deployxa.online/

Bloom is a deploy experience on [Deployxa](https://deployxa.com/) for people who build apps with AI tools like Lovable, Bolt, Cursor and v0 and have never deployed before. Each project is a plant. Deploying it grows the plant through four stages:

| Stage | What happens |
|---|---|
| Seed | Bloom copies your code |
| Sprout | Bloom builds it |
| Bud | Bloom checks the app starts and answers |
| Bloom | The app is live with a secure web address |

When something goes wrong, the plant droops and Bloom explains the problem in plain English, with one button to fix it. There's no wall of build logs. Every live version is kept, so you can rewind a bad update in one click.

Built for **HyperBloom October: UI/UX & Web Design**.

## What's inside

- **Landing page:** a hero where the plant grows on load, a pinned scroll story through the four stages, a draggable before/after comparison of a raw build log against Bloom's explanation, a version-rewind demo and a garden finale.
- **Garden:** all your apps as plants, each showing its live, needs-attention or not-online-yet state.
- **Project view:**
  - live deploy progress with a stepper and a plain-English activity feed
  - optional technical log
  - a guided fix for a missing database
  - the version history
- **Motion:**
  - shared-element plant transitions and spring physics throughout
  - a bee cursor that pollinates plants
  - a scroll-drawn vine and petals that fall when you scroll fast
  - a dawn-to-night sky with fireflies

All deploys are simulated in the browser with mock data. The app makes no network calls.

## Accessibility

- Text contrast meets WCAG AA or better, and focus rings are visible.
- Touch targets are at least 44px.
- The comparison slider and the version picker work with the keyboard.
- Progress is announced to screen readers.
- With `prefers-reduced-motion`, every animation snaps to its end state.
- The custom cursor only appears on devices with a fine pointer.

## Run it

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

The output in `dist/` is a static site. It's built with React, [Motion](https://motion.dev) and Vite.

## Credits

The background video is "Green leaves closeup" from [Mixkit](https://mixkit.co/free-stock-video/green-leaves-closeup-94/), used under the Mixkit Stock Video Free License.
