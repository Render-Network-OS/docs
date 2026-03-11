# Team 00: Synthesis And Program Control

## Mission
- Own the cross-team execution model for the remaining Pro Streamer work.
- Convert findings, contracts, dependencies, and release criteria into one stable operating picture.
- Do not implement feature code in this pass unless a separate implementation task explicitly reopens that scope.

## Source Of Truth
- Primary runtime: `milaidy/apps/app`
- Planning baseline: `PRO_STREAMER_REMAINING_WORK_PLAN.md`
- Program index: `PRO_STREAMER_PROGRAM_INDEX.md`

## Final Program Closeout (Authoritative, 2026-03-11)
- Current Team 00 state:
  - `COMPLETED FOR THIS PASS`
- Final program-control decision:
  - `NO-GO`
- Why the program is `NO-GO`:
  - Team 07 produced a clean current-head release gate for the scoped app.
  - The current-head Vitest lane is green.
  - The Electron smoke lane is green.
  - The packaged lane is not green:
    - `cd milaidy/apps/app/electron && bun run electron:make:dmg:test` failed because `whisper-node/lib/whisper.cpp` is missing
    - `cd milaidy/apps/app/electron && npm install` failed with `EOVERRIDE` on `pg`
    - `bunx playwright test --config playwright.electron.packaged.config.ts` failed because `milaidy/apps/app/electron/dist` does not exist

### Program-Level Acceptance Call
- Team 01:
  - `COMPLETED`
  - do nothing further. Thank you.
- Team 02:
  - `COMPLETED`
  - do nothing further. Thank you.
- Team 03:
  - `COMPLETED`
  - do nothing further. Thank you.
- Team 04:
  - `COMPLETED`
  - do nothing further. Thank you.
- Team 05:
  - `COMPLETED`
  - do nothing further. Thank you.
- Team 06:
  - `COMPLETED`
  - do nothing further. Thank you.
- Team 07:
  - `COMPLETED FOR THIS PASS`
  - do nothing further. Thank you.

### Reopened And External Owners
- External packaging blocker:
  - `milaidy/apps/app/electron` dependency chain
  - no human owner-of-record is available from local repo artifacts

### Team 00 Final Direction
- Team 00 next step:
  1. Do nothing further in this pass. Thank you.
  2. Keep the program closed at `NO-GO` until the packaging dependency chain produces a real `electron/dist` artifact.
  3. Once that fix lands, Team 07 reruns the unchanged packaged gate and Team 00 records the new final decision.

## Staffing And Speed
- Staffing: 1 lead architect or program owner
- Best case: continuous same-day support
- Likely: continuous throughout the program
- Hard gate: this team remains active until Team 07 signs release evidence

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these files before doing anything else:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_00_SYNTHESIS.md`
   - `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Create or update one central execution board in your normal planning surface using the exact team names from these packets.
4. Record these hard dependencies in that board:
   - Team 01 must freeze launch contracts before Team 02 can finish routing.
   - Teams 03, 04, 05, and 06 can run in parallel after Team 01 freezes contracts.
   - Team 07 runs continuously and blocks release if evidence is missing.
5. Treat all team packets as living documents and require every team lead to update their own packet when scope, blockers, or acceptance changes.
6. Do not write feature code under this team unless the program owner explicitly reassigns implementation work here.
7. Require every team to report:
   - files touched
   - interfaces changed
   - tests added
   - residual risks
8. When Team 01 changes a contract, update this file with the final contract wording and notify Team 07 immediately.
9. Before release, verify that every team packet has an up-to-date status section or completion note.
10. Your deliverable is not code. Your deliverable is a synchronized execution model that makes the other seven packets actionable and audit-ready.

## Overview Of Other Teams
- Team 01 owns the Go Live contract, destination readiness, and partial-launch behavior.
- Team 02 owns toast vs modal vs inline Action Log feedback routing and persistent remediation surfaces.
- Team 03 owns stage lane rendering rules, Action Log layout integrity, and historical operator-action collapse behavior.
- Team 04 owns Alice idle clip validation, verified idle rotation, fallback guarantees, and runtime diagnostics.
- Team 05 owns shared primitive convergence across Go Live, Stream555 settings, 555 Arcade settings, and config-renderer paths.
- Team 06 owns boot/loading validation, randomized ASCII dither retention, and theme-safe startup behavior.
- Team 07 owns automated coverage growth, smoke testing, release evidence, deploy verification, and rollback gating.

