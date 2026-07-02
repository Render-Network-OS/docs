# SW4P Earn - Complete Team Handoff Pack

Generated: 2026-06-26 05:15 UTC
Owner: SW4P / 555 team
Purpose: ship SW4P Earn without hand-wavy tokenomics, fake yield, fake volume, or unreviewed cross-chain risk.

## Read this first

This pack turns the current SW4P Earn concept and audit context into an engineering handoff. It is deliberately biased toward **P0**, because P0 is the size of the actual launch-critical work. P1/P2 are included only so the team does not overbuild, leak scope, or accidentally ship future features before the launch contract is safe.

## P0 definition

P0 is not "make the page look nice" and it is not "turn on staking". P0 is the closed, auditable loop:

```txt
real routed volume / real LP fees
  -> fee ledger
  -> anti-wash eligibility filter
  -> treasury allocation policy
  -> reward epoch builder
  -> Safe-controlled publication
  -> source-tagged claim
  -> dashboard proof
  -> reconciliation / alerts / pause path
```

P0 is complete only when the team can prove all of this with on-chain evidence, DB evidence, testnet drills, CI gates, and dashboard truth.

## Folder map

```txt
sw4p_earn_complete_handoff_pack/
├── README.md
├── docs/
│   ├── 00_P0_SPOTLIGHT.md
│   ├── 01_PRODUCT_SPEC_PRD.md
│   ├── 02_TECHNICAL_REQUIREMENTS_TRD.md
│   ├── 03_PLAN_OF_WORK_POW.md
│   ├── 04_TOKENOMICS_AND_REWARD_POLICY.md
│   ├── 05_SECURITY_RISK_AND_AUDIT_REMEDIATION.md
│   ├── 06_QA_ACCEPTANCE_AND_TEST_MATRIX.md
│   ├── 07_LAUNCH_GATES_AND_OPERATIONS.md
│   ├── 08_API_AND_DATA_MODEL.md
│   ├── 09_INTEGRATION_WITH_DEEP_LIQUIDITY_MM.md
│   └── 10_TEAM_HANDOFF_NOTES.md
├── diagrams/
│   ├── architecture.mmd
│   ├── money_flow.mmd
│   ├── reward_epoch_sequence.mmd
│   ├── p0_dependency_graph.mmd
│   └── state_machines.mmd
├── backlog/
│   ├── P0_BACKLOG.csv
│   ├── P0_ISSUE_CARDS.md
│   ├── ACCEPTANCE_GATES.csv
│   └── RISK_REGISTER.csv
├── schemas/
│   ├── sw4p_earn_policy_manifest.json
│   ├── p0_acceptance_gate_schema.json
│   ├── data_model.sql
│   └── api_openapi_skeleton.yaml
├── runbooks/
│   ├── p0_stage_gate_runbook.md
│   ├── rewards_epoch_runbook.md
│   ├── pause_recovery_runbook.md
│   └── canary_and_drill_schedule.md
└── team_prompts/
    ├── engineering_dispatch_prompt.md
    ├── audit_dispatch_prompt.md
    └── frontend_dashboard_prompt.md
```

## Non-negotiables

1. No fake volume. Market maker, protocol-owned liquidity, treasury wallets, and affiliated wallets must be excluded from organic reward calculations.
2. No misleading APY. Real-fee APR, incentive APR, and blended APR must be separated everywhere.
3. No unbacked cross-chain 555. Burn-and-mint supply accounting must be correct before open registration.
4. No hot-key dual-role for reward publication and funding.
5. No public launch while P0 gates are red.
6. No unlabelled treasury movement. Every dollar/token must have a source, destination, bucket, reason, and evidence artifact.

## Fast path for the team

1. Start with `docs/00_P0_SPOTLIGHT.md`.
2. Convert `backlog/P0_BACKLOG.csv` into GitHub issues.
3. Run squads by workstream from `docs/03_PLAN_OF_WORK_POW.md`.
4. Use `docs/06_QA_ACCEPTANCE_AND_TEST_MATRIX.md` as the release checklist.
5. Do not market Earn until `runbooks/p0_stage_gate_runbook.md` is green.
