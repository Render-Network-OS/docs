# W1 Phase C: Tier 1 V4.1 deploys via Circle SCP - STATUS: DONE_WITH_CONCERNS (BLOCKED on Gas Station)

**Date:** 2026-05-17  
**Worktree:** `.worktrees/sw4p-devnet-frontier-2026-05-16`  
**Goal:** Deploy `ZapAndBridgeV41` to Ethereum Sepolia and Base Sepolia via Circle Smart Contract Platform (SCP), bypassing the sw4p-backend entirely, with Gas Station sponsoring deploy gas (per operator direction).

## Outcome

Both deploys returned Circle SCP API error `code: 177025, "the asset amount owned by the wallet is insufficient for the transaction"` on the very first `POST /v1/w3s/contracts/deploy` call. No on-chain transactions were broadcast. The contract is compiled and the request payload is well-formed (Circle accepted the ABI, bytecode, and constructor params on validation); the only failure mode is wallet funding / Gas Station policy.

## Root cause

The operator instruction "Circle Gas Station policies are already configured on the Circle Wallets we provisioned, so EVM deployer wallets do NOT need pre-funding" does not match the live state of the Circle account:

1. All 6 provisioned EVM deployer wallets (eth-sepolia, base-sepolia, arb-sepolia, op-sepolia, avax-fuji, matic-amoy) are `accountType: EOA`, not `SCA`. Verified via `GET /v1/w3s/wallets?walletSetId=29b8aae4-e37b-5e72-9653-c7157ad20c0c`.
2. Circle Gas Station only sponsors transactions for **Smart Contract Account (SCA)** wallets. EOA wallets must pay their own gas in native asset (ETH on Ethereum/Base Sepolia, etc.). This is a Circle product constraint, not a configuration gap.
3. `GET /v1/w3s/gasStation/policies` returns `code: -1, "Resource not found"`, confirming no Gas Station policies are visible on this developer account regardless. The same endpoint at `api-sandbox.circle.com` also 404s.
4. Native ETH balance is `0x0` on both Ethereum Sepolia and Base Sepolia for the shared deployer address `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` (verified via `eth_getBalance` against `publicnode.com` RPCs).

## Constructor signature verified from source

`sw4p-backend/contracts/contracts/ZapAndBridgeV41.sol:86-99` and `Sw4pV4Controls.sol:122-128`:

```solidity
constructor(
    address _universalRouter,
    address _permit2,
    address _tokenMessenger,
    address _messageTransmitter,
    address _usdc,
    address _weth,
    address initialAdmin,
    address initialPauser,
    address initialTreasury,
    uint48  defaultAdminDelay_
) Sw4pV4Controls(initialAdmin, initialPauser, initialTreasury, defaultAdminDelay_)
```

10 parameters total. Cross-checked against the compiled ABI in `artifacts/contracts/ZapAndBridgeV41.sol/ZapAndBridgeV41.json`, types and order match exactly.

## Compilation

```bash
cd sw4p-backend/contracts && npx hardhat compile  # Nothing to compile (cache hit, prior compile is current)
# Artifact: artifacts/contracts/ZapAndBridgeV41.sol/ZapAndBridgeV41.json
# Bytecode: 43,322 chars (>50% solc baseline, real compiled output)
# ABI: 22,317 chars, 104 entries, constructor at index N matches source signature
```

## Constructor parameters submitted per chain (from registry/tier1.json)

### Ethereum Sepolia

