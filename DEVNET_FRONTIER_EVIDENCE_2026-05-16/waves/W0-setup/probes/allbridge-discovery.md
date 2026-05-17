# Allbridge Core REST API Discovery (W0.a)

**Date:** 2026-05-17T04:55:32Z
**Source of truth:** https://docs-core.allbridge.io/sdk/allbridge-core-rest-api
**Production endpoint:** https://core.api.allbridgecoreapi.net

## Step 1: Documentation summary

The Allbridge Core REST API is published as a self-hostable Docker service
(`allbridge/io.allbridge.rest-api:latest`) that exposes a Swagger-documented
HTTP surface on port 3000. The hosted variant lives at
`https://core.api.allbridgecoreapi.net` and is the only public production
endpoint referenced anywhere in the docs or in the SDK source.

Key quotes captured from the docs page (verbatim from WebFetch against
`https://docs-core.allbridge.io/sdk/allbridge-core-rest-api`):

> "ENVIRONMENT" - The environment in which the API is running. Possible
> values are "development" and "production".

> The easiest approach is using the existing Docker image:
> `docker run -p 3000:3000 --env-file .env -d allbridge/io.allbridge.rest-api:latest`

> After deployment, you can access the swagger documentation at
> http://localhost:3000/api.

Important nuance on the `ENVIRONMENT` variable: it is a self-host-side
log/profile switch, not a mainnet-vs-testnet toggle. The network the API
talks to is determined entirely by the per-chain RPC URLs the operator
supplies (`ETH_NODE_URL`, `BSC_NODE_URL`, etc.). The docs never define a
testnet variant of the on-chain bridge or pool contracts.

Documented endpoints (per docs page extraction):

- Raw transactions:
  - `GET /raw/approve`, `GET /raw/swap`, `GET /raw/bridge`,
    `GET /raw/deposit`, `GET /raw/withdraw`, `GET /raw/claim`
- Tokens / chains:
  - `GET /tokens`, `GET /chains`, `GET /token/balance`,
    `GET /token/native/balance`, `GET /token/details`,
    `GET /gas/fee`, `GET /gas/balance`, `GET /gas/extra/limits`
- Pools / liquidity:
  - `GET /check/allowance`, `GET /pool/info/server`,
    `GET /pool/info/blockchain`, `GET /pool/allowance`,
    `GET /liquidity/details`, `GET /liquidity/deposit/calculate`,
    `GET /liquidity/withdrawn/calculate`
- Transfers:
  - `GET /transfer/time`, `GET /transfer/status`, `GET /pending/info`,
    `GET /swap/details`, `GET /bridge/details`,
    `GET /bridge/receive/calculate`, `GET /bridge/send/calculate`

Note: the live production deployment at
`https://core.api.allbridgecoreapi.net` also serves a `/token-info`
aggregate endpoint (used by the SDK and dashboards) that is not listed in
the Docker self-host docs. It is the canonical inventory of supported
chains, pools, and bridge addresses, and it is what the probe in Step 2
exercised.

Testnet endpoint documented? **No.** WebFetch against both
`https://docs-core.allbridge.io/sdk/allbridge-core-rest-api` and the docs
root returned, verbatim: "no mention of testnet, sandbox, staging, devnet,
or any non-production environment for the Allbridge Core REST API."

## Step 2: Production /token-info probe

Command:

```
curl -sS "https://core.api.allbridgecoreapi.net/token-info" \
  > /tmp/allbridge-token-info.json
```

HTTP 200, response size 53953 bytes, captured 2026-05-17T04:53Z UTC.

Summary (from `python3` parse, full transcript in
`/tmp/allbridge-chain-summary.txt`):

```
total chains: 17

chains + chainId + token symbols:
  ETH: chainId=1  tokens=['USDC', 'USDT', 'USDe']
  BSC: chainId=2  tokens=['USDT', 'USDC']
  POL: chainId=5  tokens=['USDT', 'USDC']
  ARB: chainId=6  tokens=['USDC', 'USDT', 'USDe']
  AVA: chainId=8  tokens=['USDC', 'USDT']
  OPT: chainId=10 tokens=['USDC', 'USDT']
  BAS: chainId=9  tokens=['USDC']
  CEL: chainId=11 tokens=['USDT']
  SNC: chainId=12 tokens=['USDC']
  UNI: chainId=14 tokens=['USDC', 'USDT']
  LIN: chainId=17 tokens=['USDC']
  TRX: chainId=3  tokens=['USDT']
  SOL: chainId=4  tokens=['USDC', 'USDT']
  SRB: chainId=7  tokens=['USDC']
  SUI: chainId=13 tokens=['USDC']
  ALG: chainId=15 tokens=['USDC']
  STX: chainId=16 tokens=['USDCx']

USDC presence (15 chains):
  ETH, BSC, POL, ARB, AVA, OPT, BAS, SNC, UNI, LIN, SOL, SRB, SUI, ALG, STX (USDCx)
USDT presence (10 chains):
  ETH, BSC, POL, ARB, AVA, OPT, CEL, UNI, TRX, SOL
```

