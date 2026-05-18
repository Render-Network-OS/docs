# 555 canonical Solana mint probe

**Date:** 2026-05-17
**Mint (canonical):** `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`
**Non-canonical, do not use:** `555hm13LzCjHLs6JLFxR2rkxCpmkHmkzC1Hz4rCbVyjY` (user-flagged, excluded from probes here)
**Source of truth (primary RPC):** `https://api.mainnet-beta.solana.com` (Agave node, `apiVersion 4.0.0-rc.0`, slot 420484393 at probe time)
**Source of truth (fallback RPC, used only for `getTokenLargestAccounts` after 429 backpressure on the primary):** `https://solana-rpc.publicnode.com` (`apiVersion 3.1.14`, slot 420484527 at probe time)
**Probes executed:** read-only JSON-RPC (`getAccountInfo`, `getTokenSupply`, `getTokenLargestAccounts`, `getMinimumBalanceForRentExemption`) plus local `solana-cli 4.2.0-alpha.0` (`solana account ... --output json`) and `spl-token display`. No signed transactions, no wallet writes.

## Probe field table

| Field | Value | RPC method / source |
|---|---|---|
| Token program owner | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (SPL Token v3, classic, **not** Token-2022) | `getAccountInfo` → `result.value.owner` |
| Decimals (uint8) | **6** | `getAccountInfo` → `parsed.info.decimals`, also `getTokenSupply.value.decimals` |
| Supply (raw u64) | `989859465050629` | `getTokenSupply.value.amount`, also `parsed.info.supply` |
| Supply (human-scaled, 6 decimals) | `989,859,465.050629` 555 | `getTokenSupply.value.uiAmountString` |
| Mint authority | `null` (revoked) | `parsed.info.mintAuthority` |
| Freeze authority | `null` (revoked) | `parsed.info.freezeAuthority` |
| `isInitialized` | `true` | `parsed.info.isInitialized` |
| Mint account size | `82` bytes | `getAccountInfo.value.space` (matches SPL Token Mint layout) |
| Lamports balance | `1461600` | `getAccountInfo.value.lamports` |
| Minimum lamports for rent exemption (82 bytes) | `1461600` | `getMinimumBalanceForRentExemption(82)` |
| Rent-exempt status | **Rent-exempt** (lamports == rent-exemption minimum, and `rentEpoch == 18446744073709551615` = `u64::MAX` sentinel, which Agave reports for rent-exempt accounts) | derived from above |
| Executable | `false` | `getAccountInfo.value.executable` |

### Note on the SPL Token v3 vs Token-2022 distinction

Owner is `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (SPL Token v3, the "classic" program). It is **not** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Token-2022). This rules out Token-2022 extensions (transfer hooks, transfer fees, confidential transfers, interest-bearing, etc.) being part of the canonical 555 mint surface. The NTT manager constructor and the decimal verifier can both assume the classic SPL Token interface, no extension parsing required.

## Top 10 holders (largest accounts)

From `getTokenLargestAccounts` against the canonical mint. The primary RPC returned `429 Too many requests for a specific RPC call` repeatedly for this method; the table below is sourced from `https://solana-rpc.publicnode.com` (slot 420484527). Addresses listed are SPL token accounts (not wallet owners). All amounts have 6 decimals.