| Index | Param | Value | Source |
|---|---|---|---|
| 0 | _universalRouter | `0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b` | tier1.json:ethereum-sepolia.universalRouter |
| 1 | _permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | tier1.json:ethereum-sepolia.permit2 |
| 2 | _tokenMessenger | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | tier1.json:ethereum-sepolia.tokenMessengerV2 |
| 3 | _messageTransmitter | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | tier1.json:ethereum-sepolia.messageTransmitterV2 |
| 4 | _usdc | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | tier1.json:ethereum-sepolia.usdc |
| 5 | _weth | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` | tier1.json:ethereum-sepolia.weth |
| 6 | initialAdmin | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | Circle wallet EOA |
| 7 | initialPauser | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | Circle wallet EOA (rotate via timelock) |
| 8 | initialTreasury | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | Circle wallet EOA (rotate via timelock) |
| 9 | defaultAdminDelay_ | `86400` (uint48) | Matches `TIMELOCK_DELAY = 1 day` |

### Base Sepolia

| Index | Param | Value | Source |
|---|---|---|---|
| 0 | _universalRouter | `0x95273d871c8156636e114b63797d78D7E1720d81` | tier1.json:base-sepolia.universalRouter |
| 1 | _permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | tier1.json:base-sepolia.permit2 |
| 2 | _tokenMessenger | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | tier1.json:base-sepolia.tokenMessengerV2 |
| 3 | _messageTransmitter | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | tier1.json:base-sepolia.messageTransmitterV2 |
| 4 | _usdc | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | tier1.json:base-sepolia.usdc |
| 5 | _weth | `0x4200000000000000000000000000000000000006` | tier1.json:base-sepolia.weth (OP-stack canonical WETH) |
| 6 | initialAdmin | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | Circle wallet EOA |
| 7 | initialPauser | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | Circle wallet EOA |
| 8 | initialTreasury | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` | Circle wallet EOA |
| 9 | defaultAdminDelay_ | `86400` (uint48) | Matches `TIMELOCK_DELAY = 1 day` |

## Circle SCP request shape

```
POST https://api.circle.com/v1/w3s/contracts/deploy
Authorization: Bearer ${CIRCLE_TEST_API_KEY}
Content-Type: application/json

{
  "idempotencyKey": "<UUIDv4>",
  "name": "ZapAndBridgeV41",
  "description": "sw4p canonical V41 EVM contract W1 Tier 1 deploy via SCP",
  "walletId": "<deployer wallet UUID>",
  "abiJson": "<JSON-encoded ABI string, 22,317 chars>",
  "bytecode": "0x...<43,322 chars>",
  "entitySecretCiphertext": "<fresh RSA-OAEP(SHA-256)-encrypted entity secret, base64>",
  "blockchain": "ETH-SEPOLIA" | "BASE-SEPOLIA",
  "constructorParameters": [<10 strings: addresses + delay>],
  "feeLevel": "MEDIUM"
}
```

Notes from request iteration:
- First attempt used description `"sw4p canonical V4.1 EVM contract; W1 Tier 1 deploy via SCP"` which Circle rejected with `error: alphanumeric_format` because the description field is regex-restricted. Re-submitted with `"sw4p canonical V41 EVM contract W1 Tier 1 deploy via SCP"`.
- Entity secret ciphertext is regenerated per request using the live `/v1/w3s/config/entity/publicKey` PEM (Circle requires a new ciphertext per write).

## Per-chain results

### Ethereum Sepolia

