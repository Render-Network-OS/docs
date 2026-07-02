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