## Priority Checklist
- `P0` Publish the canonical dependency graph:
  - Team 01 output is required before Team 02 can finalize feedback routing.
  - Team 07 starts immediately, but final release gating depends on all teams.
  - Teams 03, 04, 05, and 06 can run in parallel once Team 01 interface decisions are frozen.
- `P0` Freeze the operating scope:
  - `milaidy/apps/app` only
  - no legacy `555stream` redesign
  - no Milady OS redesign
  - no stored history mutation
- `P0` Maintain the contract ledger:
  - launch result semantics
  - destination readiness semantics
  - feedback target semantics
  - stage rendering semantics
  - idle source classification semantics
- `P1` Maintain the blocker board:
  - contract blockers
  - integration blockers
  - test blockers
  - release blockers
- `P1` Maintain the acceptance board:
  - one line per team acceptance item
  - one owner per unresolved item
  - one date per expected closure
- `P1` Review handoff quality:
  - every team has explicit file scope
  - every team knows what not to touch
  - every team knows upstream/downstream dependencies
- `P2` Collect evidence:
  - implementation notes
  - screenshots
  - test results
  - release artifact locations

## Explicit Instructions
- Start by opening all eight team packets and turning them into a single execution board.
- Treat Team 01 contract decisions as the first hard dependency.
- Reject vague status updates; require file-level ownership, acceptance evidence, and next unblock.
- Do not let any team silently expand scope into unrelated surfaces.
- Do not allow Team 07 to call the release ready without a single audit-ready evidence bundle.

## Codex Segment
- A partial exploratory change was started in `milaidy/apps/app/src/AppContext.tsx` and intentionally backed out.
- Codex ownership for this phase is synthesis only:
  - decision packaging
  - dependency sequencing
  - team packet authoring
  - release criteria normalization
- No runtime code from the exploratory start should be treated as accepted implementation.

## Exit Criteria
- Every team has acknowledged scope, dependencies, and acceptance criteria.
- Team 01 contract output is frozen and published.
- Team 07 has a release-evidence template and gate checklist before implementation finishes.
- There is a single program board that can answer:
  - what is left
  - who owns it
  - what blocks it
  - what proves it is done

## Contract Ledger Update (2026-03-11)
- Team 01 contract snapshot:
  - runtime files changed:
    - `milaidy/apps/app/src/AppContext.tsx`
    - `milaidy/apps/app/src/components/GoLiveModal.tsx`
    - `milaidy/apps/app/src/components/PluginOperatorPanels.tsx`
    - `milaidy/apps/app/src/stream555Readiness.ts`
  - tests added or expanded:
    - `milaidy/apps/app/test/app/stream555-readiness.test.ts`
    - `milaidy/apps/app/test/app/go-live-modal.test.tsx`
    - `milaidy/apps/app/test/app/go-live-launch-contract.test.tsx`
  - frozen launch result contract:
    - `state: success | partial | blocked | failed`
    - `tone: success | warning | error`
    - `message: string`
    - optional `followUp { target: "action-log"; label; detail }`
  - frozen readiness rule:
    - destination is ready only when `enabled && streamKeySet && urlReady`
    - `urlReady` accepts plugin/server default RTMP URLs for first-party destinations
    - custom RTMP still requires both URL and stream key
    - readiness states are `ready`, `disabled`, `missing-stream-key`, and `missing-url`
  - frozen modal rules:
    - `success` closes the modal
    - `partial` stays inline in the modal and preserves Action Log follow-up
    - `blocked` stays inline in the modal
    - `failed` stays inline in the modal
  - frozen partial taxonomy:
    - camera live plus segment bootstrap failure
    - camera live via legacy fallback after primary 555 failure
    - reaction live plus segment bootstrap and/or override follow-up failure
    - screen share prepared but destination attach failed
    - play-games launch succeeded but 555 or legacy attach failed
    - lo-fi radio remains binary success/failure for this pass
  - focused evidence published:
    - `node ../../node_modules/vitest/vitest.mjs run test/app/stream555-readiness.test.ts test/app/go-live-modal.test.tsx test/app/go-live-launch-contract.test.tsx`
    - result: 15/15 tests passed
