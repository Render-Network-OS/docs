# SW4P Earn Complete Handoff Master

This is a concatenated master of the core docs. The folder also contains individual files, CSVs, schemas, diagrams, and runbooks.



---


# 00 - P0 Spotlight: What Must Ship Before SW4P Earn Can Be Trusted

## P0 thesis

SW4P Earn is not just a staking page. It is the trust layer that converts SW4P/555 economic activity into auditable rewards. If P0 is weak, Earn becomes dangerous: fake volume can farm rewards, incorrect cross-chain supply can be displayed as safe, APY can become misleading, and a single hot key can publish a malicious reward epoch.

P0 must therefore be treated as the launch product, not as a patch list.

## P0 scope in one sentence

Ship a narrow, audited, Base-first SW4P Earn loop where 555 staking, LP participation, real-fee capture, anti-wash filtering, reward distribution, dashboard proof, and emergency controls are all live, reconciled, and independently testable.

## P0 must deliver

```txt
1. Cross-chain supply truth
2. Contract safety for stake, LP, POL, and rewards
3. Real-fee and incentive separation
4. Anti-wash and market-maker exclusion
5. Safe-controlled reward publication
6. Policy-locked fee allocation
7. Reconciled dashboard proof
8. Stage-gated deploy and canary process
9. Pause / recovery / incident runbooks
10. Evidence pack for external audit and internal signoff
```

## P0 explicitly does not include

```txt
- open external solver marketplace
- multi-chain expansion beyond the first Base spoke
- public APY marketing before source separation is proven
- automated high-capital market making
- leveraged liquidity
- complex dynamic lock markets
- social quests as primary yield source
- unbounded incentives
- unreviewed extra treasury buckets
```

## Critical P0 blockers to close

### P0-1 - NTT burn-and-mint supply invariant

Current known risk: the plan and some code/audit language drift between lock-and-mint and burn-and-mint semantics. For the chosen topology, Solana is the canonical hub and Base is the first EVM spoke, with Wormhole NTT in burn-and-mint mode on both sides. Therefore, dashboard proof cannot use a simple `sum(EVM) <= SPL` or `locked >= minted` invariant.

Required invariant model:

```txt
global_initial_supply
  + total_protocol_mints
  - total_protocol_burns
  == sum(all_chain_live_supply)
```

For every bridge leg:

```txt
amount_burned_on_source == amount_minted_on_destination
```

P0 acceptance:

```txt
- Per-chain mint/burn counters exist.
- NTT supply indexer uses counters, not only totalSupply snapshots.
- Dashboard exposes invariant status and last verified leg.
- CI fails if decimal verifier or invariant test fails.
- Round-trip canary proves Solana -> Base -> Solana within threshold.
```

### P0-2 - Publisher hot-key dual-role elimination

Current known risk: a publisher hot key holding both `EPOCH_PUBLISHER_ROLE` and `FUNDER_ROLE` can become a reward-drain primitive if compromised.

Required target:

```txt
- Reward root publication is Safe-controlled or Safe-co-signed.
- Funding authority and epoch publication authority are separated.
- `treasury-router` and `rewards-publisher` do not share the same signing secret.
- Every epoch root can be independently recomputed from DB snapshot.
- Unknown/different root halts publication.
```

Acceptable designs, ranked:

```txt
A. Safe-only publishEpoch. Highest security, slower weekly ops.
B. Queue -> Safe sign -> publish. Best operational compromise.
C. Hot publisher with contract-level cooldown + Safe cancel. Acceptable only with monitoring and strict caps.
```

P0 recommendation: **B**. The publisher service computes the root and creates a Safe transaction. A Safe quorum publishes. The hot service cannot publish directly.

### P0-3 - Anti-wash production completion

SW4P Earn cannot pay rewards from unfiltered volume. The anti-wash worker must be real, persistent, tested, and visible.

Required:

```txt
- `route_events` table has anti-wash status fields.
- worker can select unprocessed events.
- worker can mark included/excluded.
- classifier recognizes affiliate/MM/POL wallets.
- MM and treasury route events are excluded from organic reward base.
- excluded volume is visible on dashboard.
- reward epoch builder reads only eligible volume.
- CI has an integration test proving fake volume cannot enter the reward root.
```

P0 acceptance:

```txt
A controlled wallet executes a synthetic wash loop in staging.
The anti-wash worker flags/excludes it.
The reward epoch builder excludes it.
The dashboard shows excluded volume > 0.
The reward proof for the attacker wallet is absent or zero.
```

### P0-4 - Contract hardening

Minimum contract state before public launch:

```txt
- `ProtocolOwnedLiquidityVault` has tests and pause semantics.
- `LPVault` has withdraw, share-inflation, multi-depositor, and adapter tests.
- `GlobalStakeVault` has multi-position, multiplier, cooldown, and early-exit tests.
- `RewardsDistributor` has underfund, duplicate claim, sourceTag, and wrong-root tests.
- `PoolRegistry` status changes are respected by quote/route services.
- `EVM555Token` owner/minter/pauser role path is Safe-mediated.
- One adapter instance per vault, or adapter refactor supports multiple authorized vaults.
```

### P0-5 - Economic-policy coherence

The economic model must be centralized and dashboard-visible.

Required P0 decisions:

```txt
- Are LP/staker real-fee rewards split 70/30 LP-vs-stake? If yes, make it an explicit policy constant.
- Is LP/staker capture 46.5 bps or should DEX LP yield be modeled differently because pool LPs receive direct fees?
- Which inflows are `REAL_FEE` vs `INCENTIVE`?
- Which buckets are active at launch?
- Which buckets are pending operator action only?
```

No hidden constants. No comment-only policy.

### P0-6 - Dashboard truth

The dashboard must be a proof dashboard, not a marketing page.

P0 dashboard surfaces:

```txt
- total 555 staked
- total LP position value
- real-fee APR
- incentive APR
- blended APR
- fee sources by bucket
- excluded / ineligible volume
- NTT supply invariant
- active reward epoch
- merkle root and epoch hash
- pending claims
- treasury allocation by bucket
- POL and MM fund balances
- last canary status
- pause state per contract/service
```

### P0-7 - Launch gates

No launch unless all are green:

```txt
1. Unit tests green.
2. Integration tests green.
3. Decimal verifier blocking in CI.
4. NTT round-trip canary green.
5. Anti-wash liveness green for 24h.
6. Rewards epoch synthetic close/retry/different-root drill green.
7. Pause/unpause drill green.
8. Dashboard reconciliation drill green.
9. Safe role rotation verified.
10. External audit scope ready with artifacts.
```

## P0 output definition

At the end of P0, the team should be able to hand an auditor this evidence pack:

```txt
- deployed addresses
- Safe role table
- contract test report
- service integration test report
- NTT invariant report
- decimal verifier report
- anti-wash report
- reward epoch root reproduction file
- dashboard screenshots
- canary tx hashes
- pause drill tx hashes
- secrets/role rotation evidence
- known residual risks
```

## P0 team structure

Recommended squads:

| Squad | Owner type | Focus |
|---|---|---|
| Protocol | Solidity lead | contracts, roles, adapters, reward distributor |
| Cross-chain | Protocol + infra | NTT supply invariant, decimals, canaries |
| Services | Backend lead | ledgers, anti-wash, fee router, epoch builder |
| Dashboard | Full-stack | proof UI, APY separation, epoch data |
| Ops/SRE | DevOps | CI, secrets, runbooks, drills, observability |
| Audit captain | Lead engineer | evidence pack, gate status, external scoping |

## P0 timebox

A realistic P0 should be planned as **2-4 focused engineering weeks**, depending on current repo state and whether Safe-mediated reward publication requires contract/interface changes. If the team discovers that the anti-wash worker or supply indexer needs heavier rewrites, do not shrink P0; shrink launch scope.



---


# 01 - SW4P Earn Product Spec / PRD

## Product summary

SW4P Earn is the reward and alignment layer for SW4P and 555. It lets users participate in the protocol's liquidity engine by staking 555, providing approved 555 liquidity, and eventually supporting protocol-owned liquidity and solver liquidity programs. Rewards must be sourced from real protocol economics and displayed honestly.

SW4P Earn should make one thing obvious to users and auditors:

```txt
Where did this yield come from?
```

The answer must be provable for every claim.

## Product goals

1. Increase productive 555 staking and liquidity.
2. Route real SW4P fees back to participants who support protocol liquidity.
3. Make 555 more useful as the alignment, staking, and coordination token.
4. Build a transparent fee-distribution system that separates real yield from incentives.
5. Connect the Deep Liquidity market-maker strategy to user participation without relying on fake volume.
6. Give the team an auditable launch surface for investors, community, and external reviewers.

## Product non-goals

```txt
- promise fixed yield
- imply legal equity ownership
- hide incentives inside real-fee APY
- pay rewards from wash volume
- launch unreviewed multichain complexity
- make treasury actions opaque
- create unlimited claims against treasury reserves
```

## User types

### 1. 555 staker

Locks/stakes 555 in `GlobalStakeVault` to earn a weighted share of the staking portion of real-fee rewards and disclosed incentives.

Needs:

```txt
- clear lock options
- multiplier explanation
- cooldown / early-exit rules
- real-fee APR vs incentive APR
- claim status
- risk disclosures
```

### 2. LP participant

Deposits 555 + quote asset into approved pools through `LPVault` or provides approved external LP evidence where supported.

Needs:

```txt
- supported pool list
- deposit ratio / quote asset requirements
- LP share accounting
- fee source breakdown
- withdrawal path
- impermanent loss disclosure
```

### 3. Protocol treasury / POL operator

Deploys protocol-owned liquidity into approved venues and funds reward/incentive buckets under policy.

Needs:

```txt
- bucket balances
- allocation status
- Safe role controls
- pause controls
- source tags
- proof dashboard
```

### 4. Auditor / analyst

Validates that APY, reward roots, supply, and fee routing are truthful.

Needs:

```txt
- on-chain addresses
- merkle root reproduction
- fee ledger exports
- anti-wash exclusions
- supply invariant proof
- policy snapshot hash
- stage gate artifacts
```

## Core user stories

### Staking

```txt
As a 555 holder,
I want to lock or stake 555 with transparent multipliers,
so I can earn a source-labelled share of real protocol fees and incentives.
```

Acceptance:

```txt
- user sees lock duration, multiplier, cooldown, and early-exit terms before action.
- user sees real-fee APR, incentive APR, and blended APR separately.
- user can claim rewards with proof tied to epoch and source tag.
```

### LP earning

```txt
As a liquidity provider,
I want to deposit approved 555 + quote liquidity,
so I can support deeper markets and earn pool and protocol rewards.
```

Acceptance:

```txt
- pool is registered and active.
- deposit creates correct LP shares.
- withdraw path is tested.
- rewards reflect eligible LP share and not fake volume.
```

### Reward claims

```txt
As a participant,
I want my claim to tell me whether it came from real fees or incentives,
so I am not misled by blended APY.
```

Acceptance:

```txt
- each claim leaf includes sourceTag.
- UI renders sourceTag.
- claim history can be exported.
```

### Treasury proof

```txt
As the protocol operator,
I want every routed fee to flow into a closed bucket registry,
so treasury policy cannot drift silently.
```

Acceptance:

```txt
- all buckets are typed and closed.
- new bucket requires PR and policy update.
- dashboard shows cumulative inflow/outflow per bucket.
```

### Anti-wash integrity

```txt
As a legitimate participant,
I want rewards to exclude fake volume,
so wash traders and protocol-controlled wallets cannot dilute me.
```

Acceptance:

```txt
- anti-wash worker is live.
- excluded volume is visible.
- reward epoch builder consumes eligibility results.
```

## Product surfaces

### Earn app

Required pages:

```txt
/earn                       overview
/earn/stake                 stake/lock 555
/earn/liquidity             LP deposit and position view
/earn/rewards               epochs, claims, proof
/earn/proof                 protocol proof dashboard
/earn/risk                  risk and disclosures
```

### Operator dashboard

Required pages:

```txt
/admin/earn                 internal status
/admin/earn/epochs          root generation and Safe queue status
/admin/earn/treasury        bucket allocations
/admin/earn/anti-wash       inclusion/exclusion queue
/admin/earn/canaries        NTT and launch gate status
/admin/earn/pauses          pause state and recovery checklist
```

### Public dashboard widgets

```txt
- Real-fee APR
- Incentive APR
- Blended APR
- 555 staked
- LP TVL
- Fee sources
- Excluded volume
- Active epoch
- Claimable rewards
- Supply invariant
- Last canary
- Contract pause status
```

## P0 product scope

P0 is Base-first and conservative.

```txt
Chains:
- Solana canonical 555 hub
- Base first EVM Earn spoke

Assets:
- 555
- USDC or approved quote asset

Contracts:
- EVM555Token
- GlobalStakeVault
- LPVault
- PoolRegistry
- ProtocolOwnedLiquidityVault
- RewardsDistributor
- UniswapV3PoolAdapter or equivalent adapter

Reward sources:
- SW4P protocol fee
- DEX LP fees harvested/credited
- Pump creator fee path as accounting-ready, if source exists
- disclosed incentive budget only if labelled

Participants:
- 555 stakers
- approved LP providers
- protocol treasury/POL

External solvers:
- not P0
```

## Success metrics

### Product metrics

| Metric | P0 target |
|---|---|
| Source-labelled claim coverage | 100% |
| APY displays split into real/incentive/blended | 100% |
| Claim proof reproducibility | 100% of epochs |
| Excluded-volume dashboard | live before public launch |
| Supply invariant dashboard | live before public launch |
| Stage-gate status dashboard | live before public launch |

### Economic metrics

