# 05: Full drill in English and Hindi with pre/post check, results and export

**What to build:** The bins-and-stock-log screen, pre and post check (confidence 1-5, four quiz items, plus comfort and willingness to wear an N95 for a full shift in the post check), and the results screen: team protection %, team PF, contamination events, grouped mistakes ("Took off PPE out of order ×3"), before vs after table, three things to remember, "Download my results" (JSON), "Delete my results", and play again. Optional role picker and trainer code on the pre-check (`[A-Z0-9-]{0,16}`). Results saved once per run to localStorage (last 50), wrapped in try/catch. One plain-language consent line.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Seam `engine/telemetry` tested first: record shape matches spec 6.4; contains no free text except the validated trainer code
- [ ] Full drill playable end to end in both languages
- [ ] Playwright: scripted perfect run ends at 96-97% team protection with 0 contamination events; random run reaches results with no console errors; no request leaves the app origin
- [ ] Bundle still under 250 KB gzipped
