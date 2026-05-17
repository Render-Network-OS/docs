# Circle Wallet Setup for sw4p Devnet-Frontier Cycle

**Date:** 2026-05-17T08:56:15Z
**Wallet Set Name:** `sw4p-devnet-frontier-2026-05-17`
**Wallet Set ID:** `29b8aae4-e37b-5e72-9653-c7157ad20c0c`
**API Environment:** Circle Sandbox (`api.circle.com` with `CIRCLE_TEST_API_KEY`)
**Custody Type:** `DEVELOPER` (developer-controlled Circle Programmable Wallets)
**Provisioning script:** `/tmp/circle-wallet-setup-2026-05-17/setup.mjs` (run from sw4p worktree with `.env.testnet` + `.env.secrets` + `.env.circle-sandbox.local` sourced)
**Provisioning artifacts:** `/tmp/circle-wallet-setup-2026-05-17/summary.json`, plus per-wallet raw API responses at `/tmp/circle-wallet-setup-2026-05-17/wallet-<name>.json`

## Provisioned wallets

| Name (Circle label) | Blockchain | Wallet ID | Address | State |
|---|---|---|---|---|
| sw4p-deployer-eth-sepolia  | ETH-SEPOLIA  | `576a3130-fa0f-569f-90d3-e4bd54c23cde` | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | LIVE |
| sw4p-deployer-base-sepolia | BASE-SEPOLIA | `6ff236e0-79c4-59ad-9885-7701b9ebae68` | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | LIVE |
| sw4p-deployer-arb-sepolia  | ARB-SEPOLIA  | `2226adeb-a0d7-5f6b-af8d-da217fdc08ca` | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | LIVE |
| sw4p-deployer-op-sepolia   | OP-SEPOLIA   | `9308e4d5-3bc4-5c61-9a13-2b3008d78af4` | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | LIVE |
| sw4p-deployer-avax-fuji    | AVAX-FUJI    | `7d138935-2b0f-5d2d-8d8f-a28daaf54e51` | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | LIVE |
| sw4p-deployer-matic-amoy   | MATIC-AMOY   | `a49bbb14-2a17-5874-b81f-1d24540e7e3f` | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | LIVE |
| sw4p-relayer-sol-devnet    | SOL-DEVNET   | `d9182ce5-eedf-5857-a835-63f308892a25` | `DF1hZMMiH3oXVU7n1NE7zbFnUf5ApxZQNvae4r9FPuy` | LIVE |

All 7 wallets returned `state: "LIVE"` on creation (i.e., key generation complete; ready to sign).

### Why all 6 EVM wallets share one address

Circle's developer-controlled EOA wallets in a single wallet set derive from the same entity-secret-encrypted key material per chain class. Because Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Avalanche Fuji, and Polygon Amoy all share the EVM address space (secp256k1 + Keccak-256), the same derivation produces the same address `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` on every EVM chain. This is intentional and expected behavior, not a duplicate-wallet bug. The 6 wallet IDs are distinct because Circle tracks per-chain state (nonces, balances, transaction history) even though the underlying address is the same.

The Solana relayer wallet has its own address (`DF1h...FPuy`) since SOL-DEVNET uses Ed25519 + base58 derivation, not secp256k1.

## Funding requirements per wallet

| Wallet | Required | Faucet URL |
|---|---|---|
| sw4p-deployer-eth-sepolia  | ~0.05 Sepolia ETH + 2 USDC      | https://www.alchemy.com/faucets/ethereum-sepolia + https://faucet.circle.com |
| sw4p-deployer-base-sepolia | ~0.01 Base-Sepolia ETH + 2 USDC | https://www.alchemy.com/faucets/base-sepolia + https://faucet.circle.com |
| sw4p-deployer-arb-sepolia  | (provisioned, not yet funded)   | https://www.alchemy.com/faucets/arbitrum-sepolia + https://faucet.circle.com |
| sw4p-deployer-op-sepolia   | (provisioned, not yet funded)   | https://www.alchemy.com/faucets/optimism-sepolia + https://faucet.circle.com |
| sw4p-deployer-avax-fuji    | minimal AVAX + 2 USDC           | https://faucet.avax.network/ + https://faucet.circle.com |
| sw4p-deployer-matic-amoy   | minimal MATIC + 2 USDC          | https://www.alchemy.com/faucets/polygon-amoy + https://faucet.circle.com |
| sw4p-relayer-sol-devnet    | 1 SOL + 5 USDC devnet           | `solana airdrop 1 DF1hZMMiH3oXVU7n1NE7zbFnUf5ApxZQNvae4r9FPuy --url devnet` + https://faucet.circle.com |

