# Mask Drill: build spec

**A phone-first training game for emergency response teams on choosing, fitting, checking, removing, maintaining and stockpiling masks**

- Status: Draft v1, 18 Nov 2026, for tp53's review
- Owner: tp53 (Ashoka University), with Samarth Srinivas as subject-matter partner on mask stockpiling
- Build approach: Fable 5.2 using the `mattpocock/skills` workflow (`to-spec` → `to-tickets` → `implement-spec` with `tdd`, then `code-review` and `pr`)
- Hard deadline for the first public version: **5 PM IST, 18 Nov 2026**
- Reference prototype: `/mnt/project-files/mask-drill-prototype/index.html` (a throwaway single-file version built to test the core loop; play it on a phone before reading the rest)

---

## 1. Why this game exists

### 1.1 The problem in one paragraph

India is under-prepared for a respiratory pandemic, and masks are the most tractable first lever. But a stockpile only protects people if the people wearing the masks pick the right one, get a seal, keep it on, take it off without contaminating themselves, and keep the stock usable until the day it is needed. Most of that is behaviour, not hardware. A cheap, repeatable drill that runs on the phones responders already own is the fastest way to move that behaviour, and the data it produces is the evidence a mask-stockpiling pilot needs.

### 1.2 What the call with Samarth (16 Nov 2026) adds

These points from tp53's call with Samarth Srinivas shape the design directly:

| From the call | What it means for the game |
|---|---|
| "If you have a group of 50 people, it's much more important that all 50 have a generally good fit rather than a few having an excellent fit and some having really bad fit." They formalise this with "some sort of mean". | The core score is **team-average inward leakage** (equivalently, the harmonic mean of protection factors). One leaky teammate drags the team down. Buddy checks are a first-class mechanic, not a side quest. |
| Two stockpile options: **disposable N95s** (status quo, cheap, large Indian manufacturing base, shorter storage life) and **elastomeric reusable respirators** (filters to change, must be cleaned, less comfortable, longer storage life, best guess up to ~5 years). | The game teaches **both** mask types, including filter changes, cleaning and storage for elastomerics. Later, it can compare how quickly and correctly people learn each one. |
| Comfort decides whether people wear a mask voluntarily; snugness decides protection. Both matter for any study. | The game records **self-reported comfort and willingness to wear** alongside seal-check behaviour. |
| Most disposables are designed around US/Canadian face-shape data, not Indian faces. | Content stresses that **one model will not fit everyone**, that having two or more models in stock matters, and that a yearly fit test is different from a seal check every time. |
| Storage life, heat (40°C+), humidity, expiry and rotation are unsolved logistics problems. "Who restarts the stockpile when it expires" is a known failure in the US. | A **Storekeeper** mode teaches first-expiry-first-out rotation, storage conditions, rejecting bad stock, and keeping an honest log. |
| Stockpile locations should not be public, because a bad actor could target them before an attack. | The game never shows real stockpile locations. Storekeeper mode includes one short lesson on not sharing stock locations publicly. |
| Kerala publishes rolling N95 stock notices during Nipah outbreaks and has placed orders of around 1.5 lakh. Red Cross warehouses and private hospital chains are other early partners. | The launch scenario is a **Nipah alert in Kerala**. The first users to target are Kerala health ERTs, Red Cross volunteers and one private hospital chain's infection-control team. |
| Study design is hard: you cannot test individuals in isolation, and you must account for emergency conditions. | The game is built as a **study instrument** from day one: pre/post measures, anonymous event logs, team-level outcomes, and an exportable file a trainer can collect. |

### 1.3 Goals

1. Teach first responders the five behaviours that most change real protection: choosing the right mask, getting a seal, checking each other, doffing safely, and keeping stock usable.
2. Make the group-fit idea intuitive: "the team is only as protected as its leakiest mask."
3. Produce anonymous before-and-after evidence that a stockpiling pilot (Kerala, Red Cross, a hospital chain) can cite.
4. Run on a ₹6,000 Android phone on a 2G connection, in English and Hindi, with no account.
5. Ship a public, working first version today, and a structure that makes adding Malayalam, more scenarios and the elastomeric track easy.

### 1.4 Non-goals

- It is **not** a fit test and must never claim to measure fit. It teaches the seal check and explains the fit test.
- It does not replace hospital or state protocols. Every screen that gives a rule says "follow your local protocol".
- No real stockpile locations, supplier names or quantities.
- No accounts, no personal data, no server in v1.
- Not a 3D or VR game. Tap-based 2D only.