The `chainId` values are an Allbridge-internal enum (POL=5, SOL=4, etc.),
not EVM chain IDs. Cross-verified via the same response's `bridgeAddress`
and `tokenAddress` fields and via the separate `GET /chains` probe, which
returned canonical mainnet hex IDs:

```json
{"chains":["0x1","0x38","0x89","0xa4b1","0xa86a","0xa","0x2105",
           "0xa4ec","0x92","0x82","0xe708"],"statusCode":200}
```

That list is Ethereum mainnet (0x1), BSC (0x38), Polygon (0x89), Arbitrum
One (0xa4b1), Avalanche C-Chain (0xa86a), Optimism (0xa), Base (0x2105),
Celo (0xa4ec), Sonic (0x92), Unichain (0x82), Linea (0xe708). All
mainnet. Spot-checked POL's USDT `tokenAddress`
`0xc2132D05D31c914a87C6611C10748AEb04B58e8F`, which is the canonical
Polygon mainnet USDT contract.

Full JSON snippet (first ~80 lines, trimmed to ETH entry with one token,
from the captured response):

```json
{
  "ETH": {
    "tokens": [
      {
        "name": "USD Coin",
        "originalName": "USD Coin",
        "originalSymbol": "USDC",
        "poolAddress": "0xa7062bbA94c91d565Ae33B893Ab5dFAF1Fc57C4d",
        "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "decimals": 6,
        "symbol": "USDC",
        "poolInfo": {
          "aValue": "20",
          "dValue": "2171291696",
          "tokenBalance": "1129795416",
          "vUsdBalance": "1041540097",
          "totalLpAmount": "2169302096",
          "accRewardPerShareP": "1837672204042291904",
          "p": 52
        },
        "feeShare": "0.0015",
        "apr": "0.08895720179602902011",
        "apr7d": "0.08895720179602902011",
        "apr30d": "0.07180867238708855960",
        "lpRate": "0.50047553311124048665",
        "cctpAddress": "0xC51397b75B783E31469bFaADE79913F3f82210d6",
        "cctpV2Address": "0x7972d6907739593C00e6284c53C83dB3ECd15c33",
        "cctpFeeShare": "0.001",
        "cctpV2FeeShare": "0.00114985",
        "xReserve": {
          "bridgeAddress": "0x44F9E60cB5543777492101BF424271c5F252cF15",
          "feeConst": "0",
          "feeShare": "0.001"
        },
        "flags": { "swap": true, "pool": true }
      }
    ],
    "chainId": 1,
    "bridgeAddress": "0x609c690e8F7D68a59885c9132e812eEbDaAf0c9e",
    "oftBridgeAddress": "0xeC455fFC19811e573eb5700a1bDff6ee1C47AB7B",
    "swapAddress": "0x609c690e8F7D68a59885c9132e812eEbDaAf0c9e"
  }
}
```

(Full 53,953-byte JSON captured locally at
`/tmp/allbridge-token-info.json` for reproducibility; size: 53953 bytes.)

## Step 3: Testnet endpoint probe

Probed hostnames (all attempted live, 2026-05-17T04:53Z UTC):

| Probed URL                                                       | Result                    |
| ---------------------------------------------------------------- | ------------------------- |
| `https://core.api.allbridgecoreapi-test.net/token-info`          | NXDOMAIN (curl exit 6)    |
| `https://test.api.allbridgecoreapi.net/token-info`               | NXDOMAIN (curl exit 6)    |
| `https://staging.api.allbridgecoreapi.net/token-info`            | NXDOMAIN (curl exit 6)    |
| `https://core-test.api.allbridgecoreapi.net/token-info`          | NXDOMAIN (curl exit 6)    |
| `https://core.api.allbridgecoreapi.net/token-info?testnet=true`  | HTTP 200, identical payload to mainnet (param silently ignored) |