- Team 03 contract snapshot:
  - no API or persistence changes
  - Action Log shell selectors are `data-action-log-shell`, `data-action-log-header`, `data-action-log-pinned-region`, `data-action-log-inline-notice-slot`, and `data-action-log-feed-region`
  - inline notice selectors are `data-action-log-inline-notice` and `data-action-log-inline-cta`, plus dismiss control `aria-label="Dismiss action log notice"`
  - stage entry selectors are `data-stage-entry-role` and `data-stage-entry-kind`
  - valid stage entry kinds are `bubble`, `action-pill`, `action-chip`, and `system-event`
  - historical `source="operator_action"` cleanup is render-only and preserves stored message history
  - desktop uses explicit `80vh`; tablet/mobile use explicit `80dvh`
  - the Team 02 integration surface is no longer slot-only; Team 03 now renders a live inline Action Log notice inside the pinned region above live controls
- Team 04 contract snapshot:
  - runtime files changed:
    - `milaidy/apps/app/src/components/avatar/VrmEngine.ts`
    - `milaidy/apps/app/src/components/avatar/resolveGltfAnimationClipForVrm.ts`
  - tests added or expanded:
    - `milaidy/apps/app/test/avatar/resolve-gltf-animation-clip-for-vrm.test.ts`
    - `milaidy/apps/app/test/avatar/vrm-engine-idle.test.ts`
    - `milaidy/apps/app/test/avatar/vrm-viewer-resize.test.tsx`
  - frozen runtime diagnostics:
    - `activeIdleSource: alice-native | mixamo-retargeted | legacy-fallback | procedural-fallback | null`
    - `idleFallbackActive: boolean`
    - `idleHealthy: boolean`
    - `activeAnimationState: idle | emote | static-fallback`
  - frozen stage idle rules:
    - the default stage candidate list is runtime-owned in `VrmEngine.ts` and includes `catching-breath`, `idle-03`, `idle-04`, `idle-07`, `idle-09`, and `idle-15`
    - additive `idleGlbPaths` do not define the stage idle path by themselves
    - `animations/alice/idle/catching-breath.glb` is both a normal stage candidate and the pinned first fallback URL; use `idleFallbackActive`, not clip path alone, to distinguish fallback takeover
    - fallback order is `animations/alice/idle/catching-breath.glb` then `animations/idle.glb` then procedural fallback
    - only verified clips rotate in the live pool, and failed candidates are evicted until the VRM or idle inventory changes
  - QA evidence handoff:
    - the validated admitted/rejected idle inventory record lives in `verifiedIdleGlbUrls`, `failedIdleGlbUrls`, and `rejectedIdleReasons`
    - that record is not part of `VrmEngineState`
    - Team 07 must capture it in focused avatar runtime evidence and carry it in the release bundle
  - focused evidence published:
    - `npx vitest run --config vitest.config.ts test/avatar/resolve-gltf-animation-clip-for-vrm.test.ts test/avatar/vrm-engine-idle.test.ts test/avatar/vrm-viewer-resize.test.tsx`
    - result: targeted Team 04 avatar runtime suites passed

## Review Remarks (2026-03-11)
- Team 00 now agrees with the live Team 01 contract on modal behavior.
- Any downstream packet that still implies `partial` closes the modal is stale.
- Team 07 has now republished current-head release evidence for the scoped app:
  - focused slice green
  - full Vitest green
  - Electron smoke red
  - packaged build and packaged smoke red
- Teams 01, 02, 03, 04, 05, and 07 are complete for this pass and should do nothing further. Thank you.
- Team 06 is no longer complete because Team 07 proved a startup-specific Electron defect.
