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
- **Screen kinds**: briefing, choice, stock, sequence, seal, buddy, bins, quiz, results.
- **Track**: ERT (disposable N95), Elastomeric, Storekeeper, ASHA.
- **Mistake**: `{code, screenId, note}` recorded when the player chooses wrongly; notes are translatable Text.
- **Text**: an object of strings keyed by language code, always with `en`.