---

## 2. Users and context

| User | Context | What they need from the game |
|---|---|---|
| **ERT member** (hospital emergency response team, district rapid response team, state disaster response force) | Short shifts between duties, shared phones, mixed English and Hindi or Malayalam literacy | A 10-minute drill they can repeat, with instant feedback |
| **Trainer** (infection-control nurse, ERT lead, Red Cross trainer) | Runs a session for 10 to 30 people with one projector or none | A way to run the drill in a group, and collect results from each phone afterwards |
| **Storekeeper** (hospital stores, district drug warehouse, Red Cross warehouse) | Manages boxes, expiry dates and registers, often on paper | Practice deciding what to use, reject, rotate and report |
| **Programme lead / funder** (tp53, Samarth, Kerala health department, a foundation) | Needs evidence that training and stockpiles work together | Aggregate before-and-after numbers and error patterns |

### 2.1 Indian training structures to plug into

These are the routes the game should fit, so that a trainer can drop it into an existing session rather than create a new one. Figures are approximate and should be checked before they go into a funding document.

- **NDRF and SDRFs**: national and state disaster response forces with CBRN-trained teams and a published annual training calendar and capacity-building SOPs (ndrf.gov.in). Good for a pilot with one battalion's CBRN unit.
- **Aapda Mitra**: NDMA's community disaster volunteer scheme, trained through state disaster management authorities with a facilitator handbook. Good fit for a short, scenario-based module.
- **Hospital infection prevention and control teams and nursing schools**: the most direct users. Kerala's medical colleges ran Nipah drills in 2018, 2019, 2021, 2023 and later.
- **ASHA workers** (roughly a million nationwide): community health workers who visit homes during outbreaks. They need a simpler track (surgical mask vs N95, when to refer, safe removal), not the full ERT drill.
- **Indian Red Cross Society state branches**: run disaster response teams and warehouses. Samarth flagged them as an early, more experimental partner.

---

## 3. Evidence base (short)

This section is deliberately short because the deadline is today. It records what the design leans on. Items marked *(check)* were not re-verified in this session.

### 3.1 Where errors happen

- Doffing is where most self-contamination happens. Simulation studies that spray fluorescent marker on PPE and then check skin and clothing after removal find contamination in a large share of removals (around 4 in 10 glove-and-gown removals in Tomas et al., JAMA Internal Medicine 2015 *(check)*). Error-prone steps cluster around glove removal, gown removal and touching the face or mask front.
- The common seal and fit errors are: nose clip pinched rather than moulded, straps over the ears or crossed, mask not under the chin, facial hair under the seal, and the wrong size or model for the face.
- Stock errors: expired masks with perished elastic, masks stored damp or crushed, counterfeit or unmarked masks, and valved respirators used where source control matters.

### 3.2 Do games and simulations work?

- A Cochrane review of PPE for highly infectious diseases (Verbeek et al., updated 2020) found low-certainty evidence that more active training (simulation, video, hands-on) reduces donning and doffing errors compared with passive training. *(check exact wording)*
- A gamified e-learning module on prehospital PPE use during COVID-19 (Suppan et al., *JMIR Serious Games* 2020, e20173) was tested in a randomised trial and improved PPE knowledge compared with conventional e-learning.
- A VR PPE training game with a pilot randomised trial was published in 2025 (PMC11949087) *(check details)*.
- A scoping review of serious games for infection prevention (2016, PMC5062920) found most games show knowledge gains but few measure real behaviour.
- In LMICs, the strongest examples are low-bandwidth mobile games and e-learning: e-Bug style hygiene games, the 2014 Ebola ward-walkthrough game, and WHO's OpenWHO courses.

**Design implication:** knowledge gains are easy to show and behaviour change is hard. The game therefore (a) drills the physical sequence with tap-to-order mechanics, (b) pairs with a real hands-on session in the pilot, and (c) logs the specific errors so a trainer can follow up in person.

### 3.3 Guidance the content follows

