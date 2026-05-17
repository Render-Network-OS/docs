# W1 Phase F: Tier 3 Mainnet-Fork Compatibility (Avalanche + Polygon)

**Date:** 2026-05-17
**Phase reference:** W1 Phase F (Tier 3 mainnet-fork compat)
**Plan:** `docs/superpowers/plans/2026-05-17-sw4p-devnet-frontier-w1-canonical-evm.md`
**Outputs:**
- `sw4p-backend/contracts/registry/tier3-mainnet-fork.json` (mainnetAddresses for AVAX + Polygon)
- `sw4p-backend/contracts/hardhat.config.cjs` (forkAvalancheMainnet, forkPolygonMainnet network entries; chainId 43114 added to chains hardforkHistory)
- `sw4p-backend/contracts/test/fork/avalanche-mainnet-compat.test.cjs`
- `sw4p-backend/contracts/test/fork/polygon-mainnet-compat.test.cjs`

## Verdict

**Tier 3 mainnet-fork compatibility evidence (NOT testnet acceptance, NOT mainnet deploy).**

Both target chains (Avalanche C-Chain 43114, Polygon PoS 137) pass a fresh
`ZapAndBridgeV41` deploy against their *real* mainnet Universal Router,
Permit2, CCTP V2 TokenMessenger, CCTP V2 MessageTransmitter, native USDC, and
wrapped-native (WAVAX / WMATIC) contracts, with safety controls (pause +
unpause) round-trip exercising the live forked state. This is fork-compat
evidence only; it does NOT certify a real testnet acceptance run and does
NOT certify a mainnet deploy.

## Premise

W1's tier ladder (per `docs/superpowers/plans/2026-05-17-sw4p-devnet-frontier-w1-canonical-evm.md`):

- Tier 1: on-chain canonical / oracle-grade addresses (sw4p-backend/contracts/registry/mainnet.json).
- Tier 2: contract-level integration tests against mocks (test/ZapAndBridgeV4*.test.cjs).
- Tier 3: mainnet-fork tests exercising live chain state at a pinned block.

Phase F extends Tier 3 to AVAX and Polygon. The existing fork suite
(`test/ZapAndBridgeV41.fork.test.cjs`) had per-chain blocks for BASE / ARB / ETH /
MATIC; AVAX was wired into `CCTP_META` but missing from `VALID_FORK_CHAINS` /
`CHAIN_CONFIG` / `USDC_WHALE`, so AVAX was effectively unsupported. This
phase adds dedicated per-chain compat suites for AVAX and Polygon under
`test/fork/`, separate from the broader fork suite, so the compat surface is
cleanly attributable in CI output.

## Step 1: RPC availability (preflight)

```
AVAX  mainnet RPC (https://api.avax.network/ext/bc/C/rpc):     block 85654161, chainId 43114
POLYGON mainnet RPC (https://polygon-bor-rpc.publicnode.com): block 87011763, chainId 137
```

Notes:
- Alchemy Polygon RPC `https://polygon-mainnet.g.alchemy.com/v2/h85R-...` returned
  `Monthly capacity limit exceeded`; we fell back to the public `publicnode.com`
  endpoint, which served `eth_blockNumber` / `eth_getCode` / `eth_call` cleanly.
- `https://polygon-rpc.com` returned `API key disabled, reason: tenant disabled,
  json-rpc code: -32051`; not used.
- `https://rpc.ankr.com/polygon` returned `ERR`; not used.
- AVAX public RPC `https://api.avax.network/ext/bc/C/rpc` served all requests
  without rate-limiting in this session.

## Step 2: Bytecode-verification per chain

`eth_getCode` against the live mainnet RPC. `code_size` is the bytecode size
in hex chars minus the `0x` prefix; nonzero means the address has live code.

### Avalanche C-Chain (43114)

| Role | Address | code_size |
|---|---|---|
| Universal Router (Uniswap V2) | `0x94b75331AE8d42C1b61065089B7d48FE14aA73b7` | 38998 |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | 18304 |
| CCTP V2 TokenMessenger | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` | 4350 |
| CCTP V2 MessageTransmitter | `0x8186359aF5F57FbB40c6b14A588d2A59C0C29880` | 27354 |
| USDC (native) | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` | 3704 |
| WAVAX | `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` | 6498 |
| USDC whale (Aave aUSDC vault) | `0x625E7708f30cA75bfd92586e17077590C60eb4cD` | 6.37M USDC balance |

