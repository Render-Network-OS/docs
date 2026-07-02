# 06 - QA, Acceptance, and Test Matrix

## P0 acceptance principle

Every acceptance gate must be machine-checkable or evidence-checkable. Do not accept "looks good" as a launch criterion.

## 1. Master P0 acceptance gates

| Gate | Name | Required status |
|---|---|---|
| G0 | Scope freeze | P0 scope signed off; P1/P2 disabled |
| G1 | Cross-chain invariant | burn-and-mint invariant healthy |
| G2 | Decimal coherence | SPL/EVM/SDK/DB decimals match |
| G3 | Contract tests | all P0 tests green |
| G4 | Service tests | Postgres integration tests green |
| G5 | Anti-wash | synthetic wash excluded and visible |
| G6 | Reward epoch | deterministic root, Safe path, source tags |
| G7 | APY truth | real/incentive/blended split everywhere |
| G8 | Dashboard proof | non-zero proof metrics and stale banners |
| G9 | Ops drills | canary, pause, epoch, reconciliation, key rotation |
| G10 | Audit handoff | evidence pack complete |

## 2. Contract test matrix

### `EVM555Token`

```txt
[ ] decimals fixed at 6
[ ] only NTT manager can mint
[ ] only authorized burn path works
[ ] owner role is Safe after deployment
[ ] pause blocks expected paths
[ ] unpause restores expected paths
[ ] permit tests exist if permit enabled
```

### `GlobalStakeVault`

```txt
[ ] lock creates position
[ ] multiple locks per wallet handled
[ ] weightedAmount calculation correct
[ ] totalWeighted equals sum positions
[ ] cooldown cannot be skipped
[ ] mature withdraw works
[ ] early exit applies penalty
[ ] pause blocks new lock
[ ] pause does not trap mature withdrawals if policy says withdraw remains open
[ ] fuzz boundary: amount, duration, multiplier
```

### `LPVault`

```txt
[ ] deposit with valid ratio mints shares
[ ] multi-depositor share math fair
[ ] withdraw burns shares and returns assets/LP claim
[ ] share inflation attack fails
[ ] adapter missing reverts
[ ] adapter swap with active LP blocked or safe
[ ] non-authorized adapter rejected
[ ] pause blocks deposits
[ ] reentrancy attack fails
```

### `ProtocolOwnedLiquidityVault`

```txt
[ ] fund happy path
[ ] multiple source tags tracked
[ ] zero amount reverts
[ ] no adapter reverts
[ ] partial withdraw works
[ ] withdraw over balance reverts
[ ] non-funder cannot fund
[ ] non-treasury cannot withdraw
[ ] pause blocks funding
[ ] withdraw destination allowlist enforced if implemented
```

### `RewardsDistributor`

```txt
[ ] publish epoch with valid root
[ ] cannot publish same epoch twice with different root
[ ] wrong proof rejected
[ ] duplicate claim rejected
[ ] claim transfers to account not msg.sender
[ ] REAL_FEE sourceTag works
[ ] INCENTIVE sourceTag works
[ ] underfunded claim behavior monitored/tested
[ ] Safe/cooldown publication path tested
```

## 3. Service integration matrix

### Fee path

```txt
[ ] route_event inserted
[ ] fee_event derived once
[ ] fee_outbox created once
[ ] treasury-router dispatch idempotent
[ ] retry does not double pay
[ ] dispatch maps only to approved bucket
[ ] pending_operator_action created for non-auto buckets
```

### Anti-wash path

```txt
[ ] unprocessedSinceLast returns events
[ ] markIncluded persists result
[ ] markExcluded persists result
[ ] MM wallet classified as market_maker
[ ] POL wallet classified as protocol_owned_liquidity
[ ] wash loop excluded
[ ] stale anti-wash blocks epoch build
[ ] excluded volume visible on dashboard
```

### Epoch path

```txt
[ ] snapshot deterministic
[ ] policy hash included
[ ] root reproducible from export
[ ] sourceTag on every leaf
[ ] 70/30 or chosen split explicit
[ ] Safe transaction generated
[ ] different-root retry halts
[ ] funding sufficiency checked
```

### Dashboard path

```txt
[ ] overview endpoint shows TVL/stake/LP
[ ] proof endpoint shows non-zero metrics
[ ] APY split endpoint returns triple
[ ] supply invariant endpoint returns status and evidence
[ ] stale service causes stale-data banner
[ ] ops endpoints require auth
```

## 4. Cross-chain matrix

```txt
[ ] Solana 555 mint metadata captured
[ ] Base EVM555Token decimals captured
[ ] NTT managers captured
[ ] burn event indexed on source
[ ] mint event indexed on destination
[ ] per-leg amount equality test
[ ] global supply equation test
[ ] round-trip canary passes
[ ] bridge paused-state behavior documented
```

## 5. Negative tests

```txt
[ ] fake route volume cannot enter reward root
[ ] affiliated wallet volume cannot enter organic pool
[ ] MM rebalance cannot enter organic pool
[ ] wrong policy hash blocks epoch
[ ] unknown supply status blocks epoch
[ ] insufficient funds blocks claimability or alerts before claimability
[ ] unauthenticated treasury-pending request fails
[ ] duplicate outbox dispatch fails
[ ] malformed claim proof fails
```

## 6. Performance / reliability tests

P0 thresholds:

```txt
- dashboard proof endpoints p95 < 500ms from cached/read model
- anti-wash worker lag < 10 minutes during normal load
- fee outbox pending age < 5 minutes
- claim proof generation p95 < 1s
- indexer catches up after restart without duplication
- RPO for fee ledger: zero accepted data loss
```

## 7. Manual QA checklist

```txt
[ ] User stakes 555 and sees position.
[ ] User deposits LP and sees position.
[ ] User sees real/incentive/blended APR separately.
[ ] User sees claimable amount after epoch.
[ ] User claims and claim history shows sourceTag.
[ ] Dashboard shows excluded volume after synthetic wash.
[ ] Dashboard shows supply invariant.
[ ] Dashboard shows pause status.
[ ] Stale-data banner appears when API fixture is stale.
```

## 8. Release-blocking definitions

A bug is P0-blocking if it affects:

```txt
- user funds
- treasury funds
- reward correctness
- cross-chain supply correctness
- anti-wash enforcement
- APY/source disclosure
- admin/ops endpoint security
- pause/recovery ability
```
