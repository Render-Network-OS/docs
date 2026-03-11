# Team 06: Boot And Startup

## Mission
- Close the final boot/loading pass and freeze it.
- Treat this as validation-first work, not a redesign pass.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary surfaces:
  - `src/components/LoadingScreen.tsx`
  - `src/components/MiladyBootShell.tsx`
  - `src/components/StartupFailureView.tsx`
  - `src/App.tsx`

## Staffing And Speed
- Staffing: 1 frontend engineer
- Best case: 0.5 day
- Likely: 1-2 days
- Hard gate: 3 days

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_06_BOOT_STARTUP.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
4. Open these files first:
   - `src/components/LoadingScreen.tsx`
   - `src/components/MiladyBootShell.tsx`
   - `src/components/StartupFailureView.tsx`
   - `src/App.tsx`
5. Validate current behavior before changing code.
6. Check `milady-os` startup first:
   - randomized ASCII dither
   - agent identity
   - shell presentation
7. Check non-`milady-os` startup second:
   - neutral path preserved
   - no Pro Streamer visual leakage
8. If behavior is already correct, leave code unchanged and update this packet with validation evidence.
9. If behavior is incorrect, fix only the parity issue and document the delta here.
10. Your deliverable is either:
   - a no-code validation note in this packet, or
   - a minimal parity fix plus validation note in this packet

## Overview Of Other Teams
- Team 00 owns sequencing and keeps this team from taking on unrelated shell redesign work.
- Team 01 is independent except that launch changes must not leak into startup semantics.
- Team 02 is mostly independent; boot-state notices stay separate unless routed through reachable Pro Streamer surfaces.
- Team 03 is independent except that startup must transition cleanly into the stage/dashboard shell.
- Team 04 depends on startup cleanly handing off into a healthy avatar runtime.
- Team 05 must preserve the same Milady OS visual language while converging shared surfaces.
- Team 07 depends on this team for stable theme-specific loading assertions and startup smoke flow.

## Priority Checklist
- `P0` Validate `milady-os` boot shell behavior:
  - randomized ASCII dither preserved
  - registered agent identity used when available
  - fallback identity used only when unavailable
- `P0` Validate non-`milady-os` behavior:
  - neutral loading path preserved
  - no Pro Streamer boot styling leaks into other themes
- `P1` Validate startup path coverage:
  - cold startup
  - onboarding-adjacent startup
  - startup-failure path
- `P1` Only change code if parity issues are found
- `P2` Publish a simple parity checklist for Team 07 smoke runs

## Explicit Instructions
- Start by validating current behavior before writing code.
- If parity is already correct, keep the code unchanged and publish evidence.
- Do not expand this into a larger loading-screen redesign.
- Use the registered agent name as identity; do not add hard-coded branding labels beyond the existing shell language.

## Interfaces Owned
- loading-shell theme split
- startup identity labeling
- randomized ASCII dither preservation

## Exit Criteria
- `milady-os` shows boot shell, dither, and agent identity correctly.
- Non-`milady-os` themes keep their original neutral loading behavior.
- Team 07 has stable startup expectations for automated and manual smoke coverage.

## Implementation Update (2026-03-11)
- Validation baseline:
  - `LoadingScreen.tsx` already preserved the `milady-os` boot shell, randomized ASCII dither, and agent-name fallback behavior.
  - `LoadingScreen.tsx` already kept non-`milady-os` themes on the neutral loading path.
  - `StartupFailureView.tsx` had the parity defect for this packet: it always rendered `MiladyBootShell` and hard-coded the boot identity as `rasp`.
- Parity delta shipped:
  - `StartupFailureView.tsx` now branches on `currentTheme`; `milady-os` keeps the boot shell while non-`milady-os` renders a neutral failure card.
  - `App.tsx` now forwards `currentTheme` and `agentStatus?.agentName` into `StartupFailureView`.
  - Loading-screen behavior was left unchanged and frozen; only tests were expanded around it.
- Team 07 startup smoke checklist:
  - `milady-os` cold start shows boot shell chrome, ASCII dither, and the registered agent name when available.
  - `milady-os` falls back to `standby` only when no agent name is available.
  - non-`milady-os` cold start shows the neutral loading path with no boot diagnostics or broadcast-shell copy.
  - `backend-unreachable` on `milady-os` keeps the shell treatment and exposes retry plus `OPEN_APP`.
  - `backend-unreachable` on non-`milady-os` shows the neutral failure card with the same recovery controls and error copy.
- Startup coverage status:
  - cold startup/loading parity is covered by the expanded `LoadingScreen` assertions
  - startup-failure parity is covered by `StartupFailureView` assertions plus App-level routing coverage
  - onboarding-adjacent startup is not yet isolated in a Team 06-specific assertion and remains an open smoke/evidence item for Team 07
- Files touched:
  - `milaidy/apps/app/src/App.tsx`
  - `milaidy/apps/app/src/components/StartupFailureView.tsx`
  - `milaidy/apps/app/test/app/loading-screen.test.tsx`
  - `milaidy/apps/app/test/app/startup-failure-view.test.tsx`
  - `milaidy/apps/app/test/app/startup-backend-missing.e2e.test.ts`
  - `milaidy/apps/app/test/app/startup-failure-routing.test.tsx`
  - `PRO_STREAMER_TEAM_06_BOOT_STARTUP.md`
- Tests updated:
  - `test/app/loading-screen.test.tsx`
  - `test/app/startup-failure-view.test.tsx`
  - `test/app/startup-backend-missing.e2e.test.ts`
  - `test/app/startup-failure-routing.test.tsx`
- Remaining risks:
  - onboarding-adjacent startup still lacks dedicated Team 06 assertion coverage and should remain on Team 07's startup smoke checklist
  - Team 07 still needs browser/Electron startup screenshots or clips for release evidence.

## Team 00 Acceptance And Next Steps (2026-03-11)
- Current Team 06 implementation state:
  - `COMPLETED`
- Program gate note:
  - this packet's implementation work is locally complete
  - Team 00 still records the program control state as `NOT ACCEPTED` until Team 07 clears the remaining release-evidence blockers
- Accepted work:
  - startup theme parity is fixed
  - loading-shell behavior is frozen correctly
  - startup test expectations are explicit for loading and startup-failure paths
- Next steps:
  1. Do nothing further. Thank you.
  2. No more feature work in this stream unless a startup regression is found.
  3. Do not reopen startup UI code because of unrelated Electron or packaging blockers.
