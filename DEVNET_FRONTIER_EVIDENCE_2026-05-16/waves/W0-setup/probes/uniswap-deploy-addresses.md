# Uniswap Universal Router Deploy-Addresses Inventory (W0.a)

**Date:** 2026-05-17T04:44:48Z
**Source of truth:** https://github.com/Uniswap/universal-router/tree/main/deploy-addresses
**Deploy-addresses dir latest commit SHA:** 050b93cf4e9508b78412f23ad66e85d5c76a45b5
**Deploy-addresses dir latest commit date:** 2025-12-01T21:51:45Z

## Step 1: deploy-addresses/ directory listing

Full listing from `GET /repos/Uniswap/universal-router/contents/deploy-addresses`
at HEAD of `main`, sorted by filename, with the per-file blob SHA prefix:

```
CLAUDE.md              f4bc8446
arbitrum-goerli.json   49416b95
arbitrum.json          26ddaea2
avalanche.json         60473541
base-goerli.json       a6818760
base-sepolia.json      b7c69f51
base.json              93ed945d
blast.json             6d04ebd2
bsc.json               678ed164
celo-alfajores.json    49416b95
celo.json              b8917fb4
goerli.json            08649dc2
ink.json               3b5ec39c
mainnet.json           d6d846d9
op-sepolia.json        810ceda8
optimism-goerli.json   49416b95
optimism.json          5539c194
polygon-mumbai.json    49416b95
polygon.json           890cd282
sepolia.json           43908a4a
soneium.json           d299419a
unichain-sepolia.json  2d2e3fea
unichain.json          accaac74
worldchain.json        0f52f90e
zora.json              f1563fad
```

Testnet entries per the directory's own `CLAUDE.md`:

```
sepolia.json           Sepolia
goerli.json            Goerli (deprecated)
base-sepolia.json      Base Sepolia
base-goerli.json       Base Goerli (deprecated)
op-sepolia.json        Optimism Sepolia
optimism-goerli.json   Optimism Goerli (deprecated)
arbitrum-goerli.json   Arbitrum Goerli (deprecated)
polygon-mumbai.json    Polygon Mumbai (deprecated)
celo-alfajores.json    Celo Alfajores
unichain-sepolia.json  Unichain Sepolia
```

There is no `arbitrum-sepolia.json`, no `avalanche-fuji.json` (and no `fuji.json`
or `avax-fuji.json`), and no `polygon-amoy.json` (and no `amoy.json`) at HEAD.
The 404 evidence for every alternate filename probed:

```
arbitrum-sepolia.json: HTTP 404
avalanche-fuji.json:   HTTP 404
fuji.json:             HTTP 404
avax-fuji.json:        HTTP 404
polygon-amoy.json:     HTTP 404
amoy.json:             HTTP 404
optimism-sepolia.json: HTTP 404
opsepolia.json:        HTTP 404
basesepolia.json:      HTTP 404
arbsepolia.json:       HTTP 404
ethereum-sepolia.json: HTTP 404
```

## Step 2 + 3: W1 candidate testnet inventory

The actual JSON schema in this directory does NOT list `Permit2`. Permit2 has a
canonical cross-chain address (`0x000000000022D473030F116dDEE9F6B43aC78BA3`)
sourced from `Uniswap/permit2`, not from `universal-router/deploy-addresses/`.
The Permit2 column below reflects what the canonical Uniswap router registry
file actually contains, not Permit2 chain deployment status. Permit2 chain
coverage is tracked separately (W1.b registry hardening).

The "Router available" column reports whether the JSON contains a concrete
deployed UniversalRouter address (any of `UniversalRouterV1`,
`UniversalRouterV1_2_V2Support`, or `UniversalRouterV2`). A file containing
only `UnsupportedProtocol` is recorded as no router available.

| W1 candidate testnet | Filename in repo  | UniversalRouter address(es) in JSON                                                                                                            | Permit2 in JSON | Router available | Tier  |
|----------------------|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|------------------|-------|
| Ethereum Sepolia     | sepolia.json      | `UniversalRouterV1_2_V2Support`: 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD; `UniversalRouterV2`: 0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b   | not listed      | yes              | Tier 1 |
| Base Sepolia         | base-sepolia.json | `UniversalRouterV2`: 0x95273d871c8156636e114b63797d78D7E1720d81                                                                                | not listed      | yes              | Tier 1 |
| Arbitrum Sepolia     | ABSENT            | n/a                                                                                                                                            | n/a             | n/a              | Tier 3 (drop) |
| Optimism Sepolia     | op-sepolia.json   | none (file contains only `UnsupportedProtocol`: 0xFC885F37F5A9FA8159c8dBb907fc1b0C2fB31323)                                                    | not listed      | no               | Tier 3 (drop, per spec R3) |
| Avalanche Fuji       | ABSENT            | n/a                                                                                                                                            | n/a             | n/a              | Tier 2 |
| Polygon Amoy         | ABSENT            | n/a                                                                                                                                            | n/a             | n/a              | Tier 2 |

## Raw JSON captures

### sepolia.json (Ethereum Sepolia)

