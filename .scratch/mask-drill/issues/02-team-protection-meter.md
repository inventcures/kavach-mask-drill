# 02: Team protection meter driven by the scoring engine

**What to build:** The pure scoring engine (spec 4.2) and the live meter + team row that every later screen uses. A dev-only route or story shows a team of four with set leakages and the meter reading e.g. "88% · PF 8.5". Values from the spec table live in one constants module documented as teaching approximations.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Seam `engine/scoring` tested first (TDD): 4 x 0.04 → team leakage 0.04, PF 25; [0.04,0.04,0.04,0.35] → 0.1175, PF ≈ 8.51; leakage capped at 1; null members ignored; no members → null
- [ ] Meter shows protection % and PF, colour bands (≥90 good, ≥70 warn, else bad) with a text label, not colour alone
- [ ] Team row shows four members with their protection or "?"
