# Team 05: Shared Surfaces And Design System Convergence

## Mission
- Finish shared-control convergence for Pro Streamer-adjacent surfaces without redesigning Milady OS.

## Source Of Truth
- Runtime scope: `milaidy/apps/app`
- Primary surfaces:
  - `src/components/GoLiveModal.tsx`
  - Stream555 settings/operator surfaces
  - 555 Arcade settings/operator surfaces
  - shared config renderer paths

## Staffing And Speed
- Staffing: 2 frontend/design-system engineers
- Best case: 2 days
- Likely: 3-4 days
- Hard gate: 5 days

## Dispatch Instructions
1. Go to the repo root: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555`.
2. Open these documents in this order:
   - `PRO_STREAMER_PROGRAM_INDEX.md`
   - `PRO_STREAMER_TEAM_05_SHARED_SURFACES.md`
   - `PRO_STREAMER_TEAM_01_BROADCAST_LAUNCH.md`
   - `PRO_STREAMER_TEAM_02_FEEDBACK_ARCHITECTURE.md`
   - `PRO_STREAMER_TEAM_07_QA_RELEASE.md`
3. Go to the implementation surface: `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/milaidy/apps/app`.
4. Inventory every targeted surface before editing:
   - `src/components/GoLiveModal.tsx`
   - Stream555 settings/operator surfaces
   - 555 Arcade settings/operator surfaces
   - shared config-renderer paths
5. For each surface, list the bespoke controls that should collapse onto shared primitives.
6. Do not change launch semantics owned by Team 01.
7. Do not change routing semantics owned by Team 02.
8. Replace bespoke control chrome only where the approved primitive already covers the behavior.
9. Update this packet with:
   - surfaces audited
   - bespoke controls removed
   - primitives now in use
   - any residual divergence intentionally kept
10. Your deliverable is code plus a convergence inventory recorded in this packet.

## Overview Of Other Teams
- Team 00 owns sequencing and scope discipline.
- Team 01 owns launch correctness and must not be blocked by a cosmetic convergence pass.
- Team 02 owns notice routing and persistence rules that this team must consume rather than duplicate.
- Team 03 owns the Action Log shell and stage lane; do not redesign those layouts here.
- Team 04 owns avatar runtime only and should not receive UI-chrome changes from this team.
- Team 06 owns boot/startup behavior and shell parity, which should remain visually consistent with this convergence pass.
- Team 07 depends on this team to reduce control inconsistencies and selector churn across shared surfaces.

## Priority Checklist
- `P0` Standardize the target surfaces on shared primitives only:
  - `Dialog`
  - `Card`
  - `ScrollArea`
  - `Button`
  - `Input`
  - `Select`
  - `Switch`
  - `Textarea`
- `P0` Cover the full target scope:
  - Go Live modal
  - Stream555 settings/operator surfaces
  - 555 Arcade settings/operator surfaces
  - shared config-renderer paths used by those surfaces
- `P1` Remove bespoke field chrome:
  - raw button styling
  - one-off input shells
  - duplicate spacing logic where shared primitives already cover it
- `P1` Preserve behavior exactly:
  - do not break config save semantics
  - do not break plugin toggle semantics
  - do not alter launch flow logic owned by Team 01
- `P1` Preserve visual language:
  - this is convergence, not redesign
  - Milady OS remains intentionally styled, only more consistent
- `P2` Publish a component-usage inventory for future teams so the surfaces do not drift again

## Explicit Instructions
- Work from shared primitives outward, not by patching each screen independently.
- Do not introduce a new primitive set.
- Do not restyle surfaces owned by other teams beyond convergence to the approved primitive layer.
- Coordinate with Team 01 before touching `GoLiveModal.tsx` structure.
- Coordinate with Team 02 before changing how notice components are embedded in shared surfaces.

## Interfaces Owned
- primitive usage consistency across target surfaces
- shared config-renderer presentation consistency
- spacing and control density consistency

## Exit Criteria
- Targeted Pro Streamer-adjacent surfaces no longer rely on bespoke raw control chrome where shared primitives already exist.
- No behavioral regressions are introduced in save, toggle, or launch setup flows.
- Team 07 can test these surfaces against stable primitive-based structure.

## Implementation Record

### Surfaces Audited
- `milaidy/apps/app/src/components/GoLiveModal.tsx`
- `milaidy/apps/app/src/components/PluginOperatorPanels.tsx`
- `milaidy/apps/app/src/components/PluginsView.tsx`
- `milaidy/apps/app/src/components/config-renderer.tsx`
- `milaidy/apps/app/src/components/config-field.tsx`

### Bespoke Controls Removed
- Removed duplicate Stream555 and Arcade555 operator-panel implementations plus duplicated Stream555 summary helpers from `PluginsView.tsx`; `PluginOperatorPanels.tsx` is now the canonical operator surface.
- Replaced the Go Live modal’s raw channel-selection card buttons with shared `Button` composition.
- Replaced the Go Live modal’s manual scrolling container with `ScrollArea`.
- Replaced one-off inline notice chrome in the Go Live modal with shared `Card` + `Badge` composition.
- Replaced raw validation-summary links, collapsible group headers, and advanced toggles in the shared config renderer with `Button`.
- Replaced raw searchable-select rows, multiselect remove affordances, and array move controls in config fields with `Button`.

### Primitives Now In Use
- `Dialog`: retained for the Go Live shell and plugin settings shell.
- `ScrollArea`: now used for the Go Live modal body.
- `Card`: now used for normalized inline notice presentation in the Go Live modal and retained for operator-summary surfaces.
- `Badge`: now used for normalized inline notice state labels and existing readiness/status labels.
- `Button`: now backs Go Live channel cards, config validation jumps, group toggles, advanced toggles, searchable select rows, multiselect removal, and array reordering.
- `Input`, `Select`, `Switch`, `Textarea`: preserved as the existing field primitives in both legacy and minimal config-render modes.

### Residual Divergence Intentionally Kept
- `SelectablePillGrid` remains the shared launch-mode selector in the Go Live flow instead of being rewritten into a new primitive.
- Existing `pro-streamer-*` classes and tokenized Milady OS styling remain the styling layer; this pass did not introduce a second design system.
- Blocked and failed launch outcomes stay inline inside the Go Live modal; partial and success outcomes still follow the existing close-and-route behavior owned by the launch/feedback flows.
- Native `Switch`, `Input`, `Select`, and `Textarea` field renderers were not redesigned beyond removing ad hoc button chrome around them.

### Files Touched
- `milaidy/apps/app/src/components/GoLiveModal.tsx`
- `milaidy/apps/app/src/components/PluginsView.tsx`
- `milaidy/apps/app/src/components/config-renderer.tsx`
- `milaidy/apps/app/src/components/config-field.tsx`
- `milaidy/apps/app/test/app/go-live-modal.test.tsx`
- `milaidy/apps/app/test/app/go-live-launch-contract.test.tsx`
- `milaidy/apps/app/test/app/plugins-view-stream555-operator-controls.test.ts`
- `milaidy/apps/app/test/app/plugins-view-arcade555-operator-controls.test.ts`
- `milaidy/apps/app/test/app/config-renderer-minimal-controls.test.tsx`

### Verification
- Focused Vitest coverage now exercises the Go Live setup-required gate, readiness-state messaging, disabled unready channels, the four-step launch flow, blocked/failed inline notice behavior, Stream555 operator controls, Arcade555 canonical operator actions, and minimal-mode config-renderer controls.
- Command run:
  - `bunx vitest run --config vitest.config.ts test/app/go-live-modal.test.tsx test/app/go-live-launch-contract.test.tsx test/app/plugins-view-stream555-operator-controls.test.ts test/app/plugins-view-arcade555-operator-controls.test.ts test/app/config-renderer-minimal-controls.test.tsx`

### Remaining Risks
- The focused suite passes, but `test/app/go-live-launch-contract.test.tsx` still emits pre-existing `AppContext` stderr noise for emote/greeting startup paths that are outside Team 05 scope.
- Full-project TypeScript and unrelated app suites were not used as the release gate for this packet because the workspace already contains unrelated dirty changes and unrelated baseline failures outside the shared-surface scope.
