# W1 Phase E: Tier 2 real CCTP-only proof on Fuji and Amoy - STATUS: PASS

**Date:** 2026-05-17
**Worktree:** `.worktrees/sw4p-devnet-frontier-2026-05-16` (sw4p repo branch `staging/devnet-frontier-2026-05-16`)
**Goal:** Produce real on-chain evidence that the canonical Circle CCTP V2 contracts (`TokenMessengerV2`, `MessageTransmitterV2`) operate end-to-end on Tier 2 chains via direct calls from the Circle SCA wallets, executed through Circle Smart Contract Platform's `POST /v1/w3s/developer/transactions/contractExecution` with Gas Station sponsorship.

## Acceptance label

**This is Tier 2 real CCTP-only acceptance, NOT canonical V4.1 acceptance.** V4.1 is not deployable on Fuji or Amoy because the Uniswap `universal-router` deploy-addresses registry at the W0 pin (commit `050b93cf4e9508b78412f23ad66e85d5c76a45b5`) has no `UniversalRouterV2` JSON for these chains. The acceptance bar here is strictly the canonical Circle bridge primitives proven against real on-chain bytecode, with the V4.1 controller surface explicitly out of scope on these chains. This matches the cycle spec's Tier 2 contract.

## Verdict at a glance

| Gate | Avalanche Fuji (chainId 43113, domain 1) | Polygon Amoy (chainId 80002, domain 7) |
|---|---|---|
| TM V2 bytecode present | PASS | PASS |
| MT V2 bytecode present | PASS | PASS |
| USDC bytecode present | PASS | PASS |
| SCA wallet LIVE on right chain | PASS | PASS |
| `USDC.approve(TM V2, 1 USDC)` via SCP, on-chain | PASS | PASS |
| `TokenMessengerV2.depositForBurn(...)` ABI reachable from SCA | PASS (revert reason proves wiring; superseded by on-chain burn) | PASS (revert reason proves wiring; superseded by on-chain burn) |
| `depositForBurn` burn-emit `MessageSent` | PASS (tx `0xa7f72b10...30532f1b`) | PASS (tx `0x5d52c34e...59b1997f`) |
| Iris attestation captured | PASS (`status=complete`, attestation 262 chars, finalityThresholdExecuted 2000) | PASS (`status=complete`, attestation 262 chars, finalityThresholdExecuted 2000) |

The full CCTP V2 burn path is proven end-to-end on both chains: the SCA holds a positive USDC allowance on the canonical `TokenMessengerV2`, executes `TokenMessengerV2.depositForBurn(...)` on-chain with the burn confirmed in a real block, and the Iris sandbox returns a `status=complete` attestation that decodes to the correct `(sourceDomain, destinationDomain, burnToken, mintRecipient, amount)` tuple. Bonus Sepolia `receiveMessage` mint is deferred to a follow-up sweep to avoid SCA nonce contention with the sibling Phase D agent; per spec, Tier 2 acceptance requires only burn-side proof.

## Tier 2 chain roster (from `sw4p-backend/contracts/registry/tier2.json`)

