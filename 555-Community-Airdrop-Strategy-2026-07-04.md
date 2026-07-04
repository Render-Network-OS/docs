# 555 Community Airdrop Strategy (Solana)

Status: **plan approved in principle, saved for later execution.** 2026-07-04.
Owner: rndrntwrk. Blocked only on: Helius RPC + treasury balance readout + final recipient count.

Every figure below is measured (RPC / on-chain simulation / live price), not estimated.

---

## 1. Objective

Push **$555** to the **top 10 Solana coin communities** as a goodwill/awareness drop, funded from existing treasury holdings (supply is fixed, we cannot mint), with a **percentile-tiered** per-wallet amount in 555 repdigits only.

## 2. Locked decisions

- **Mode: PUSH** (we send directly and pay the ATA rent). Not claim. (Claim stays as the only lever if we ever want near-zero SOL and millions of wallets.)
- **Token: canonical mainnet 555** `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2` (confirmed correct), 6 decimals, classic SPL (Tokenkeg…), **mint + freeze authority revoked**, no transfer hook / fee / freeze. Plain SPL transfers.
- **Tiers (repdigits only, no arbitrary amounts):** **555 / 5,555 / 55,555**. Min 555, max 55,555. No sub-555 "55" tier (dropped per founder).
- **Tier by percentile within each community** (default split, tunable): top 5% → 55,555 · next 20% → 5,555 · remaining eligible → 555.
- **Supply is fixed.** All 555 comes from treasury; the treasury 555 balance caps reach.

## 3. The cost is ATA rent, and it is exact

On Solana every recipient needs a rent-exempt 555 token account (ATA). Almost none of these community members hold 555, so we create + fund one each. Rent is a locked deposit, not a fee.

**Measured, 2026-07-04:**
- ATA rent = **2,039,280 lamports = 0.00203928 SOL** each (`getMinimumBalanceForRentExemption(165)`).
- Base fee = 5,000 lamports per tx (1 signature).
- Priority fee = **0** right now (`getRecentPrioritizationFees` median/p75 = 0; add a small buffer only if sending during congestion).
- Batch size = **10 recipients per legacy tx** (measured: 1,174/1,232 bytes), **11/tx** with an address-lookup-table.
- SOL price = **$81.70** (live at time of writing; this is the only figure that drifts).

### Exact cost, 10,000 wallets (PUSH)

| Component | SOL | Note |
|---|---|---|
| ATA rent | 20.39280000 | 10,000 × 0.00203928 |
| Base fees | 0.00500000 | 1,000 txs × 5,000 lamports |
| Priority | 0.00000000 | network uncongested now |
| **Total** | **20.39780000 SOL** | **= $1,666.50 at $81.70/SOL** |

Rent is 99.98% of the SOL cost. Fees are ~half a cent. **Simulation script saved at** `tools/airdrop/airdrop-cost-sim.mjs` (see §8) — re-run it for any recipient count / live price.

### 555 tokens needed (from treasury, tier-dependent)

10,000 wallets at 5/20/75 = **43,050,000 $555** (500 × 55,555 + 2,000 × 5,555 + 7,500 × 555) ≈ 4.35% of the ~989M circulating supply.

### General formulas
- SOL out-of-pocket ≈ `recipients × 0.00203928 + ceil(recipients/10) × 0.000005`.
- 555 from treasury ≈ `recipients × 4,305` (at the 5/20/75 split).
- Reach ≈ `min(treasury_555_balance / 4,305, sol_budget / 0.00204)`.

## 4. Alchemy rent-sponsorship option (fronted, not free)

Alchemy **does** sponsor ATA rent on Solana (confirmed): it auto-rewrites top-level `createAccount` / `createAssociatedTokenAccount` so the paymaster funds the deposit. Mechanism: placeholder `payerKey` → `alchemy_requestFeePayer({policyId, serializedTransaction})` → sign + broadcast, under a Gas Manager policy with `maxSpendPerTxnUsd`.

**Catch: it is fronted then billed monthly.** *"Fees and rent are sponsored and added to your bill."* We still pay the full ~$1,667; it just moves from 20.4 SOL upfront in the spender wallet to a fiat line on the Alchemy invoice.
- Use it **only if SOL liquidity is the blocker** (no need to hold 20 SOL; settle fiat monthly). Alchemy account already wired at AWS `/sw4p/development/alchemy`.
- **Unverified before relying on it:** any markup over cost, and the per-policy monthly cap at ~10k-ATA scale. Verify by policy-testing one sponsored `createATA + transfer` batch.
- It is **not a saving**. Rent is unavoidable; someone funds every ATA.
- Docs: alchemy.com/docs/wallets/transactions/solana/sponsor-gas

## 5. Recipients: top 10 communities + snapshot