| Rank | Token account | Amount (raw) | Amount (UI, 6 dp) | Approx % of supply |
|---|---|---|---|---|
| 1 | `2NVdqi88cmnXfLnQhveuaUWzFe8AJYtVxguNU6TBoEt5` | `349269640575597` | `349,269,640.575597` | 35.28% |
| 2 | `EQ9LjREzwYHnsPKNnHevDoWtz3yaBQHKPuuWUmczQrGk` | `70041210598872`  | `70,041,210.598872`  | 7.07% |
| 3 | `gjrutFDmEyCehRg4M15Rv2DQ7F52jQcPsQwZGVQpQ2S`  | `58017812454703`  | `58,017,812.454703`  | 5.86% |
| 4 | `D1UZ7xgrzXfXvKuQaLuDD2mC4yZYBL1FkdNLTqyZujp7` | `48220599365663`  | `48,220,599.365663`  | 4.87% |
| 5 | `DYmb33PAtof52wRUo5ZPMYRQ89sMmzkHCjGu7osM6sPf` | `39656363818925`  | `39,656,363.818925`  | 4.00% |
| 6 | `BgbRwENnckXqjS2HEnh7V9ZAajSVfxXfekqaLzhVaEKY` | `23611107000000`  | `23,611,107.000000`  | 2.38% |
| 7 | `BxYe3CmZg5mHA9rwkDDNQuNFd22QYiaNtKDU6GRWxwQQ` | `22222222000000`  | `22,222,222.000000`  | 2.24% |
| 8 | `D3hYnKWjkTH8ihvZvkhk85hkxN9SsHe4Cv4GNyv6d8Qx` | `18517251969422`  | `18,517,251.969422`  | 1.87% |
| 9 | `3ws4KaG5epBtKqFeyxkELWPdfnHjnzQrR3SJ9gBV8huc` | `13652718150185`  | `13,652,718.150185`  | 1.38% |
| 10 | `9JdMpNmcFpN27oVxgakQVMmSQnVYLPLtGoi3hK5dNnDz` | `9900708194958`   | `9,900,708.194958`   | 1.00% |

Cumulative top-10 share: roughly 65.95% of circulating supply. (The RPC returned 20 entries; only the top 10 are tabulated here as specified; raw JSON below contains all 20.)

## Raw JSON-RPC responses (full capture)

### 1. `getAccountInfo` (encoding: `jsonParsed`) , primary RPC

```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": {
      "apiVersion": "4.0.0-rc.0",
      "slot": 420484393
    },
    "value": {
      "data": {
        "parsed": {
          "info": {
            "decimals": 6,
            "freezeAuthority": null,
            "isInitialized": true,
            "mintAuthority": null,
            "supply": "989859465050629"
          },
          "type": "mint"
        },
        "program": "spl-token",
        "space": 82
      },
      "executable": false,
      "lamports": 1461600,
      "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      "rentEpoch": 18446744073709551615,
      "space": 82
    }
  },
  "id": 1
}
```

### 2. `getTokenSupply` , primary RPC

```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": {
      "apiVersion": "3.1.14",
      "slot": 420484397
    },
    "value": {
      "amount": "989859465050629",
      "decimals": 6,
      "uiAmount": 989859465.050629,
      "uiAmountString": "989859465.050629"
    }
  },
  "id": 2
}
```

### 3. `getTokenLargestAccounts` , fallback RPC (primary returned 429)

Primary RPC response (recorded for completeness; the rate limiter rejected three sequential attempts including one with `commitment: finalized`):

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": 429,
    "message": "Too many requests for a specific RPC call"
  },
  "id": 3
}
```

Fallback RPC response (`https://solana-rpc.publicnode.com`):

