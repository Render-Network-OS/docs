# Team 07: QA And Release

## Mission
- Turn the remaining Pro Streamer work into a hard release gate.
- Own evidence, smoke coverage, deploy verification, and rollback readiness.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary test locations:
  - `test/app`
  - `test/avatar`
  - `test/ProStreamerStageComposition.test.tsx`
- Release path:
  - merge to `milaidy` `alice`
  - sync deploy trigger branch in `555-bot` `alice`
  - deploy
  - verify live health
  - rollback if any gate fails

## Staffing And Speed
- Staffing: 1 QA automation engineer + 1 app engineer + 1 release owner
- Best case: 3 days
- Likely: 4-5 days
- Hard gate: ship blocker

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
   - `PRO_STREAMER_TEAM_00_SYNTHESIS.md`
   - `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
   - `PRO_STREAMER_TEAM_02_FEEDBACK_ARCHITECTURE.md`
   - `PRO_STREAMER_TEAM_03_STAGE_ACTION_LOG.md`
   - `PRO_STREAMER_TEAM_04_AVATAR_RUNTIME.md`
   - `PRO_STREAMER_TEAM_05_SHARED_SURFACES.md`
   - `PRO_STREAMER_TEAM_06_BOOT_STARTUP.md`
3. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
4. Inventory the existing test files under:
   - `test/app`
   - `test/avatar`
   - `test/ProStreamerStageComposition.test.tsx`
5. Start authoring tests immediately against the contracts in these packets even while implementation is still in flight.
6. When a team freezes a contract, update your test matrix the same day.
7. Build one release evidence bundle that includes:
   - commit or build identifier
   - test suite names
   - pass/fail status
   - screenshots or clips
   - live smoke notes
   - rollback decision record
8. Do not approve release if any required artifact is missing.
9. Update this packet with:
   - tests added
   - test gaps still open
   - smoke run results
   - final go/no-go decision
10. Your deliverable is a release gate, not a best-effort recommendation.

## Overview Of Other Teams
- Team 00 owns sequencing and acceptance tracking; this team reports release blockers back there.
- Team 01 provides the launch contract, readiness logic, and per-mode expected results.
- Team 02 provides the feedback-routing contract and persistence rules.
- Team 03 provides Action Log layout and stage lane rendering expectations.
- Team 04 provides avatar idle classification, runtime diagnostics, and fallback behavior.
- Team 05 provides primitive-converged UI structure across targeted surfaces.
- Team 06 provides startup parity expectations across `milady-os` and non-`milady-os` themes.

## Priority Checklist
- `P0` Expand automated coverage for launch behavior:
  - all five launch modes
  - URL-required readiness
  - blocked states
  - failed states
  - partial-launch states
- `P0` Expand automated coverage for Action Log and stage behavior:
  - sticky header
  - pinned controls region
  - independent feed scroll
  - desktop `80vh`
  - mobile/tablet `80dvh`
  - historical operator-action collapse
  - centered system events
- `P0` Expand automated coverage for avatar runtime:
  - verified idle rotation
  - fallback activation
  - avatar visible on stage
- `P0` Expand automated coverage for loading screen:
  - `milady-os`
  - non-`milady-os`
  - agent identity fallback
- `P0` Add browser/Electron smoke coverage for:
  - startup
  - stage/avatar visibility
  - Action Log interactions
  - guided Go Live setup flow
  - partial-launch warning flow
  - avatar motion actions
  - chat drawer interactions
- `P1` Produce a single release evidence bundle:
  - commit/build identifier
  - suites run
  - pass/fail
  - screenshots or clips
  - live smoke notes
  - known residual risk list, if any
- `P1` Freeze the release sequence:
  - merge
  - deploy trigger sync
  - deploy
  - live verification
  - rollback on failure
- `P2` Publish the exact ship/no-ship criteria so no ambiguity remains on release day

## Explicit Instructions
- Start authoring tests while Teams 01-06 are still in flight; do not wait for all code to finish.
- Use team packet contracts as the acceptance baseline, not informal Slack descriptions.
- Treat any missing evidence as a failed gate.
- Do not allow release on manual optimism if smoke coverage or evidence is incomplete.
- Record every found regression back to Team 00 with owning team and blocking severity.

## Interfaces Owned
- release-evidence bundle
- test matrix and gap list
- ship/no-ship gate
- rollback trigger conditions

## Exit Criteria
- All automated suites for the scoped surfaces pass.
- Browser/Electron smoke evidence exists and is centrally stored.
- Release sequence is executed with recorded health checks.
- Ship is blocked automatically if any required artifact or test result is missing.

## Team 03 Test Targets (2026-03-11)
- Action Log shell selectors:
  - `data-action-log-shell`
  - `data-action-log-header`
  - `data-action-log-pinned-region`
  - `data-action-log-inline-notice-slot`
  - `data-action-log-feed-region`
- Stage lane selectors:
  - `data-stage-entry-role="operator|assistant|system"`
  - `data-stage-entry-kind="bubble|action-pill|action-chip|system-event"`
- Required Team 03 assertions:
  - operator `action-pill` entries hide raw fallback text
  - historical `source="operator_action"` entries collapse to an `action-chip`
  - `action-chip` details remain hidden until the operator expands them
  - assistant and operator plain text remain `bubble` entries with distinct roles
  - public/system summaries render as centered `system-event` entries
  - desktop rail path remains `80vh`
  - tablet/mobile sheet path remains `80dvh`
  - pinned controls remain above the feed and the feed stays independently scrollable

## Team 01 Launch Matrix (2026-03-11)
- Shared readiness assertions:
  - destination selectable only when `enabled && streamKeySet && urlReady`
  - first-party default RTMP URLs count as `urlReady`
  - custom RTMP without URL is `missing-url`
  - enabled destination without stream key is `missing-stream-key`
  - submit-time revalidation returns `blocked` if a selected destination is no longer ready
- Modal behavior assertions:
  - `success` closes modal
  - `partial` closes modal
  - `blocked` keeps modal open with inline notice
  - `failed` keeps modal open with inline notice
- Camera:
  - `success`: go-live and segment bootstrap succeed
  - `partial`: go-live succeeds but segment bootstrap fails
  - `partial`: primary 555 path fails but legacy fallback still reaches live
  - `failed`: neither primary nor fallback path reaches live
- Lo-fi Radio:
  - `success`: go-live and radio control both succeed
  - `failed`: either step fails
- Screen Share:
  - `success`: screen-share prepare/request and destination attach both succeed
  - `partial`: screen-share prepare/request succeeds but destination attach fails
  - `failed`: screen-share prepare/request fails
- Reaction:
  - `success`: go-live, segment bootstrap, and segment override all succeed
  - `partial`: go-live succeeds but segment bootstrap fails
  - `partial`: go-live succeeds but segment override fails
  - `partial`: go-live succeeds but both follow-on steps fail
  - `failed`: go-live fails
- Play Games:
  - `success`: game launch succeeds and stream attach succeeds
  - `partial`: game launch succeeds but 555 attach fails
  - `partial`: game launch succeeds but legacy attach still needs follow-up
  - `failed`: game launch does not return a usable viewer URL
  - `blocked`: no stream plugin available for broadcast attach

## Team 01 Evidence Update (2026-03-11)
- Added or expanded focused suites:
  - `milaidy/apps/app/test/app/stream555-readiness.test.ts`
  - `milaidy/apps/app/test/app/go-live-modal.test.tsx`
  - `milaidy/apps/app/test/app/go-live-launch-contract.test.tsx`
- Focused run completed:
  - `node ../../node_modules/vitest/vitest.mjs run test/app/stream555-readiness.test.ts test/app/go-live-modal.test.tsx test/app/go-live-launch-contract.test.tsx`
  - result: 3 files passed, 15 tests passed
- Remaining Team 07 work:
  - fold these expectations into the broader release evidence bundle
  - add browser/Electron smoke proof for guided setup, partial launch follow-up, and blocked launch handling