| Metric | P0 target |
|---|---|
| Real fee capture | non-zero in canary before public marketing |
| LP/staker reward allocation | matches policy snapshot |
| Treasury bucket reconciliation | zero unexplained delta |
| Reward overpayment | zero |
| Ineligible volume paid | zero |

### Security metrics

| Metric | P0 target |
|---|---|
| Hot-key dual-role | removed or explicitly mitigated by Safe/cooldown |
| Critical audit blockers | zero open |
| Pause drill | passed |
| Reward root mismatch handling | passed |
| NTT canary | passed |
| CI hard gates | blocking, not advisory |

## Launch positioning

Correct messaging:

```txt
SW4P Earn lets 555 holders and approved liquidity providers participate in protocol fee flows. Yield is source-labelled: real protocol fees are shown separately from incentives.
```

Incorrect messaging:

```txt
Guaranteed APY.
Risk-free staking.
Protocol revenue is equity.
Market maker volume counts as organic.
All fees automatically go to stakers.
```



---


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



---


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



---


# 04 - Tokenomics and Reward Policy

## 1. Economic purpose

SW4P Earn exists to convert protocol economic activity into transparent user rewards while strengthening 555 liquidity and SW4P routing quality.

The product should reward users for useful participation:

```txt
- staking 555
- providing approved 555 liquidity
- supporting route liquidity
- holding through protocol growth
```

It should not reward fake participation:

```txt
- wash volume
- market-maker self-flow
- treasury cycling
- sybil loops
- non-approved pools
```

## 2. P0 revenue sources

P0 recognizes four upstream inflow categories.

| Source | P0 status | Notes |
|---|---|---|
| DEX LP fee | Active if LPVault/POL pool is live | Accrues through LP position; do not double-count through treasury router. |
| SW4P protocol fee | Active | Core real-fee source for Earn. |
| Pump creator fee | Accounting-ready | Include only if fee owner/source path is confirmed. |
| Product revenue bags | Accounting-ready | 555stream, Arcade, Alice, x402, subscriptions; only active when real revenue exists. |

## 3. Reward source tags

Every reward leaf must be tagged.

```txt
REAL_FEE
INCENTIVE
```

Optional later tags:

```txt
UTILITY_BOOST
RETROACTIVE_GRANT
PENALTY_REDISTRIBUTION
```

P0 rule: UI must never display a single APY without source separation.

Required APY object:

```json
{
  "realFeeAprPct": 12.4,
  "incentiveAprPct": 8.1,
  "blendedAprPct": 20.5,
  "windowSeconds": 604800,
  "epochId": 17,
  "sourceBreakdown": [
    {"source": "SW4P_PROTOCOL_FEE", "amountUsd": 1000},
    {"source": "DEX_LP_FEE", "amountUsd": 420}
  ]
}
```

## 4. Closed bucket registry

P0 buckets:

```txt
ARP
LP_STAKERS
BUYBACK
RESERVE_555
RESERVE_STABLE
TREASURY
POL
LP_INCENTIVES
MM_FUND
OPS_RESERVE
```

No new bucket can be added without:

```txt
- code change
- policy manifest change
- dashboard label
- accounting owner
- governance/multisig signoff
```

## 5. SW4P protocol fee allocation

Baseline policy from current plan/audit context:

```txt
SW4P protocol fee: 50 bps of routed volume
Allocation:
- ARP: 10% of fee
- LP_STAKERS: 45% of fee
- BUYBACK: 9% of fee
- RESERVE_555: 2.25% of fee
- RESERVE_STABLE: 2.25% of fee
- TREASURY: 31.5% of fee
```

P0 requirement: the above must live in one policy module and one policy manifest, not scattered constants.

## 6. LP_STAKERS sub-split

Current implementation context includes a default real-fee split:

```txt
70% LPVault participants
30% GlobalStakeVault stakers
```

P0 decision required:

```txt
Option A: Accept 70/30 as P0 policy.
  - Move to shared policy constant.
  - Display in dashboard.
  - Include in epoch snapshot.

Option B: Make split explicit per epoch.
  - Epoch builder requires split input.
  - Safe signs split with root.
  - Dashboard displays per-epoch split.

Option C: Delay LP/stake sub-split and use one LP_STAKERS pool.
  - Not recommended because contract/service already separate LP/stake accounting.
```

Recommendation: **Option A for P0**, with a governance-ready path to Option B later.

## 7. DEX LP fee modeling issue

P0 must settle the DEX fee model before dashboard claims are public.

The modeling question:

```txt
If a 30 bps DEX fee accrues directly to LP positions, does Earn count all 30 bps as LP real-fee yield, or only an 80% modeled share?
```

