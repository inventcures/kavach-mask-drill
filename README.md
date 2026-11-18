# Mask Drill

A phone-first training game for emergency response teams (ERTs) and other first responders. In about ten minutes it drills the mask skills that fail most often in an outbreak: picking the right mask, rejecting bad stock, getting a seal, checking teammates, and taking everything off without contaminating yourself.

> **Training aid only.** Mask Drill does not replace fit testing, hands-on training or your infection-control team. Always follow your hospital or state infection-control protocol.

**Status:** first public build. One drill (a suspected Nipah case, ERT track) is playable end to end in English and Hindi. The Hindi text still needs review by a native speaker with clinical vocabulary before any pilot. The leakage numbers behind the score are teaching approximations, not laboratory values. See `docs/spec.md` for the full design.

## How to play

1. Open the public URL on your phone (any recent Chrome on Android works; it is built for low-cost phones and slow networks).
2. Tap **हिन्दी** / **English** in the top bar to switch language at any time. Nothing you have done is lost.
3. Optional: use the browser menu, then **Add to Home screen**. After the first visit the game opens with no network.
4. Tap **Start the drill**. It takes about ten minutes:
   - **Before we start**: rate your confidence and answer four quick questions. Role and trainer code are optional.
   - **Eight drill steps**: read the alert, choose protection for three tasks, check the stockpile, put on PPE in order, get a good seal, buddy check three teammates, take PPE off in order, then dispose of it and fill in the stock log.
   - **After the drill**: the same questions again, plus how comfortable and how willing you are to wear an N95 for a full shift.
   - **Results**: team protection %, team protection factor, self-contamination events, what to work on, before vs after, and three things to remember.
5. Your score is the team's average protection, so one teammate with a leaking mask pulls everyone down. A run with no mistakes ends at 96%.

For trainers: give the group one trainer code (for example `KZD-ERT-1125`) to type on the first screen. After the session, each player taps **Download my results (JSON)** and shares the file with you.

## Data and privacy

- No account, no names, no phone numbers, no location, no device ids, no analytics. The game makes no network requests after it has loaded; the end-to-end tests fail if any request leaves the app's own address.
- When a drill is finished, one record is saved in the browser's storage on that phone (the last 50 runs are kept). It holds: scenario, language, finish time and duration, team leakage and protection factor, each team member's leakage, the count of contamination events, the codes of the mistakes made, quiz scores and 1 to 5 ratings before and after, and the optional role and trainer code.
- The trainer code is the only thing a player types. It is cut down to capital letters, digits and hyphens, 16 characters at most, so a name or a sentence cannot be stored.
- **Download my results (JSON)** saves those records as a file on the phone. Nothing is sent anywhere unless the player shares that file.
- **Delete my results** on the results screen removes every saved run from the phone. Clearing the browser's site data does the same.
- If the browser blocks storage (some private modes), the game still works; results are just not kept after the page closes.
- This is enough for informal training sessions. Before any formal study, get ethics review and a proper consent form.

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
npm run e2e -- --trace off    # Playwright at 360x800: perfect run, random tapping, Hindi run, offline reload
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
