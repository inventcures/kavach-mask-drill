# 04: Seal check and buddy check move the team meter

**What to build:** The seal-check screen (inline SVG face with animated leak puffs at nose, sides, chin; six actions, three fixes and three harmful ones; harmful actions re-open leaks; fix actions stay usable so the screen can never soft-lock) and the buddy-check screen (Ravi with stubble, Anjali with strap over ears, Faiz correct), each setting member leakage and moving the meter live. Includes the "seal check is not a fit test" card and the worked example of why one leaky teammate matters.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Player leakage after seal = base + 0.03 per harmful action + stock penalty (capped at 1)
- [ ] Buddy choices set leakage per the prototype values
- [ ] Leak puffs respect `prefers-reduced-motion`; SVG has an accessible label
- [ ] A random-tapping Playwright run always gets past both screens
