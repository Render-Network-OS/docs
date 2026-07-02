# 07 - Launch Gates and Operations

## Launch model

SW4P Earn launch must progress through controlled stages:

```txt
Stage 0: Local + CI readiness
Stage 1: Base Sepolia deploy and canaries
Stage 2: Low-value Base mainnet canary
Stage 3: Open registration / public Earn
Stage 4: Scale, POL, MM integration, and new routes
```

P0 covers Stage 0 through Stage 3 readiness. Stage 4 is not P0.

## Stage 0 - Local + CI readiness

Required gates:

```txt
- Foundry tests green.
- TypeScript services tests green.
- App typecheck green.
- Decimal verifier configured and blocking.
- Anvil integration configured and blocking.
- Static analysis added.
- Dependency versions pinned.
- P0 contracts and services tagged.
```

Exit artifact:

```txt
stage0_ci_report.json
```

## Stage 1 - Base Sepolia deploy

Required gates:

```txt
- Deploy through production-style Safe path.
- Safe post-deploy role rotation executed.
- NTT round-trip canary green.
- Reward epoch synthetic close green.
- Pause/unpause drill green.
- Dashboard proof endpoints non-empty.
- Contract source verification green.
```

Exit artifact:

```txt
stage1_testnet_evidence_pack.zip
```

## Stage 2 - Low-value Base mainnet canary

Required gates:

```txt
- small capped stake enabled
- small capped LP deposit enabled
- real or synthetic low-value SW4P route fee recorded
- anti-wash worker green for 24h
- no supply invariant violation
- no stuck job > 5 minutes
- dashboard proof non-zero
- first epoch root queued/published through Safe path
```

Exit artifact:

```txt
stage2_72h_canary_report.md
```

## Stage 3 - Open registration

Open registration can begin only when:

```txt
- all P0 gates green
- external audit blockers accepted/closed
- public risk disclosures published
- dashboard proof live
- incident response staffed
- pause controls rehearsed
```

## Drill schedule

```txt
T-21 days: NTT round-trip canary on Base Sepolia
T-14 days: Pause/unpause full system drill
T-10 days: Rewards epoch synthetic close + retry + different-root failure
T-7 days: Dashboard reconciliation diff drill
T-7 days: Hot-key rotation rehearsal
T-5 days: Incident-response tabletop
T-3 days: Service-pause kill switch drill
T-3 days: CI cold-build/cache drill
T-1 day: Final launch lead signed PASS/FAIL
```

## Operational roles

| Role | Responsibility |
|---|---|
| Launch lead | owns stage gates and final PASS/FAIL |
| Safe captain | coordinates signer quorum and role transactions |
| Protocol lead | owns contract deploy and verification |
| Backend lead | owns services, DB, epoch builder |
| SRE/on-call | owns CI, alerts, runbooks, uptime |
| Dashboard lead | owns public proof surfaces |
| Audit captain | owns evidence pack and residual risk list |
| Comms owner | owns launch/incident communications |

## Pause matrix

| Scope | Pause actor | Effect |
|---|---|---|
| EVM555Token | Safe/guardian path | all token movement halted, vault effects cascade |
| GlobalStakeVault | PAUSER_ROLE | new locks halted; withdraw policy must be defined |
| LPVault | PAUSER_ROLE | deposits halted; withdrawal policy must be defined |
| PoolRegistry pool | POOL_ADMIN_ROLE | route/reward eligibility halted for pool |
| RewardsDistributor | PAUSER_ROLE | claims and/or publishing halted, depending implementation |
| Treasury-router | SRE/operator | fee dispatch stopped |
| Anti-wash | SRE/operator | epoch build blocked if stale |
| Dashboard | SRE/operator | stale banner / read-only mode |
| NTT | Wormhole/manager process | bridge movement halted; pending messages handled by bridge runbook |

## Monitoring requirements

Alerts:

```txt
- Supply invariant broken: page immediately.
- Reward root mismatch: page immediately.
- Anti-wash stale: page before epoch close; block epoch.
- Fee outbox stuck: page after threshold.
- Claim spike: warn/page depending threshold.
- Policy drift: page and block new epoch.
- Unauthorized ops API request: page security channel.
- Dashboard stale: warn; page if public launch.
```

## Evidence discipline

Every launch stage must produce:

```txt
- exact git commit
- deployer and Safe tx hashes
- contract addresses
- role table
- CI report
- canary report
- screenshots
- logs
- unresolved risks
- launch lead signoff
```
