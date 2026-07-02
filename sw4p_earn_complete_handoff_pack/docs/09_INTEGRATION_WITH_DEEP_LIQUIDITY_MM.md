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
