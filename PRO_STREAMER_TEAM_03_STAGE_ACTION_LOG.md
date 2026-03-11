# Team 03: Stage And Action Log

## Mission
- Finalize the Action Log drawer shell and the stage conversation rendering rules.
- Make the layout deterministic across desktop, tablet, and mobile without mutating stored history.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary surfaces:
  - `src/components/MiladyOsDashboard.tsx`
  - `src/components/AgentCore.tsx`
  - `src/components/shared/OperatorActionPill.tsx`
  - `src/components/CognitiveTracePanel.tsx`

## Staffing And Speed
- Staffing: 1 frontend engineer + 1 UI engineer
- Best case: 1.5 days
- Likely: 2-3 days
- Hard gate: 4 days

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_03_STAGE_ACTION_LOG.md`
   - `PRO_STREAMER_TEAM_02_FEEDBACK_ARCHITECTURE.md`
   - `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
4. Open these files first:
   - `src/components/MiladyOsDashboard.tsx`
   - `src/components/AgentCore.tsx`
   - `src/components/shared/OperatorActionPill.tsx`
   - `src/components/CognitiveTracePanel.tsx`
5. Freeze the rail shell layout before tuning spacing.
6. The inline Action Log notice mount point is frozen at the top of the pinned region; coordinate with Team 02 only if payload semantics or routing behavior change.
7. Implement historical `source="operator_action"` cleanup as render-time collapse only.
8. Do not mutate stored history and do not rewrite backend payloads.
9. Validate desktop, tablet, and narrow mobile separately.
10. Update this packet with:
   - final shell selectors
   - final render rules per message shape
   - any responsive caveats Team 07 must test
11. Your deliverable is code plus an updated rendering contract in this packet.

## Overview Of Other Teams
- Team 00 owns sequencing and cross-team acceptance tracking.
- Team 01 determines how partial-launch follow-up should appear in the Action Log.
- Team 02 determines the routing contract for Action Log inline notices that must live inside this shell.
- Team 04 is independent except that avatar state changes must remain visually coherent inside the stage composition.
- Team 05 must not fork bespoke control patterns while converging shared UI primitives.
- Team 06 is independent except for ensuring startup shell and stage shell remain visually distinct.
- Team 07 depends on this team for layout, rendering, and responsive behavior test targets.

## Priority Checklist
- `P0` Freeze the Action Log shell contract:
  - sticky header
  - pinned controls region
  - independently scrolling feed region
  - desktop target height `80vh`
  - tablet/mobile target height `80dvh`
- `P0` Remove clipping and header regression:
  - no bottom clipping on desktop
  - header remains visible on narrow viewports
  - pinned controls remain visible while the feed scrolls
- `P0` Lock stage rendering rules:
  - operator `action-pill` block renders as right-aligned pill
  - historical `source="operator_action"` raw text collapses to a compact operator-action chip with optional detail reveal
  - plain operator text renders as right bubble
  - assistant text renders as left bubble
  - system/public action entries render as centered system events
- `P1` Keep historical cleanup render-only:
  - do not rewrite stored conversation history
  - do not mutate message payloads in persistence
- `P1` Tighten density and grouping:
  - action controls feel intentionally grouped
  - feed spacing is deliberate rather than stacked
  - pills/chips do not dominate the stage lane
- `P1` Integrate Team 02 notice behavior:
  - inline Action Log notice placement
  - close behavior
  - follow-up affordance location
- `P2` Publish message-shape examples for Team 07

## Explicit Instructions
- Start with `MiladyOsDashboard.tsx` for the rail shell and `AgentCore.tsx` for stage rendering.
- Do not change persisted messages to solve historical clutter.
- Keep operator-action collapse compact; the goal is suppression of raw prompt dumps, not hidden context loss.
- Validate the three viewport classes explicitly: desktop, tablet, narrow mobile.
- Keep the inline Action Log notice mount point stable; coordinate with Team 02 only on routing semantics, not placement.

## Interfaces Owned
- Action Log shell layout contract
- stage lane message rendering contract
- historical operator-action collapse presentation

## Exit Criteria
- Action Log is unclipped and independently scrollable on all target viewports.
- Historical operator actions no longer dump raw prompt text into the live stage lane by default.
- Team 07 has stable selectors/expectations for shell, pinned region, feed region, and message rendering cases.

## Contract Update (2026-03-11)
- Final shell selectors:
  - `data-action-log-shell`
  - `data-action-log-header`
  - `data-action-log-pinned-region`
  - `data-action-log-inline-notice-slot` (container mount)
  - `data-action-log-feed-region`
- Final inline notice selectors:
  - `data-action-log-inline-notice` (primary rendered notice selector)
  - `data-action-log-inline-cta`
  - dismiss control with `aria-label="Dismiss action log notice"`
- Final stage selectors:
  - `data-stage-entry-role="operator|assistant|system"`
  - `data-stage-entry-kind="bubble|action-pill|action-chip|system-event"`
- Final render rules per message shape:
  - operator message with any `action-pill` block renders as a right-aligned compact pill and suppresses raw fallback text
  - historical operator message with `source="operator_action"` and no `action-pill` block renders as a right-aligned compact chip
  - the chip label is the first non-empty line of `message.text`
  - if additional non-empty lines exist, they stay hidden behind a `Details` reveal that shows the original message text
  - plain operator text renders as a right bubble
  - assistant text renders as a left bubble
  - public/system action summaries render as centered system events
- Responsive caveats for Team 07:
  - desktop Action Log shell is a left rail at explicit `80vh` with `top: 10vh`
  - tablet and narrow mobile Action Log shell use the bottom sheet path at explicit `80dvh`
  - pinned controls stay above the feed; only the feed region is the primary long-scroll surface
  - the inline notice slot is rendered inside the pinned region above live controls
  - the current notice contract includes visible body text, optional CTA, and dismiss control
  - Team 02 may still change notice payload semantics, but not the mount point without updating this packet and Team 07 targets

## Team 00 Acceptance And Next Steps (2026-03-11)
- Current acceptance state:
  - `COMPLETED`
- Accepted work:
  - shell selectors are frozen
  - stage render rules are explicit
  - historical `operator_action` cleanup is correctly render-only
- Next steps:
  1. Do nothing further. Thank you.
  2. Do not expand scope into visual redesign or storage mutation.
  3. Do not edit this packet or the scoped UI unless Team 07 files a reproducible defect and Team 00 explicitly reopens the stream.