```json
{
  "jsonrpc": "2.0",
  "result": {
    "context": {
      "apiVersion": "3.1.14",
      "slot": 420484527
    },
    "value": [
      {"address": "2NVdqi88cmnXfLnQhveuaUWzFe8AJYtVxguNU6TBoEt5", "amount": "349269640575597", "decimals": 6, "uiAmount": 349269640.575597, "uiAmountString": "349269640.575597"},
      {"address": "EQ9LjREzwYHnsPKNnHevDoWtz3yaBQHKPuuWUmczQrGk", "amount": "70041210598872",  "decimals": 6, "uiAmount": 70041210.598872,  "uiAmountString": "70041210.598872"},
      {"address": "gjrutFDmEyCehRg4M15Rv2DQ7F52jQcPsQwZGVQpQ2S",  "amount": "58017812454703",  "decimals": 6, "uiAmount": 58017812.454703,  "uiAmountString": "58017812.454703"},
      {"address": "D1UZ7xgrzXfXvKuQaLuDD2mC4yZYBL1FkdNLTqyZujp7", "amount": "48220599365663",  "decimals": 6, "uiAmount": 48220599.365663,  "uiAmountString": "48220599.365663"},
      {"address": "DYmb33PAtof52wRUo5ZPMYRQ89sMmzkHCjGu7osM6sPf", "amount": "39656363818925",  "decimals": 6, "uiAmount": 39656363.818925,  "uiAmountString": "39656363.818925"},
      {"address": "BgbRwENnckXqjS2HEnh7V9ZAajSVfxXfekqaLzhVaEKY", "amount": "23611107000000",  "decimals": 6, "uiAmount": 23611107.0,        "uiAmountString": "23611107"},
      {"address": "BxYe3CmZg5mHA9rwkDDNQuNFd22QYiaNtKDU6GRWxwQQ", "amount": "22222222000000",  "decimals": 6, "uiAmount": 22222222.0,        "uiAmountString": "22222222"},
      {"address": "D3hYnKWjkTH8ihvZvkhk85hkxN9SsHe4Cv4GNyv6d8Qx", "amount": "18517251969422",  "decimals": 6, "uiAmount": 18517251.969422,  "uiAmountString": "18517251.969422"},
      {"address": "3ws4KaG5epBtKqFeyxkELWPdfnHjnzQrR3SJ9gBV8huc", "amount": "13652718150185",  "decimals": 6, "uiAmount": 13652718.150185,  "uiAmountString": "13652718.150185"},
      {"address": "9JdMpNmcFpN27oVxgakQVMmSQnVYLPLtGoi3hK5dNnDz", "amount": "9900708194958",   "decimals": 6, "uiAmount": 9900708.194958,   "uiAmountString": "9900708.194958"},
      {"address": "FKQ6wU4hfNaY2wPgkcQu2FYXbonAJASRTaXzTaNvp4fJ", "amount": "9877692008547",   "decimals": 6, "uiAmount": 9877692.008547,   "uiAmountString": "9877692.008547"},
      {"address": "7NH2Dfaa4Frdyfk8fKTvHYuHNbGjPEPhEXYZPJbMwG2u", "amount": "9345795619742",   "decimals": 6, "uiAmount": 9345795.619742,   "uiAmountString": "9345795.619742"},
      {"address": "ABra7JVEy66ecDZaYNf7hq6KggecwZpxZviqaSnd9a7G", "amount": "9221151904255",   "decimals": 6, "uiAmount": 9221151.904255,   "uiAmountString": "9221151.904255"},
      {"address": "T6uDRq2A283KCr6gQpfSNRF4rt3fzWh1hpkjWuPe552",  "amount": "8152558887488",   "decimals": 6, "uiAmount": 8152558.887488,   "uiAmountString": "8152558.887488"},
      {"address": "EpZvyJj5Mc2aUHB2QrthTN9gmChhaqourPsQ2dXBGws1", "amount": "7688436465313",   "decimals": 6, "uiAmount": 7688436.465313,   "uiAmountString": "7688436.465313"},
      {"address": "C2ZTxgooRK2XUvVH8JNFtgsKxrE4tF3p2Y6JBuV2qe6c", "amount": "6483075552116",   "decimals": 6, "uiAmount": 6483075.552116,   "uiAmountString": "6483075.552116"},
      {"address": "E8ETBiKxD3efevYyhkPkWkhwSe3TWqucBVtcshceQDhZ", "amount": "6310688087171",   "decimals": 6, "uiAmount": 6310688.087171,   "uiAmountString": "6310688.087171"},
      {"address": "6z8K7b4TxvuRHTzwMdq2mrTg1rS2biu4ndW1ARiQx2Nk", "amount": "6187417706622",   "decimals": 6, "uiAmount": 6187417.706622,   "uiAmountString": "6187417.706622"},
      {"address": "AJrq2Ti1tTkGJkSUc7YBVzuanLAdt5kQR5RZjh3cpL95", "amount": "5691917729162",   "decimals": 6, "uiAmount": 5691917.729162,   "uiAmountString": "5691917.729162"},
      {"address": "7Xa2AZBeNMVRtj2uifDdxjDMMssASwqPdySJo5mwz8TD", "amount": "5575769919641",   "decimals": 6, "uiAmount": 5575769.919641,   "uiAmountString": "5575769.919641"}
    ]
  },
  "id": 3
}
```