- **Donning (CDC/WHO standard order):** hand hygiene → gown → respirator → seal check → eye protection → gloves over gown cuffs.
- **Doffing (CDC sequence 1):** gloves → (hand hygiene) → gown → eye protection by the strap → leave the room → respirator by the straps, bottom strap first, without touching the front → hand hygiene. Some protocols remove gown and gloves together. The game should accept configurable sequences per protocol.
- **User seal check:** both hands over the respirator, breathe out sharply (positive pressure) and in sharply (negative pressure); no air at the edges, slight collapse on inhaling. Done every time. A **fit test** (qualitative or quantitative) is done at least yearly and when changing model.
- **Nipah:** NCDC's advisory for health personnel calls for standard, contact and droplet precautions and full PPE (gown, gloves, mask, goggles or face shield, shoe covers) for aerosol-generating procedures in an airborne isolation room. Kerala protocols in practice use N95s for suspected-case contact.
- **Waste:** India's Bio-Medical Waste Management Rules, 2016 colour codes. Used masks and gowns go to the yellow bag; used gloves to the red bag; reusable goggles and elastomeric facepieces are cleaned and disinfected. Filters are discarded per the manufacturer's rules, never washed.

---

## 4. Game design

### 4.1 Core idea

You lead a team of four responders through a short outbreak scenario. Every choice changes each teammate's **inward leakage**. The meter at the top always shows the **team's average protection**. You win by keeping the whole team protected, not by being perfect yourself.

### 4.2 The team protection model (the heart of the game)

For each team member *i*:

```
leakage_i = filter_penetration(mask) + seal_leakage(seal actions, facial hair, strap position)
            + stock_penalty(expired, damp, damaged)
            (capped at 1.0)
protection_factor_i = 1 / leakage_i
```

For the team:

```
team_leakage = mean(leakage_i)               # arithmetic mean of leakage
team_PF      = 1 / team_leakage              # = harmonic mean of the individual PFs
team_protection_% = (1 - team_leakage) × 100
```

Why this model, explained to players with numbers:

- Four teammates at 4% leakage each: team leakage 4%, team PF 25.
- Three at 4% and one at 35% (a beard under the seal): team leakage (4+4+4+35)/4 ≈ 12%, team PF ≈ 8.5.
- So one bad seal makes the team about **three times** more exposed, even though three people did everything right. That is the point Samarth made about groups of 50.

Starting values (teaching approximations, documented in the code as such, never presented as lab values):

| Factor | Value |
|---|---|
| N95 filter penetration | 0.03 |
| Surgical mask (as worn) | 0.35 |
| Cloth mask | 0.60 |
| No mask | 1.00 |
| Elastomeric with P100 or P2 filter, good seal | 0.02 |
| Nose clip pinched, not moulded | +0.10 |
| Straps crossed or bottom strap over ears | +0.15 |
| Not under the chin | +0.08 |
| Facial hair under the seal | +0.30 |
| Expired with perished straps, or damp | +0.15 |

**Doffing** is scored separately as **self-contamination events** (a count), because it is a different risk from inhaling through a gap.

### 4.3 Session flow (one "drill", about 10 minutes)

| # | Screen | What the player does | Teaches |
|---|---|---|---|
| 0 | Home | Choose language, start. Choose track: ERT drill, Elastomeric drill, Storekeeper | — |
| 1 | Pre-check | Confidence (1 to 5) plus 4 to 6 quiz items | Baseline |
| 2 | Alert | Read a 4-line scenario. Meet the team | Context |
| 3 | Choose protection | For each of 3 tasks (triage desk, ambulance transfer, airway suctioning), pick from cloth, surgical, N95, N95 + eye protection | Risk-matched choice and saving N95s |
| 4 | Check the stockpile | Use or reject 6 items (in date, expired, valved, damp, unmarked, second model) | Stock quality, two models for fit |
| 5 | Don | Tap steps in order | Donning sequence |
| 6 | Seal check | A face with animated leaks at nose, sides and chin. Pick actions; wrong actions reopen leaks | Seal technique |
| 7 | Buddy check | Look at three teammates (beard, strap over ears, correct) and choose an action for each. The meter moves live | Group fit; also "say when someone has it right" |
| 8 | Doff | Tap steps in order, with trap cards ("pull the N95 off by the front", "adjust goggles with gloved hands") | Self-contamination |
| 9 | Dispose and log | Put 4 items in the right bin; answer one stock-log arithmetic question | Waste rules, honest logging |
| 10 | Post-check | Same confidence plus quiz items; comfort and willingness questions | Change |
| 11 | Results | Team protection %, team PF, contamination events, grouped mistakes, before vs after, download results | Reflection, data export |