| Field | Value |
|---|---|
| Deployer wallet ID | `576a3130-fa0f-569f-90d3-e4bd54c23cde` (sw4p-deployer-eth-sepolia) |
| Deployer address | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` |
| Wallet state | `LIVE`, `accountType: EOA`, `custodyType: DEVELOPER` |
| Native ETH balance | `0x0` (0 ETH) at time of attempt |
| SCP HTTP status | `400` |
| SCP error body | `{"code":177025,"message":"the asset amount owned by the wallet is insufficient for the transaction."}` |
| Idempotency key | `3b9c6a4d-7b84-41b9-942d-b3f73602bc66` |
| On-chain tx hash | n/a (no transaction broadcast) |
| Contract address | n/a |
| Bytecode-verified | n/a |
| Etherscan URL | n/a |

### Base Sepolia

| Field | Value |
|---|---|
| Deployer wallet ID | `6ff236e0-79c4-59ad-9885-7701b9ebae68` (sw4p-deployer-base-sepolia) |
| Deployer address | `0x1f9573941eb6e7927eea2f2933eb2434e3a3323d` (same EOA shared across chains) |
| Wallet state | `LIVE`, `accountType: EOA`, `custodyType: DEVELOPER` |
| Native ETH balance | `0x0` (0 ETH) at time of attempt |
| SCP HTTP status | `400` |
| SCP error body | `{"code":177025,"message":"the asset amount owned by the wallet is insufficient for the transaction."}` |
| Idempotency key | `3df20c93-479a-4346-821d-fbf295739134` |
| On-chain tx hash | n/a (no transaction broadcast) |
| Contract address | n/a |
| Bytecode-verified | n/a |
| Basescan URL | n/a |

## Gas Station sponsorship check

NOT confirmed. Both attempted deploys reverted at the Circle API layer with `code: 177025`, which is Circle's "insufficient balance" code. If Gas Station were sponsoring, this code would not appear (the policy engine would attach a paymaster before the asset check). Two independent signals confirm Gas Station is not active for these wallets:

1. `GET /v1/w3s/gasStation/policies` -> `404 / code: -1` (no policies discoverable on the API key).
2. All deployer wallets are `accountType: EOA`. Circle Gas Station is documented to sponsor `SCA` wallets only (it operates as a paymaster against ERC-4337 user operations, which EOAs do not produce).

## Unblock options for operator

1. **Fund the EOA deployers** with native testnet asset (~0.05 ETH per chain is more than enough for one V4.1 deploy). Faucets:
   - Ethereum Sepolia: <https://www.alchemy.com/faucets/ethereum-sepolia> or <https://sepoliafaucet.com>
   - Base Sepolia: <https://www.alchemy.com/faucets/base-sepolia>
   Re-run `node /tmp/scp-deploy-v41.mjs ethereum-sepolia` then `node /tmp/scp-deploy-v41.mjs base-sepolia`.

2. **Provision SCA wallets** in the same wallet set (`POST /v1/w3s/developer/wallets` with `accountType: SCA`), then create Gas Station policies in the Circle dashboard targeting those wallets. Re-derive constructor params with the SCA wallet addresses as `initialAdmin / initialPauser / initialTreasury`.

3. **Fall back to a self-funded `PRIVATE_KEY` + Hardhat path** (`scripts/deploy_v4.ts`-style) per the original plan, abandoning the SCP-direct approach for Phase C.

## Files / scripts produced

- `/tmp/scp-deploy-v41.mjs` (deploy helper, parametric by chain, regenerates ciphertext per request, polls Circle transactions endpoint, verifies on-chain bytecode via public RPC)
- `/tmp/scp-deploy-ethereum-sepolia-payload.json` (request payload, ciphertext + bytecode + ABI masked)
- `/tmp/scp-deploy-ethereum-sepolia-response.json` (raw 400 response)
- `/tmp/scp-deploy-base-sepolia-payload.json`
- `/tmp/scp-deploy-base-sepolia-response.json`
- `/tmp/v41-bytecode.txt`, `/tmp/v41-abi.json`, `/tmp/circle-pubkey-pem.txt` (artifact extracts used for the SCP requests)

## Hard-constraint compliance

- No `Co-Authored-By` trailers; commit signed with `rndrntwrk <dev@rndrntwrk.com>` only.
- No em dashes anywhere in this evidence file or commit messages.
- No secrets logged: API key, entity secret raw, ciphertext, and PEM contents are all referenced by file path or `[REDACTED]`; only wallet IDs and the deployer address (public on-chain) appear in the record.
- No mocks: real Circle SCP API hit, real public RPC bytecode-balance probe, real Circle wallet listing.

## Status

**DONE_WITH_CONCERNS / BLOCKED on operator action.** The deploy path is wired and verified up to the SCP API; the contract compiles and the payload is well-formed. The only remaining work is either (a) fund the EOA wallets with testnet ETH, or (b) switch to SCA wallets with a Gas Station policy. Both options are external to this task.
