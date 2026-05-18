---
title: 555 token Solana mint metadata, read-only probe
date: 2026-05-18
status: Phase H prerequisite, captured
mint: CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
network: Solana mainnet
read_only: true
probe_method: JSON-RPC (api.mainnet-beta.solana.com) plus solana CLI cross-check
probe_slot: 420524976
explorer: https://solscan.io/token/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
---

# Headline

Captured canonical metadata for the 555 SPL token mint at slot 420524976 on Solana mainnet (read-only probe via JSON-RPC against api.mainnet-beta.solana.com, cross-checked with the locally installed solana CLI). This is the Phase H mobility prerequisite: token-mobility design (Wormhole NTT or Hyperlane) needs decimals and authority state to proceed.

# Probe results

| Field | Value |
| --- | --- |
| Mint | `CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2` |
| Token program | SPL Token (legacy), program id `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| Decimals | 6 |
| Supply (raw) | `989859465050629` |
| Supply (ui) | `989859465.050629` 555 |
| Mint authority | `null` (renounced) |
| Freeze authority | `null` (renounced) |
| Account type | `mint` |
| Executable | `false` |
| Probe slot | `420524976` (getAccountInfo); `420524986` (getTokenSupply) |

Account size is 82 bytes (legacy SPL mint layout), lamports 1461600 (rent-exempt minimum for an 82-byte account), `rentEpoch` is u64::MAX (rent-exempt sentinel). `isInitialized` is true.

# Phase H implications

- **Mint authority is null (renounced)**: the mint is permanently fixed at the current supply of 989,859,465.050629 555. No party can mint additional units on Solana. This forecloses any NTT burn-and-mint or hub-and-spoke design that requires Solana to be the minter for newly bridged inbound supply. For Phase H token mobility, the viable options are: (a) lock-and-mint with Solana as the hub (NTT or Hyperlane warp route in collateralized mode where Solana 555 is escrowed and synthetic 555 is minted on destination chains), or (b) release-after-burn where destination-chain bridges burn synthetics and a custodial vault on Solana releases pre-escrowed 555. Either way, no path requires reactivating mint authority, and any design proposing to does not match this on-chain state.
- **Freeze authority is null (renounced)**: freeze is permanently renounced. No party can freeze 555 token accounts on Solana. This is final and cannot be re-enabled. Operationally this means: no compliance-style freeze hooks are available on the Solana side; any sanctions or fraud response must live at the bridge / destination-chain layer, not at the SPL mint layer.

Token program is legacy SPL Token (Tokenkeg...), not Token-2022 (TokenzQd...). Phase H tooling that assumes Token-2022 features (transfer hooks, confidential transfers, interest-bearing) does not apply here; integrators target the legacy program only.

# Verification commands

```bash
# JSON-RPC, parsed account info (definitive)
curl -sS --max-time 15 -X POST https://api.mainnet-beta.solana.com \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: 555-closure-handover/1.0' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2",{"encoding":"jsonParsed","commitment":"finalized"}]}' \
  | jq .

# JSON-RPC, token supply
curl -sS --max-time 15 -X POST https://api.mainnet-beta.solana.com \
  -H 'Content-Type: application/json' \
  -H 'User-Agent: 555-closure-handover/1.0' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getTokenSupply","params":["CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2",{"commitment":"finalized"}]}' \
  | jq .

# Solana CLI cross-check (raw base64 account dump)
solana account CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2 \
  --url https://api.mainnet-beta.solana.com \
  --output json
```

Raw responses were captured locally to `/tmp/555-mint-account.json` and `/tmp/555-mint-supply.json` for this probe session; they are intentionally not committed.

# References

- Solscan: https://solscan.io/token/CQwwRomsuWsUCPYomZmRnwMns4ZCTASc31ExMvSysAF2
- SPL Token program: https://docs.solana.com/spl-token
- Wormhole NTT docs: https://wormhole.com/docs/learn/messaging/native-token-transfers/
- Hyperlane warp routes: https://docs.hyperlane.xyz/docs/protocol/warp-routes
