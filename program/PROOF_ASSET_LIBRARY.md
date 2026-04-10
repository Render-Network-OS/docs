# Proof Asset Library

This is the reusable evidence index for founder narrative, partner materials,
public progress, and release-readiness claims.

For the fastest founder-facing reuse path, start with
`program/founder-proof/INDEX.md` and use this file as the deeper reusable
library behind it.

## Seed assets

| Claim | Audience | Artifact type | Source repo/path | Date | Reusability |
| --- | --- | --- | --- | --- | --- |
| Alice has a real deploy path with explicit fallbacks and validation gates | operator, partner | audit / runbook | `555-bot/docs/ALICE_CURRENT_DEPLOYMENT_TECHNIQUE_AUDIT_2026-02-28.md` | 2026-02-28 | campaign_reusable |
| Alice deployment can be executed by an operator without GitHub Actions | operator | runbook | `555-bot/docs/ALICE_WEBHOOK_DEPLOYMENT_RUNBOOK.md` | 2026-03-25 | evergreen |
| Alice and Five55 surface parity is reviewed against explicit criteria | founder, partner | matrix | `milaidy/docs/FIVE55_ALICE_PARITY_MATRIX.md` | 2026-03-25 | campaign_reusable |
| Stream runtime/operator work has evidence-backed acceptance coverage | founder, partner | test report | `555stream/PHASE7_UNIFIED_ACCEPTANCE_CLOSURE_2026-02-19_POST_REMEDIATION.md` | 2026-02-19 | campaign_reusable |
| Stream operational evidence is collected and indexed | founder, partner, reviewer | evidence index | `555stream/ECOSYSTEM_EVIDENCE_INDEX.md` | 2026-03-25 | evergreen |
| Arcade mastery exists as real, game-specific operator material | founder, operator | dossier set | `arcade-plugin/src/mastery/dossiers/` | 2026-03-08 | campaign_reusable |
| SW4P has formal security, ops, and funding-grade technical documentation | partner, investor | whitepaper / audit set | `sw4p/docs/funding/SW4P_Technical_Whitepaper.md` | 2026-03-25 | campaign_reusable |
| SW4P security posture is documented at the protocol level | partner, reviewer | threat model | `sw4p/docs/THREAT_MODEL.md` | 2026-03-25 | evergreen |

## Promotion rules

- Promote a dated artifact into evergreen docs only after it has been normalized
  into an operator or public document.
- Keep the original dated artifact as evidence.
- When a claim weakens, demote the proof asset instead of silently deleting it.
