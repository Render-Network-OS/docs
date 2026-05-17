# W1 Phase D: Tier 1 V4.1 acceptance via Circle SCP - STATUS: DONE_WITH_CONCERNS

**Date:** 2026-05-17
**Worktree:** `.worktrees/sw4p-devnet-frontier-2026-05-16` (sw4p repo branch `staging/devnet-frontier-2026-05-16`)
**Goal:** Produce real on-chain evidence for four acceptance gates per Tier 1 chain against the V4.1 contracts deployed in Phase C. Every state-changing call routed through Circle Smart Contract Platform's `POST /v1/w3s/developer/transactions/contractExecution` from the per-chain SCA wallets, with Gas Station sponsorship.

## Verdict at a glance

| Gate | Sepolia | Base Sepolia |
|---|---|---|
| 1. Pause + unpause | PASS | PASS |
| 2. Direct grantRole rejection (`MustGoThroughTimelock`) | PASS | PASS |
| 3. Propose + execute-before-delay (`TimelockPending`) | PASS | PASS |
| 4. CCTP V2 zap-and-bridge round-trip | DEFERRED_PENDING_USDC_FAUCET | DEFERRED_PENDING_USDC_FAUCET |

Three of the four gates passed on both chains. The fourth (CCTP round-trip) is deferred because the SCA wallet currently holds 0 USDC on both chains; this gate requires a manual Circle faucet claim before it can run. See "Item 4 deferral" below for the exact unblock action.

## Pre-flight state (read via public RPC eth_call on both chains)

| Slot | Sepolia (`0xe2e85...3665`) | Base Sepolia (`0x0bb64...bfed`) |
|---|---|---|
| paused | `false` | `false` |
| globalDailyLimit | `10000000000000` (10M USDC) | `10000000000000` (10M USDC) |
| perUserDailyLimit | `50000000000` (50,000 USDC) | `50000000000` (50,000 USDC) |
| globalWeeklyLimit | `70000000000000` (70M USDC) | `70000000000000` (70M USDC) |
| platformFeeBps | `0` | `0` |
| feeTreasury | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` |
| PAUSER_ROLE | `0x75f50ac5178864b10e6790e35b418380c457aafbf2d0c1e86d72dc2bb439c5e5` | (same) |
| ADMIN_ROLE | `0x91572ece9f1393d91c5ccf3f4393f06629822a51f573ccdf94f1e5b8eec8dccb` | (same) |
| TIMELOCK_DELAY | `0x015180` = 86,400 (1 day) | (same) |
| pendingSafetyConfig | empty (all zeros) | empty (all zeros) |
| SCA native balance | `0x0` | `0x0` |
| SCA USDC balance | 0 | 0 |

## SCP execution helper

`/tmp/scp-execute.mjs` wraps the contractExecution endpoint:

```
POST https://api.circle.com/v1/w3s/developer/transactions/contractExecution
Authorization: Bearer ${CIRCLE_TEST_API_KEY}
Content-Type: application/json

