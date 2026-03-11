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
  - `activeIdleSource` and `idleFallbackActive` diagnostics
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
- Action Log inline notice selectors:
  - `data-action-log-inline-notice`
  - `data-action-log-inline-cta`
  - dismiss control with `aria-label="Dismiss action log notice"`
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
  - inline notice renders inside the pinned region above live controls
  - visible inline-notice scenarios assert `data-action-log-inline-notice`, not only `data-action-log-inline-notice-slot`
  - inline notice CTA re-opens or keeps focus on the Action Log rail
  - inline notice dismiss control clears the visible rail notice

## Team 04 Test Targets (2026-03-11)
- Public runtime diagnostics to assert through `VrmEngine.getState()` or the viewer state wrapper:
  - `activeIdleSource: alice-native | mixamo-retargeted | legacy-fallback | procedural-fallback | null`
  - `idleFallbackActive: boolean`
  - `idleHealthy: boolean`
  - `activeAnimationState: idle | emote | static-fallback`
- Required Team 04 assertions:
  - healthy `pro-streamer-stage` idle reaches `activeAnimationState="idle"` with `idleHealthy=true`
  - healthy clip rotation keeps `idleFallbackActive=false`
  - `legacy-fallback` sets `idleFallbackActive=true`
  - `procedural-fallback` sets `idleFallbackActive=true`
  - `stopEmote()` returns the avatar to a healthy idle state
  - `animations/alice/idle/catching-breath.glb` can appear during healthy rotation or fallback takeover, so QA must use `idleFallbackActive` rather than clip path to distinguish those states
- Release evidence requirements for Team 04:
  - record the runtime-admitted `verifiedIdleGlbUrls`
  - record the runtime-rejected `failedIdleGlbUrls`
  - record `rejectedIdleReasons`
  - capture that inventory from focused avatar runtime coverage or direct `VrmEngine` inspection during stage smoke, because it is not exposed via `VrmEngineState`

## Team 01 Launch Matrix (2026-03-11)
- Shared readiness assertions:
  - destination selectable only when `enabled && streamKeySet && urlReady`
  - first-party default RTMP URLs count as `urlReady`
  - custom RTMP without URL is `missing-url`
  - enabled destination without stream key is `missing-stream-key`
  - submit-time revalidation returns `blocked` if a selected destination is no longer ready
- Modal behavior assertions:
  - `success` closes modal
  - `partial` keeps modal open with inline follow-up guidance and Action Log follow-up persistence
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
- Initial focused run completed:
  - `node ../../node_modules/vitest/vitest.mjs run test/app/stream555-readiness.test.ts test/app/go-live-modal.test.tsx test/app/go-live-launch-contract.test.tsx`
  - result: 3 files passed, 15 tests passed
- This slice is historical only:
  - the broader Team 07 release-gate slice below requires QA-owned revalidation before it should supersede it for current evidence
- Remaining Team 07 work:
  - fold these expectations into the broader release evidence bundle
  - add browser/Electron smoke proof for guided setup, partial launch follow-up, and blocked launch handling

## Review Remarks (2026-03-11)
- Canonical Team 01 modal behavior for the current app implementation:
  - `success` closes the modal
  - `partial` keeps the modal open with inline follow-up guidance and Action Log follow-up persistence
  - `blocked` keeps the modal open with inline notice
  - `failed` keeps the modal open with inline notice
- The sections below titled `Team 07 Implementation Update` and `Release Evidence Bundle (Historical Local Snapshot, 2026-03-11)` were not validated in this review pass and should not be treated as authoritative release-gate evidence until Team 07 reruns and republishes them.

## Team 07 Implementation Update (2026-03-11)
- Launch gate implementation:
  - `milaidy/apps/app/src/components/GoLiveModal.tsx`
    - `partial`, `blocked`, and `failed` launch results now stay inline instead of closing the modal.
    - follow-up label/detail remain visible for partial launches.
  - `milaidy/apps/app/test/app/go-live-modal.test.tsx`
    - added coverage for temporary per-launch channel subsets not mutating saved plugin config
    - added partial-launch inline warning assertions
    - kept blocked and failed modal-open assertions
  - `milaidy/apps/app/test/app/go-live-launch-contract.test.tsx`
    - added explicit `failed` camera-launch contract coverage
- Stage and Action Log implementation:
  - `milaidy/apps/app/src/components/MiladyOsDashboard.tsx`
    - added `data-action-log-inline-notice-slot` and a live inline notice surface in the pinned region
  - `milaidy/apps/app/test/app/milady-os-dashboard-smoke.test.tsx`
    - locked sticky header, pinned region ordering, shell clipping, inline notice slot, notice dismiss/CTA, and independent feed scroll assertions
  - `milaidy/apps/app/test/app/agent-core-layout.test.tsx`
    - added explicit right-aligned operator entry assertions
    - added centered system-event assertion
- Avatar and startup coverage reused for this gate:
  - `milaidy/apps/app/test/app/loading-screen.test.tsx`
  - `milaidy/apps/app/test/app/startup-failure-view.test.tsx`
  - `milaidy/apps/app/test/avatar/vrm-viewer-resize.test.tsx`
  - `milaidy/apps/app/test/avatar/vrm-engine-idle.test.ts`

## Current Release Evidence Bundle (Local, 2026-03-11)
- Commit/build identifier:
  - `036e5f6bfbc9b04980c789ee6404a6a1b628399e`