| Chain | chainId | CCTP domain | USDC | TokenMessengerV2 | MessageTransmitterV2 |
|---|---|---|---|---|---|
| Avalanche Fuji | 43113 | 1 | `0x5425890298aed601595a70AB815c96711a31Bc65` | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |
| Polygon Amoy | 80002 | 7 | `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |

The TokenMessengerV2 and MessageTransmitterV2 addresses are universal across CCTP V2 testnets (verified in W0.a probe `W0-setup/probes/circle-cctp-v2.md`). The Tier 2 registry file also lists Arbitrum Sepolia and Optimism Sepolia under the same V2 endpoints; this Phase E run is scoped to Fuji and Amoy per the cycle spec, with the other two left for a follow-up bridge sweep.

## SCA wallets (provisioned in W0 addendum, commit `41d5c8cf`)

| Chain | Wallet ID | Wallet state (Circle SCP) | Shared address |
|---|---|---|---|
| Avalanche Fuji | `d2ddab0e-bb2b-50cc-bebc-0049b4f78bda` | `LIVE` on `AVAX-FUJI` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` |
| Polygon Amoy | `e847e311-abbb-53c5-9826-87feabab9972` | `LIVE` on `MATIC-AMOY` | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` |

The single SCA address `0x7ddba97f...557d4` is shared across both chains because Circle's developer-controlled SCA derivation is deterministic per (entity, wallet-set, account-type) and independent of the blockchain field. Wallet state read live from `GET /v1/w3s/wallets/{id}` (Authorization bearer `CIRCLE_TEST_API_KEY`).

## Structural readiness probe

Direct public-RPC reads at run time on 2026-05-17:

| Probe | Avalanche Fuji | Polygon Amoy |
|---|---|---|
| `eth_getCode(TokenMessengerV2)` length | 4350 bytes | 4350 bytes |
| `eth_getCode(MessageTransmitterV2)` length | 4350 bytes | 4350 bytes |
| `eth_getCode(USDC)` length | 3704 bytes | 3596 bytes |
| `eth_getBalance(SCA)` (native) | `0` | `0` |
| `balanceOf(SCA)` on USDC | `0` USDC (pre-faucet) -> `20.0` USDC (resume) -> `19.0` USDC (post-burn) | `0` USDC (pre-faucet) -> `20.0` USDC (resume) -> `19.0` USDC (post-burn) |

Identical TokenMessengerV2 + MessageTransmitterV2 sizes (4350) match the canonical V2 implementation across CCTP V2 testnets, confirming the same contracts the W0 probe verified are present and live at these addresses on both chains. The 0 native balance is expected; Gas Station sponsors gas.

## SCP execution helper

The Phase D helper `/tmp/scp-execute.mjs` (parametric SCP `contractExecution` wrapper with fresh entity-secret ciphertext per call and 2s polling to terminal state) was reused unchanged. It generates a new RSA-OAEP(SHA-256) ciphertext per request from a freshly-fetched `/v1/w3s/config/entity/publicKey` PEM, then submits a v4 idempotency key on each call. Final state returned: `CONFIRMED`, `COMPLETE`, `FAILED`, `CANCELLED`, or `DENIED`.

## Gate A: USDC.approve(TokenMessengerV2, 1 USDC) via SCP (proves SCA can drive token-side surface)

### Avalanche Fuji

- SCP call: `POST /v1/w3s/developer/transactions/contractExecution`
- contractAddress: `0x5425890298aed601595a70AB815c96711a31Bc65` (USDC)
- abiFunctionSignature: `approve(address,uint256)`
- abiParameters: `["0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA","1000000"]`
- walletId: `d2ddab0e-bb2b-50cc-bebc-0049b4f78bda`

| Field | Value |
|---|---|
| SCP tx ID | `43e8e32c-612b-5157-b182-341fe42d51f1` |
| State | `CONFIRMED` |
| On-chain tx hash | `0x9a5aea2d5083d9a4aca32fe48c927f29fd215302a9d4933f54a72c177aae20d6` |
| Block | `55463205` |
| Gas used | `327,843` |
| Gas Station networkFee paid | `0.000885856500393714` AVAX |
| Receipt status | `0x1` |
| Approval event topic0 | `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925` (`Approval(address,address,uint256)`) emitted by USDC `0x542589...1Bc65` |

Post-state `allowance(SCA, TokenMessengerV2)` read via public RPC `eth_call`:
- Raw: `0x00000000000000000000000000000000000000000000000000000000000f4240`
- Decimal: `1000000`
- Equals `1.0` USDC, exactly what was approved.

Explorer URL (Snowtrace blocks generic curl with HTTP 403 CDN throttling; the Avalanche subnets explorer returned HTTP 200):
- https://subnets-test.avax.network/c-chain/tx/0x9a5aea2d5083d9a4aca32fe48c927f29fd215302a9d4933f54a72c177aae20d6
- Snowtrace canonical URL (browser-loadable): https://testnet.snowtrace.io/tx/0x9a5aea2d5083d9a4aca32fe48c927f29fd215302a9d4933f54a72c177aae20d6

### Polygon Amoy

- contractAddress: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` (USDC)
- walletId: `e847e311-abbb-53c5-9826-87feabab9972`

