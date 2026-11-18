# Mask Drill

A phone-first training game for emergency response teams (ERTs) and other first responders. In about ten minutes it drills the mask skills that fail most often in an outbreak: picking the right mask, rejecting bad stock, getting a seal, checking teammates, and taking everything off without contaminating yourself.

> **Training aid only.** Mask Drill does not replace fit testing, hands-on training or your infection-control team. Always follow your hospital or state infection-control protocol.

**Status:** early build. The app shell (home screen, English/Hindi toggle, offline install) is in place; the drill screens are being added ticket by ticket. See `docs/spec.md` for the full design and `docs/prototype/index.html` for a throwaway single-file prototype of the whole drill.

## How to play

1. Open the public URL on your phone (any recent Chrome on Android works; it is built for low-cost phones and slow networks).
2. Tap **हिन्दी** / **English** in the top bar to switch language at any time.
3. Optional: use the browser menu, then **Add to Home screen**. After the first visit the game opens with no network.
4. Tap **Start the drill** and follow the screens. Your score is the team's average protection, so one teammate with a leaking mask pulls everyone down.

No account, no names, no tracking. Nothing leaves your phone unless you choose to export your results.

## Run it locally

Needs Node 22.12 or newer.

```sh
npm ci
npm run dev        # dev server with hot reload (no service worker)
npm run build      # static site in dist/, plus service worker and size-budget check
npm run preview    # serve dist/ the way GitHub Pages will
```

Checks:

```sh
npm run typecheck
npm test                      # Vitest unit tests (game engine)
npm run e2e -- --trace off    # Playwright at 360x800, including an offline reload
```

The end-to-end tests need Chromium: run `npx playwright install chromium` once on your machine.

## How it is built

- Vite, TypeScript (strict) and Preact. No CSS framework: one stylesheet, `src/styles.css`, with colour tokens for light and dark mode.
- `src/engine/` holds the game logic as pure TypeScript with no DOM. `src/content/` holds scenarios and locale files as JSON. `src/ui/` holds generic, scenario-driven screens and components. `src/app.tsx` wires them together.
- Every UI string lives in `src/content/locales/<lang>.json`. A missing key falls back to English.
- `scripts/build-sw.mjs` writes a small service worker that precaches every built file. `scripts/check-size.mjs` fails the build if `dist/` goes over 250 KB gzipped.
- `.github/workflows/deploy.yml` typechecks, tests, builds and deploys `dist/` to GitHub Pages on every push to `main`. The build uses a relative base path, so it works under `/<repo>/`. In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Contributing

Tickets live in `.scratch/mask-drill/issues/`. Domain terms are defined in `GLOSSARY.md`. Hindi text needs review by a native speaker with clinical vocabulary before any pilot.

## Licence

- Code: [MIT](LICENSE), copyright 2026 tp53 / inventcures.
- Training content (scenario text, locale files and documents under `docs/`): [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Reuse and adapt it with credit to the Mask Drill project.
