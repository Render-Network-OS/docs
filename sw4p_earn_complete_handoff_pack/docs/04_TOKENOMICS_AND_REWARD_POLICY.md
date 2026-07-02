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