{
  "idempotencyKey": "<UUIDv4>",
  "walletId": "<SCA wallet>",
  "contractAddress": "<V41 address>",
  "abiFunctionSignature": "pause()",
  "abiParameters": [],
  "entitySecretCiphertext": "<fresh RSA-OAEP(SHA-256), base64>",
  "feeLevel": "MEDIUM"
}
```

A fresh entity-secret ciphertext is regenerated per request from a freshly-fetched `/v1/w3s/config/entity/publicKey` PEM (Circle requires a new ciphertext per write). The helper then polls `/v1/w3s/transactions/{id}` every 2s until terminal state (`CONFIRMED`, `COMPLETE`, `FAILED`, `CANCELLED`, `DENIED`) and prints a JSON summary including `scpTxId`, `state`, `txHash`, and `errorReason`.

## Gate 1: pause + unpause

For each Tier 1 chain, called `pause()` then `unpause()` from the per-chain SCA wallet (ADMIN_ROLE + PAUSER_ROLE holder). Both functions are gated `whenNotPaused` / `whenPaused` so the state must flip cleanly across the two calls.

### Sepolia

| Step | SCP tx ID | On-chain tx hash | State | Event |
|---|---|---|---|---|
| pause() | `9de5ae1d-340b-5f92-9266-d4c23d1c3997` | `0x169f3df44b720394232f183596483240abd086f97eb003c315763d6f7cbcec79` | CONFIRMED | `Paused(0x7ddba97f...557d4)` at log index 1 |
| unpause() | `46cc41f3-369c-5e21-b3f7-c85d59aa1cc6` | `0xba16e129e835675bbed2281752a6b81801ce039a26976c12c00faf08304bf720` | CONFIRMED | `Unpaused(0x7ddba97f...557d4)` at log index 1 |

Explorer URLs (HTTP 200 verified):
- https://sepolia.etherscan.io/tx/0x169f3df44b720394232f183596483240abd086f97eb003c315763d6f7cbcec79
- https://sepolia.etherscan.io/tx/0xba16e129e835675bbed2281752a6b81801ce039a26976c12c00faf08304bf720

Event signatures decoded from receipt logs:
- Paused topic0 = `0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258`
- Unpaused topic0 = `0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa`

Both logs were emitted by `0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665` (V4.1 address). Receipt status `0x1` on both. Gas used: 158,040 (pause), 135,979 (unpause). Post-state read confirmed `paused = false`.

### Base Sepolia

| Step | SCP tx ID | On-chain tx hash | State | Event |
|---|---|---|---|---|
| pause() | `c6f8abc7-bee7-5d9c-8cf3-0d0a1579cb1b` | `0xa9d57379f5cb1e23fa966bf92901e956a5c56e028a68fb508d7f38896ba443b2` | CONFIRMED | `Paused(0x7ddba97f...557d4)` at log index 1 |
| unpause() | `10d88854-118d-526b-acc2-74557c162fa0` | `0xf967864994749d35aaa3cdfd2c03a06dff2cfd1a90096a6128c80a59c826c33e` | CONFIRMED | `Unpaused(0x7ddba97f...557d4)` at log index 1 |

Explorer URLs (HTTP 200 verified):
- https://sepolia.basescan.org/tx/0xa9d57379f5cb1e23fa966bf92901e956a5c56e028a68fb508d7f38896ba443b2
- https://sepolia.basescan.org/tx/0xf967864994749d35aaa3cdfd2c03a06dff2cfd1a90096a6128c80a59c826c33e

Both logs emitted by `0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed`. Receipt status `0x1`. Gas used: 158,004 (pause), 135,919 (unpause). Post-state read confirmed `paused = false`.

**Gate 1 verdict: PASS on both chains.**

## Gate 2: direct grantRole rejection

Per `Sw4pV4Controls.sol`, the `grantRole` and `revokeRole` overrides revert with `MustGoThroughTimelock()` to force every role mutation through the `proposeSafetyConfig` -> `executeSafetyConfig` two-step timelock. Bypass attempt: call `grantRole(PAUSER_ROLE, 0x...dead)` directly from the SCA (which holds ADMIN_ROLE).

`MustGoThroughTimelock()` selector: `0xe99beb96` (= `keccak256("MustGoThroughTimelock()")[0:4]`).

### Sepolia

- SCP request: `POST /contractExecution`, `abiFunctionSignature = "grantRole(bytes32,address)"`, `abiParameters = ["0x75f50ac5...c5e5","0x000000000000000000000000000000000000dEaD"]`
- SCP tx ID: `507b3042-19af-5a89-aeba-e5784c484996`
- Terminal state: `FAILED`
- errorReason: `ESTIMATION_ERROR`
- errorDetails: `execution reverted`
- No on-chain tx submitted (Circle's userOp simulation caught the revert; nothing reached the chain).
- Independent confirmation via `eth_call` (run from the SCA `from` address) returned revert data `0xe99beb96` -> `MustGoThroughTimelock()`.

### Base Sepolia

- SCP tx ID: `8ac7c3d5-2cc0-552a-9036-fb8b0a085a58`
- Terminal state: `FAILED`
- errorReason: `ESTIMATION_ERROR`
- errorDetails: `execution reverted`
- Independent confirmation via `eth_call`: revert data `0xe99beb96` -> `MustGoThroughTimelock()`.

The revert happens in the override before any state mutation. SCP correctly classifies this as an estimation failure and surfaces the same `execution reverted` signal Circle's userOp simulator returns; the matching `eth_call` (selector-level) confirms the exact custom error.

**Gate 2 verdict: PASS on both chains.**

## Gate 3: propose + execute-before-delay

Two-step:
1. Call `proposeSafetyConfig(...)` with the current values (no-op proposal). This sets `pendingSafetyConfig.eta = block.timestamp + TIMELOCK_DELAY` (1 day) and emits `SafetyConfigProposed`.
2. Immediately call `executeSafetyConfig()`. Per `Sw4pV4Controls.sol:339-341`, this must revert with `TimelockPending(uint64 remainingSeconds)` because `block.timestamp < pending.eta`.

`TimelockPending(uint64)` selector: `0xa80691a5`.
`SafetyConfigProposed(uint256,uint256,uint256,uint16,address,bytes32,address,bool,uint64)` topic0: `0x996d224b12db0dca8740c7c031cfa9930e8932c85bfa52de055f6055f095644e`.

Proposal parameters (same values on both chains, no role op, treasury unchanged so no cooldown triggered):
- `newGlobalDailyLimit = 10000000000000`
- `newPerUserDailyLimit = 50000000000`
- `newGlobalWeeklyLimit = 70000000000000`
- `newPlatformFeeBps = 0`
- `newFeeTreasury = 0x7ddba97f140f936a53669aa1ba73f04dd25557d4`
- `role = 0x00000...00`
- `roleAccount = 0x00000...00`
- `roleGrant = false`

### Sepolia

| Step | SCP tx ID | On-chain tx hash | State | Notes |
|---|---|---|---|---|
| proposeSafetyConfig | `2c62ed6c-0df2-56fb-93c5-729705e63b8b` | `0xd3341a11765b05f176bd8716b5b7319f9cfc47e89721d0be543fd72345837f2d` | CONFIRMED | `SafetyConfigProposed` emitted at log index 1 (V41 address) |
| executeSafetyConfig (early) | `7c0df795-4271-523b-a8c6-df94ee1f3e1e` | n/a; revert observed | FAILED (`ESTIMATION_ERROR`, `execution reverted`) | eth_call returns `0xa80691a5...015120` |

`eth_call` decoded revert: `TimelockPending(remainingSeconds = 86316)` (86316 < 86400 = TIMELOCK_DELAY, confirming the proposal eta hasn't elapsed). Full revert data: `0xa80691a5000000000000000000000000000000000000000000000000000000000001512c`.

Explorer URLs (HTTP 200 verified):
- https://sepolia.etherscan.io/tx/0xd3341a11765b05f176bd8716b5b7319f9cfc47e89721d0be543fd72345837f2d (propose)

### Base Sepolia

| Step | SCP tx ID | On-chain tx hash | State | Notes |
|---|---|---|---|---|
| proposeSafetyConfig | `99f47ef5-18c3-570a-8297-c7210bc2af20` | `0x5feee859b2577b8eff2beee7cfb1cf1477eb3380818fe4cc94bbda232c32edd5` | CONFIRMED | `SafetyConfigProposed` emitted at log index 1 (V41 address) |
| executeSafetyConfig (early) | `dc88b0a7-4eaa-5a0d-a111-b3dc31f88932` | n/a; revert observed | FAILED (`ESTIMATION_ERROR`, `execution reverted`) | eth_call returns `0xa80691a5...015146` |

`eth_call` decoded revert: `TimelockPending(remainingSeconds = 86342)`. Full revert data: `0xa80691a50000000000000000000000000000000000000000000000000000000000015146`.

Explorer URLs (HTTP 200 verified):
- https://sepolia.basescan.org/tx/0x5feee859b2577b8eff2beee7cfb1cf1477eb3380818fe4cc94bbda232c32edd5 (propose)

**Gate 3 verdict: PASS on both chains.**

State left on-chain after this gate: each chain has one `pendingSafetyConfig` in the slot, with `initialized = true` and `eta` ~24h ahead. Because the proposed values match the current values, executing them after 1 day would be a true no-op. Cancelling is not required by the gate and was deliberately skipped to keep the gate's evidence trail clean.

## Gate 4: CCTP V2 zap-and-bridge round-trip - DEFERRED_PENDING_USDC_FAUCET

Pre-flight USDC balance read on both Tier 1 chains for the SCA address `0x7ddba97f140f936a53669aa1ba73f04dd25557d4`:

```
Sepolia USDC (0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
  balanceOf(SCA) = 0 USDC
Base Sepolia USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
  balanceOf(SCA) = 0 USDC
```

V4.1 outbound entry points:
- `zapEthAndBridge(uint32 destinationDomain, bytes32 mintRecipient, uint24 fee, uint256 minUsdcAmount, uint256 maxFee, uint32 minFinalityThreshold)` - requires native ETH at the caller for the ETH-USDC swap. SCA balance is 0 native, so even though Gas Station sponsors gas it cannot inject value for the swap input. Not usable from a zero-balance SCA.
- `zapWithPermit2(uint256 amount, ...)` - requires the caller to already hold the swap input token plus a Permit2 signature. Requires non-trivial off-chain Permit2 setup and still needs the input token at the SCA. Not viable without USDC.
- The closest CCTP-V2-only path that would work from a sponsored SCA is approving the V41 contract to spend USDC and then calling a function that hands USDC to `TokenMessengerV2.depositForBurn`; V4.1 exposes `zapWithPermit2` for the Permit2 case but no plain `cctpBurn(amount, dest, recipient)` shortcut. Even `zapWithPermit2` needs USDC liquidity at the SCA.

All three paths require USDC at the SCA. The current balance is 0 on both chains. This gate is therefore deferred.

### Unblock action

Claim Circle testnet USDC to the SCA address on both chains:
- URL: `https://faucet.circle.com`
- Recipient: `0x7ddba97f140f936a53669aa1ba73f04dd25557d4`
- Networks: Ethereum Sepolia and Base Sepolia
- Amount: 10 USDC per chain (enough for several $1 round-trips plus fees)

Once funded, the round-trip flow is:
1. Approve V41 to spend USDC: `IERC20(usdc).approve(V41, 1_000_000)` (1 USDC, 6 decimals) on Sepolia.
2. Call `zapEthAndBridge` is wrong because it expects ETH input; instead call `IUSDC.approve(tokenMessenger, amount)` then `TokenMessengerV2.depositForBurn(amount, destinationDomain=6 for Base, mintRecipient=bytes32(SCA), burnToken=usdc, destinationCaller=bytes32(0), maxFee, minFinalityThreshold=1000)` directly via SCP. Alternative: if V4.1 should be the only outbound path, the contract needs a pure-bridge entry function (out of scope for Phase D; tracked as a contract design follow-up).
3. Poll Iris sandbox `https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=<src tx>` until `status = complete`.
4. On Base Sepolia, call `MessageTransmitterV2.receiveMessage(message, attestation)` via SCP from the SCA. This is the unsponsored caller, but Gas Station should sponsor since the SCA has no native balance.
5. Verify USDC balance increment at the SCA on Base Sepolia via `eth_call balanceOf`.
6. Repeat in reverse (Base -> Sepolia) for the round-trip.

**Gate 4 verdict: DEFERRED on both chains.** Single faucet ask unblocks the full round-trip in a follow-up Phase D' session.

## Gas Station sponsorship: CONFIRMED

The SCA wallet's native balance is `0x0` on Sepolia and Base Sepolia both before and after all eight SCP submissions (six confirmed on-chain, two reverted at estimation and so consumed no native). Every confirmed userOp carries a non-empty `networkFee` field in the SCP response, all of which the Gas Station paymaster paid, not the SCA. Sample fee data:

| Tx | networkFee (paid by Gas Station, in native units) |
|---|---|
| Sepolia pause | 0.000418000281423987 ETH |
| Sepolia unpause | 0.0003789976913595 ETH |
| Sepolia propose | 0.000640536405801362 ETH |
| Base pause | 0.00000132613 ETH |
| Base unpause | 0.0000013147552 ETH |
| Base propose | 0.000002071467691119 ETH |

Post-flight SCA balance read via public RPC `eth_getBalance` on `publicnode.com`:
- Sepolia: `0x0`
- Base Sepolia: `0x0`

No native asset was ever debited from the SCA. Gas Station sponsorship is operating end-to-end for ADMIN-role and PAUSER-role state-changing calls from a counterfactual ERC-4337 wallet.

## Per-chain summary table

### Sepolia

| Gate | SCP tx ID | On-chain tx hash | State | Verdict |
|---|---|---|---|---|
| pause() | `9de5ae1d-340b-5f92-9266-d4c23d1c3997` | `0x169f3df44b720394232f183596483240abd086f97eb003c315763d6f7cbcec79` | CONFIRMED | PASS |
| unpause() | `46cc41f3-369c-5e21-b3f7-c85d59aa1cc6` | `0xba16e129e835675bbed2281752a6b81801ce039a26976c12c00faf08304bf720` | CONFIRMED | PASS |
| grantRole direct | `507b3042-19af-5a89-aeba-e5784c484996` | n/a; revert `MustGoThroughTimelock()` | FAILED | PASS |
| proposeSafetyConfig | `2c62ed6c-0df2-56fb-93c5-729705e63b8b` | `0xd3341a11765b05f176bd8716b5b7319f9cfc47e89721d0be543fd72345837f2d` | CONFIRMED | PASS |
| executeSafetyConfig early | `7c0df795-4271-523b-a8c6-df94ee1f3e1e` | n/a; revert `TimelockPending(86316)` | FAILED | PASS |
| CCTP RT outbound | n/a | n/a | n/a | DEFERRED_PENDING_USDC_FAUCET |

### Base Sepolia

| Gate | SCP tx ID | On-chain tx hash | State | Verdict |
|---|---|---|---|---|
| pause() | `c6f8abc7-bee7-5d9c-8cf3-0d0a1579cb1b` | `0xa9d57379f5cb1e23fa966bf92901e956a5c56e028a68fb508d7f38896ba443b2` | CONFIRMED | PASS |
| unpause() | `10d88854-118d-526b-acc2-74557c162fa0` | `0xf967864994749d35aaa3cdfd2c03a06dff2cfd1a90096a6128c80a59c826c33e` | CONFIRMED | PASS |
| grantRole direct | `8ac7c3d5-2cc0-552a-9036-fb8b0a085a58` | n/a; revert `MustGoThroughTimelock()` | FAILED | PASS |
| proposeSafetyConfig | `99f47ef5-18c3-570a-8297-c7210bc2af20` | `0x5feee859b2577b8eff2beee7cfb1cf1477eb3380818fe4cc94bbda232c32edd5` | CONFIRMED | PASS |
| executeSafetyConfig early | `dc88b0a7-4eaa-5a0d-a111-b3dc31f88932` | n/a; revert `TimelockPending(86342)` | FAILED | PASS |
| CCTP RT inbound | n/a | n/a | n/a | DEFERRED_PENDING_USDC_FAUCET |

## Files / scripts produced

- `/tmp/scp-execute.mjs` (SCP contract-execution helper, parametric, JSON output)
- `/tmp/state-check.mjs` (pre and post-flight contract state reader)
- `/tmp/verify-receipts.mjs` (receipt-log decoder for Paused/Unpaused events)
- `/tmp/verify-grantrole-revert.mjs` (eth_call MustGoThroughTimelock confirmation)
- `/tmp/verify-timelock.mjs` (eth_call TimelockPending confirmation + propose-event check)
- `/tmp/phase-d/sepolia-pause.json`, `sepolia-unpause.json`, `sepolia-grantrole.json`, `sepolia-propose.json`, `sepolia-exec-early.json`
- `/tmp/phase-d/base-pause.json`, `base-unpause.json`, `base-grantrole.json`, `base-propose.json`, `base-exec-early.json`

## Hard-constraint compliance

- No `Co-Authored-By` trailers; commit signed with `rndrntwrk <dev@rndrntwrk.com>` only.
- No em dashes anywhere in this evidence file.
- No secrets logged: API key, entity secret raw, ciphertext, and PEM contents are referenced by env-var name or file path only; only wallet IDs, SCA address, contract addresses, role hashes, function selectors, and tx hashes (all public on-chain) appear.
- No mocks: every PASS verdict is backed by either an on-chain CONFIRMED tx with a verifiable explorer URL (HTTP 200 confirmed) or a SCP FAILED state whose revert reason was independently re-confirmed via public-RPC `eth_call` decoding the matching custom error selector. The DEFERRED verdict is honest about the USDC-funding prerequisite.

## Status

**DONE_WITH_CONCERNS.** All three contract-only acceptance gates (pause/unpause, direct grantRole rejection, propose plus execute-before-delay revert) pass on both Tier 1 chains via Circle SCP, Gas Station sponsored, with all on-chain evidence verified. The fourth gate (CCTP V2 round-trip) is `DEFERRED_PENDING_USDC_FAUCET`: claim 10 USDC at `https://faucet.circle.com` to `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` on Ethereum Sepolia and Base Sepolia, then re-run Phase D' to capture the CCTP gate.
