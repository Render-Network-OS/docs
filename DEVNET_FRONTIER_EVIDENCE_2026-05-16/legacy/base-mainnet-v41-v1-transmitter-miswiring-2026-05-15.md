# LEGACY: Base mainnet V4.1 deploy with V1 MessageTransmitter immutable

**Status:** SUPERSEDED / DO NOT ROUTE / LEGACY ONLY
**Date of deploy:** 2026-05-17 (PR #221 createdAt 2026-05-17T03:44:21Z; deploy submitted 2026-05-17T06:50:00Z UTC per `mainnet_v41_deploys.json`)
**Date of supersession:** 2026-05-17
**Source PR:** Render-Network-OS/sw4p-pro#221 (closed; not merged)

## Poison markers (machine-readable)

```yaml
chain: base-mainnet
chain_id: 8453
contract_address: 0xaafa1e3d7f317aa40068f34c637441b5c14c1262
deploy_tx_hash: 0xebfe701c5fa5b0a4822dc77019b48b07e077364e874e526de5246768219e6b37
deploy_block: 46099837
deploy_block_hash: 0xa762d9504d0d6ded037da92ada9bd19b32cf5d70ae7c40a1886e2d47a78ed1d0
deployer_eoa: 0x1eb4454787bdef594deac1603366c5e46074ee6a
deployer_sca: 0x1eb4454787bdef594deac1603366c5e46074ee6a
deployer_path: circle-sca
sca_core: circle_6900_singleowner_v3
circle_wallet_id: 27d863e3-7dee-5a95-9d5d-7d85543a0829
circle_contract_id: 019e3401-f2de-7d4b-a6e2-d97ceb5502f5
circle_transaction_id: 570b8ff4-0b49-5d69-836d-bddd23282d6b
legacy_v1_transmitter: true
superseded: true
canonical: false
route_enabled: false
do_not_route: true
deployment_method: Circle WaaS Smart Contract Platform (Circle SDK) with Gas Station sponsorship
gas_sponsored_by_circle: true
gas_used: 5051536
network_fee_eth: 0.00004057426726
```

## What this contract is

A real V4.1 contract deployed to Base mainnet at `0xaafa1e3d7f317aa40068f34c637441b5c14c1262`. All 13 immutable + storage sanity checks listed in PR #221 pass on-chain. The contract IS V4.1 bytecode; the issue is that its **immutable** `messageTransmitter` was set at constructor time to the Base mainnet CCTP **V1** MessageTransmitter, not V2.

## Why it cannot be canonical

The `messageTransmitter` field is `immutable` in V4.1's Solidity source. Once set at deployment, it cannot be changed without redeploying. The immutable value here is:

- **Configured at deploy:** `0xAD09780d193884d503182aD4588450C416D6F9D4` (Base mainnet CCTP **V1** MessageTransmitter, NOT V2)
- **Canonical V2 value (post-#239):** `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64`

CCTP V2 messages are formatted differently from V1 and use different replay protection. Routing V2 traffic to a V1 transmitter will not produce settlement; routing V1 traffic via this contract is also wrong because the rest of V4.1 expects V2 semantics (e.g. `depositForBurn` with V2 7-parameter signature, `maxFee`, `minFinalityThreshold`, paired with the correct V2 `TokenMessenger` already wired at `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d`).

Therefore this contract is **permanently disabled for routing.** It must not be added to any registry (`registry/mainnet.json`, keeper config, SDK runtime). It must not appear in any chain-routing map. Any reference to it in code must use the poison markers above.

## On-chain probe verification

Independent `eth_call` against the deployed contract via Base mainnet public RPC (`https://mainnet.base.org`), executed 2026-05-17:

```
Method: messageTransmitter()
Selector (computed via ethers.id("messageTransmitter()").slice(0,10)): 0x7b04c181
Raw eth_call result: 0x000000000000000000000000ad09780d193884d503182ad4588450c416d6f9d4
Decoded address: 0xAD09780d193884d503182aD4588450C416D6F9D4

Cross-check via foundry cast:
$ cast call 0xaafa1e3d7f317aa40068f34c637441b5c14c1262 "messageTransmitter()(address)" --rpc-url https://mainnet.base.org
0xAD09780d193884d503182aD4588450C416D6F9D4

Interpretation: V1 CONFIRMED.
- Base mainnet CCTP V1 MessageTransmitter: 0xAD09780d193884d503182aD4588450C416D6F9D4 (matches deployed value)
- Base mainnet CCTP V2 MessageTransmitter (canonical, post-#239): 0x81D40F21F12A8F0E3252Bccb954D722d4c464B64 (does NOT match)
```

Companion immutable probes (for completeness; these are correct):

```
$ cast call 0xaafa1e3d7f317aa40068f34c637441b5c14c1262 "tokenMessenger()(address)" --rpc-url https://mainnet.base.org
0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d   # Base mainnet CCTP V2 TokenMessenger (correct)

$ cast call 0xaafa1e3d7f317aa40068f34c637441b5c14c1262 "usdc()(address)" --rpc-url https://mainnet.base.org
0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913   # Base native USDC (correct)

$ cast call 0xaafa1e3d7f317aa40068f34c637441b5c14c1262 "weth()(address)" --rpc-url https://mainnet.base.org
0x4200000000000000000000000000000000000006   # Base WETH (correct)
```

This evidence row's `legacy_v1_transmitter: true` marker is set per the on-chain probe outcome above. The mismatch is the `messageTransmitter` immutable specifically; the V2 `tokenMessenger`, native USDC, and WETH immutables are all correct, which makes the deployed contract a hybrid V2-mostly with a V1 transmitter pin: unsafe to route either way.

## Sanity matrix from PR #221 body

| Assertion | Expected | Actual | Note |
|-----------|----------|--------|------|
| paused() | false | false | pass |
| globalDailyLimit() | 10000000000000 (10M USDC e6) | 10000000000000 | pass |
| MAX_PLATFORM_FEE_BPS | 1000 | 1000 | pass |
| AUTO_UNPAUSE_SECONDS | 604800 (7d) | 604800 | pass |
| feeTreasury | deployer EOA | 0x1eb4454787bdef594deac1603366c5e46074ee6a | pass |
| TIMELOCK_DELAY | 86400 (1d) | 86400 | pass |
| hasRole(DEFAULT_ADMIN, deployer) | true | true | pass |
| universalRouter | 0x6fF5693b99212Da76ad316178A184AB56D299b43 | match | pass |
| permit2 | 0x000000000022D473030F116dDEE9F6B43aC78BA3 | match | pass |
| tokenMessenger | 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d (CCTP V2) | match | pass |
| messageTransmitter | claimed "Base V2" in PR body but value `0xAD09780d193884d503182aD4588450C416D6F9D4` is provably the Base mainnet CCTP **V1** transmitter | match-to-deployed-but-wrong-canonically | FAIL (mislabel) |
| usdc | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (native USDC on Base) | match | pass |
| weth | 0x4200000000000000000000000000000000000006 | match | pass |

The header row "messageTransmitter" was mislabeled in the PR body as "Base V2" but the address `0xAD09...F9D4` is provably the V1 transmitter. Post-#239 master's `CCTP_V2_MESSAGE_TRANSMITTER_MAINNET` constant in `sw4p-backend/contracts/scripts/deploy_v4.ts` correctly carries `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64`. The sanity matrix in PR #221 also reported `message_transmitter_matches_mainnet_v2: true` inside `mainnet_v41_deploys.json`, which is incorrect by the same argument.

## Constructor args as deployed (full)

Per `mainnet_v41_deploys.json` in the closed PR branch (`fa712558`), the on-chain constructor args were:

```
1. universalRouter        = 0x6fF5693b99212Da76ad316178A184AB56D299b43
2. permit2                = 0x000000000022D473030F116dDEE9F6B43aC78BA3
3. tokenMessenger         = 0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d   (CCTP V2; correct)
4. messageTransmitter     = 0xAD09780d193884d503182aD4588450C416D6F9D4   (CCTP V1; WRONG, source of miswire)
5. usdc                   = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913   (native USDC; correct)
6. weth                   = 0x4200000000000000000000000000000000000006   (correct)
7. initialAdmin           = 0x1eb4454787bdef594deac1603366c5e46074ee6a   (deployer EOA)
8. initialPauser          = 0x1eb4454787bdef594deac1603366c5e46074ee6a   (deployer EOA)
9. initialTreasury        = 0x1eb4454787bdef594deac1603366c5e46074ee6a   (deployer EOA)
10. defaultAdminDelaySecs = 86400                                        (1 day)
```

Arg 4 is the miswire.

## Supersession

- **Future canonical Base mainnet V4.1:** to be deployed via the Option-A SCA flow (Circle SCA `0x6c55ad0ae94dcd3a8c0b8bf38077e20f580233ac`, wallet set `6035954f566a`) after the wave PR #247 (`wp2.4-mainnet-wave-2026-05-17`) merges with the post-#239 V2 MessageTransmitter constants. Until that deploy lands, **there is no canonical Base mainnet V4.1**.
- **PR #221** was closed 2026-05-17 without merge. No file from that branch is in master. The legacy address exists only as on-chain history and in this evidence doc.
- **Skipped chains in PR #221** (ETH, ARB, OP, MATIC, AVAX, UNI) are independently superseded by wave PR #247's per-chain Gas Station policy work; they are not material to this evidence row.

## Keeper / SDK / registry guidance

- DO NOT add `0xaafa1e3d7f317aa40068f34c637441b5c14c1262` to `sw4p-backend/contracts/registry/mainnet.json` or any runtime-routed registry.
- DO NOT reference this address in `deploy_v4.ts`, `deploy_addresses.json`, or any keeper / SDK chain map.
- If any historical doc references it (other than this evidence file), update with poison markers or remove.
- For chain explorers and dashboards: explicitly mark as "DEPRECATED / DO NOT ROUTE".
- The deployer EOA `0x1eb4454787bdef594deac1603366c5e46074ee6a` still holds `DEFAULT_ADMIN_ROLE` on this contract on-chain. Because the contract is not routed and not canonical, no Safe handoff is required for this address. The role remains with the deployer EOA for archival purposes; do not promote, do not pause-and-forget, do not perform `beginDefaultAdminTransfer` on this legacy contract.

## Audit trail

- Deploy commit on closed branch: `fa712558 feat(mainnet): deploy ZapAndBridgeV41 to Base via Circle WaaS`
- Subsequent scripts fix attempt on same branch: `6cc617e3 fix(scripts): switch deploy_v4 to Circle SDK with correct deploy schema` (did NOT fix the immutable; cannot)
- Closed PR: Render-Network-OS/sw4p-pro#221 (DRAFT at time of close, branch `wp2.4-mainnet-v41-deploys`, author `rndrntwrk`, createdAt `2026-05-17T03:44:21Z`)
- Closing comment links to this file.

## Final disposition

**LEGACY. Do not route. Do not promote. Do not delete the on-chain artifact (it cannot be deleted anyway).** This evidence doc is the canonical reference for the address going forward. Any reviewer asking "what is `0xaafa1e3d7f317aa40068f34c637441b5c14c1262` on Base?" gets pointed here.
