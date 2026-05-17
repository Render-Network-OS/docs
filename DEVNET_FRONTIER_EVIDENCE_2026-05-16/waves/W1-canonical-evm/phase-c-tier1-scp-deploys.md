# W1 Phase C: Tier 1 V4.1 deploys via Circle SCP - STATUS: DONE

**Date:** 2026-05-17  
**Worktree:** `.worktrees/sw4p-devnet-frontier-2026-05-16`  
**Goal:** Deploy `ZapAndBridgeV41` to Ethereum Sepolia and Base Sepolia via Circle Smart Contract Platform (SCP), bypassing the sw4p-backend entirely, with Gas Station sponsoring deploy gas (per operator direction).

## Outcome

Both deploys succeeded with state `CONFIRMED` on the very first SCP submission against the newly-provisioned SCA wallets. On-chain bytecode verified at 38,784 chars per address (matches compiled `deployedBytecode` from the V4.1 artifact). SCA deployer balance remained `0x0` on both chains throughout, confirming Gas Station sponsored the userOps end-to-end.

## Re-run history

| Attempt | Commit | Wallets | Outcome |
|---|---|---|---|
| 1 (deferred) | `176a4b94` | EOA wallets (`576a3130-...` ETH, `6ff236e0-...` BASE) | BLOCKED with Circle `code: 177025` "insufficient balance" because EOA wallets cannot be sponsored by Gas Station and had zero native balance. |
| 2 (this evidence) | re-run after `41d5c8cf` provisioned SCA wallets | SCA wallets (`f929a768-...` ETH, `b150e7c0-...` BASE) | DONE. Both deploys CONFIRMED with on-chain bytecode verified and SCA deployer balance still `0x0`. |

## Unblock action (W0 addendum)

Per `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-wallet-sca-addendum.md` (commit `41d5c8cf`), six SCA wallets were provisioned in the same wallet set `29b8aae4-e37b-5e72-9653-c7157ad20c0c`. All six share the deterministic ERC-4337 counterfactual address `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` (one factory keyed on the wallet-set owner). The Tier-1 Phase C re-run targets the two relevant SCA wallet IDs.

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

```
Artifact: artifacts/contracts/ZapAndBridgeV41.sol/ZapAndBridgeV41.json
Bytecode (creation code): 43,322 chars
Deployed bytecode (runtime): 38,784 chars
ABI: 20,346 chars JSON-encoded, 104 entries
```

The deployed (runtime) bytecode size predicts what `eth_getCode` returns after construction; both on-chain reads match exactly.

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
| 6 | initialAdmin | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | Circle SCA wallet (counterfactual) |
| 7 | initialPauser | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | Circle SCA wallet (rotate via timelock) |
| 8 | initialTreasury | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | Circle SCA wallet (rotate via timelock) |
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
| 6 | initialAdmin | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | Circle SCA wallet |
| 7 | initialPauser | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | Circle SCA wallet |
| 8 | initialTreasury | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | Circle SCA wallet |
| 9 | defaultAdminDelay_ | `86400` (uint48) | Matches `TIMELOCK_DELAY = 1 day` |

## Circle SCP request shape

```
POST https://api.circle.com/v1/w3s/contracts/deploy
Authorization: Bearer ${CIRCLE_TEST_API_KEY}
Content-Type: application/json

{
  "idempotencyKey": "<UUIDv4>",
  "name": "ZapAndBridgeV41",
  "description": "sw4p canonical V41 EVM contract W1 Tier 1 deploy via SCP SCA Gas Station",
  "walletId": "<SCA wallet UUID>",
  "abiJson": "<JSON-encoded ABI string, 20,346 chars>",
  "bytecode": "0x...<43,322 chars>",
  "entitySecretCiphertext": "<fresh RSA-OAEP(SHA-256)-encrypted entity secret, base64>",
  "blockchain": "ETH-SEPOLIA" | "BASE-SEPOLIA",
  "constructorParameters": [<10 strings: addresses + delay>],
  "feeLevel": "MEDIUM"
}
```