Required decision:

```txt
- If LPs receive direct DEX fees, dashboard should show direct LP fee yield separately from routed SW4P reward yield.
- Do not subtract an implicit 20% unless there is actual code or accounting that routes that 20% elsewhere.
- Do not count the same DEX fee both as direct LP yield and as treasury-routed reward.
```

Recommended P0 display:

```txt
Real-fee APR
├── Direct LP fee APR
├── SW4P protocol reward APR
└── Other real-fee APR

Incentive APR
├── 555 incentive APR
└── LP incentive APR

Blended APR = Real-fee APR + Incentive APR
```

## 8. Pump creator fee policy

Pump creator fee should be included only after confirming:

```txt
- fee owner address
- collection path
- conversion path if asset is not reward asset
- bucket allocation
- anti-wash exclusion interaction
- dashboard source label
```

Proposed P0 allocation if activated:

```txt
POL: 45%
BUYBACK: 20%
LP_INCENTIVES: 15%
MM_FUND: 10%
OPS_RESERVE: 10%
```

## 9. Product revenue bag policy

Product revenues can flow into Earn only after product-side accounting exists.

Proposed allocation:

```txt
POL: 40%
BUYBACK: 20%
LP_INCENTIVES: 15%
MM_FUND: 10%
RESERVE_555: 5%
RESERVE_STABLE: 5%
OPS_RESERVE: 5%
```

## 10. MM_FUND policy

The MM_FUND is where SW4P Earn connects to Deep Liquidity from the Market Maker.

P0 treatment:

```txt
- bucket exists
- accounting exists
- dashboard exists
- automated high-capital trading does not exist yet
```

P1/P2 treatment:

```txt
- MM_FUND can allocate to approved 555 liquidity and solver buckets under caps.
- MM/POL-controlled volume is excluded from organic Earn rewards.
- MM returns can be reported separately from user rewards.
```

## 11. Anti-wash reward eligibility

Eligible volume:

```txt
- real third-party routed SW4P volume
- real third-party DEX activity in approved pools
- real product revenue from paying users
```

Ineligible volume:

```txt
- self-trades
- protocol treasury routes
- market-maker rebalances
- POL operations
- affiliated wallet loops
- known wash clusters
- sybil clusters above threshold
```

P0 rule:

```txt
Ineligible volume may still be useful for liquidity/accounting, but it must not farm rewards.
```

## 12. Policy snapshot

Every epoch must bind to:

```txt
- policy version
- policy hash
- bucket allocation table
- LP/stake split
- eligible fee sources
- excluded fee sources
- sourceTag definitions
- active contract addresses
```

Policy drift response:

```txt
- mismatch pages on-call.
- epoch build is blocked until reviewed.
- dashboard shows policy drift banner.
```



---


# 05 - Security, Risk, and Audit Remediation

## 1. Security posture

SW4P Earn touches user funds, treasury funds, reward accounting, and cross-chain supply. It should be treated as a DeFi launch, not a web-app launch.

The main risks are:

```txt
- unbacked 555 supply due to wrong NTT invariant
- malicious or mistaken reward root
- fake volume entering rewards
- treasury/router misallocation
- LP vault share-inflation or withdraw bugs
- adapter misconfiguration
- misleading APY
- ops endpoint exposure
- insufficient pause/recovery paths
```

## 2. Threat model layers

```txt
Layer 1: Plan invariants
Layer 2: Smart contracts
Layer 3: Services and DB
Layer 4: Ops and key management
Layer 5: Dashboard and public claims
```

A failure in one layer must be caught by another layer.

Example:

```txt
If anti-wash service fails, reward epoch builder must refuse to build.
If reward root differs from recomputed DB snapshot, publication must halt.
If supply invariant is unknown, dashboard must not show green.
```

## 3. Critical P0 risks

### R-001 - Wrong cross-chain supply invariant

Impact:

```txt
Silent false-positive dashboard, possible unbacked supply, public trust failure.
```

Mitigation:

```txt
- burn-and-mint aware invariant
- per-chain mint/burn counters
- round-trip canary
- CI gate
- dashboard proof
```

### R-002 - Publisher hot-key dual-role

Impact:

```txt
Compromised key can publish malicious epoch root and enable drain of reward balances.
```

Mitigation:

```txt
- Safe-mediated root publishing
- split funder and publisher secrets
- cooldown/challenge if direct publish remains
- root recomputation monitor
- alert on unknown root
```

### R-003 - Anti-wash inert or stale

Impact:

```txt
Fake volume farms rewards, dilutes legitimate LP/stakers, invalidates tokenomics.
```

Mitigation:

```txt
- implement persistence
- worker liveness metric
- reward build stale check
- synthetic wash integration test
- excluded volume dashboard
```

### R-004 - LP/POL contract coverage gaps

Impact:

```txt
share inflation, stuck funds, adapter misuse, untested withdraw paths.
```

Mitigation:

```txt
- add tests
- add pausable POL
- block adapter swap with active LP
- set adapter deployment topology
- external audit before scale
```

### R-005 - Misleading APY or policy drift

Impact:

```txt
users misunderstand yield, regulatory/trust risk, community backlash.
```

Mitigation:

```txt
- APY source separation
- sourceTag in claim leaves
- policy manifest hash
- dashboard labels
- drift alert
```

## 4. Role model

Required roles:

```txt
DEFAULT_ADMIN_ROLE     Safe / timelock
POLICY_ROLE            Safe / governance
PAUSER_ROLE            Guardian Safe, pause-only
POOL_ADMIN_ROLE        Safe / protocol ops
POOL_OPERATOR_ROLE     limited operator, no treasury withdraw
TREASURY_ROLE          Treasury Safe
FUNDER_ROLE            restricted funding path, not same as publisher
EPOCH_PUBLISHER_ROLE   Safe/co-signed/cooldown, not raw hot key
AUDITOR_READONLY       no write access
```

P0 rule:

```txt
No single hot key should be able to create a reward root and fund the reward contract in a way that drains balances.
```

## 5. Key management requirements

```txt
- production Safe signer list exported
- hot key inventory exported
- every hot key has purpose, scope, max loss, rotation path
- secrets have 90-day max age or explicit exception
- service account IAM is least privilege
- no shared secret across treasury-router and rewards-publisher
- break-glass process documented
```

## 6. Contract audit checklist

### `EVM555Token`

```txt
- NTT minter only
- decimals fixed
- pausable behavior
- owner is Safe
- permit safe if present
```

### `GlobalStakeVault`

```txt
- multiplier correctness
- totalWeighted invariant
- cooldown/early exit
- no lock bypass
- pause behavior
- emergency withdraw policy
```

### `LPVault`

```txt
- deposit ratio
- share mint formula
- share inflation
- withdraw/redeem
- multi-depositor ordering
- adapter trust
- reentrancy
- pause behavior
```

### `ProtocolOwnedLiquidityVault`

```txt
- source-tagged funding
- withdraw allowlist
- pause path
- adapter trust
- no tests gap closed
```

### `RewardsDistributor`

```txt
- leaf hash correctness
- sourceTag correctness
- duplicate claim prevention
- wrong proof rejection
- underfund behavior
- publish role safety
- funding sufficiency
```

## 7. Service audit checklist

```txt
- all workers idempotent
- all DB writes have idempotency keys
- route_event -> fee_event -> reward_leaf traceable
- anti-wash cannot fail open
- epoch builder deterministic
- dashboard never lies green on unknown state
- ops endpoints authenticated
- policy hash drift monitored
- outbox cannot double dispatch
```

## 8. Incident response triggers

Immediate pause / halt if:

```txt
- supply invariant broken
- reward root mismatch
- anti-wash stale past threshold during epoch close
- unexpected publisher transaction
- reward distributor underfunded after publication
- unauthorized ops endpoint access
- policy hash drift during active epoch
- claims spike > 10x median without matching real volume
```

## 9. External audit handoff

Auditor must receive:

```txt
- full repo at commit hash
- deployed addresses
- Safe role table
- contract tests and coverage
- service integration test logs
- policy manifest
- runbook evidence
- canary tx hashes
- known risk register
- exact P0 acceptance gates
```

## 10. Residual risks after P0

Even after P0, communicate internally:

```txt
- LPs face impermanent loss.
- Rewards depend on real volume and may fall.
- Cross-chain infrastructure has guardian/bridge dependencies.
- Product revenue bag inflows are variable and may be zero initially.
- Incentive APR can end or be reduced.
```



---


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



---


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



---


# 08 - API and Data Model

## API design principles

1. Public APIs can expose proof and status.
2. Operator APIs require authentication, authorization, rate limits, and audit logs.
3. Every financial number must include source, timestamp, chain, and confidence/status.
4. APY must always be split.
5. Dashboard must distinguish zero, unknown, stale, and healthy states.

## Public API skeleton

### `GET /v1/earn/overview`

Returns global Earn status.

```json
{
  "status": "HEALTHY",
  "chainTopology": {"hub": "solana", "spokes": ["base"]},
  "tvlUsd": "0",
  "total555Staked": "0",
  "totalLpUsd": "0",
  "activeEpochId": 0,
  "apy": {
    "realFeeAprPct": 0,
    "incentiveAprPct": 0,
    "blendedAprPct": 0
  },
  "supplyInvariant": {"status": "UNKNOWN"},
  "lastUpdated": "2026-01-01T00:00:00Z"
}
```