### 4.4 Tracks

**Track A: ERT drill (disposable N95)** — the flow above. Ships first.

**Track B: Elastomeric drill.** Same scenario, but the stock is reusable elastomeric half-face respirators. Extra screens:

1. Assemble: fit the correct filters (matching colour or rating), check valves and gaskets for cracks.
2. Don and seal check (positive and negative pressure, using the valve covers).
3. Source control: an elastomeric with an open exhalation valve does not protect others in a sterile field. Choose: valve cover, a surgical mask over the valve, or a valveless model.
4. Between shifts: wipe the facepiece with an approved disinfectant, never wash or wet the filters, store in a clean labelled bag.
5. When to change filters: breathing gets harder, filter visibly soiled or damaged, after contamination, or on the manufacturer's schedule.
6. End of outbreak: full clean (take apart, wash, disinfect, rinse, air dry), inspect, reassemble, return to stock with the date logged.

This track lets a pilot compare how fast and how accurately people learn each mask type, which is one of the open questions from the call.

**Track C: Storekeeper.** A short warehouse puzzle, repeated over three in-game "months":

1. Receive a delivery: check markings (BIS or NIOSH), packaging, lot and expiry, and reject counterfeits.
2. Shelve it: first-expiry-first-out, off the floor, away from heat and damp. A thermometer shows 41°C in the tin-roof shed and 28°C in the inner room.
3. Issue stock to a ward during an alert, from the earliest expiry first.
4. Spot stock about to expire and choose: rotate it into routine hospital use now, or let it expire. Rotating keeps the stockpile fresh (the "sell or use before expiry" idea from the call).
5. Keep the register honest; the end-of-month count has to match.
6. One card on security: someone on social media asks where the district's masks are stored. The right answer is not to post it and to refer them to the official channel.

**Track D (later): ASHA and community.** A 3-minute version: surgical mask vs N95, how to wear and remove one safely at a home visit, when to refer.

### 4.5 Scenarios

| ID | Name | Track | Status |
|---|---|---|---|
| `nipah-kerala-01` | Suspected Nipah case at a district hospital | A, B | v1 |
| `flu-x-ambulance-01` | New influenza-like illness cluster, ambulance crew | A, B | v2 |
| `warehouse-monsoon-01` | Monsoon damp in a district store | C | v2 |
| `asha-homevisit-01` | Home visit to a coughing household | D | v3 |

Scenarios are **data, not code**. Each is a JSON file with its screens, options, correct answers, explanations (in every language) and scoring deltas. A trainer or translator can add one without touching the engine.

### 4.6 Feedback rules

- Feedback appears **immediately** after each choice, in one or two plain sentences, saying what happens physically ("pinching with one hand bends the clip into a V and leaves gaps").
- Wrong is shown in red with a cross and the right answer highlighted; right is green with a tick. Never colour alone: always an icon and text too.
- No timers in v1. Speed pressure increases errors and the users are often reading in their second language.
- Mistakes are grouped on the results screen ("Put on PPE out of order ×3") so a trainer sees patterns, not noise.

### 4.7 Trainer group mode (v2)

A trainer opens `?mode=group` on one phone connected to a projector. Players use their own phones. At the end, each player shows a 6-digit code or a QR code with their compressed results; the trainer's phone scans them or the trainer types the codes. This keeps everything offline and serverless. The trainer's phone shows the room's team-average protection, the top three mistakes and the pre-to-post change, and exports a CSV.

---

## 5. Language and accessibility

- **Languages:** English and Hindi in v1, with a language toggle on every screen. Malayalam next (Kerala launch). Then Tamil, Bengali and Marathi.
- Every string lives in a locale file keyed by ID; no strings are hard-coded in components. A missing key falls back to English and is logged in development.
- **Hindi text needs review by a native speaker with clinical vocabulary** before any pilot. Use the terms responders actually use (many say "N95", "gown", "PPE kit", "sanitiser" in English inside Hindi sentences).
- Reading level: short sentences, one idea each. Target grade 6 to 8.
- Icons next to every key action; later, optional audio narration for each screen (pre-recorded MP3s under 30 KB each, cached offline).
- Tap targets at least 48 px. Works at 320 px wide. Supports system dark mode. Respects reduced-motion (leak puffs stop animating). Screen-reader labels on the face diagram and meter.
- Fonts: system fonts only, including Noto Sans Devanagari where available. No web font downloads.