Universal Router cross-check vs upstream
(`https://raw.githubusercontent.com/Uniswap/universal-router/main/deploy-addresses/avalanche.json`):
upstream JSON lists `UniversalRouterV1_2_NoV2Support` =
`0x82635AF6146972cD6601161c4472ffe97237D292` and `UniversalRouterV1_2_V2Support`
= `0x4Dae2f939ACf50408e13d58534Ff8c2776d45265`. Both have live bytecode (35916
bytes each). The registry-pinned `0x94b75331...` is the same canonical
deployment used by the live sw4p V4 production deployment on AVAX (see
`sw4p-backend/contracts/scripts/deployed_addresses.json`); it has 38998 bytes
of code (the V2 / newest variant on this chain). We keep the registry value
for consistency with the live V4 deployment.

### Polygon PoS (137)

| Role | Address | code_size |
|---|---|---|
| Universal Router (UniversalRouterV2) | `0x1095692A6237d83C6a72F3F5eFEdb9A670C49223` | 38998 |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | 18304 |
| CCTP V2 TokenMessenger | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` | 4350 |
| CCTP V2 MessageTransmitter | `0xF3be9355363857F3e001be68856A2f96b4C39Ba9` | 35124 |
| USDC (native) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | 3704 |
| WMATIC | `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270` | 6000 |
| USDC whale | `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` | 11086 USDC balance |

Universal Router cross-check vs upstream
(`https://raw.githubusercontent.com/Uniswap/universal-router/main/deploy-addresses/polygon.json`):
upstream JSON lists `UniversalRouterV2` =
`0x1095692a6237d83c6a72f3f5efedb9a670c49223` (case differs; same address).
Registry pin matches upstream V2.

## Step 3: Fork networks added to hardhat.config.cjs

```javascript
forkAvalancheMainnet: {
  url: "hardhat",
  chainId: 43114,
  forking: {
    url: process.env.AVAX_MAINNET_FORK_RPC_URL || process.env.AVAX_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
    blockNumber: process.env.AVAX_MAINNET_FORK_BLOCK ? Number(...) : ...,
  },
},
forkPolygonMainnet: {
  url: "hardhat",
  chainId: 137,
  forking: {
    url: process.env.POLYGON_MAINNET_FORK_RPC_URL || process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com",
    blockNumber: ...,
  },
},
```

The `chains` map now anchors chainId 43114 at Cancun-from-block-0, alongside
the existing entries for 1 / 137 / 8453, so EDR does not reject historical
state lookups when forking AVAX mainnet.

## Step 4: Pinned fork blocks per run

The test files compute `pinned = head - PIN_OFFSET (5)` at run time so the
fork sits a handful of blocks behind tip. The blocks pinned during this
phase's verification run:

| Chain | Pinned block | Head at run time |
|---|---|---|
| Avalanche C-Chain (43114) | 85654647 | head was ~85654652 |
| Polygon PoS (137) | 87012069 | head was ~87012074 |

(Block numbers can be overridden via `AVAX_MAINNET_FORK_BLOCK` /
`POLYGON_MAINNET_FORK_BLOCK` for deterministic CI replay.)

## Step 5: Fork test results

### Avalanche (test/fork/avalanche-mainnet-compat.test.cjs)

Command:
```
HARDHAT_FORK_CHAIN_ID=43114 \
AVAX_MAINNET_FORK_RPC_URL="https://api.avax.network/ext/bc/C/rpc" \
npx hardhat test test/fork/avalanche-mainnet-compat.test.cjs
```

Result:
```
Tier 3 mainnet-fork compat , Avalanche C-Chain (43114)
        [AVAX] forked mainnet at block 85654647
    bytecode parity , every constructor input has live bytecode on AVAX mainnet (4844ms)
    chain id assertion , forked block.chainid matches AVAX mainnet (43114) (1617ms)
    constructor parity , V4.1 deploys with real AVAX mainnet addresses (538ms)
    safety controls , pause + auto-unpause cycle works against real AVAX mainnet state (3684ms)
    USDC whale parity , registered AVAX whale holds the USDC we expect to use (20527ms)

5 passing (42s)
```