### `GET /v1/earn/positions/{account}`

Returns staking, LP, rewards, and claim history.

### `GET /v1/earn/rewards/epochs`

Returns epoch list.

### `GET /v1/earn/rewards/{epochId}/{account}`

Returns account reward summary for epoch.

### `GET /v1/earn/claims/proof/{epochId}/{account}`

Returns claim proof.

```json
{
  "epochId": 17,
  "account": "0x...",
  "asset": "0x...",
  "amount": "1000000",
  "sourceTag": "REAL_FEE",
  "proof": ["0x..."],
  "root": "0x...",
  "claimContract": "0x..."
}
```

### `GET /v1/earn/policy/snapshot`

Returns policy snapshot and hash.

### `GET /v1/dashboard/555-proof`

Returns dashboard proof object:

```json
{
  "supplyInvariant": {},
  "feeSources": [],
  "excludedVolume": {},
  "activeEpoch": {},
  "bucketBalances": [],
  "pauseStatus": [],
  "canaryStatus": []
}
```

## Operator API skeleton

### `GET /v1/ops/anti-wash/status`

Requires ops auth.

### `POST /v1/ops/epochs/{epochId}/build`

Builds deterministic root from finalized snapshot.

### `POST /v1/ops/epochs/{epochId}/queue-safe`

Queues Safe transaction for root publication.

### `GET /v1/ops/treasury-pending`

Requires ops auth; returns pending operator actions.

### `POST /v1/ops/reconcile`

Runs reconciliation and returns diff.

## Data model entities

### `route_events`

```txt
route_event_id
source_tx_hash
destination_tx_hash
source_chain
destination_chain
input_token
output_token
input_amount
output_amount
notional_usd
user_wallet
wallet_cluster_id
route_type
created_at
anti_wash_status
anti_wash_evaluated_at
eligibility_reason
```

### `fee_events`

```txt
fee_event_id
route_event_id
source_type
source_tx_hash
chain_id
asset
amount_raw
amount_usd
fee_bps
policy_version
idempotency_key
created_at
```

### `fee_outbox`

```txt
outbox_id
fee_event_id
bucket
asset
amount_raw
status
attempt_count
last_error
idempotency_key
created_at
dispatched_at
```

### `reward_epochs`

```txt
epoch_id
start_ts
end_ts
state
policy_hash
snapshot_hash
merkle_root
total_real_fee_raw
total_incentive_raw
safe_tx_hash
published_tx_hash
funded_tx_hash
created_at
published_at
```

### `reward_leaves`

```txt
leaf_id
epoch_id
account
asset
amount_raw
source_tag
leaf_hash
proof_json
eligible_basis_json
created_at
```

### `supply_counters`

```txt
counter_id
chain_id
token
minted_raw
burned_raw
live_supply_raw
last_block
last_tx_hash
updated_at
```

Full SQL is in `schemas/data_model.sql`.

## Error handling

APIs must return status classes:

```txt
HEALTHY
STALE
UNKNOWN
DEGRADED
BROKEN
PAUSED
```

No endpoint should quietly return zero for unknown state.

Example:

```json
{
  "status": "UNKNOWN",
  "value": null,
  "reason": "anti_wash_worker_lag_exceeded_threshold"
}
```



---


# 09 - Integration with Deep Liquidity from the Market Maker

## Relationship between SW4P Earn and the Deep Liquidity Engine

The Deep Liquidity Engine decides where capital should go. SW4P Earn decides how productive participation and real fee flows are measured, labelled, and distributed.

```txt
Deep Liquidity Engine
  -> creates better liquidity and solver depth
  -> generates real routing/LP/MM revenue
  -> routes eligible revenue into Earn buckets
  -> excludes MM/POL self-flow from organic rewards
  -> reports capital performance to dashboard
```

## Shared concepts

| Deep Liquidity concept | SW4P Earn representation |
|---|---|
| 555 liquidity engine | LPVault, POL, approved pools, LP rewards |
| Solver liquidity engine | future solver bucket rewards, route fee attribution |
| Protocol-owned MM | MM_FUND, POL, excluded organic volume |
| Treasury allocation | closed bucket registry |
| Fee accounting | fee-ledger + treasury-router |
| Proof dashboard | Earn proof dashboard |
| Anti-fake-volume rule | anti-wash worker + MM exclusion |

## P0 integration

P0 should only create the accounting foundation.

P0 includes:

```txt
- MM_FUND bucket exists.
- POL bucket exists.
- MM/POL wallets can be classified and excluded from organic rewards.
- LP/POL balances are visible.
- revenue source tags can distinguish real fees from incentives.
```

P0 does not include:

```txt
- autonomous MM trading
- external solver rewards
- dynamic reallocation of user rewards based on MM performance
- open MM vault deposits
```

## P1 integration

P1 can add:

```txt
- POL performance reporting
- approved market-maker wallet registry
- market-maker exclusion dashboard
- simple MM_FUND allocation report
- capped treasury liquidity deployment reporting
```

## P2 integration

P2 can add:

```txt
- solver bucket rewards
- route liquidity staking
- external solver bonds
- capital efficiency scoring
- dynamic fee-sharing based on route profitability
```

## Critical design rule

Market maker activity can support liquidity, but it must not farm Earn rewards as organic user volume.

Correct:

```txt
MM rebalances inventory.
System records MM flow as market_maker.
MM performance is reported in MM_FUND/POL analytics.
No organic user reward is paid from that fake volume.
```

Incorrect:

```txt
MM trades 555 back and forth.
Route ledger records it as organic.
Reward epoch pays stakers/LPs from that volume.
Dashboard claims growth.
```

## Revenue path from Deep Liquidity to Earn

```txt
Real third-party swap
  -> SW4P fee
  -> fee-ledger
  -> treasury-router
  -> LP_STAKERS / POL / BUYBACK / RESERVES / MM_FUND
  -> rewards epoch
  -> source-tagged claim
```

## Capital feedback loop

```txt
Earn grows 555 stake and LP depth
  -> 555 liquidity improves
  -> SW4P route quality improves
  -> more real volume
  -> more real fees
  -> more rewards and POL/MM funding
  -> deeper liquidity
```

## Dashboard integration

Add these P1/P2 widgets after P0:

```txt
- POL deployed capital
- MM_FUND capital
- MM excluded volume
- solver bucket contribution
- route profitability
- fee source by strategy
- liquidity depth improvement
- net revenue after gas/rebalance
```



---


# 10 - Team Handoff Notes

## What the team should understand immediately

SW4P Earn is closer to a financial accounting and reward-distribution system than a normal staking frontend. The frontend matters, but the hard part is the correctness loop underneath it.

The team should not build this as:

```txt
stake -> show APY -> claim token
```

The correct model is:

```txt
real economic event -> eligibility -> fee policy -> source-tagged epoch -> claim -> proof dashboard
```

## First meeting agenda

1. Confirm P0 scope.
2. Assign P0 owners.
3. Convert `P0_BACKLOG.csv` to GitHub issues.
4. Review P0 critical blockers.
5. Decide LP/stake split policy.
6. Decide reward publication security design.
7. Freeze chain topology.
8. Start cross-chain invariant fix immediately.

## Decisions needed from leadership

### D-001 - LP/stake real-fee split

Recommendation: accept 70/30 for P0 but make it explicit.

### D-002 - Reward root publication

Recommendation: queue-to-Safe publish path for P0.

### D-003 - DEX LP fee modelling

Recommendation: separate direct LP fee APR from protocol-routed reward APR.

### D-004 - Pump creator fee activation

Recommendation: accounting-ready but not included in public APR until fee owner/source path is confirmed.

### D-005 - Launch posture

Recommendation: Stage 3 public Earn only after P0 gates green and a low-value mainnet canary has completed.

## Suggested GitHub labels

```txt
p0-launch-blocker
p0-security
p0-crosschain
p0-contracts
p0-services
p0-anti-wash
p0-dashboard
p0-ops
p0-policy
p1-post-launch
p2-scale
needs-founder-decision
needs-safe-tx
needs-auditor-review
```

## Suggested branch naming

```txt
feat/earn-p0-crosschain-invariant
feat/earn-p0-reward-safe-publish
feat/earn-p0-anti-wash-persistence
feat/earn-p0-pol-vault-hardening
feat/earn-p0-policy-manifest
feat/earn-p0-proof-dashboard
feat/earn-p0-ci-gates
```

## Engineering order

Start with:

```txt
1. Cross-chain invariant
2. Anti-wash persistence
3. Reward root Safe path
4. Contract test gaps
5. Policy manifest
6. Dashboard proof
7. Drills and launch gates
```

Do not start with cosmetic dashboard changes. Proof data comes first.

## Handoff statement for team

```txt
P0 is the launch product. We are not shipping Earn until the team can prove source-labelled rewards from real eligible volume, correct cross-chain supply, Safe-controlled epoch publication, and a dashboard that shows truth rather than marketing metrics. Every P0 issue must close with an evidence artifact.
```
