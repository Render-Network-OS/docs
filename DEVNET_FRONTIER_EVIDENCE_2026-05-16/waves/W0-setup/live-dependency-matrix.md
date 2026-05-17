# Live Dependency Matrix v1 (W0.a)

**Generated:** 2026-05-17T05:10:00Z
**Cycle:** sw4p devnet-frontier 2026-05-16
**Spec reference:** `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` (Section 4, W0.a)
**Probe evidence:** sibling files under `probes/`

## Rows

| Dependency | Source of truth | Probe | Evidence file | Status |
|---|---|---|---|---|
| Circle CCTP V2 testnet endpoints | https://developers.circle.com/cctp | `cast code` byte-count per chain + Iris sandbox HTTP + `solana program show` on devnet | `probes/circle-cctp-v2.md` | **PASS**. All 6 EVM testnets (Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Avalanche Fuji, Polygon Amoy) carry `TokenMessengerV2` `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` and `MessageTransmitterV2` `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` at identical 2176-byte runtime sizes. Solana CCTP V2 programs `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe` (TokenMessengerMinterV2, 717392 bytes) and `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC` (MessageTransmitterV2, 495640 bytes) live on devnet under the upgradeable BPF loader. Iris sandbox `https://iris-api-sandbox.circle.com/v2/messages/0` reachable (HTTP/2 404 with structured JSON for unknown tx hash). Protocol code in `sw4p-backend/src/cctp_burn.rs` + `networks.rs` already references the same canonical addresses; no Circle-vs-protocol drift. |
| Uniswap Universal Router testnet addresses | https://github.com/Uniswap/universal-router/tree/main/deploy-addresses (pinned to commit SHA `050b93cf4e9508b78412f23ad66e85d5c76a45b5`, 2025-12-01T21:51:45Z) | per-chain JSON presence + UniversalRouter address extraction at HEAD | `probes/uniswap-deploy-addresses.md` | **PASS with caveats**. Sepolia (`UniversalRouterV1_2_V2Support` `0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD` and `UniversalRouterV2` `0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b`) and Base Sepolia (`UniversalRouterV2` `0x95273d871c8156636e114b63797d78D7E1720d81`) carry concrete router addresses. `op-sepolia.json` present but contains only `UnsupportedProtocol` `0xFC885F37F5A9FA8159c8dBb907fc1b0C2fB31323` with no UniversalRouter key; fails the V4.1 `ZapAndBridgeV41.sol:103` nonzero-router precondition. `arbitrum-sepolia.json`, `avalanche-fuji.json`/`fuji.json`/`avax-fuji.json`, and `polygon-amoy.json`/`amoy.json` all return HTTP 404 at HEAD. Permit2 not listed in this registry by schema (canonical Permit2 address `0x000000000022D473030F116dDEE9F6B43aC78BA3` is sourced from `Uniswap/permit2`, not `universal-router/deploy-addresses/`); W1.b will source Permit2 chain coverage separately. |
| Allbridge Core live route corridors | https://core.api.allbridgecoreapi.net + https://docs-core.allbridge.io | `GET /token-info` (production), `GET /chains` (production), testnet hostname enumeration | `probes/allbridge-discovery.md` | **PASS with W2 path = B2 (defer live tx)**. Production endpoint `https://core.api.allbridgecoreapi.net/token-info` HTTP 200 with 53953-byte response covering 17 chains (ETH, BSC, POL, ARB, AVA, OPT, BAS, CEL, SNC, UNI, LIN, TRX, SOL, SRB, SUI, ALG, STX). USDC present on 15 chains; USDT present on 10. `GET /chains` returns canonical mainnet hex chain IDs only (`0x1`, `0x38`, `0x89`, `0xa4b1`, `0xa86a`, `0xa`, `0x2105`, `0xa4ec`, `0x92`, `0x82`, `0xe708`). All four candidate testnet hostnames (`core.api.allbridgecoreapi-test.net`, `test.api.allbridgecoreapi.net`, `staging.api.allbridgecoreapi.net`, `core-test.api.allbridgecoreapi.net`) return NXDOMAIN; `?testnet=true` query param silently ignored. Docs page surveyed end-to-end: zero references to testnet, sandbox, staging, or devnet. Multi-transport corridor observation (each corridor may expose `bridgeAddress`, `cctpAddress`, `cctpV2Address`, `oftBridgeAddress`, and `xReserve.bridgeAddress` simultaneously) flagged for W2 adapter design. |
| Circle Solana gas sponsor | https://developers.circle.com/wallets/gas-station + https://developers.circle.com/cctp/references/solana-programs | fit-research + real sponsored devnet tx OR documented deferral | `probes/circle-gas-sponsor.md` (commit `2dd5b45577e2d383702d315aefcb166f5b44c684`) + `circle-sponsor-deferral.md` | **DEFERRED. Circle Gas Station fit NOT CONFIRMED per `probes/circle-gas-sponsor.md` and `circle-sponsor-deferral.md`. Kora retained as Solana fee-payer; sunset PR deferred; unblock criteria documented.** |
| Cloudflare zone for sw4p.io / mcp.sw4p.io / api.sw4p.io | Cloudflare authoritative nameservers (`monika.ns.cloudflare.com`, `damian.ns.cloudflare.com`) | `dig` per host (A, AAAA, CNAME, NS) + `openssl s_client` TLS capture | `probes/cloudflare-dns.md` | **PASS**. `sw4p.io`, `www.sw4p.io`, `api.sw4p.io`, `app.sw4p.io`, `console.sw4p.io` all resolve to Cloudflare anycast (A: 172.67.69.69, 104.26.10.41, 104.26.11.41; AAAA: 2606:4700:20::681a:a29, 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29) and serve a Google Trust Services WE1 cert (`CN=sw4p.io`, SHA-256 `11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52`, valid Apr 15 to Jul 14 2026) via Cloudflare TLS termination. `mcp.sw4p.io` NXDOMAIN (clear for W4 provisioning). `555.sw4p.io` no records (out of scope for this cycle). W0.b interpretation: "DNS swap" is a Cloudflare origin change to the AWS ELB hostname, not a record-level Cloudflare-to-AWS DNS edit, since the zone stays delegated to Cloudflare. |
| AWS landing target | existing commit `b0e95fd feat(ops): route sw4p landing hosts to aws ingress` | `kubectl get ingress` + direct ELB curl with `Host: sw4p.io` | `probes/aws-landing.md` + `phase-3-no-cutover-summary.md` | **PASS. sw4p.io already serves from AWS EKS per `phase-3-no-cutover-summary.md` (Scenario A). No DNS cutover executed; no cutover needed.** |