```json
{
  "UniversalRouterV1_2_V2Support": "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  "UnsupportedProtocol": "0x5302086A3a25d473aAbBd0356eFf8Dd811a4d89B",
  "UniversalRouterV2": "0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b"
}
```

### base-sepolia.json (Base Sepolia)

```json
{
  "UniversalRouterV2": "0x95273d871c8156636e114b63797d78D7E1720d81",
  "UnsupportedProtocol": "0x76870DEbef0BE25589A5CddCe9B1D99276C73B4e"
}
```

### op-sepolia.json (Optimism Sepolia)

```json
{
  "UnsupportedProtocol": "0xFC885F37F5A9FA8159c8dBb907fc1b0C2fB31323"
}
```

The file exists but contains no `UniversalRouterV1`,
`UniversalRouterV1_2_V2Support`, or `UniversalRouterV2` key. There is no
deployed Universal Router for Optimism Sepolia in the canonical registry as of
the commit SHA cited above.

### Reference: mainnet.json schema

For comparison, the mainnet file (`mainnet.json`) carries:

```json
{
  "UniversalRouterV1": "0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B",
  "UnsupportedProtocol": "0x76D631990d505E4e5b432EEDB852A60897824D68",
  "UniversalRouterV1_2_V2Support": "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  "UniversalRouterV2": "0x66a9893cc07d91d95644aedd05d03f95e1dba8af"
}
```

This confirms the schema convention: the registry tracks router versions plus
`UnsupportedProtocol`, never Permit2.

## Step 4: W1 tier roster determination

Per the cycle spec
`docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`
section "W1 tier roster (binding)" (lines 176 to 182), and risk row R3 (line 415):

- **Tier 1** (canonical V4.1 acceptance, real testnet deploy): **Ethereum
  Sepolia, Base Sepolia.** Both have a concrete `UniversalRouterV2` address in
  the canonical Uniswap registry and (per Task 2.1) full Circle CCTP V2
  TokenMessengerV2 plus MessageTransmitterV2 testnet coverage.

- **Tier 2** (real CCTP-only proof, NOT canonical V4.1 acceptance): **Avalanche
  Fuji, Polygon Amoy.** No Uniswap deploy-addresses file at HEAD. Spec already
  scopes these as CCTP-only.

- **Tier 3** (mainnet-fork compatibility): **Avalanche mainnet, Polygon
  mainnet** block-pinned forks (per spec section "Tier 3" line 182), plus
  **Arbitrum Sepolia** and **Optimism Sepolia** which drop from the
  spec-anticipated Tier 1 list. Arbitrum Sepolia has no canonical
  `arbitrum-sepolia.json` in the Uniswap registry at HEAD. Optimism Sepolia has
  a file but it lists only `UnsupportedProtocol` with no deployed
  UniversalRouter, which fails the V4.1 deploy precondition
  (`ZapAndBridgeV41.sol:103` requires nonzero `universalRouter`); R3 in the
  spec already commits Optimism Sepolia to drop in that case.

### Spec divergence flag

The spec body (line 178) lists Arbitrum Sepolia in the default Tier 1 set
without conditioning it on the registry probe; only Optimism Sepolia is given
the conditional R3 escape hatch. The probe result is that Arbitrum Sepolia is
also absent from the canonical Uniswap deploy-addresses directory. By the same
logic the spec applies to Optimism Sepolia (file presence with a real router
address is the gate), Arbitrum Sepolia must drop too. This evidence file flags
the divergence so the cycle owner can update the binding tier list or accept
the Tier 3 drop. Recommended resolution: extend R3 to cover Arbitrum Sepolia
identically.

## Conclusion

The Uniswap Universal Router testnet coverage usable for canonical V4.1
acceptance is **minimal**: only Ethereum Sepolia and Base Sepolia among the
six W1 candidates carry a concrete UniversalRouter address in the canonical
registry. The W1 tier roster for the cycle is locked at:

- Tier 1: Ethereum Sepolia, Base Sepolia
- Tier 2: Avalanche Fuji, Polygon Amoy
- Tier 3: Arbitrum Sepolia, Optimism Sepolia (drops from spec-anticipated Tier
  1 per registry probe), Avalanche mainnet block-pinned fork, Polygon mainnet
  block-pinned fork

This row of the Live Dependency Matrix is marked: **PASS with caveats**.

Caveats:
1. The canonical Uniswap registry does not list Permit2 for any chain;
   Permit2 chain coverage must be verified separately during W1.b.
2. Arbitrum Sepolia and Optimism Sepolia drop from Tier 1 to Tier 3; the spec
   currently lists both as Tier 1 candidates and only handles the Optimism
   Sepolia drop via risk R3. The cycle spec needs an editorial update to
   cover the Arbitrum Sepolia drop the same way.
3. The probe is pinned to commit
   `050b93cf4e9508b78412f23ad66e85d5c76a45b5` (2025-12-01T21:51:45Z); any
   later Uniswap registry update that adds `arbitrum-sepolia.json`,
   `polygon-amoy.json`, `avalanche-fuji.json`, or a real UniversalRouter
   entry for `op-sepolia.json` would re-promote the affected chain.