Notes from the request flow:

- Description string uses only alphanumeric and spaces, per Circle's regex restriction (re-confirmed from the deferred attempt's failure mode).
- Entity secret ciphertext is regenerated per request from a freshly-fetched `/v1/w3s/config/entity/publicKey` PEM (Circle requires a new ciphertext per write).
- Success response shape uses `data.transactionId` (not `data.deploymentTransactionId` as the deferred-version helper assumed); helper was updated in-flight.

## Per-chain results

### Ethereum Sepolia

| Field | Value |
|---|---|
| SCA Wallet ID | `f929a768-f311-569f-8cdc-db03fd925c6c` (sw4p-deployer-sca-eth-sepolia) |
| SCA Wallet address | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` |
| Wallet state | `LIVE`, `accountType: SCA`, `custodyType: DEVELOPER` |
| Native ETH balance at submit | `0x0` (0 ETH) |
| SCP HTTP status | `201` |
| SCP contractId | `019e3572-3982-77b4-9252-0c5ea9443b7f` |
| SCP transactionId | `d5581972-c266-5b03-861d-cf15ae3dadc0` |
| Idempotency key | `c62e93c4-d601-483a-b411-8e582eacd70a` |
| Terminal state | `CONFIRMED` |
| On-chain tx hash | `0x6c68bd21311b4562e6137724542a261bef30840fd23528a065b9cc0ed12d77aa` |
| Contract address | `0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665` |
| On-chain bytecode chars | 38,784 (matches compiled deployedBytecode) |
| Etherscan tx URL | https://sepolia.etherscan.io/tx/0x6c68bd21311b4562e6137724542a261bef30840fd23528a065b9cc0ed12d77aa (HTTP 200) |
| Etherscan address URL | https://sepolia.etherscan.io/address/0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665 (HTTP 200) |
| Native ETH balance post-deploy | `0x0` (0 ETH; Gas Station paid) |

### Base Sepolia

| Field | Value |
|---|---|
| SCA Wallet ID | `b150e7c0-0a05-5bdb-9875-8503eeb42ed3` (sw4p-deployer-sca-base-sepolia) |
| SCA Wallet address | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` (same EVM counterfactual address across chains) |
| Wallet state | `LIVE`, `accountType: SCA`, `custodyType: DEVELOPER` |
| Native ETH balance at submit | `0x0` (0 ETH) |
| SCP HTTP status | `201` |
| SCP contractId | `019e3573-98d0-7cce-a36b-729fe4b243a3` |
| SCP transactionId | `b3e991cf-6ff7-53c0-8f33-e84e8cae0c11` |
| Idempotency key | `900219b2-ec80-43fc-9af1-125a001b9a0b` |
| Terminal state | `CONFIRMED` |
| On-chain tx hash | `0x48e137534ce6c032a23528817a4b9d04877ca9343376fc7e70af392df9b33e87` |
| Contract address | `0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed` |
| On-chain bytecode chars | 38,784 (matches compiled deployedBytecode) |
| Basescan tx URL | https://sepolia.basescan.org/tx/0x48e137534ce6c032a23528817a4b9d04877ca9343376fc7e70af392df9b33e87 (HTTP 200) |
| Basescan address URL | https://sepolia.basescan.org/address/0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed (HTTP 200) |
| Native ETH balance post-deploy | `0x0` (0 ETH; Gas Station paid) |

## Gas Station sponsorship: CONFIRMED

Two independent signals confirm Gas Station sponsored both deploys:

1. **Pre-deploy SCA balance was `0x0`** on both chains, queried via `eth_getBalance` on `publicnode.com` RPCs immediately before submission.
2. **Post-deploy SCA balance is still `0x0`** on both chains, queried via the same RPCs after `CONFIRMED`. No native asset was debited from the SCA, so the userOp paymaster (Gas Station) covered factory deploy + contract deploy in a single sponsored userOp per chain.