## W1 tier determination (locked from probes)

Crossing the Uniswap canonical-registry inventory against universal Circle CCTP V2 EVM testnet presence:

- **Tier 1** (canonical V4.1 acceptance, real testnet deploy with both UniversalRouter and CCTP V2): Ethereum Sepolia, Base Sepolia
- **Tier 2** (real CCTP-only proof, no canonical V4.1 acceptance): Avalanche Fuji, Polygon Amoy
- **Tier 3** (mainnet-fork compatibility only, no canonical V4.1 testnet deploy): Arbitrum Sepolia, Optimism Sepolia, Avalanche mainnet block-pinned fork, Polygon mainnet block-pinned fork

**Spec divergence:** the cycle spec (line 178 of `2026-05-16-sw4p-devnet-frontier-execution-design.md`) lists Arbitrum Sepolia in the default Tier 1 set without conditioning it on the Uniswap registry probe; only Optimism Sepolia is given the conditional R3 escape hatch (line 415). The probe result is that Arbitrum Sepolia has no `arbitrum-sepolia.json` at HEAD of the canonical registry, so by the same precondition the spec applies to Optimism Sepolia (file presence with a real router address gates Tier 1), Arbitrum Sepolia must drop to Tier 3 as well. The W1 plan-writer should treat both Arbitrum Sepolia and Optimism Sepolia identically under an extended R3 (no canonical V4.1 acceptance on those testnets; Tier 3 mainnet-fork compat instead). Recommended editorial action: extend R3 to cover Arbitrum Sepolia explicitly.