### 4. `getMinimumBalanceForRentExemption(82)`

```json
{
  "jsonrpc": "2.0",
  "result": 1461600,
  "id": 4
}
```

### 5. `solana account ... --output json` (local CLI cross-check)

```json
{
  "pubkey": "CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2",
  "account": {
    "lamports": 1461600,
    "data": [
      "AAAAAAbFwc5jjSVn0mRosF65UdGijcxuEjSCtcZ1FJdw5ivyBbrKnUWEAwAGAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
      "base64"
    ],
    "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "executable": false,
    "rentEpoch": 18446744073709551615,
    "space": 82
  }
}
```

### 6. `spl-token display` (local CLI cross-check)

```text
SPL Token Mint
  Address: CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
  Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
  Supply: 989859465050629
  Decimals: 6
  Mint authority: (not set)
  Freeze authority: (not set)
```

All four data sources (primary RPC `getAccountInfo`, primary RPC `getTokenSupply`, local CLI `solana account`, local CLI `spl-token display`) agree on: owner = SPL Token v3, decimals = 6, supply = 989,859,465.050629, mint authority = null, freeze authority = null.

## Cross-reference URLs

- Solscan, token detail: https://solscan.io/token/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
- Solscan, account detail: https://solscan.io/account/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
- Solscan, top holders: https://solscan.io/token/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2#holders
- Birdeye, token detail: https://birdeye.so/token/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2?chain=solana
- Solana Explorer: https://explorer.solana.com/address/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
- Solana FM: https://solana.fm/address/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
- SolanaBeach: https://solanabeach.io/address/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2

## Reconciliation: which docs are wrong about 555 decimals

**Live mint truth (authoritative):** `decimals = 6`. The mint authority is revoked (`null`), so this value cannot be changed by any subsequent transaction. Decimals on a 6-decimal mint are immutable for the life of the mint.

### Docs that match live truth (6 decimals)

These are correct and need no edits on the decimal question:

- `docs/superpowers/specs/2026-05-08-rndrntwrk-network-ecosystem-design.md` (ecosystem design, line 131 and 153): `$555 = 6 decimals canonical across Solana mint, EVM ERC-20, NTT manager`. Correct.
- `docs/superpowers/plans/2026-05-13-sw4p-earn-wave-g-plan.md` (Wave G plan; lines 265, 288, 653, 655, 699, 706, 751, 930, 965, 1032, 1100, 1103, 1206, 1216, 1306, 1335, 1395): all reference `$555 = 6 decimals` consistently. Correct.
- `sw4p-earn/services/decimal-verifier/` (decimal verifier): enforces `$555 = 6 decimals` canonical across Solana mint, EVM ERC-20, NTT manager, Uniswap V3 pools, staking vault, rewards distributor, dashboard literals, burn-executor constants, routing constants. Correct.
- `sw4p/docs/ARCHITECTURE.md` (and all worktree copies) line 644: `the canonical 6-decimal target`. Correct.
- `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-h-rail-restoration-audit.md` lines 190 and 208: `decimals: 6` and `6 decimals; matches NTT 'amount in base units (6 decimals)' comment`. Correct.

### Docs that contradict live truth (need correction)

These claim 9 decimals and must be amended to 6:

- **`RNDRNTWRK_CANONICAL_TRUTH.md` line 543**, exact text: `- **Supply:** 1,000,000,000 (fixed, 9 decimals)`. **Wrong.** Live mint is 6 decimals, with current circulating supply `989,859,465.050629` (so the `1,000,000,000` headline figure is also stale by approximately 10.14M tokens, presumably reflecting burns since the canonical truth doc was authored).
- **`DOCS_AUDIT_CHANGELOG.md` line 558**, exact text: `Total supply: 1 billion, 9 decimals`. **Wrong** (downstream restatement of the canonical truth error).
- **`DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md` lines 226, 231, 237** describe the contradiction itself by quoting `9 decimals` from canonical truth. The audit doc is not wrong in itself (it correctly flagged the contradiction), but it should be updated to record that the live probe resolves the contradiction in favor of **6 decimals canonical** and the canonical truth manuscript is the doc that needs editing.

### Verdict, one sentence

**The ecosystem design + Wave G plan + decimal verifier are correct (6 decimals). `RNDRNTWRK_CANONICAL_TRUTH.md` (line 543) and `DOCS_AUDIT_CHANGELOG.md` (line 558) are wrong and must be amended from "9 decimals" to "6 decimals" with the supply figure refreshed from `1,000,000,000` to the live circulating figure (or to a "issued: 1,000,000,000 fixed; current circulating after burns: 989,859,465.050629" form if the original 1B is retained as historical context).**

## Phase H.0 gating note (555 NTT manager constructor)

The 555 NTT manager constructor needs an unambiguous decimal count. The reconciliation deck (`coordination-reconciliation-deck.md` line 250) explicitly carves out a `Phase H.0 , decimal-contradiction PR (consistency pass; ecosystem-aligned)` as a pre-requisite for Phase H item 1 (the 555 EVM token + NTT manager deployment).

**Recommendation for the Phase H.0 PR:**

1. **Authoritative value to encode:** `decimals = 6`, sourced from the live Solana mint `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2`. NTT requires decimal consistency across the source-chain mint and every destination-chain ERC-20. Setting the EVM 555 ERC-20 to 6 decimals also matches the decimal verifier's enforcement target, the Wave G plan, and the ecosystem design, so no other doc has to change to support this choice.
2. **Doc edits required by the consistency PR:**
   - `RNDRNTWRK_CANONICAL_TRUTH.md` line 543: change `9 decimals` to `6 decimals`. Optionally refresh the supply figure to reflect post-burn live circulating supply, or annotate it as `issued: 1,000,000,000 fixed (decimals 6); current circulating after burns at probe time 2026-05-17: 989,859,465.050629`. Add a footnote linking to this probe doc.
   - `DOCS_AUDIT_CHANGELOG.md` line 558: same fix.
   - `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/rail-scope-doc-audit.md` lines 226, 231, 237, 341: update the contradiction notes to record that the live mint probe (this doc) resolved the contradiction in favor of 6 decimals canonical and that `RNDRNTWRK_CANONICAL_TRUTH.md` is the file to edit.
3. **Authority posture to encode in the NTT manager:** mint authority and freeze authority are both `null` on the Solana side. The EVM 555 ERC-20 should either burn the equivalent privileges at deploy time, or hold them under the ecosystem authority Safe with public on-chain evidence of intent to revoke once cross-chain peers are wired and the supply invariant green-light is observed. The decimal-verifier and authority-monitor (CC-14) wiring already expects revoked-or-Safe-held authorities; this matches the Solana posture.
4. **Supply invariant baseline for the NTT manager:** record `989,859,465.050629 555` as the source-chain circulating supply at probe time (slot 420484393, 2026-05-17), to be used as the seed value for the NTT supply invariant check once a destination-chain peer is live. This figure is not 1B; the 10.14M-token gap is accounted for by historical burns from the canonical mint (cross-reference with the burn-executor records under `BURN_EVENT_*.md`).

**Phase H gate status after this probe:** the 555-decimals contradiction item in the agent-A reconciliation block (`coordination/agent-a-pr-reconciliation.md`, "555-token decimals contradiction resolved against live Solana mint truth") is **resolved against live truth: 6 decimals**. The remaining Phase H pre-conditions (PR #234 merge, PR #221 rebase or close, PR #222 close, `wp2.4-mainnet-wave-2026-05-17` opened as a PR, plus the documented consistency PR above) are unchanged by this probe.
