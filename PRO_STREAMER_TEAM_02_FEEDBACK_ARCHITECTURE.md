# Team 02: Feedback Architecture

## Mission
- Complete the toast/modal/inline notice hierarchy cleanup for reachable Pro Streamer flows.
- Ensure every actionable failure gets a persistent remediation surface.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary surfaces:
  - `src/AppContext.tsx`
  - `src/components/ui/Toast.tsx`
  - `src/components/MiladyOsDashboard.tsx`
  - `src/components/GoLiveModal.tsx`

## Staffing And Speed
- Staffing: 1 senior app engineer
- Best case: 1.5 days
- Likely: 2-3 days
- Hard gate: 4 days

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_02_FEEDBACK_ARCHITECTURE.md`
   - `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
   - `PRO_STREAMER_TEAM_03_STAGE_ACTION_LOG.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Wait until Team 01 freezes the launch result contract before you finalize any routing helper that consumes launch results.
4. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
5. Open these files first:
   - `src/AppContext.tsx`
   - `src/components/ui/Toast.tsx`
   - `src/components/MiladyOsDashboard.tsx`
   - `src/components/GoLiveModal.tsx`
6. Audit every reachable Pro Streamer `setActionNotice(...)` path in `AppContext.tsx` before writing new helpers.
7. Reclassify each path into exactly one target:
   - toast
   - go-live-inline
   - action-log-inline
   - modal
8. Do not use longer toast TTL as a substitute for persistent UI.
9. After your routing contract is stable, update this file with:
   - the route helper name
   - the target taxonomy
   - the list of reclassified actions
10. Hand the final routing map to Team 03 and Team 07.
11. Your deliverable is code plus an updated routing table in this packet.

## Overview Of Other Teams
- Team 00 owns the dependency board and decides when contract changes are frozen.
- Team 01 must publish final launch result semantics before this team locks routing behavior.
- Team 03 consumes this team’s Action Log inline notice behavior inside the rail shell.
- Team 04 is mostly independent, but avatar runtime failures that surface to operators must fit this hierarchy if they are reachable from Pro Streamer controls.
- Team 05 must not reintroduce bespoke notices while converging shared surfaces.
- Team 06 is mostly independent; startup failures should keep their own path unless they are routed through Pro Streamer surfaces.
- Team 07 depends on this team for test cases around routing correctness and persistence.

## Priority Checklist
- `P0` Define one internal routing contract:
  - `toast`
  - `go-live-inline`
  - `action-log-inline`
  - `modal`
- `P0` Reclassify reachable streaming/operator `setActionNotice(...)` cases:
  - setup blockers to Go Live modal inline state
  - launch blockers to Go Live modal inline state
  - Action Log quick-control failures to inline Action Log notice with auto-open behavior
  - passive confirmations to toast only
  - persistent follow-up after live-state changes to Action Log entry or inline Action Log notice
- `P0` Enforce persistence rules:
  - no blocking operator error may exist only as a toast
  - warnings that require review must survive longer than toast TTL
- `P1` Keep toast noise low:
  - cap visible toasts
  - reserve them for passive confirmations and benign status
  - keep classmorphic Milady OS presentation intact
- `P1` Limit scope correctly:
  - include only flows reachable from Pro Streamer dashboard/operator surfaces
  - exclude unrelated admin/settings CRUD unless directly reachable through those surfaces
- `P1` Publish a routing map for Team 07:
  - action
  - old target
  - new target
  - persistence rule
- `P2` Remove duplicated notice logic where one canonical route helper can own it

## Explicit Instructions
- Wait for Team 01 to freeze the launch result payload before finalizing route helpers.
- Audit `AppContext.tsx` first; that is where most current misclassification lives.
- Do not solve persistence by simply increasing toast TTL.
- When a quick action fails, the operator must have somewhere stable to look after the toast disappears.
- Do not broaden this into a site-wide notification redesign.

## Interfaces Owned
- feedback target routing contract
- Action Log inline notice contract
- toast usage rules for Pro Streamer flows

## Routing Contract Update
- Route helper: `routeProStreamerFeedback(...)`
- Target taxonomy:
  - `toast`
  - `go-live-inline`
  - `action-log-inline`
  - `modal` (reserved; not mounted in this pass)
- Shared tone union:
  - `info`
  - `success`
  - `warning`
  - `error`
- Current launch contract consumed from `AppContext.tsx`:
  - `GoLiveLaunchResult.state = success | partial | blocked | failed`
  - `partial` may include `followUp.target = action-log`
- Current live `partial` behavior:
  - the modal stays open and keeps the warning inline in `GoLiveModal.tsx`
  - the runtime may also persist a follow-up notice into the pinned Action Log region
- Review note:
  - the committed Team 05 UI surface proves only the modal-inline half of this behavior
  - any Action Log persistence for `partial` depends on the broader Team 01 and Team 02 runtime work, not the scoped Team 05 UI commit alone
- Persistent Action Log notice mount:
  - `MiladyOsDashboard.tsx`
  - inside the pinned Action Log region, above live controls
  - auto-opens the Action Log rail on write

## Reclassified Actions
| Action | Old target | New target | Persistence rule |
| --- | --- | --- | --- |
| Go Live setup blockers in modal | mixed local inline / transient | `go-live-inline` | stays in modal until operator resolves or retries |
| Go Live launch `blocked` | transient or ambiguous | `go-live-inline` | modal stays open; no toast-only blocker |
| Go Live launch `failed` | transient or ambiguous | `go-live-inline` | modal stays open; no toast-only blocker |
| Go Live launch `partial` | transient success/warning copy | modal-local inline warning plus `action-log-inline` and Action Log entry | modal stays open; follow-up survives in Action Log |
| Screen Share quick action failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Ads create failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Ads trigger failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Ads missing `adId` follow-up | toast | `action-log-inline` | warning persists until dismissed |
| Guest invite failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Radio failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| PiP failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Reaction override failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Reaction override partial orchestration follow-up | toast | `action-log-inline` | warning persists until dismissed |
| Earnings estimate failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| End Live failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Play Games launch failure | toast | `action-log-inline` | persists until dismissed; Action Log auto-opens |
| Play Games attach failure / follow-up | toast | `action-log-inline` | warning persists until dismissed |
| Passive confirmations for successful quick actions | toast | `toast` | capped at 3 visible toasts |

## Handoff Notes
- Team 03: consume `data-action-log-inline-notice` as the primary rendered notice selector and treat `data-action-log-inline-notice-slot` as the pinned-region container contract.
- Team 07: cover `routeProStreamerFeedback(...)`, Go Live `blocked/failed/partial` behavior, the current dual-surface `partial` contract, Action Log auto-open behavior, and warning-tone toast rendering.

## Exit Criteria
- Every reachable blocking stream/operator failure routes to modal or inline persistent UI.
- Toasts are passive only.
- Action Log auto-opens for actionable rail-level failures.
- Team 03 and Team 07 have stable routing semantics to implement/test against.

## Team 00 Acceptance And Next Steps (2026-03-11)
- Current acceptance state:
  - `COMPLETED`
- Accepted work:
  - shared feedback router exists
  - sink plumbing exists in `AppContext.tsx`
  - Action Log inline notice routing is now a first-class target
- Open issues Team 00 is holding on:
  - none for this scoped workstream
- Next steps:
  1. Do nothing further. Thank you.
  2. Do not reopen feedback routing code or this packet unless Team 07 finds a reproducible Pro Streamer behavior defect.

## Review Remarks (2026-03-11)
- The live code already implements the dual-surface `partial` contract:
  - modal-inline follow-up in `GoLiveModal.tsx`
  - `action-log-inline` persistence plus operator-action follow-up in `AppContext.tsx`
- Autonomous-run notices are outside this closeout because they are exposed through `ChatView`, not the Pro Streamer launch and Action Log surfaces.
- Team 02 is complete for this closeout and should do nothing further. Thank you.
