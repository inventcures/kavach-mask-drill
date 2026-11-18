# 03: Play the Nipah drill from alert to doffing, driven by scenario JSON

**What to build:** A responder can start the drill, read the alert, choose protection for three tasks, check six stock items, put on PPE in order, and take it off in order with trap cards, all from `content/scenarios/nipah-kerala-01.json` and `content/locales/{en,hi}.json`. Generic screens: briefing, choice, stock, sequence. Text comes from the prototype (`docs/prototype/index.html`). Mistakes are recorded with codes; doffing traps and out-of-order taps after step 1 count contamination events.

Decision-rich shape from the prototype (sequence checking): duplicate labels such as two "Hand hygiene" steps are interchangeable; a trap tap disables that card and records a mistake; an out-of-order tap flashes red, records `{code, expected step}`, and does not advance.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Seams `engine/sequence`, `engine/session` (advance, record mistake, restart) and `engine/scenario` (schema validation; every Text has `en`; build/test fails if a `hi` key is missing) tested first
- [ ] Choice of mask for the ambulance transfer sets the player's base leakage (surgical 0.35, cloth 0.6, N95 0.03)
- [ ] Using a bad stock item sets a stock penalty (+0.15) for the player
- [ ] Switching language mid-screen keeps progress and never duplicates mistakes
- [ ] Each screen shows immediate feedback with icon + text