- Focused Team 07 verification:
  - command:
    - `bunx vitest run test/app/go-live-modal.test.tsx test/app/go-live-launch-contract.test.tsx test/app/milady-os-dashboard-smoke.test.tsx test/app/agent-core-layout.test.tsx test/app/loading-screen.test.tsx test/app/startup-failure-view.test.tsx test/avatar/vrm-viewer-resize.test.tsx test/avatar/vrm-engine-idle.test.ts`
  - result:
    - `PASS`
    - `8` files
    - `45` tests
  - notes:
    - launch contract matches the current inline-`partial` runtime
    - `go-live-launch-contract` still emits AppContext stderr noise for mocked emote/greeting startup paths, but the suite passes
- Full automated suite gate:
  - command:
    - `bunx vitest run --config vitest.config.ts`
  - result:
    - `FAIL`
    - `86` files passed, `29` files failed
    - `644` tests passed, `81` tests failed, `3` skipped
  - representative blocking areas on current `HEAD`:
    - multiple dialog/modal suites still fail with `Target container is not a DOM element`
    - `ChatView`, `AppsView`, and AppContext-heavy lock suites still fail on stale mocks or missing client methods such as `onWsEvent`, `snapshot`, `listEmotes`, and `listFive55MasteryRuns`
    - avatar selector tests still expect legacy `/vrms/1.vrm` assets instead of current Alice defaults
    - `proStreamerStageScene` backdrop metrics assertion is still red
    - canvas plugin tests still fail because a 2D context is unavailable in the environment
    - Playwright-style electron spec files are still being collected under `vitest`
    - `triggers-view.e2e` still fails to resolve `@opentelemetry/sdk-node`
- Electron smoke gate:
  - command:
    - `bunx playwright test --config playwright.electron.config.ts`
  - result:
    - `FAIL`
    - blocked before execution by `SyntaxError: Named export 'AgentManager' not found` from `../../electron/src/native/agent`
  - blocking owner:
    - not named in the workspace
    - required owner assignment is the Electron runtime/bootstrap owner responsible for the CommonJS/ESM boundary at `../../electron/src/native/agent`
- Packaged smoke gate:
  - command:
    - `bunx playwright test --config playwright.electron.packaged.config.ts`
  - result:
    - `FAIL`
    - missing packaged input directory: `milaidy/apps/app/electron/dist`
  - explicit prerequisite:
    - Team 07 cannot claim packaged smoke coverage until a DMG/build artifact exists under `milaidy/apps/app/electron/dist`
  - artifact:
    - `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app/test-results/electron-dmg-startup.e2e-p-c3731-ches-chat-agent-ready-state/trace.zip`
- Screenshots or clips:
  - none captured in this local pass
  - current blockers prevent meaningful startup, stage, Action Log, Go Live, avatar-motion, and chat-drawer capture
- Live smoke notes:
  - not run locally because Electron smoke still fails before a usable runtime session is available

## Remaining Gaps And Blockers (2026-03-11)
- Full `vitest` release gate is red outside the focused Team 07 slice.
- Electron smoke is red on module-loading before any startup, stage, chat-drawer, or Action Log flows can be recorded.
- Packaged Electron smoke is red because no DMG/build artifacts exist under `milaidy/apps/app/electron/dist`.
- The Electron module-load blocker does not currently have a named owner in the workspace and must be assigned to the Electron runtime/bootstrap surface.
- Deploy verification has not been run:
  - merge to `milaidy/alice`
  - sync `555-bot/alice`
  - deploy
  - live health verification
  - rollback rehearsal/evidence
- Required release artifacts are still missing:
  - screenshots or clips for startup, stage/avatar visibility, Action Log interactions, guided Go Live, partial-launch warning flow, avatar motion actions, and chat drawer interactions

## Final Go/No-Go (2026-03-11)
- Decision:
  - `NO-GO`
- Why:
  - Team 07-focused coverage is green, but the repo-wide automated gate is red, Electron smoke is red, packaged smoke is red, and deploy/live evidence is absent.
- Rollback decision record:
  - if a release is attempted before these blockers are cleared or any required artifact remains missing after deploy, rollback immediately

## Team 00 Acceptance And Next Steps (2026-03-11)
- Current acceptance state:
  - `NOT ACCEPTED FOR RELEASE AUTHORITY`
- Accepted work:
  - focused verification slice is credible and current to `HEAD`
  - the packet now records real blocking areas instead of vague status
  - `NO-GO` is the correct current program call
- Open issues Team 00 is holding on:
  - repo-wide `vitest`, Electron smoke, packaged smoke, screenshots/clips, and deploy verification are all still open
- Next steps:
  1. Keep Team 00 and Team 07 on the reconciled contract:
     - `partial` stays inline in the modal and also persists follow-up in the Action Log
  2. Do not reopen Teams 01 through 06 unless a new reproducible defect is discovered.
  3. Resolve the Electron module-load blocker or document the exact owner and blocking change needed outside this program scope.
  4. Produce packaged build artifacts under `milaidy/apps/app/electron/dist` before attempting packaged smoke again.
  5. Capture the missing screenshots or clips for startup, stage/avatar visibility, Action Log interactions, guided Go Live, partial-launch handling, avatar motion actions, and chat drawer interactions after smoke is unblocked.
  6. Do not move this packet to `GO` until deploy verification and rollback evidence are both present.
