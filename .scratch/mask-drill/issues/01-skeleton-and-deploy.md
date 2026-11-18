# 01: Skeleton app that installs and works offline

**What to build:** A responder opens the public URL on a cheap Android phone, sees a Mask Drill home screen with an English/Hindi toggle, can add it to the home screen, and it still opens with no network. Vite + TypeScript (strict) + Preact, one CSS file with light/dark tokens, PWA manifest and a small service worker, GitHub Actions workflow that builds and deploys `dist/` to GitHub Pages on push to `main` (relative base path so it works under `/<repo>/`). MIT licence for code, CC BY 4.0 note for content, README with what it is, how to play, how to run locally, and the training-aid disclaimer.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] `npm run build` produces a static `dist/` under 250 KB gzipped (a script checks this and fails if exceeded)
- [x] Home screen renders at 360x800 with the language toggle working
- [x] Service worker caches the app shell; a Playwright test reloads offline and the home screen still renders
- [x] `.github/workflows/deploy.yml` builds, tests and deploys to Pages
- [x] `npm test`, `npm run typecheck`, `npm run build` all pass