---

## 6. Technical design

### 6.1 Constraints

| Constraint | Target |
|---|---|
| Device | Android Go phones, 1 to 2 GB RAM, Chrome 90+ |
| Network | First load on 2G in under 10 s; everything after works offline |
| Size | Total transferred under 250 KB gzipped for v1 (prototype is 45 KB uncompressed) |
| Install | Installable as a PWA ("Add to home screen"); no Play Store needed in v1 |
| Hosting | Railway (static Node server, `railway up`); GitHub Actions runs the checks on every push |
| Data | No server in v1. Results stay on the device until the user downloads or shares them |

### 6.2 Stack

- **Vite + TypeScript (strict)**, building a static site.
- **Preact** for the UI (3 KB; React-compatible so contributors know it). Plain DOM is acceptable if Fable prefers, but keep the engine framework-free either way.
- **Vitest** for unit tests (scoring, engine, i18n). **Playwright** for one end-to-end run of each track at a 360×800 phone viewport.
- **vite-plugin-pwa** (or a hand-written service worker of under 40 lines) for offline caching.
- No CSS framework. One CSS file with custom properties for light and dark themes.

### 6.3 Module design (deep modules, small interfaces)

```
src/
  engine/          pure TypeScript, no DOM. All game logic lives here.
    scoring.ts     leakage model, team aggregation, contamination count
    session.ts     state machine: current screen, answers, mistakes, history
    scenario.ts    loads and validates scenario JSON against a schema
    sequence.ts    ordered-steps checker (accepts interchangeable steps, e.g. two "hand hygiene")
    telemetry.ts   builds the anonymous result record; local storage; export to JSON/CSV/QR code
  content/
    scenarios/nipah-kerala-01.json
    locales/en.json, hi.json
    protocols/cdc-doffing-1.json, cdc-doffing-2.json   (configurable sequences)
  ui/
    screens/       one component per screen type (Choice, StockCheck, Sequence, SealCheck, BuddyCheck, Bins, Quiz, Results)
    components/    Meter, TeamRow, FaceDiagram, Feedback, LangToggle
  app.tsx          wires engine → screens
```

The key rule: **screens are generic and scenario-driven.** A `Sequence` screen renders any ordered task (donning, doffing, elastomeric cleaning) from data. Adding a scenario should need no new component in most cases.

### 6.4 Core types (sketch)

```ts
type Lang = 'en' | 'hi' | 'ml';
type Text = Partial<Record<Lang, string>> & { en: string };

type MemberId = 'you' | string;
interface Member { id: MemberId; name: string; leakage: number | null; }

type ScreenDef =
  | { kind: 'briefing'; id: string; body: Text }
  | { kind: 'choice'; id: string; tasks: ChoiceTask[] }
  | { kind: 'stock'; id: string; items: StockItem[] }
  | { kind: 'sequence'; id: string; steps: Text[]; traps?: Trap[]; countsContamination?: boolean; explain: Text }
  | { kind: 'seal'; id: string; leaks: LeakSite[]; actions: SealAction[] }
  | { kind: 'buddy'; id: string; mates: BuddyCase[] }
  | { kind: 'bins'; id: string; items: BinItem[]; bins: Bin[]; logQuestion?: NumericQuestion }
  | { kind: 'quiz'; id: string; phase: 'pre' | 'post' };

interface Mistake { code: string; screenId: string; note: Text; }

interface SessionResult {   // what gets stored and exported. No names, no device IDs.
  v: 1; game: 'mask-drill'; scenario: string; track: 'ert' | 'elastomeric' | 'storekeeper';
  finishedAt: string; durationSec: number; lang: Lang;
  teamLeakage: number; teamPF: number; contaminationEvents: number;
  leakageByMember: Record<string, number>;
  pre: { confidence: number; score: number; max: number };
  post: { confidence: number; score: number; max: number; comfort?: number; willingToWear?: number };
  mistakes: string[];   // codes only
  context?: { role?: 'ert'|'nurse'|'doctor'|'volunteer'|'asha'|'store'|'other'; trainerCode?: string };
}
```

### 6.5 Data and privacy