The deferred-version failure mode (Circle `code: 177025` "insufficient balance") did not appear in either request, also confirming that the policy engine is now correctly attaching a paymaster ahead of the asset check, which only happens for `accountType: SCA` wallets.

## Total deploy time per chain

| Chain | SCP submit-to-CONFIRMED (helper-measured) | Notes |
|---|---|---|
| Ethereum Sepolia | ~2 seconds at poll start | SCP queued the userOp synchronously; first poll already returned CONFIRMED. Out-of-band time from POST to first poll iteration was a few seconds (interrupted earlier by a helper bug on the response field name, then re-polled). |
| Base Sepolia | ~15 seconds | First poll returned `SENT` with `txHash=""` and the contract address already known counterfactually; second poll returned `CONFIRMED` with the on-chain `txHash`. |

Both well within Circle's expected envelope for counterfactual SCA + Gas Station deploys.

## Verification commands

```bash
# Bytecode size on chain (verifies non-empty + correct runtime size)
curl -sS -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665","latest"],"id":1}' \
  https://ethereum-sepolia-rpc.publicnode.com
# -> result.length == 38786 (0x + 38784 nibble chars)

curl -sS -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed","latest"],"id":1}' \
  https://base-sepolia-rpc.publicnode.com
# -> result.length == 38786 (0x + 38784 nibble chars)

# SCA wallet native balance (still 0 after deploys, proving Gas Station sponsorship)
curl -sS -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x7ddba97f140f936a53669aa1ba73f04dd25557d4","latest"],"id":1}' \
  https://ethereum-sepolia-rpc.publicnode.com
# -> result == "0x0"

curl -sS -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x7ddba97f140f936a53669aa1ba73f04dd25557d4","latest"],"id":1}' \
  https://base-sepolia-rpc.publicnode.com
# -> result == "0x0"
```

## Files / scripts produced

- `/tmp/scp-deploy-v41-sca.mjs` (SCA-aware deploy helper, parametric by chain, regenerates ciphertext per request, polls Circle transactions endpoint, verifies on-chain bytecode via public RPC)
- `/tmp/scp-poll-tx.mjs` (standalone transaction poller, used for the in-flight Ethereum Sepolia re-poll after the helper was patched)
- `/tmp/scp-deploy-sca-ethereum-sepolia-payload.json`, `/tmp/scp-deploy-sca-ethereum-sepolia-response.json`, `/tmp/scp-deploy-sca-ethereum-sepolia-final.json`
- `/tmp/scp-deploy-sca-base-sepolia-payload.json`, `/tmp/scp-deploy-sca-base-sepolia-response.json`, `/tmp/scp-deploy-sca-base-sepolia-final.json`
- `/tmp/v41-bytecode.txt`, `/tmp/v41-abi.json` (artifact extracts used for the SCP requests)

## Deployed-addresses registry update

`sw4p-backend/contracts/scripts/deployed_addresses.json` updated:

```json
"ZAP_BRIDGE_V41": {
  "SEPOLIA": "0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665",
  "BASE_SEPOLIA": "0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed"
}
```

## Hard-constraint compliance

- No `Co-Authored-By` trailers; commit signed with `rndrntwrk <dev@rndrntwrk.com>` only.
- No em dashes anywhere in this evidence file or commit messages.
- No secrets logged: API key, entity secret raw, ciphertext, and PEM contents are all referenced by file path or `[REDACTED]`; only wallet IDs, SCA address, contract addresses, and tx hashes (all public on-chain) appear.
- No mocks: real Circle SCP API hit, real public RPC bytecode + balance verification, real explorer-page HEAD checks (HTTP 200 on all four).

## Status

**DONE.** Both V4.1 contracts are live on Tier-1 testnets, indexed under `ZAP_BRIDGE_V41` in `deployed_addresses.json`, with Gas Station sponsorship verified via persistent zero balance on the SCA deployer. Phase C re-run is complete.