| Field | Value |
|---|---|
| SCP tx ID | `72a53fb4-b179-51e5-bed0-c49a9521e285` |
| State | `CONFIRMED` |
| On-chain tx hash | `0x4d5ba05cf70b3ca888a6543c554cd884d781a834fb561ba47638376f81557f4e` |
| Block | `38522894` |
| Gas used | `385,559` |
| Gas Station networkFee paid | `0.070133631873606144` MATIC |
| Receipt status | `0x1` |
| Approval event topic0 | `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925` (`Approval(address,address,uint256)`) emitted by USDC `0x41E94E...7582` |

Post-state `allowance(SCA, TokenMessengerV2)` read via public RPC `eth_call`:
- Raw: `0x00000000000000000000000000000000000000000000000000000000000f4240`
- Decimal: `1000000`
- Equals `1.0` USDC.

Explorer URL (HTTP 200 verified via direct curl probe):
- https://amoy.polygonscan.com/tx/0x4d5ba05cf70b3ca888a6543c554cd884d781a834fb561ba47638376f81557f4e

**Gate A verdict: PASS on both chains.** SCA can drive USDC contract calls on both Tier 2 chains via Circle SCP with Gas Station sponsorship, and the on-chain ERC-20 allowance state was mutated as intended.

## Gate B: TokenMessengerV2.depositForBurn(...) ABI surface reachable from SCA

