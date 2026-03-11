# Team 04: Avatar Runtime

## Mission
- Restore high-quality Alice idle behavior on the Pro Streamer stage without reintroducing disappearance, T-pose, or dead-rig regressions.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary surfaces:
  - `src/components/avatar/VrmEngine.ts`
  - `src/components/avatar/resolveGltfAnimationClipForVrm.ts`
  - stage composition and VRM viewer tests under `test/avatar`

## Staffing And Speed
- Staffing: 1 graphics/runtime engineer + 1 animation QA partner
- Best case: 2 days
- Likely: 3-4 days
- Hard gate: 5 days

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_04_AVATAR_RUNTIME.md`
   - `PRO_STREAMER_TEAM_03_STAGE_ACTION_LOG.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
4. Open these files first:
   - `src/components/avatar/VrmEngine.ts`
   - `src/components/avatar/resolveGltfAnimationClipForVrm.ts`
   - `test/avatar`
5. Start by inspecting the `pro-streamer-stage` idle path in `VrmEngine.ts`.
6. Restore clip-based idle handling on that path without removing the guaranteed fallback idle.
7. Build a verified idle pool and reject uncertain clips rather than letting them run in production.
8. Expose diagnostics Team 07 can assert directly.
9. Do not let UI concerns leak into this workstream.
10. Update this packet with:
   - verified clip inventory
   - rejected clip inventory
   - runtime diagnostic names
   - fallback takeover rules
11. Your deliverable is code plus a validated idle-classification record in this packet.

## Overview Of Other Teams
- Team 00 owns sequencing and risk management.
- Team 01 is independent except where launch modes change scene preset/mark behavior.
- Team 02 is only relevant if runtime failures become operator-visible notices.
- Team 03 depends on avatar visibility staying stable while stage lane work is validated.
- Team 05 is independent and should not alter runtime animation logic.
- Team 06 is independent except that startup must still transition cleanly into a healthy stage.
- Team 07 depends on this team for idle classification, fallback, and no-regression test targets.

## Priority Checklist
- `P0` Preserve the current safety floor:
  - Alice must remain visible
  - no T-pose regression
  - no static invisible state
- `P0` Re-enable clip-based idle rotation for the `pro-streamer-stage` path:
  - stop bypassing clip idles entirely for that scene preset
  - keep procedural idle only as a safe supplement or fallback, not the only stage behavior
- `P0` Classify every candidate idle clip:
  - `alice-native`
  - `mixamo-retargeted`
  - `rejected`
- `P0` Build the live idle pool from verified clips only
- `P0` Keep the guaranteed fallback idle as hard floor
- `P1` Expose runtime diagnostics sufficient for QA:
  - active idle source
  - fallback active
  - idle healthy
  - current animation state
- `P1` Define failure behavior:
  - invalid clip falls out of pool deterministically
  - fallback takes over immediately
  - pool does not thrash on repeated failed candidates
- `P1` Validate scene interactions:
  - pro-streamer stage
  - portrait hold
  - emote transition back to idle
- `P2` Document accepted/rejected clip inventory for future animation additions

## Explicit Instructions
- Start in `VrmEngine.ts`; do not solve this only at the test level.
- Treat `pro-streamer-stage` as the key failing path, because that is where clip idles are currently bypassed.
- Do not remove the guaranteed fallback idle under any circumstances.
- Make diagnostics cheap to inspect and easy for Team 07 to assert.
- If a clip classification is uncertain, reject it rather than letting it into the live pool.

## Interfaces Owned
- idle source classification semantics
- verified idle pool behavior
- fallback takeover rules
- runtime diagnostics for idle health

## Exit Criteria
- Alice rotates through verified idles on the live stage when healthy.
- Fallback takes over deterministically on bad clip load/playback.
- Team 07 can assert visibility, healthy idle, active idle source, and fallback activation from runtime diagnostics without manual scene inspection.
- The validated idle-classification record includes the admitted/rejected inventory plus rejection reasons in focused runtime evidence.

