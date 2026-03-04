# 555 Platform Remaining Work SOW (Alice Pilot -> Multi-Agent GA)

## Purpose
This SOW tracks **all remaining platform work** (past + present scope), while separating:
- **Priority 0 (Tonight):** ship expert-grade plugins safely.
- **Priority 1 (Immediate next):** make ads reliably render and monetize on live streams.

This is not only a “plugin launch checklist”; it is the full execution map for the remaining product.

---

## Priority 0 — Plugin Release Tonight (Hard Gate)

### P0.1 Packaging and structure
- Finalize plugin surfaces and manifests for:
  - `five55-games` (game launch/play orchestration),
  - `stream555-live` (live session control),
  - `stream555-ads` (ad scheduling/trigger/reporting).
- Ensure expert structure compliance for ElizaOS + Milaidy plugin loading:
  - action metadata,
  - settings schema,
  - safe defaults,
  - capability gating.

### P0.2 Operator-ready configuration
- Publish one canonical config matrix for operators:
  - required env vars,
  - optional env vars,
  - per-feature toggles,
  - cloud/live destinations.
- Include explicit “minimum viable live” and “full monetization” presets.

### P0.3 Milaidy app discoverability
- Ensure plugins are visible in Milaidy install/discovery surfaces with:
  - install instructions,
  - setup wizard steps,
  - web access/control entrypoints.

### P0.4 Release safety checks
- Validate no tactical ambiguity: `milaidy` strategy authority, `555-bot` trigger/observer only.
- Validate session start/stop, game switch, ad trigger endpoints are callable via plugin actions.
- Validate leaderboard writes for non-Alice agents are accepted (schema + dedupe keys).

### P0.5 Release outputs tonight
- Versioned release notes.
- Operator runbook.
- Incident rollback steps.
- “Known limitations” section with explicit next milestones.

---

## Priority 1 — Ad Reliability and Monetization Stability

### P1.1 Reliability defects to close
- QR image breakage in game overlays.
- Render ACK auth mismatch (`401 Invalid token`) between control-plane and capture path.
- Incomplete metadata projection (blank info side on L-bar in game mode).
- Ad asset mismatch/stale payload selection during triggers.

### P1.2 Required technical fixes
- Make game ad QR path auth-safe (pre-rendered data URL or public-safe generation route).
- Use correct renderer/service token on game capture ad ACK path.
- Expand game overlay mapping to fully consume canonical L-bar fields (`tagline`, `description`, pills/stats, CTA).
- Add trigger-time template/media reconciliation against canonical ad library.

### P1.3 Reliability acceptance gate
- 0 broken QR images in soak.
- 0 auth-related ACK failures across soak window.
- No blank “info panel” when source template contains info fields.
- 99.5%+ successful ad trigger->render confirmation.

---

## Priority 2 — Gameplay Mastery and Agent Intelligence

### P2.1 Game-by-game mastery tracks
- Per-game adapter parity (`state`, `diagnostics`, `policy`, lifecycle handling).
- Per-game failure buckets and policy corrections.
- Deterministic certification runs with seeds where possible.

### P2.2 Cross-session learning
- Persistent profile updates by agent/game with guardrails and rollback.
- Episode summaries linked to scores/leaderboard records via stable run IDs.

### P2.3 UX and operator controls
- Operator dashboards for session health, ads, and policy versions.
- Agent-facing explainability for “why this action happened”.

---

## Priority 3 — Streaming Product Completeness

### P3.1 Always-on continuity
- Continuous stream state across game transitions with deterministic fallback media.
- No long black/idle gaps during switch sequences.

### P3.2 Segment architecture
- Segment primitives: pre-roll, gameplay, mid-roll ad, sponsor callout, intermission, recovery slate.
- Segment scheduler with policy-based insertion and cooldown protections.

### P3.3 Multi-destination robustness
- Cloudflare-first distribution with validated simulcast fanout.
- Per-destination health telemetry and degradation handling.

---

## Priority 4 — Open-Source and Ecosystem Readiness

### P4.1 OSS standards
- Public architecture docs, SDK contracts, threat model.
- Semantic versioning and migration docs.
- Contribution guide + code ownership.

### P4.2 Governance and safety
- Capability tokens and scoped permissions.
- Replay protection and audit logs for score/ad events.
- Multi-agent isolation guarantees.

---

## Execution Order
1. **Tonight:** complete P0 release gate.
2. **Immediately after:** execute P1 ad reliability fixes and soak validation.
3. **Then:** P2 game mastery expansion and learning quality.
4. **Then:** P3 always-on and segment hardening.
5. **Parallel track:** P4 OSS readiness/docs as code stabilizes.

---

## Delivery Artifacts (Required)
- Plugin release bundle + setup docs.
- Ad reliability patch set + regression tests + soak report.
- Streaming continuity report (switch latency, interruption budget).
- Game mastery backlog by title (severity-ranked).
- Public-facing docs pack for community adoption.

---

## Definition of “Ready to Welcome More Agents”
- Plugin install/setup works from clean environment without hidden tribal steps.
- Stream launch + game play + ad display + score capture succeed end-to-end.
- Ad rendering and attribution are reliable enough for production monetization.
- Non-Alice agents can use safe baseline tools without privileged Alice-only behavior.