The CCTP V2 `depositForBurn` ABI (7 parameters; V2 superset of the V1 4-param signature; matches Circle's CCTP V2 docs):

```
depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold)
```

Parameters used (identical on both chains; destination = Ethereum Sepolia for a Tier-1-bound burn):
- `amount`: `1000000` (1 USDC, 6 decimals)
- `destinationDomain`: `0` (Ethereum Sepolia, the Tier 1 receiver of choice)
- `mintRecipient`: `0x0000000000000000000000007ddba97f140f936a53669aa1ba73f04dd25557d4` (bytes32 of the SCA)
- `burnToken`: chain's USDC
- `destinationCaller`: `0x0000...0000` (any caller can call `receiveMessage`)
- `maxFee`: `1000` (small)
- `minFinalityThreshold`: `1000` (CCTP V2 fast-finality bucket)

Both calls were submitted via the same SCP helper. With the SCA holding 0 USDC, the burn must revert at the USDC `_burn` step inside `depositForBurn`'s call chain, because TokenMessenger pulls the burn amount from the caller before burning it. The expected revert is therefore the ERC-20 `transfer amount exceeds balance` error from USDC, not a TokenMessenger-specific error. Catching this exact revert is the structural proof that the SCA is wired correctly into the CCTP V2 contract surface.

### Avalanche Fuji

| Field | Value |
|---|---|
| SCP tx ID | `f40ad2a1-8dbd-53d9-bac9-219385ff0373` |
| State | `FAILED` |
| errorReason | `INSUFFICIENT_TOKEN` |
| errorDetails (raw) | `UserOperation reverted during simulation with reason: 0x08c379a0...64616e63650000...` |
| Decoded revert | `Error("ERC20: transfer amount exceeds balance")` |

Revert-data decode:
- selector `0x08c379a0` = `Error(string)`
- payload length `38`
- string `"ERC20: transfer amount exceeds balance"`

No on-chain tx submitted (Circle's userOp simulation caught the revert, so the SCA paid no gas and nothing reached the chain). The classification `INSUFFICIENT_TOKEN` is Circle's standard mapping of an ERC-20 balance-exceeded revert during a contract-call simulation.

### Polygon Amoy

| Field | Value |
|---|---|
| SCP tx ID | `845c5ee4-dbd9-5a30-bcb2-d3f804332124` |
| State | `FAILED` |
| errorReason | `INSUFFICIENT_TOKEN` |
| errorDetails | `ERC20: transfer amount exceeds balance` (already decoded by Circle on this chain) |

Same outcome: simulator reached the canonical TokenMessengerV2 burn flow and stopped at the token-balance check. No on-chain tx submitted.

**Gate B verdict:** ABI surface is reachable and correctly wired on both chains. The exact revert reason is structurally identical and rules out any ABI mismatch, address-typo, or contract-not-found path. The only remaining gate-blocker is funding the SCA's USDC balance.

## Gate C: actual burn + Iris attestation - PASS

The full CCTP V2 burn path requires:
1. SCA holds at least 1 USDC on the source chain.
2. SCA calls `USDC.approve(TM V2, amount)` (done in Gate A, allowance `1.0 USDC` on both chains).
3. SCA calls `TM V2.depositForBurn(...)`, emitting `MessageSent(bytes message)` on `MessageTransmitterV2`.
4. Poll Iris sandbox `https://iris-api-sandbox.circle.com/v2/messages/{sourceDomain}?transactionHash={burnTx}` until `status == "complete"`.
5. On Ethereum Sepolia (domain 0), call `MessageTransmitterV2.receiveMessage(message, attestation)` from any caller (Gas Station sponsored). This mint step is optional for Tier 2 acceptance per cycle spec; it is deferred to a follow-up sweep here to avoid SCA nonce contention with the sibling Phase D Sepolia receive run.

Steps 1 through 4 are now PASS on both chains. See "Burn resumption (2026-05-17)" below.

## Burn resumption (2026-05-17)

After Phase E's original DONE_WITH_CONCERNS state, the SCA was funded via the Circle faucet UI: `20.0 USDC` on Fuji and `20.0 USDC` on Amoy, verified by public-RPC `balanceOf(SCA)` reads before resumption. The pre-existing `1.0 USDC` allowance to `TokenMessengerV2` on each chain was reverified by `eth_call allowance(SCA, TM V2)` and was still in place, so no additional approve was issued. The original Phase E approve receipts (`0x9a5aea2d...` on Fuji and `0x4d5ba05c...` on Amoy) remain canonical evidence for Gate A.

### Pre-state per chain (resumption snapshot)

| Chain | balanceOf(SCA) | allowance(SCA, TM V2) | eth_getBalance(SCA) |
|---|---|---|---|
| Fuji | `20.0` USDC | `1.0` USDC | `0` AVAX |
| Amoy | `20.0` USDC | `1.0` USDC | `0` MATIC |

All three reads via public RPC `eth_call` / `eth_getBalance` against `https://api.avax-test.network/ext/bc/C/rpc` and `https://rpc-amoy.polygon.technology` respectively.

### Burn parameters (identical on both chains)

```
TokenMessengerV2.depositForBurn(
  amount = 1000000,                              // 1.0 USDC
  destinationDomain = 0,                         // Ethereum Sepolia
  mintRecipient = 0x000...7ddba97f140f936a53669aa1ba73f04dd25557d4,
  burnToken = chain-specific USDC,
  destinationCaller = 0x0...0,                  // any caller may call receiveMessage
  maxFee = 500,                                  // 0.0005 USDC fast-lane fee
  minFinalityThreshold = 1000                    // fast finality bucket
)
```

### Avalanche Fuji burn

| Field | Value |
|---|---|
| SCP tx ID | `94138eaf-b3e7-5d73-9d3f-255ff411c669` |
| State | `CONFIRMED` |
| On-chain tx hash | `0xa7f72b109239121a6df38a97fac3689e6f163922e8d1d75267f7e18b60532f1b` |
| Block | `55463836` |
| Block hash | `0xb855dfbe7a8c317f7617d81e481ca35757a31a6d472b6a13e9032e684077ab4f` |
| Gas Station networkFee paid | `0.000704196000312976` AVAX |
| firstConfirmDate | `2026-05-17T11:10:26Z` |
| userOpHash | `0xae37df6fa90b43af17d56037571eabd168a404226a6b60c011fa9f3e28337b6d` |
| Iris event nonce | `0x299012340c5ec41ac1ed2c8891c697075140da159c9bf1ee99a024f88c308ddf` |
| Iris status | `complete` |
| Iris elapsed (post-burn) | observed `complete` within 5s of first poll (under sub-Iris-cycle attestation lag) |
| Iris cctpVersion | `2` |
| Iris finalityThresholdExecuted | `2000` (Iris exceeded the requested `1000` fast threshold) |
| Iris attestation length | `262` chars (130-byte signature, hex-encoded with `0x` prefix) |
| Iris message length | `754` chars (376 bytes hex-encoded with `0x` prefix) |
| decodedMessage.sourceDomain | `1` |
| decodedMessage.destinationDomain | `0` |
| decodedMessageBody.burnToken | `0x5425890298aed601595a70ab815c96711a31bc65` |
| decodedMessageBody.mintRecipient | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` |
| decodedMessageBody.amount | `1000000` (1 USDC) |
| decodedMessageBody.maxFee | `500` |
| balanceOf(SCA) post-burn | `19.0` USDC |
| allowance(SCA, TM V2) post-burn | `0.0` USDC (consumed by burn) |
| eth_getBalance(SCA) post-burn | `0` AVAX (Gas Station sponsorship confirmed) |

Explorer URLs (HTTP-probed):
- https://subnets-test.avax.network/c-chain/tx/0xa7f72b109239121a6df38a97fac3689e6f163922e8d1d75267f7e18b60532f1b (HTTP 200)
- https://testnet.snowtrace.io/tx/0xa7f72b109239121a6df38a97fac3689e6f163922e8d1d75267f7e18b60532f1b (HTTP 403 from curl due to Cloudflare WAF; browser-loadable)

### Polygon Amoy burn

| Field | Value |
|---|---|
| SCP tx ID | `1bed8758-d3fd-5ae6-bfa2-0d3166961d0d` |
| State | `CONFIRMED` |
| On-chain tx hash | `0x5d52c34e845b88d5a2caaf291e273c4cfc3758045c9c7dae2f59f89859b1997f` |
| Block | `38523759` |
| Block hash | `0x15d6d77a36db7be9fb1234cfb6d6fd68e277f41f80a12424fa5b948f8e636926` |
| Gas Station networkFee paid | `0.061778992980100914` MATIC |
| firstConfirmDate | `2026-05-17T11:10:53Z` |
| userOpHash | `0x2b5abf7da1b4ebd2e41314e3bc6293f316de0a577a6454e9cef8f3a6b84579af` |
| Iris event nonce | `0xc8e691f2ecb6d67cf7fdc5b674e0296c95a52b756cdb48c3d5e929ba9b71527b` |
| Iris status | `complete` |
| Iris elapsed (post-burn) | observed `complete` within 1s of first poll |
| Iris cctpVersion | `2` |
| Iris finalityThresholdExecuted | `2000` (Iris exceeded the requested `1000` fast threshold) |
| Iris attestation length | `262` chars |
| Iris message length | `754` chars |
| decodedMessage.sourceDomain | `7` |
| decodedMessage.destinationDomain | `0` |
| decodedMessageBody.burnToken | `0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582` |
| decodedMessageBody.mintRecipient | `0x7ddba97f140f936a53669aa1ba73f04dd25557d4` |
| decodedMessageBody.amount | `1000000` (1 USDC) |
| decodedMessageBody.maxFee | `500` |
| balanceOf(SCA) post-burn | `19.0` USDC |
| allowance(SCA, TM V2) post-burn | `0.0` USDC (consumed by burn) |
| eth_getBalance(SCA) post-burn | `0` MATIC (Gas Station sponsorship confirmed) |

Explorer URL:
- https://amoy.polygonscan.com/tx/0x5d52c34e845b88d5a2caaf291e273c4cfc3758045c9c7dae2f59f89859b1997f (HTTP 200)

### Sepolia receive (deferred)

`MessageTransmitterV2.receiveMessage(message, attestation)` on Sepolia is intentionally not exercised in this run to avoid SCA nonce contention with the sibling Phase D agent's D.5 Sepolia receive. Tier 2 acceptance per cycle spec only requires the burn-side proof (Iris-attested), which is now PASS on both chains. The follow-up Sepolia receive sweep can drain both attested messages (Fuji + Amoy) into 2 USDC minted at the recipient SCA on Sepolia using the same Iris payloads captured in `/tmp/iris-fuji.json` and `/tmp/iris-amoy.json`.

## Gas Station sponsorship: CONFIRMED

The SCA's native balance was `0` on both chains pre-flight and remained `0` post-flight on both chains (verified via public RPC `eth_getBalance` after the runs). Every confirmed SCP userOp returned a non-empty `networkFee` field, all paid by the Gas Station paymaster, not the SCA. Sample fee data captured from this run:

| Tx | Chain | networkFee (paid by Gas Station) |
|---|---|---|
| approve | Fuji | `0.000885856500393714` AVAX |
| approve | Amoy | `0.070133631873606144` MATIC |
| depositForBurn (initial sim-reverted) | Fuji | n/a (simulator-only, no native consumed) |
| depositForBurn (initial sim-reverted) | Amoy | n/a (simulator-only, no native consumed) |
| depositForBurn (resumption CONFIRMED on-chain) | Fuji | `0.000704196000312976` AVAX |
| depositForBurn (resumption CONFIRMED on-chain) | Amoy | `0.061778992980100914` MATIC |

The two earlier `INSUFFICIENT_TOKEN` failures are positive sponsorship signal too: they were caught at simulation and never billed, exactly as designed. Post-resumption, the SCA native balance on both chains remained `0` (verified by `eth_getBalance` after the on-chain CONFIRMED burns), confirming Gas Station sponsored the resumption userOps end-to-end.

## Per-chain summary table

### Avalanche Fuji (chainId 43113, CCTP domain 1)

| Step | SCP tx ID | On-chain tx | State | Verdict |
|---|---|---|---|---|
| structural readiness | n/a | n/a | n/a | PASS |
| `USDC.approve(TM V2, 1e6)` | `43e8e32c-612b-5157-b182-341fe42d51f1` | `0x9a5aea2d5083d9a4aca32fe48c927f29fd215302a9d4933f54a72c177aae20d6` | CONFIRMED | PASS |
| `TM V2.depositForBurn(...)` simulation (pre-faucet) | `f40ad2a1-8dbd-53d9-bac9-219385ff0373` | n/a; revert `ERC20: transfer amount exceeds balance` | FAILED (`INSUFFICIENT_TOKEN`) | PASS (wiring proof) |
| `TM V2.depositForBurn(...)` on-chain (post-faucet) | `94138eaf-b3e7-5d73-9d3f-255ff411c669` | `0xa7f72b109239121a6df38a97fac3689e6f163922e8d1d75267f7e18b60532f1b` | CONFIRMED (block 55463836) | PASS |
| Iris attestation | n/a | nonce `0x299012340c5ec41ac1ed2c8891c697075140da159c9bf1ee99a024f88c308ddf` | `complete` (cctpVersion 2) | PASS |

### Polygon Amoy (chainId 80002, CCTP domain 7)

| Step | SCP tx ID | On-chain tx | State | Verdict |
|---|---|---|---|---|
| structural readiness | n/a | n/a | n/a | PASS |
| `USDC.approve(TM V2, 1e6)` | `72a53fb4-b179-51e5-bed0-c49a9521e285` | `0x4d5ba05cf70b3ca888a6543c554cd884d781a834fb561ba47638376f81557f4e` | CONFIRMED | PASS |
| `TM V2.depositForBurn(...)` simulation (pre-faucet) | `845c5ee4-dbd9-5a30-bcb2-d3f804332124` | n/a; revert `ERC20: transfer amount exceeds balance` | FAILED (`INSUFFICIENT_TOKEN`) | PASS (wiring proof) |
| `TM V2.depositForBurn(...)` on-chain (post-faucet) | `1bed8758-d3fd-5ae6-bfa2-0d3166961d0d` | `0x5d52c34e845b88d5a2caaf291e273c4cfc3758045c9c7dae2f59f89859b1997f` | CONFIRMED (block 38523759) | PASS |
| Iris attestation | n/a | nonce `0xc8e691f2ecb6d67cf7fdc5b674e0296c95a52b756cdb48c3d5e929ba9b71527b` | `complete` (cctpVersion 2) | PASS |

## Files / scripts produced

- `/tmp/scp-execute.mjs` (reused unchanged from Phase D; parametric SCP `contractExecution` wrapper)
- `/tmp/phase-e/fuji-approve.json` (full SCP response payload for the Fuji approve)
- `/tmp/phase-e/fuji-burn.json` (full SCP response payload for the Fuji burn simulation revert)
- `/tmp/phase-e/amoy-approve.json` (full SCP response payload for the Amoy approve)
- `/tmp/phase-e/amoy-burn.json` (full SCP response payload for the Amoy burn simulation revert)
- `/tmp/tier2-readiness.txt` (per-chain structural readiness summary)
- `/tmp/fuji-deposit-for-burn.json` (resumption: CONFIRMED on-chain depositForBurn SCP payload, Fuji)
- `/tmp/amoy-deposit-for-burn.json` (resumption: CONFIRMED on-chain depositForBurn SCP payload, Amoy)
- `/tmp/iris-fuji.json` (Iris sandbox `complete` response for the Fuji burn, with full message + attestation + decodedMessage)
- `/tmp/iris-amoy.json` (Iris sandbox `complete` response for the Amoy burn, with full message + attestation + decodedMessage)

## Hard-constraint compliance

- No `Co-Authored-By` trailers; commit signed with `rndrntwrk <dev@rndrntwrk.com>` only.
- No em dashes in this evidence file.
- No secrets logged: API key, entity secret raw, ciphertext, and PEM contents are referenced by env-var name or file path only; only wallet IDs, the SCA address, contract addresses, function selectors, tx hashes, and revert data (all public on-chain) appear.
- Zero mocks: every PASS verdict is backed by a `CONFIRMED` on-chain SCP transaction with a public-RPC-verified receipt, an `eth_call` post-state read, or a `FAILED` SCP simulation whose decoded revert payload independently confirms the CCTP V2 wiring. The resumption burns add two `CONFIRMED` on-chain `depositForBurn` txs with public-RPC `balanceOf` deltas (`20 -> 19 USDC` on each chain) and live Iris sandbox `status=complete` responses with full attestation + message + decoded body payloads captured.
- Explicit acceptance label: this is Tier 2 real CCTP-only acceptance, not canonical V4.1 acceptance. V4.1 cannot deploy on Fuji or Amoy at the W0 pin because the Uniswap Universal Router deploy-addresses registry has no entries for those chains.

## Status

**PASS.** All Tier 2 CCTP-only acceptance gates are now PASS on both Fuji and Amoy: structural readiness, USDC approve via SCP, on-chain `depositForBurn` execution, and Iris sandbox attestation `status=complete`. The SCA's native balance stayed `0` on both chains across the resumption userOps (Gas Station sponsorship confirmed via post-burn `eth_getBalance` reads, with `networkFee` values returned in the SCP response payloads), and `balanceOf(SCA)` decreased exactly `1.0 USDC` on each chain. Iris decoded the message body to the correct `(burnToken, mintRecipient, amount, maxFee)` tuple per chain. The Sepolia `receiveMessage` mint is intentionally deferred to a follow-up sweep to avoid SCA nonce contention with the sibling Phase D Sepolia receive run; Tier 2 acceptance per cycle spec only requires the burn-side proof.
