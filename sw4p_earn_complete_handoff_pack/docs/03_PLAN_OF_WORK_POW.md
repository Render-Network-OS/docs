# 03 - SW4P Earn Plan of Work / POW

## POW meaning

POW here means both:

1. **Plan of Work** - who builds what, in what order, with which dependencies.
2. **Proof of Work** - evidence gates proving the work is real before launch.

## Execution model

Run P0 as a short, strict launch train with parallel squads and one audit captain.

```txt
P0.0 Freeze + baseline
P0.1 Cross-chain truth
P0.2 Contract hardening
P0.3 Services and ledgers
P0.4 Anti-wash and reward eligibility
P0.5 Reward epoch and claims
P0.6 Dashboard proof
P0.7 Ops, CI, drills
P0.8 External audit readiness
```

P1 and P2 are intentionally held behind P0 gates.

---

# P0 Work Plan

## P0.0 - Freeze and baseline

Goal: lock the launch surface and prevent scope drift.

Tasks:

```txt
- Freeze P0 chain topology: Solana hub + Base spoke.
- Freeze P0 contracts.
- Freeze active policy buckets.
- Freeze fee sources included in launch.
- Create addresses registry placeholder.
- Create `docs/security/roles.md`.
- Convert this pack into GitHub issue epics.
```

Evidence:

```txt
- P0 scope signed off in PR.
- All P1/P2 features labelled non-blocking and disabled.
- Roles doc exists.
```

## P0.1 - Cross-chain truth

Goal: no unbacked 555 and no false dashboard green.

Tasks:

```txt
- Implement burn-and-mint invariant formula.
- Add per-chain mint/burn counters.
- Update NTT supply indexer.
- Add per-leg assertion tests.
- Expand decimal verifier and production config.
- Make decimal verifier CI blocking.
- Build Solana -> Base -> Solana canary.
```

Evidence:

```txt
- test report.
- invariant report JSON.
- round-trip canary tx hashes.
- dashboard screenshot showing invariant healthy.
```

## P0.2 - Contract hardening

Goal: contracts are safe enough to enter external audit.

Tasks:

```txt
- Add ProtocolOwnedLiquidityVault tests.
- Add Pausable or equivalent POL halt path.
- Add LPVault withdraw/share-inflation/multi-depositor tests.
- Add GlobalStakeVault multiplier/cooldown/early-exit tests.
- Add RewardsDistributor underfund/sourceTag/wrong-root tests.
- Resolve adapter topology: one adapter per vault or multi-vault refactor.
- Ensure Safe-mediated roles after deployment.
- Add Slither static analysis to CI.
```

Evidence:

```txt
- Foundry report.
- coverage matrix.
- Safe role table.
- Slither output.
```

## P0.3 - Services and ledgers

Goal: every fee event is durable, idempotent, and traceable.

Tasks:

```txt
- Finalize route_events schema.
- Finalize fee_events schema.
- Finalize fee_outbox schema.
- Implement idempotent fee dispatch.
- Add real Postgres integration tests.
- Auth-gate ops endpoints.
- Add reconciliation job.
- Add policy snapshot endpoint and golden hash.
```

Evidence:

```txt
- integration test logs.
- fee path trace: route_event -> fee_event -> outbox -> dispatch.
- auth tests.
- reconciliation diff export.
```

## P0.4 - Anti-wash and eligibility

Goal: fake volume cannot enter rewards.

Tasks:

```txt
- Implement anti-wash persistence methods.
- Add migration for anti-wash evaluation fields.
- Add MM/POL/treasury wallet classifier.
- Add wallet cluster and self-route heuristics.
- Add banned/affiliate wallet config.
- Gate reward epoch build on anti-wash freshness.
- Add dashboard excluded volume widget.
```

Evidence:

```txt
- synthetic wash test.
- excluded-volume dashboard screenshot.
- reward root missing ineligible wallet.
- anti-wash liveness report for 24h.
```

## P0.5 - Reward epoch and claims

Goal: claims are source-tagged, reproducible, and Safe-published.

Tasks:

```txt
- Centralize LP/stake split policy.
- Decide and document 70/30 or explicit per-epoch split.
- Build deterministic epoch snapshot.
- Add sourceTag to every leaf.
- Create root reproduction artifact.
- Replace direct hot-key publish with Safe queue/co-sign/cooldown design.
- Separate funder and publisher secrets.
- Add funding sufficiency checks.
```

Evidence:

```txt
- epoch snapshot hash.
- policy snapshot hash.
- merkle tree JSON.
- Safe tx hash.
- claim proof for test wallet.
- different-root failure drill.
```

## P0.6 - Dashboard proof

Goal: the dashboard tells the truth and degrades loudly.

Tasks:

```txt
- Build proof dashboard endpoints.
- Render real APR / incentive APR / blended APR separately.
- Render supply invariant.
- Render fee source breakdown.
- Render excluded volume.
- Render epoch status and root.
- Render pause status.
- Render stale-data banner.
```

Evidence:

```txt
- dashboard screenshots.
- API JSON fixtures.
- stale-data drill screenshots.
```

## P0.7 - Ops, CI, drills

Goal: deployment is not a YOLO mainnet push.

Tasks:

```txt
- Pin Foundry and dependencies.
- Harden CodeBuild cache behavior.
- Make decimal/anvil gates blocking.
- Add secret rotation policy.
- Create drill evidence log.
- Run NTT round-trip drill.
- Run pause/unpause drill.
- Run reward epoch retry/wrong-root drill.
- Run dashboard reconciliation drill.
- Run hot-key rotation rehearsal.
```

Evidence:

```txt
- CI build report.
- drill logs.
- Safe tx hashes.
- incident tabletop notes.
```

## P0.8 - External audit readiness

Goal: third-party auditor can verify without reconstructing the system from scratch.

Tasks:

```txt
- Export contract addresses.
- Export roles table.
- Export tests/coverage.
- Export threat model.
- Export economic policy snapshot.
- Export data flow diagrams.
- Export runbook evidence.
- Create retest checklist.
```

Evidence:

```txt
- audit folder complete.
- auditor access checklist complete.
- blockers labelled with owner and due date.
```

---

# P1 Work Plan

P1 starts only after P0 is green.

## P1 themes

```txt
- improve UX and earning clarity
- expand pool ladder
- automate more treasury allocation under caps
- add better analytics and APR history
- expose public proof exports
- build early market-maker/POL integration with low caps
```

P1 deliverables:

```txt
- historical APR charts
- richer LP position analytics
- proof CSV exports
- controlled POL allocation dashboard
- LP incentive budget controls
- broader Base pool support
- better anti-wash heuristics
```

---

# P2 Work Plan

P2 is scale and multichain.

## P2 themes

```txt
- more EVM spokes
- external audits completed
- protocol-owned market maker integration
- solver-liquidity reward modules
- deeper MM/POL accounting
- possible external solver/LP partners
```

P2 deliverables:

```txt
- multichain 555 Earn support
- multi-spoke supply dashboard
- external solver reward eligibility
- MM fund performance reporting
- advanced staking multipliers
- governance-controlled policy changes
```

---

# POW evidence ledger

Every workstream must write evidence to:

```txt
docs/evidence/<date>/<workstream>/<artifact>
```

Required artifact types:

```txt
- tx_hashes.json
- test_report.txt
- coverage_report.txt
- api_snapshot.json
- dashboard_screenshot.png
- policy_snapshot.json
- root_reproduction.json
- drill_log.md
- safe_role_table.csv
- risk_acceptance.md
```

No evidence, no gate.