## W2 Phase 2 path (locked from probes)

**Path B2: defer live Allbridge mainnet tx; ship rail consolidation + REST adapter.**

Path A (public Allbridge testnet corridor) is impossible: no testnet endpoint exists at the REST tier, and the `/chains` response is mainnet-only. Path B1 (one-time small mainnet authorization, e.g. ~$5 USDT POL to ARB) is technically feasible but consumes working capital on a route the cycle is not ready to exercise interactively, commits a sender wallet and key custody story before sw4p settlement identity is finalized, and produces evidence that is only useful once. Path B2 ships the same consolidation work, preserves an upgrade path to B1 later without refactor (the REST adapter is the same), and keeps the W2 critical path clear of mainnet gas and custody coordination.

The W2 plan should:

1. Ship rail consolidation work (`BridgeProtocol` enum cleanup, explicit routing observability) without a live Allbridge transaction.
2. Ship the Allbridge REST adapter against production, read-only initially: wrap `/token-info`, `/chains`, `/bridge/send/calculate`, `/bridge/receive/calculate`, and `/transfer/status`. No signer integration, no on-chain authorize step.
3. Capture dry-run quote evidence from `/bridge/send/calculate` plus `/bridge/receive/calculate` for at least one USDC corridor and one USDT corridor on the live mainnet inventory; record actual quote payloads as W2 acceptance.
4. Document multi-transport corridor support: the adapter must read `bridgeAddress`, `cctpAddress`, `cctpV2Address`, `oftBridgeAddress`, and `xReserve.bridgeAddress` per corridor and reason about up to 4 simultaneously-routable transports per (sourceChain, destChain, token) tuple. Route selection cannot assume one transport per corridor.
5. Document the live-tx deferral and the upgrade-to-B1 trigger criterion (sponsor request, sw4p settlement identity reaching production readiness, or first paying user, whichever comes first), and carry a separate optional B1 follow-up ticket.
6. Do not introduce Allbridge testnet code paths or mock-testnet fixtures: the rail is mainnet-only by upstream design and pretending otherwise would create misleading test signal.

## Kora retirement candidacy (W0.c complete)

**DEFERRED.** Per W0.c outcome (Circle Gas Station fit NOT CONFIRMED), Kora stays in the architecture. W8.f records the deferral and the unblock criteria; no sunset PR is drafted in this cycle.

## AWS / Cloudflare cutover state (W0.b complete, no cutover executed)

Phase 3 complete (`phase-3-no-cutover-summary.md`). No Cloudflare origin edit was executed because sw4p.io is already serving from AWS EKS (Scenario A, confirmed in `probes/aws-landing.md`).

Pre-flight and post-Phase-3 state both stable:

- A targets: 172.67.69.69, 104.26.10.41, 104.26.11.41 (Cloudflare anycast, unchanged)
- AAAA targets: 2606:4700:20::681a:a29, 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29 (unchanged)
- Cert fingerprint: `11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52` (expires 2026-07-14, unchanged)
- Origin: AWS EKS nginx-ingress (sw4p-landing Service on port 10000), confirmed via `x-powered-by: Express` header and commit chain
- TLS termination: Cloudflare edge (Google Trust Services cert), no mid-cycle rotation detected

## Conclusion

W0.a probes that ran in Phase 2 of W0 all PASS. Phase 3 (AWS landing) is complete: sw4p.io is already serving from AWS EKS, so no Cloudflare origin edit was needed. Phase 4 (Circle gas sponsor) is complete with DEFERRED outcome: Circle Gas Station fit NOT CONFIRMED; Kora retained; unblock criteria documented in `circle-sponsor-deferral.md`. The W1 tier roster and the W2 Phase 2 path are now locked from probe data and ready to inform the W1 + W2 plan writers.

This matrix is v1 Phase 4 update; v2 (all rows finalized + acceptance criteria signed off) is written after W0 fully closes, as part of `acceptance.md`.