## Runtime Contract Update
- Shipped stage idle candidate inventory now comes from runtime-owned defaults in `VrmEngine.ts`:
  - `animations/alice/idle/catching-breath.glb`
  - `animations/alice/idle/idle-03.glb`
  - `animations/alice/idle/idle-04.glb`
  - `animations/alice/idle/idle-07.glb`
  - `animations/alice/idle/idle-09.glb`
  - `animations/alice/idle/idle-15.glb`
- `animations/alice/idle/catching-breath.glb` has a dual role in the runtime:
  - it is part of the normal stage candidate inventory
  - it is also the pinned first fallback URL when the verified pool cannot take over
- Because the same asset serves both roles, clip path alone does not distinguish healthy rotation from fallback takeover; `idleFallbackActive` is the supported diagnostic for that distinction.
- Optional `idleGlbPaths` remain additive only. They no longer define the stage idle path by themselves.
- Verified clip inventory is the runtime-admitted subset of the candidate list above plus any additive `idleGlbPaths`, tracked by `verifiedIdleGlbUrls`.
- Rejected clip inventory is the runtime-rejected subset of the same configured list, tracked by `failedIdleGlbUrls` with reasons recorded in `rejectedIdleReasons`.

## Runtime Diagnostics
- `activeIdleSource`
  - `alice-native`
  - `mixamo-retargeted`
  - `legacy-fallback`
  - `procedural-fallback`
- `idleFallbackActive`
- `idleHealthy`
- `activeAnimationState`

## QA Handoff
- Public Team 07 assertions come from `VrmEngineState` only:
  - `activeIdleSource`
  - `idleFallbackActive`
  - `idleHealthy`
  - `activeAnimationState`
- The verified/rejected inventory record is not part of `VrmEngineState`.
- Team 07 must capture `verifiedIdleGlbUrls`, `failedIdleGlbUrls`, and `rejectedIdleReasons` from focused `VrmEngine` coverage or direct engine inspection during stage smoke, then attach that record to the release evidence bundle.

## Fallback Takeover Rules
1. Classify the configured idle candidates first and admit only verified clips into the live pool.
2. Rotate only across the verified pool during normal healthy stage idle playback.
3. `animations/alice/idle/catching-breath.glb` is also pinned as the first fallback URL; if it appears with `idleFallbackActive=false`, treat it as healthy rotation rather than fallback takeover.
4. If no verified clip can take over, retry `animations/alice/idle/catching-breath.glb` first.
5. If that fails, try `animations/idle.glb`.
6. If all clip-based paths fail, activate procedural fallback immediately.
7. Any failed candidate is removed from future selection until the VRM or idle inventory changes.

## Implementation Notes
- Files touched:
  - `milaidy/apps/app/src/components/avatar/VrmEngine.ts`
  - `milaidy/apps/app/src/components/avatar/resolveGltfAnimationClipForVrm.ts`
  - `milaidy/apps/app/test/avatar/resolve-gltf-animation-clip-for-vrm.test.ts`
  - `milaidy/apps/app/test/avatar/vrm-engine-idle.test.ts`
  - `milaidy/apps/app/test/avatar/vrm-viewer-resize.test.tsx`
- Tests added or updated:
  - strict idle classification coverage for Alice-native, Mixamo-retargeted, and rejected clips
  - stage idle runtime coverage for verified rotation, failed-candidate eviction, deterministic fallback, procedural fallback, and emote return-to-idle
  - viewer mock state updated for the new QA diagnostics
- Residual risk:
  - the exact admitted/rejected split across shipped GLB assets is finalized by runtime loading against Alice; Team 07 must capture the resulting verified/rejected inventory and rejection reasons as release evidence, because that record is runtime-owned rather than part of `VrmEngineState`.

## Team 00 Acceptance And Next Steps (2026-03-11)
- Current acceptance state:
  - `COMPLETED`
- Accepted work:
  - idle candidate ownership is now runtime-driven
  - diagnostics are explicit and test-backed
  - fallback takeover rules are specific enough for QA
- Next steps:
  1. Do nothing further. Thank you.
  2. Treat the runtime contract as frozen unless a stage regression is discovered.
  3. Do not edit this packet or the runtime files unless Team 07 shows a stage-smoke failure that contradicts the exposed diagnostics.
  4. Do not broaden scope into avatar styling, stage composition, or unrelated VRM loading work.
