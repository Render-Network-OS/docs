# Team 01: Broadcast Launch

## Mission
- Finish the Go Live flow to production quality.
- Preserve the existing four-step modal as the canonical operator launch path.
- Lock the launch contract that all downstream teams will consume.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary surfaces:
  - `src/AppContext.tsx`
  - `src/components/GoLiveModal.tsx`
  - `src/components/PluginOperatorPanels.tsx`

## Staffing And Speed
- Staffing: 2 senior app/runtime engineers
- Best case: 2 days
- Likely: 3-4 days
- Hard gate: 5 days

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
   - `PRO_STREAMER_TEAM_00_SYNTHESIS.md`
   - `PRO_STREAMER_TEAM_02_FEEDBACK_ARCHITECTURE.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
4. Open these files first:
   - `src/AppContext.tsx`
   - `src/components/GoLiveModal.tsx`
   - `src/components/PluginOperatorPanels.tsx`
5. Start by fixing destination readiness semantics before touching launch copy or modal styling.
6. Then replace the current boolean-only launch result with the typed launch result described in this packet.
7. Keep the four-step modal structure intact:
   - setup-required
   - channel-selection
   - segment-selection
   - review-and-launch
8. Do not move launch blocking out of the modal.
9. Do not let partial launch cases return plain success.
10. When your contract is frozen, update this file with:
   - final result shape
   - final readiness rule
   - exact partial-launch cases supported
   - exact files changed
11. Notify Team 02 and Team 07 immediately after the contract is frozen.
12. Your handoff artifact is a code change plus an updated version of this packet documenting the final contract.

## Overview Of Other Teams
- Team 00 owns program synthesis, dependencies, and contract publication.
- Team 02 depends on this team to freeze launch result semantics before feedback rerouting is finalized.
- Team 03 depends on this team for Action Log follow-up expectations when partial launches happen.
- Team 04 is independent except where launch modes affect stage/avatar state after go-live.
- Team 05 depends on this team not to fork new bespoke controls in the modal.
- Team 06 is mostly independent and only cares that go-live changes do not leak startup styling.
- Team 07 depends on this team for the full test matrix around modes, readiness, partial results, and blocking states.

## Priority Checklist
- `P0` Lock destination readiness:
  - a channel is selectable only if enabled and all required destination credentials exist
  - custom RTMP must require both URL and stream key
  - plugin-managed defaults may only count as ready if explicitly represented as ready in code
- `P0` Lock the typed launch contract:
  - `state: success | partial | blocked | failed`
  - `tone: success | warning | error`
  - `message: string`
  - optional follow-up action metadata for downstream surfaces
- `P0` Keep the modal as the only setup/blocking surface:
  - `blocked` and `failed` stay inline in the modal
  - do not close the modal on a blocked or failed launch
  - do not fall back to transient toast for operator setup failures
- `P0` Handle all five launch modes as first-class paths:
  - Camera
  - Lo-fi Radio
  - Screen Share
  - Play Games
  - Reaction
- `P0` Explicitly classify partial-launch cases:
  - camera broadcast live but segment bootstrap failed
  - reaction broadcast live but segment bootstrap or override failed
  - game launched but stream attach failed
  - screen share prepared but stream attach failed
  - legacy fallback saved the launch after primary failure
- `P1` Keep launch subset behavior temporary:
  - selected channels for a launch must not rewrite persistent plugin config
  - saved config remains plugin state; per-launch subset remains modal state
- `P1` Preserve current live-state side effects:
  - layout mode
  - live source selection
  - game overlay behavior
  - operator action logging
- `P1` Write integration notes for Team 02 and Team 07:
  - launch result payload
  - modal close rules
  - Action Log follow-up expectations
- `P2` Remove dead-path ambiguity:
  - no boolean-only result semantics left in streaming launch code
  - no silent success when follow-on orchestration failed

## Explicit Instructions
- Start with `GoLiveModal.tsx` and `AppContext.tsx`; do not scatter launch logic into new surfaces.
- Change readiness before changing copy; incorrect selection state is the root correctness bug.
- Treat partial success as a warning state, not a success state with warning text.
- Keep the current four-step information architecture intact.
- Do not redesign the modal while fixing behavior.
- Coordinate with Team 02 before inventing any ad hoc notice mechanism.

## Interfaces Owned
- `GoLiveLaunchResult`
- launch close/stay-open rules
- channel readiness calculation
- per-mode partial/failure taxonomy

## Exit Criteria
- No unready destination can be selected in the modal.
- A partial launch never returns plain success semantics.
- The modal remains open for every blocked or failed case.
- All five launch modes have explicit success, partial, and failure expectations documented for Team 07.

## Status Update (2026-03-11)
- Contract frozen in `milaidy/apps/app`.
- Destination readiness is now centralized and shared across the modal, operator panels, and plugin summary surfaces.
- The modal now closes on `success` and `partial`, and stays open with inline remediation on `blocked` and `failed`.
- Focused contract and modal coverage is green.

## Final Contract
- `GoLiveLaunchResult`:
  - `state: "success" | "partial" | "blocked" | "failed"`
  - `tone: "success" | "warning" | "error"`
  - `message: string`
  - `followUp?: { target: "action-log"; label: string; detail: string }`
- `launchGoLive(config)` call shape remains unchanged:
  - `channels`
  - `launchMode`
  - `layoutMode`
- Modal close rules:
  - `success`: close modal
  - `partial`: close modal
  - `blocked`: keep modal open and render inline notice
  - `failed`: keep modal open and render inline notice

## Final Readiness Rule
- Destination readiness is `enabled && streamKeySet && urlReady`.
- `urlReady` is true when the RTMP URL has either:
  - a non-empty configured value, or
  - a non-empty default published by the plugin/server contract
- First-party destinations therefore count built-in/default RTMP URLs as ready.
- Custom RTMP still requires both:
  - URL
  - stream key
- Final readiness states:
  - `ready`
  - `disabled`
  - `missing-stream-key`
  - `missing-url`

## Final Partial Launch Cases
- Camera:
  - `STREAM555_GO_LIVE` succeeds but `STREAM555_GO_LIVE_SEGMENTS` fails
  - primary 555 path fails but legacy stream fallback still reaches live state
- Reaction:
  - go-live succeeds but segment bootstrap fails
  - go-live succeeds but segment override fails
  - go-live succeeds but both follow-on orchestration steps fail
- Screen Share:
  - screen-share prepare/request succeeds but destination attach fails
- Play Games:
  - game launch succeeds but 555 attach fails
  - game launch succeeds but legacy attach still needs follow-up
- Lo-fi Radio:
  - no partial path in this pass; result is full success or failed

## Final Blocking Rules
- `launchGoLive` re-validates every selected channel immediately before execution.
- If any selected destination is no longer `ready`, launch returns `blocked` and execution does not continue.
- Selected channels remain modal-only state and are not written back into plugin config.

## Files Changed
- `milaidy/apps/app/src/AppContext.tsx`
- `milaidy/apps/app/src/components/GoLiveModal.tsx`
- `milaidy/apps/app/src/components/PluginOperatorPanels.tsx`
- `milaidy/apps/app/src/stream555Readiness.ts`
- `milaidy/apps/app/test/app/stream555-readiness.test.ts`
- `milaidy/apps/app/test/app/go-live-modal.test.tsx`
- `milaidy/apps/app/test/app/go-live-launch-contract.test.tsx`

## Evidence Update
- Focused automated run:
  - `node ../../node_modules/vitest/vitest.mjs run test/app/stream555-readiness.test.ts test/app/go-live-modal.test.tsx test/app/go-live-launch-contract.test.tsx`
  - result: 3 files passed, 15 tests passed
- Team 00 and Team 07 packet updates are required consumers of this frozen contract and were updated in the same pass.
