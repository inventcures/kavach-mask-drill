# Glossary

- **Member**: one of the four people on the player's team (`you` plus three teammates).
- **Leakage** (inward leakage): fraction of outside air reaching a member's lungs, 0 to 1. Filter penetration plus seal leakage plus stock penalty, capped at 1.
- **Protection factor (PF)**: 1 / leakage.
- **Team leakage**: arithmetic mean of members' leakage (null members ignored). **Team PF** = 1 / team leakage (the harmonic mean of PFs). **Team protection %** = (1 - team leakage) x 100.
- **Contamination event**: a doffing error (trap or out-of-order after the first step) that would put virus on skin or face. Counted separately from leakage.
- **Seal check**: the user check done every time a mask goes on. Not a **fit test** (yearly, instrumented).
- **Leak site**: where air escapes around the mask during the seal check: `nose`, `side`, `chin`.
- **Harmful seal action**: a seal-check action that makes things worse (pinching the clip, crossing straps, stuffing tissue). Each costs the player 0.03 leakage for the rest of the drill.
- **Observed leakage**: a teammate's leakage as set by the player's buddy-check decision. Teammates have no reading before it.
- **Scenario**: a JSON file of screens for one drill, e.g. `nipah-kerala-01`.
- **Screen kinds**: briefing, choice, stock, sequence, seal, buddy, bins, quiz. The results are shown once the last screen is done; they are not a screen in the scenario.
- **Drill step**: a screen that is not a quiz. The Nipah drill has eight.
- **Pre-check / post-check**: the quiz screens before and after the drill: confidence (1 to 5) and the same quiz items, plus comfort and willingness to wear an N95 for a full shift in the post-check. Wrong quiz answers are not mistakes.
- **Result** (session result): the record saved on the phone and exported for one finished run. Numbers and codes only.
- **Context**: optional role (from a fixed list) and **trainer code** (`[A-Z0-9-]`, 16 at most) given on the pre-check, so a trainer can group results without identifying anyone.
- **Track**: ERT (disposable N95), Elastomeric, Storekeeper, ASHA.
- **Mistake**: `{code, screenId, note}` recorded when the player chooses wrongly; notes are translatable Text.
- **Text**: an object of strings keyed by language code, always with `en`.
