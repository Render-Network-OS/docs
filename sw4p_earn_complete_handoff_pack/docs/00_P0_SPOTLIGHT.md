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