| # | Token | Mint | ~Holders |
|---|-------|------|----------|
| 1 | BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | ~985K |
| 2 | PENGU | `2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv` | ~850K |
| 3 | JUP | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` | ~700K |
| 4 | TRUMP | `6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN` | ~640K |
| 5 | WEN | `WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk` | ~1M base |
| 6 | WIF | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` | ~225K |
| 7 | RAY | `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` | ~230K |
| 8 | PYTH | `HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3` | ~190K |
| 9 | FARTCOIN | `9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump` | ~160K |
| 10 | POPCAT | `7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr` | ~136K |

(MEW `MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5`, JTO `jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL` are next in line. Verify every mint on Solscan at snapshot; watch for imitators like "President FARTCOIN".)

**Snapshot:** Helius DAS `getTokenAccounts` by mint, paginated 1,000/page, dedupe owners into a set, sum per owner. Record the slot (`withContext`) for a reproducible, un-gameable snapshot. Fallback for scale: `getProgramAccountsV2` (cursor, 10k/page); vanilla `getProgramAccounts` times out past ~100K accounts.

**Eligibility / sybil filter** (per community, before ranking):
- Drop dust below a min-balance floor.
- Exclude CEX hot/deposit wallets, the token's LP/AMM pool vaults, program/PDA accounts, team/treasury/vesting wallets, mint authority, burn `1nc1nerator11111111111111111111111111111111`.
- Cap same-funder / same-CEX-deposit clusters (conservative, to protect real users).
- Snapshot at an undisclosed past slot so eligibility can't be front-run.

## 6. Spender wallet

8 local 555 vanity keypairs in `wallets/` (+ 3 at repo root). The reward distributor's signing authority default is:

**`555V6EhaHLiCMq75Pg4reT7Q4YDMCH4Q7Spvrddfjg9r`** (`AUTHORITY_KEY_PATH` default; keypair `wallets/555V6Eha….json`).

Others present: `555dwh5…` (NTT devnet op), `555Tm1c…` (sw4p admin), `555jcCu…`, `555n9jc…`, `555wKE3…`, `555dqSy…`, `555Jk…`. No repo doc pins which holds the treasury 555, that's a balance question. **On resume: read all 8 wallets' 555 + SOL balances via the Helius RPC and identify the funded spender; top up if short.**

## 7. Distribution mechanics (extend, do not rebuild)

Base on the existing **`backend/cmd/airdrop-devnet/main.go`** distributor (snapshot → `rewards.Chunk` → `rewards.SendBatch` → epoch record; has `--dry-run`, `--batch-size`, authority-wallet loading, idempotent epoch record). Changes:
- Token USDC → 555 mint; recipient source points-DB → community snapshot; allocation pro-rata → the tier table.
- Batching: classic ~10-11/tx today; wire the **P-Token `batch`** path (`PTokenBatchMode::Enabled` seam in `sw4p-native`) to pack more token ops per tx where ATAs already exist.
- Landing: Helius send with dynamic priority (`getPriorityFeeEstimate`) + Sender/staked endpoint (or Jito bundles); confirm each batch, retry failures.
- Idempotency: per-(recipient, campaign) ledger so re-runs never double-pay; record every landed signature.
- Order: snapshot → filter → tier → **dry-run cost + recipient report (zero spend)** → fund spender (or Alchemy policy) → execute in batches → verify on-chain → publish recipient list + snapshot slot.

## 8. Resume checklist (what runs the moment we have the Helius RPC)

1. Read spender balances (all 8 wallets), identify funded sender.
2. Live snapshot of all 10 communities at one slot → dedupe, filter → **exact holder counts**.
3. Apply tiers, cap to `min(treasury_555, sol_or_alchemy_budget)` → **exact cost sheet** (re-run `airdrop-cost-sim.mjs` at the real count + live price).
4. **Founder approves the final numbers.**
5. Fund (direct SOL or Alchemy policy) → execute batched pToken transfers via Helius → live ledger + retries.
6. Verify + publish (recipient list, slot, signatures).

## 9. Still-open inputs (need founder / RPC)

- Treasury 555 balance available + confirm the sender wallet (read live).
- SOL budget (direct) or Alchemy sponsorship (fiat monthly) for rent.
- Final recipient count (sets exact SOL + 555 totals; 10k = 20.40 SOL + 43.05M 555).
- Final tier percentile cutoffs (default 5/20/75).
- Any community swaps in the top 10.

## Appendix: source facts (repo)

- 555 mint probe: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/555-mint-probe.md`.
- Existing distributor: `backend/cmd/airdrop-devnet/main.go`, `backend/internal/rewards/`.
- On-chain VRF claim design (alt model): `VRF-Raffle-Airdrop-Plan.md`.
- pToken batch seam: `sw4p/.../programs/sw4p-native/src/state.rs` (`PTokenBatchMode`).
- Cost simulation: `tools/airdrop/airdrop-cost-sim.mjs`.