Additional signal: the production response contains zero occurrences of
the strings `test`, `staging`, `sandbox`, or `devnet` (case-insensitive
grep against `/tmp/allbridge-token-info.json` returned no matches), and
every spot-checked on-chain address resolves to a mainnet deployment.

**Outcome: no testnet endpoint documented or reachable.** Allbridge Core
is mainnet-only at the REST tier. There is no public Allbridge-hosted
testnet corridor between any two supported chains.

## Step 4: W2 Phase 2 path determination

Per spec `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`,
section W2 Phase 2:

- **Path A applicable?** **No.** Path A requires a public Allbridge
  testnet corridor between two supported chains with a shared token.
  Step 3 establishes that no such corridor exists. The REST API exposes
  exactly one environment (production / mainnet), and no testnet bridge
  or pool contracts are listed anywhere in `/token-info` or `/chains`.
- **Path B1 applicable?** **Yes, technically.** A one-time small mainnet
  transfer (approximately $5 USDT on a low-fee corridor such as POL to
  ARB, or POL to OPT) would produce a real Allbridge transfer ID and
  satisfy the live-route acceptance criterion. The corridors with both
  USDT presence and modest gas (POL, ARB, OPT, AVA, BSC) are all
  available per Step 2.
- **Path B2 applicable?** **Yes.** Deferring Allbridge first-class wiring
  is viable: the rail consolidation code (bridge protocol enum, route
  scoring, settlement adapter scaffolding) can ship without a live
  Allbridge transaction. Acceptance evidence for the Allbridge row of
  the Live Dependency Matrix would then be the REST API discovery + a
  unit-tested adapter against the documented endpoints, marked as
  "wiring complete, live tx deferred."

**Recommended path: B2 (defer live Allbridge tx; ship wiring).**

**Reasoning:** A one-time mainnet authorization (B1) is feasible and
would produce stronger acceptance evidence, but it carries three
concrete costs that the design feedback explicitly flagged: (1) it
consumes real working capital on a route whose end-to-end UX the cycle
is not yet ready to exercise interactively, (2) it commits to a specific
sender wallet and key custody story before the broader sw4p settlement
identity is finalized, and (3) it produces evidence that is only
useful once; the rail consolidation code itself does not need a live tx
to be reviewable. B2 ships the same consolidation work, preserves the
option to run a B1 acceptance tx later (the REST adapter is the same
either way), and keeps the W2 critical path clear of mainnet gas and
custody coordination. If a sponsor or reviewer later asks for a live
Allbridge transfer ID, the path from B2 to B1 is a single curl plus
signer wiring, not a refactor.

## Conclusion

The Allbridge live-route discovery establishes that the Allbridge Core
REST API is mainnet-only, exposes 17 chains and a USDT or USDC corridor
on every one, and offers no testnet endpoint, so a Wave 2 live route
acceptance test cannot be a public testnet tx and must be either a
mainnet authorization or a deferral.

This row of the Live Dependency Matrix is marked: **PASS with W2 path = B2**.

The W2 plan (to be written after W0 closes) should:

1. Treat Allbridge as a rail-consolidation-only target for this cycle.
   Build the protocol enum, route scoring, and a thin REST adapter that
   wraps `/token-info`, `/chains`, `/bridge/send/calculate`,
   `/bridge/receive/calculate`, and `/transfer/status`. No signer
   integration, no on-chain authorize step.
2. Use the Step 2 probe (USDT on POL or ARB or OPT or AVA or BSC, USDC
   on those plus ETH, BAS, SOL, SUI) as the authoritative corridor list
   for adapter unit tests; do not synthesize chain or token lists.
3. Record acceptance evidence as "REST discovery + adapter unit tests
   green + dry-run quote against production `/bridge/send/calculate`."
   Do not include a live transfer ID for this cycle.
4. Carry a B1 follow-up ticket (one-time approximately $5 mainnet
   transfer on POL to ARB USDT, or similar) as a separate, optional
   work item, gated on a sponsor request or on the sw4p settlement
   identity reaching production readiness, whichever comes first.
5. Do not introduce any Allbridge testnet code paths or mock-testnet
   fixtures; the rail is mainnet-only by upstream design and pretending
   otherwise would create misleading test signal.