- No names, phone numbers, emails, device IDs or locations are collected. Ever.
- An optional **role** and a **trainer code** (typed by the trainer, e.g. `KZD-ERT-1125`) let results be grouped by session without identifying anyone.
- One consent line on the pre-check screen, in plain language: what is stored, where, and that it can be deleted. A "Delete my results" button on the results screen.
- Results are kept in `localStorage` (last 50 runs) inside a try/catch so private browsing works.
- Export: JSON download and, in v2, a QR code. No network calls at all in v1 (check this in the end-to-end test by failing any request that is not to the app's own origin).
- Before any formal study, get ethics review (Ashoka's IRB or the partner hospital's) and a proper consent form. The game's data model is designed so this does not need a code change.

### 6.6 Testing (for the `tdd` skill)

Write tests first for the engine; the UI gets one Playwright pass per track.

| Module | Example test cases |
|---|---|
| `scoring` | 4 × 0.04 → team leakage 0.04, PF 25. `[0.04,0.04,0.04,0.35]` → 0.1175, PF ≈ 8.5. Leakage is capped at 1. Null members are ignored. Surgical mask chosen for transfer gives the player a 0.35 base. |
| `sequence` | Correct order completes. Out-of-order tap is recorded with the expected step index. Two identical "hand hygiene" steps are interchangeable. Trap taps count contamination only when `countsContamination` is true. |
| `session` | Switching language mid-screen keeps state and does not duplicate mistakes. Restarting clears everything. Results are saved once per run. |
| `scenario` | Every scenario JSON validates against the schema. Every `Text` has `en`; the Hindi build fails CI if any key is missing in `hi.json`. |
| `telemetry` | The exported record contains no free text typed by the user except the trainer code, which is limited to `[A-Z0-9-]{0,16}`. |
| E2E (Playwright, 360×800) | A scripted "perfect" run of the ERT track ends at 96 to 97% team protection with 0 contamination; a random-tapping run always reaches the results screen with no console errors (this caught a soft-lock in the prototype's seal screen). |

### 6.7 Performance budget checks in CI

- Fail the build if `dist/` is over 250 KB gzipped.
- Lighthouse mobile run in CI (performance ≥ 90, accessibility ≥ 95, PWA installable).

---

## 7. Tickets (tracer-bullet slices for `to-tickets`)

The first five are the **5 PM IST MVP**. Each is a vertical slice that is playable on its own.

| # | Ticket | Blocked by | Done when |
|---|---|---|---|
| 1 | **Skeleton and deploy**: Vite + TS + Preact app, one "Hello" screen, GitHub Actions deploy to Pages, PWA manifest and service worker, MIT licence, README | — | Public URL loads on a phone and works offline on reload |
| 2 | **Scoring engine** with tests (section 4.2) and the Meter + TeamRow components | 1 | Unit tests pass; meter renders a hard-coded team |
| 3 | **Scenario loader + generic screens**: briefing, choice, stock, sequence (don/doff with traps) driven by `nipah-kerala-01.json` | 2 | Nipah drill playable from alert to doffing |
| 4 | **Seal check and buddy check screens** wired to scoring | 3 | Meter moves live; no soft-lock under random tapping |
| 5 | **Bins, quiz, results, export, English + Hindi** | 4 | Full ERT drill end to end in both languages; JSON download works; Playwright smoke passes |
| 6 | Elastomeric track (4.4 B) | 5 | Track B playable |
| 7 | Storekeeper track (4.4 C) | 5 | Track C playable |
| 8 | Malayalam locale, reviewed by a Kerala nurse | 5 | `ml.json` complete and reviewed |
| 9 | Trainer group mode and QR code export (4.7) | 5 | Trainer phone aggregates 10 players offline |
| 10 | Audio narration and reduced-motion polish | 5 | Each screen has optional audio |
| 11 | ASHA 3-minute track (4.4 D) | 5 | Track D playable |

---

## 8. Pilot and evaluation plan

This is how the game becomes evidence for the stockpiling pilot.

1. **Week 1: find the real mistakes.** Spend time with 3 to 5 real responders (a Red Cross unit and a hospital infection-control nurse). Ask them to list the top errors they see. Update scenario content and the scoring weights.
2. **Week 2: run one ERT batch** (15 to 30 people). Pre-check in the game, play the drill, then a **hands-on** donning and doffing session with real masks observed by the trainer using a simple checklist, then the post-check.
3. **Measures:**
   - Knowledge: pre vs post quiz score.
   - Confidence: pre vs post (1 to 5).
   - Behaviour in the game: error codes, team protection %, contamination events.
   - Behaviour in the real world: trainer checklist of seal-check done, strap position, doffing order and front-of-mask touches, scored blind to game scores.
   - Comfort and willingness to wear, for disposable vs elastomeric (track A vs B) to feed the stockpile choice.
   - Optional: if a fit-test kit is available, fit-test pass rate for players who did the drill vs those who did not.
4. **Report:** one page with before-and-after numbers for the funding proposal and for Kerala, the Red Cross or the hospital chain.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| The game teaches a rule that differs from a hospital's protocol | Protocol sequences are configurable data; every rule screen says "follow your local protocol"; content reviewed by an infection-control nurse before a pilot |
| Players think the seal check is a fit test | Explicit card on the seal-check screen and in results: "seal check every time, fit test every year" |
| Teaching numbers are read as lab values | Label the model as a teaching approximation in the UI ("PF" tooltip) and in code comments |
| Hindi or Malayalam is stilted or wrong | Native clinical reviewer before pilot; translators work in the locale JSON only |
| Low-end phones struggle | 250 KB budget, no web fonts, no images except inline SVG, CI performance checks |
| Data misuse | No personal data collected; export is user-initiated; ethics review before any formal study |
| Revealing stockpile locations | Never include real locations; a Storekeeper card teaches not to share them |

---

## 10. Open questions for tp53 (and Samarth)

1. Which repo should the code go in? (Needed before building. Public, under `inventcures`?)
2. Is the **name** "Mask Drill" OK? Alternatives: "Seal Squad", "Team Fit".
3. Launch scenario: is **Nipah in Kerala** right, or should the first scenario be a generic new respiratory virus so it is not tied to one state?
4. Should Track B (elastomeric) be in the first public version, given Samarth's interest in comparing disposables and elastomerics? It adds roughly a ticket's worth of work.
5. Which doffing protocol should be the default: CDC sequence 1 (gloves first), or gown and gloves together?
6. Licence: MIT for code and CC BY 4.0 for content?

---

## 11. Sources consulted

- tp53 and Samarth Srinivas, call transcript, 16 Nov 2026 (in the project chat).
- NCDC, *Advisory for Health Care Personnel* (Nipah), 2024: https://ncdc.mohfw.gov.in/wp-content/uploads/2024/09/Advisory-for-Health-Care-Personnel.pdf
- CDC/NIOSH, *Proper N95 respirator use*: https://www.cdc.gov/niosh/bulletin/2020/n95-preparedness.html and *Respiratory Protection Week 2022*: https://cdc.gov/niosh/bulletin/2022/rpw.html
- The Union, *Guidelines for wearing and removing an N95 respirator*: https://theunion.org/sites/default/files/2021-05/Guidelines%20for%20wearing%20and%20removing%20an%20N95%20respirator%20FINAL.pdf
- Suppan et al., *JMIR Serious Games* 2020;8(2):e20173: https://games.jmir.org/2020/2/e20173
- VR PPE training game, development study and pilot RCT: https://pmc.ncbi.nlm.nih.gov/articles/PMC11949087
- Serious games for infection prevention, scoping review: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5062920/
- Error-prone steps and self-contamination sites in PPE donning and doffing, *Disaster Medicine and Public Health Preparedness*: https://www.cambridge.org/core/product/D668BDD3EEE59F0D908DDB9DB6FEF284
- NPR, *Ebola in 3-D: a video game to guide health care workers through a ward*, 2014: https://www.npr.org/sections/goatsandsoda/2014/11/12/362352246/ebola-in-3d-a-video-game-to-guide-healthcare-workers-through-a-ward
- NDRF training calendar and SDRF capacity-building SOP: https://www.ndrf.gov.in/sites/default/files/NDRF%20Training%20Calendar%202025.pdf, https://ndrf.gov.in/sites/default/files/SOP%20for%20Capacity%20Building%20of%20State%20Disaster%20Response%20Force.pdf
- Aapda Mitra overview: https://en.vikaspedia.in/viewcontent/social-welfare/disaster-management-1/aapda-mitra-community-disaster-response-volunteers/aapda-mitra-community-volunteers-for-disaster-management-in-india?lgn=en
- Project file: `/mnt/project-files/bioprevail-research/100dm-countermeasures-and-ows-lessons.md`