All 5 EVM deployer wallets share the same destination address, so a single faucet request to `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` on each network is sufficient.

## .env.testnet updates

The worktree's `.env.testnet` was updated locally (worktree-only; the modifications are not staged for commit) with:

- `CIRCLE_WALLET_SET_ID` and `WAAS_WALLET_SET_ID` (same value, alias for sw4p tooling that uses either name)
- `WAAS_WALLET_ID_{ETH_SEPOLIA,BASE_SEPOLIA,ARB_SEPOLIA,OP_SEPOLIA,AVAX_FUJI,MATIC_AMOY,SOL_DEVNET}`
- `WAAS_WALLET_ADDRESS_{ETH_SEPOLIA,BASE_SEPOLIA,ARB_SEPOLIA,OP_SEPOLIA,AVAX_FUJI,MATIC_AMOY,SOL_DEVNET}`

`PRIVATE_KEY=` is left empty with an inline deprecation comment directing operators to use the Circle Wallet IDs above.

## Reopens W0.c gate

Per W0.c evidence (`probes/circle-gas-sponsor.md`, commit `2dd5b455`), Circle Gas Station sponsorship was deferred because sw4p was using a raw Solana relayer keypair instead of Circle Wallets. Setting up `sw4p-relayer-sol-devnet` via Circle Wallets resolves that prerequisite. Kora retirement candidacy can now be re-evaluated in W8, or earlier if Gas Station sponsorship is confirmed to apply to this wallet on `SOL-DEVNET`.

## Security flag (separate)

The Hardhat default test account `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (whose private key is publicly known from the `test test test test test test test test test test test junk` mnemonic) is holding real testnet balances: 1812 USDC on Sepolia, 52 USDC on Base Sepolia, 783 USDC on Arbitrum Sepolia, 21 USDC on Fuji, 165 USDC on Polygon Amoy. These funds are at risk; anyone with the public mnemonic can sweep them. Recommend a sweep to the new `sw4p-deployer-*` Circle Wallet address (`0x1f9573941eb6e7927eea2f2933eb2434e3a3323d`) at the user's convenience. Separate task; not blocking the cycle.

## Next steps

1. User funds the 5 deployer wallets (ETH Sepolia, Base Sepolia, Avax Fuji, Polygon Amoy; Arb/Op Sepolia optional) and the Solana relayer via the faucets listed above. Approximate spend: ~$15 testnet USDC + minimal native gas on each chain.
2. After funding lands, W0.d baseline (5.2 + 5.3) and W1 Phase C (Tier 1 deploys) can proceed using Circle Wallets for signing instead of the empty `PRIVATE_KEY` / `SOLANA_RELAYER_PRIVATE_KEY`.
3. The sw4p-backend codebase already supports Circle Wallets through `sw4p-backend/src/waas.rs` / `scp.rs` and reads `WAAS_WALLET_ID_*` directly (see e.g. `sw4p-backend/contracts/scripts/deploy_multichain.ts` and `sw4p-backend/scripts/custom_solana_adapter.ts`); no additional integration work is required.

## API details

- `POST /v1/w3s/developer/walletSets` created the wallet set with idempotency key (fresh UUID v4) and entity-secret ciphertext encrypted with Circle's entity RSA public key (`RSA-OAEP-SHA256`). HTTP 201, returned `walletSet.id`.
- `POST /v1/w3s/developer/wallets` created each wallet with `{ walletSetId, blockchains: [bc], count: 1, accountType: "EOA" }` (omitted `accountType` for `SOL-DEVNET` since Solana Circle Wallets are inherently non-EOA). HTTP 201, returned `wallets[0].{id,address,state,blockchain}`.
- `PUT /v1/w3s/wallets/{id}` renamed each wallet to its operator label (`sw4p-deployer-*` / `sw4p-relayer-*`) and set `refId` to the same value. Confirmed via `GET /v1/w3s/wallets/{id}` post-rename for all 7 wallets.
- `GET /v1/w3s/developer/walletSets` returned `404 {"code":-1,"message":"Resource not found"}` during pre-creation lookup; the provisioning script logs this as a warning and proceeds to create. This sandbox 404 did not block any wallet creation; the wallet set was successfully created and is visible in subsequent per-wallet `GET` responses (each wallet returns the correct `walletSetId`). Filing this as a Circle sandbox quirk worth flagging if it persists.
