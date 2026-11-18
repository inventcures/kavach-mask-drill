# Mask Drill: notes for agents

- Spec: `docs/spec.md`. Throwaway prototype that encodes the agreed content and behaviour: `docs/prototype/index.html` (copy its English and Hindi text; do not copy its structure).
- Issue tracker: **local files**. Tickets live in `.scratch/mask-drill/issues/NN-slug.md`. A ticket is closed by changing its `**Status:**` line to `done` and ticking its acceptance criteria in the same commit that finishes it.
- Triage labels: `ready-for-agent`, `in-progress`, `done`.
- Workflow skills (mattpocock/skills) are saved at `/home/claude/mp-skills/` (to-tickets, implement-spec, implement, tdd, tdd-tests, tdd-mocking, code-review). Read the relevant one before starting.
- Domain glossary: see `GLOSSARY.md`.

## Pre-agreed test seams (approved for autonomous build)
1. `engine/scoring`: leakage per member, team leakage (mean), team PF (1/mean), protection %. Catches maths errors; misses UI wiring.
2. `engine/sequence`: ordered-step checker with traps and interchangeable duplicate steps. Catches order logic and contamination counting.
3. `engine/session`: screen state machine driven by scenario data (advance, record mistake, language switch without duplicate mistakes, restart, results saved once).
4. `engine/scenario`: scenario JSON + locale validation (every text has `en`; `hi` keys complete).
5. `engine/telemetry`: result record shape, no personal data, export.
6. End-to-end (Playwright, 360x800): a scripted perfect run and a random-tapping run both reach results with no console errors and no non-origin network requests.

## Commands
- `npm test` (Vitest), `npm run typecheck`, `npm run build`, `npm run e2e -- --trace off`.
- Chromium for Playwright is preinstalled: launch with `executablePath: '/opt/pw-browsers/chromium'` if the pinned @playwright/test version can't find it. Do not run `playwright install`.
