# 02 - SW4P Earn Technical Requirements / TRD

## 1. Architecture overview

SW4P Earn is composed of six layers:

```txt
1. Token / cross-chain layer
2. Vault and reward contracts
3. Fee and route services
4. Anti-wash and eligibility services
5. Epoch builder and claim services
6. Proof dashboard and ops controls
```

High-level flow:

```txt
SW4P route / DEX activity / product revenue
  -> fee-ledger
  -> treasury-router
  -> policy buckets
  -> anti-wash eligibility
  -> reward epoch builder
  -> RewardsDistributor root
  -> user claim
  -> dashboard proof
```

## 2. Chain topology

### P0 topology

```txt
Solana mainnet
  role: canonical 555 hub
  token: SPL 555, 6 decimals
  NTT mode: burn-and-mint

Base mainnet
  role: first EVM Earn spoke
  token: EVM555Token, 6 decimals
  NTT mode: burn-and-mint
  Earn contracts: deployed here for Phase-1
```

### P0 technical implications

1. Supply invariant must be burn-and-mint aware.
2. `EVM555Token` minter must be NTT manager after Safe-signed setup.
3. Earn contracts consume Base 555.
4. Solana creator/Pump fee paths can feed accounting/reward buckets, but P0 reward claim execution is Base-first unless explicitly extended.
5. Future spokes must not be added until P0 invariant and dashboard support multi-chain counters.

## 3. Contract architecture

### 3.1 `EVM555Token`

Purpose:

```txt
Base-side 555 ERC-20 implementing NTT-compatible mint/burn.
```

Requirements:

```txt
- decimals pinned to 6.
- mint/burn gated to NTT manager.
- owner/pauser controlled by Safe.
- permit supported only if tested.
- pause behavior documented because pausing token impacts all vaults.
```

P0 tests:

```txt
- mint auth
- burn auth
- decimals
- setMinter Safe path
- pause/unpause
- transfer/transferFrom behavior under pause
- permit tests if permit is exposed
```

### 3.2 `GlobalStakeVault`

Purpose:

```txt
555 lock/stake vault with weighted stake multipliers.
```

Core state:

```solidity
struct Position {
  address owner;
  uint256 amount;
  uint256 weightedAmount;
  uint64 start;
  uint64 unlock;
  uint64 cooldownStart;
  uint16 multiplierBps;
  bool withdrawn;
}
```

Required functions:

```txt
lock(amount, tierId)
startCooldown(positionId)
withdraw(positionId)
earlyExit(positionId)
weightedOf(account)
totalWeighted()
setTier(tierConfig)
pause/unpause
```

P0 tests:

```txt
- multiple positions per user
- totalWeighted invariant
- cooldown boundary
- early-exit penalty routing
- pause blocks new locks but does not trap matured withdrawals, if policy chooses that
- no share inflation
```

### 3.3 `LPVault`

Purpose:

```txt
Two-sided 555 + quote LP vault that mints LP shares and routes capital to an approved adapter.
```

Required features:

```txt
- deposit with amount555 + amountQuote
- withdraw/redeem shares
- share pricing invariant
- adapter safety
- pool registry integration
- pause new deposits
- permit path only if fully tested
```

P0 must fix:

```txt
- withdraw tests
- multi-depositor tests
- share-inflation tests
- adapter replacement rules when LP is held
- path for single adapter per vault or multi-vault authorized adapter design
```

### 3.4 `PoolRegistry`

Purpose:

```txt
On-chain registry for approved pools and pool levels.
```

Pool levels:

```txt
L0 disabled / unknown
L1 watch-only
L2 eligible for quotes
L3 eligible for LP rewards
L4 protocol-owned liquidity approved
```

Requirements:

```txt
- only approved pools can be rewarded.
- quote service respects pool status.
- dashboard shows status.
- pool status changes are evented.
```

### 3.5 `ProtocolOwnedLiquidityVault`

Purpose:

```txt
Treasury/POL vault for protocol-owned liquidity, source-tagged funding, and withdrawals under Safe authority.
```

P0 requirements:

```txt
- add Pausable or equivalent emergency halt for funding path.
- add full unit tests.
- add withdraw destination allowlist or Safe-signed allowlist.
- source tags must be preserved.
- adapter swap with active LP must be blocked or staged.
```

### 3.6 `RewardsDistributor`

Purpose:

```txt
Merkle distributor for reward epochs. Each leaf includes epoch, account, asset, amount, and sourceTag.
```

Required source tags:

```txt
TAG_REAL_FEE
TAG_INCENTIVE
```

P0 requirements:

```txt
- sourceTag appears in claim UI and claim history.
- totalReal and totalIncentive are published per epoch.
- duplicate claim impossible.
- third-party gas relayer can claim for user but transfer goes to account bound in leaf.
- publishEpoch is Safe-mediated or protected by cooldown/challenge.
- funding sufficiency is monitored.
```

## 4. Service architecture

### 4.1 `route-ledger`

Records real SW4P routed volume.

Requirements:

```txt
- idempotent insert by route_id / tx hash.
- route classification fields.
- source/destination chain, token, notional, wallet cluster.
- anti-wash status fields.
- trace id through fee ledger.
```

### 4.2 `fee-ledger`

Records fee events and converts them into policy-dispatchable records.

Requirements:

```txt
- source: DEX, SW4P, PUMP, PRODUCT, INCENTIVE.
- asset and amount.
- source tx.
- recipient policy bucket.
- idempotency key.
- reconciliation status.
```

### 4.3 `treasury-router`

Moves or records allocations into closed policy buckets.

Requirements:

```txt
- closed bucket enum.
- durable outbox.
- idempotent dispatch.
- on-chain dispatch where applicable.
- pending_operator_action rows for POL/reserve/treasury actions.
- no unauthenticated sensitive endpoints.
```

### 4.4 `anti-wash`

Classifies and marks route events as eligible or excluded.

P0 required classes:

```txt
organic
affiliate
market_maker
protocol_owned_liquidity
wash_cluster
sybil_suspected
banned
unknown_review
```

P0 methods:

```txt
unprocessedSinceLast(cursor, limit)
markIncluded(eventId, reason, modelVersion)
markExcluded(eventId, reason, modelVersion)
```

### 4.5 `rewards-epoch`

Builds epoch roots from eligible balances and fee pools.

Requirements:

```txt
- deterministic root generation.
- DB snapshot hash.
- policy snapshot hash.
- sourceTag per leaf.
- explicit LP/stake split.
- no epoch build if anti-wash is stale.
- no epoch build if supply invariant is red.
- Safe transaction generation for publication.
```

### 4.6 `claims`

Serves proof data and APY math.

Requirements:

```txt
- proof per account/epoch/asset/sourceTag.
- claimable amount.
- claimed amount.
- realFeeAprPct, incentiveAprPct, blendedAprPct as separate fields.
- never return APY as single number only.
```

### 4.7 `dashboard-api`

Public and operator API for proof dashboard.

Requirements:

```txt
- public endpoints expose proof status.
- ops endpoints require auth.
- stale-data banners if services degrade.
- no false green status when invariant/anti-wash is unknown.
```

### 4.8 `decimal-verifier`

CI and preflight check that validates decimals across SPL, EVM, SDK, database, and policy config.

Requirements:

```txt
- production config present.
- CI blocking, not advisory.
- tests exist for verifier itself.
- output artifact persisted.
```

## 5. Data model summary

Core tables:

```txt
route_events
anti_wash_evaluations
fee_events
fee_outbox
treasury_dispatches
reward_epochs
reward_leaves
claims
stake_positions
lp_positions
pool_snapshots
supply_counters
ntt_transfers
policy_snapshots
system_gate_status
```

Full SQL skeleton is included in `schemas/data_model.sql`.

## 6. API requirements

Required public APIs:

```txt
GET /v1/earn/overview
GET /v1/earn/positions/:account
GET /v1/earn/rewards/epochs
GET /v1/earn/rewards/:epochId/:account
GET /v1/earn/claims/proof/:epochId/:account
GET /v1/earn/policy/snapshot
GET /v1/dashboard/555-proof
GET /v1/dashboard/supply-invariant
```

Required operator APIs:

```txt
GET /v1/ops/treasury-pending
GET /v1/ops/anti-wash/status
POST /v1/ops/epochs/:epochId/build
POST /v1/ops/epochs/:epochId/queue-safe
POST /v1/ops/pause/:scope
POST /v1/ops/reconcile
```

All operator APIs must be authenticated, authorized, audited, and rate-limited.

## 7. Required state machines

### Reward epoch

```txt
OPEN
  -> SNAPSHOT_PENDING
  -> SNAPSHOT_TAKEN
  -> ANTI_WASH_FINALIZED
  -> ROOT_BUILT
  -> SAFE_QUEUED
  -> PUBLISHED
  -> FUNDED
  -> CLAIMABLE
  -> CLOSED
  -> RECONCILED
```

Invalid transitions:

```txt
ROOT_BUILT without anti-wash finalized
PUBLISHED without Safe authorization or accepted cooldown path
CLAIMABLE without funding sufficiency check
RECONCILED with non-zero unexplained delta
```

### Route event eligibility

```txt
UNPROCESSED
  -> INCLUDED
  -> EXCLUDED
  -> REVIEW_REQUIRED
  -> FINALIZED
```

### Supply invariant

```txt
UNKNOWN
  -> SYNCING
  -> HEALTHY
  -> DEGRADED
  -> BROKEN
  -> PAUSED
```

## 8. Observability

P0 metrics:

```txt
sw4p_earn_route_events_total
sw4p_earn_route_events_excluded_total
sw4p_earn_fee_events_total
sw4p_earn_fee_outbox_pending
sw4p_earn_reward_epoch_state
sw4p_earn_reward_root_hash
sw4p_earn_claims_total
sw4p_earn_claims_failed_total
sw4p_earn_supply_invariant_status
sw4p_earn_ntt_roundtrip_seconds
sw4p_earn_policy_snapshot_hash
sw4p_earn_dashboard_staleness_seconds
sw4p_earn_hot_key_usage_total
```

P0 alerts:

```txt
- supply invariant != healthy
- anti-wash stale > 10 minutes
- fee outbox stuck > 5 minutes
- reward distributor underfunded
- unexpected epoch root
- policy hash drift
- claims spike > 10x median
- dashboard stale > threshold
- operator endpoint unauthorized access
```

## 9. Security requirements

```txt
- Safe owns admin roles.
- Guardian can pause, not withdraw.
- Publisher cannot also fund, unless Safe/cooldown mitigated.
- Treasury actions are labelled and auditable.
- No bot has unlimited treasury access.
- CI gates are blocking before mainnet.
- All production secrets have rotation policy.
- All runbooks have drill evidence.
```

## 10. P0 done definition

P0 is technically done when:

```txt
1. Contract tests pass with P0 coverage.
2. Service integration tests pass with real Postgres harness.
3. NTT invariant test and canary pass.
4. Anti-wash worker liveness passes for 24h.
5. Reward epoch synthetic publish path passes.
6. Dashboard proof endpoint returns non-zero and source-separated metrics.
7. Pause/unpause drill passes.
8. Safe role table is exported.
9. External audit handoff artifacts are complete.
```