### Polygon (test/fork/polygon-mainnet-compat.test.cjs)

Command:
```
HARDHAT_FORK_CHAIN_ID=137 \
POLYGON_MAINNET_FORK_RPC_URL="https://polygon-bor-rpc.publicnode.com" \
npx hardhat test test/fork/polygon-mainnet-compat.test.cjs
```

Result:
```
Tier 3 mainnet-fork compat , Polygon PoS (137)
        [MATIC] forked mainnet at block 87012069
    bytecode parity , every constructor input has live bytecode on Polygon mainnet (5130ms)
    chain id assertion , forked block.chainid matches Polygon mainnet (137) (1524ms)
    constructor parity , V4.1 deploys with real Polygon mainnet addresses (536ms)
    safety controls , pause + auto-unpause cycle works against real Polygon mainnet state (3629ms)
    USDC whale parity , registered Polygon whale holds the native USDC we expect to use (23578ms)

5 passing (48s)
```

## Step 6: What this proves (and what it does not)

**Proves (mainnet-fork compat):**

1. V4.1 constructor accepts every chain's *real* mainnet input addresses and
   the resulting accessor reads return back exactly those addresses (so V4.1
   is wire-compatible with these chains' canonical Universal Router, Permit2,
   CCTP V2 stack, native USDC, and wrapped-native).
2. Pause and unpause round-trip cleanly with V4.1 deployed on top of a forked
   mainnet at a recent block.
3. The pinned USDC whales hold enough native USDC to seed downstream outbound
   smoke tests (the existing per-chain Permit2 + CCTP outbound test in
   `test/ZapAndBridgeV41.fork.test.cjs` already covers Polygon outbound burn
   against the live TokenMessenger; AVAX outbound through the same path can
   now be added when that suite is extended to AVAX).
4. The chainId-honoring property required by Permit2 EIP-712 signatures holds
   inside the forked EDR runtime (the `chain id assertion` test deploys a
   `ChainIdProbeFork` contract whose `g()` reads `block.chainid` and asserts
   it equals 43114 / 137).

**Does NOT prove:**

- Real testnet acceptance: this is fork compat, not a transaction on AVAX
  Fuji / Polygon Amoy.
- Mainnet readiness: no transaction was broadcast to AVAX mainnet or Polygon
  mainnet, no admin signer was funded, no deploy was executed.
- Inbound `receiveAndTransfer` against live MessageTransmitter: the inbound
  path in `test/ZapAndBridgeV41.fork.test.cjs` is mocked because the live
  MessageTransmitter rejects synthetic attestations. That caveat carries
  through to this phase.

## Step 7: Commits

Two commits planned (one per area):

```
sw4p worktree:
  test(contracts): Tier 3 mainnet-fork compat tests for Avalanche plus Polygon mainnets
    - sw4p-backend/contracts/registry/tier3-mainnet-fork.json
    - sw4p-backend/contracts/hardhat.config.cjs
    - sw4p-backend/contracts/test/fork/avalanche-mainnet-compat.test.cjs
    - sw4p-backend/contracts/test/fork/polygon-mainnet-compat.test.cjs

555 root:
  evidence(W1.f): real mainnet-fork compat evidence for AVAX plus Polygon
    - DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-f-mainnet-fork-compat.md
```

## Step 8: Followups

- Extend `test/ZapAndBridgeV41.fork.test.cjs` to register AVAX in
  `VALID_FORK_CHAINS` / `CHAIN_CONFIG` / `USDC_WHALE`, so the existing per-chain
  outbound + inbound + pause cycle test runs for AVAX too. The whale address
  established here (`0x625E7708f30cA75bfd92586e17077590C60eb4cD`, Aave aUSDC,
  ~6.37M USDC) is the right candidate.
- Re-pin Polygon RPC to a non-Alchemy source in any CI workflow that
  currently inherits `POLYGON_RPC_URL` from `.env.testnet`; the Alchemy
  quota appears to be permanently exhausted on the current key.
