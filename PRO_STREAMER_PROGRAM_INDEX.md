# Pro Streamer Program Index

## Purpose
- This is the distribution index for the remaining Pro Streamer closure in `milaidy/apps/app`.
- The legacy `555stream` web control-plane is out of scope except where deploy/runtime compatibility must be preserved.
- Every team packet below is decision-complete enough to hand to an independent team.

## Source Of Truth
- Product/runtime source of truth: `milaidy/apps/app`
- Baseline plan: `PRO_STREAMER_REMAINING_WORK_PLAN.md`
- This packet set is the operational handoff layer on top of that baseline.

## Team Packets
- `PRO_STREAMER_TEAM_00_SYNTHESIS.md`
- `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
- `PRO_STREAMER_TEAM_02_FEEDBACK_ARCHITECTURE.md`
- `PRO_STREAMER_TEAM_03_STAGE_ACTION_LOG.md`
- `PRO_STREAMER_TEAM_04_AVATAR_RUNTIME.md`
- `PRO_STREAMER_TEAM_05_SHARED_SURFACES.md`
- `PRO_STREAMER_TEAM_06_BOOT_STARTUP.md`
- `PRO_STREAMER_TEAM_07_QA_RELEASE.md`

## Dispatch Protocol
1. Open this file first.
2. Open your own team packet in the repo root.
3. Open `PRO_STREAMER_TEAM_00_SYNTHESIS.md` and `PRO_STREAMER_TEAM_07_QA_RELEASE.md` even if you do not own those teams.
4. Read the `Overview Of Other Teams` section in your own packet before you touch code.
5. Treat every team packet as a living document:
   - update it when scope changes
   - update it when you discover blockers
   - update it when your acceptance criteria change
6. Work only inside `milaidy/apps/app` unless your team packet explicitly says otherwise.
7. Do not change legacy `555stream` UI for this program.
8. Do not redesign Milady OS.
9. If your work changes an interface another team consumes:
   - update your own team packet
   - add the changed contract to Team 00's packet
   - notify Team 07 so tests can move with the contract
10. Before you declare your work done:
   - update your packet with what changed
   - list remaining risks
   - list files touched
   - list tests added or still missing

## Program Order
1. Team 00 locks the operating model, decision ledger, and cross-team dependency board.
2. Team 01 locks the launch contract and destination readiness rules.
3. Team 02 consumes Team 01 contracts and re-routes all reachable streaming/operator feedback.
4. Teams 03, 04, 05, and 06 execute in parallel once Team 01 contract changes are stable.
5. Team 07 runs continuously, but final sign-off happens only after Teams 01-06 finish.

## Speed Matrix
| Team | Mission | Recommended Staffing | Best Case | Likely | Hard Gate |
| --- | --- | --- | --- | --- | --- |
| 00 | Synthesis / program control | 1 lead architect or program owner | Continuous | Continuous | Continuous |
| 01 | Broadcast launch | 2 senior app/runtime engineers | 2 days | 3-4 days | 5 days |
| 02 | Feedback architecture | 1 senior app engineer | 1.5 days | 2-3 days | 4 days |
| 03 | Stage and Action Log | 1 frontend engineer + 1 UI engineer | 1.5 days | 2-3 days | 4 days |
| 04 | Avatar runtime | 1 graphics/runtime engineer + 1 animation QA | 2 days | 3-4 days | 5 days |
| 05 | Shared surfaces | 2 frontend/design-system engineers | 2 days | 3-4 days | 5 days |
| 06 | Boot/startup | 1 frontend engineer | 0.5 day | 1-2 days | 3 days |
| 07 | QA/release | 1 QA automation engineer + 1 app engineer + 1 release owner | 3 days | 4-5 days | Ship blocker |

## Non-Negotiable Rules
- No team should redesign Milady OS visual language unless explicitly called out in its packet.
- No team should mutate historical conversation data in storage.
- No team should broaden scope to unrelated admin/settings CRUD outside the Pro Streamer reachable surfaces.
- No team should ship partial launch behavior as plain success.
- No team should regress the current no-disappear/no-T-pose avatar floor.

## Codex Work Segmentation
- A partial exploratory refactor was started in `milaidy/apps/app/src/AppContext.tsx` and then backed out.
- The Codex deliverable for this pass is documentation, synthesis, dependency management, and explicit team execution packets.
- The original packet set started from a pre-implementation baseline, but the current `milaidy/apps/app` workspace now contains active implementation across launch, feedback, stage, avatar, shared-surface, and startup streams.

## Current Program Direction (2026-03-11)
- Team 00 current call:
  - `NO-GO`
- Immediate program priorities:
  1. Keep the reconciled inline-`partial` launch contract frozen across Team 00 and Team 07.
  2. Treat Team 01, Team 02, Team 03, Team 04, Team 05, and Team 07 as completed scoped streams.
  3. Their closeout instruction is: do nothing further. Thank you.
  4. Reopen Team 06 for the Electron startup/bootstrap timeout proven by Team 07’s desktop smoke coverage.
  5. Treat the `milaidy/apps/app/electron` packaging dependency chain as an explicit external blocker until it can produce a real `electron/dist` DMG artifact.
  6. Team 00 is complete for this pass and should do nothing further until Team 06 and the packaging blocker are resolved.
