# Circle CCTP V2 Testnet Endpoint Probes (W0.a)

**Date:** 2026-05-17T04:32:44Z
**Source of truth:** `https://developers.circle.com/cctp`
**Probed from:** sw4p worktree `staging/devnet-frontier-2026-05-16`

## Step 1: Protocol's canonical CCTP V2 references (from code)

```
sw4p-backend/src/cctp_burn.rs:57:pub const TESTNET_MESSAGE_TRANSMITTER_V2: &str = "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC";
sw4p-backend/src/cctp_burn.rs:58:pub const TESTNET_TOKEN_MESSENGER_V2: &str = "CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe";
sw4p-backend/src/cctp_burn.rs:70:// previous `DOMAIN_ZKSYNC = 324 // Placeholder` was a guess (zkSync is
sw4p-backend/src/cctp_burn.rs:81:pub const DOMAIN_ETHEREUM: u32 = 0;
sw4p-backend/src/cctp_burn.rs:82:pub const DOMAIN_AVALANCHE: u32 = 1;
sw4p-backend/src/cctp_burn.rs:83:pub const DOMAIN_OPTIMISM: u32 = 2;
sw4p-backend/src/cctp_burn.rs:84:pub const DOMAIN_ARBITRUM: u32 = 3;
sw4p-backend/src/cctp_burn.rs:85:pub const DOMAIN_SOLANA: u32 = 5;
sw4p-backend/src/cctp_burn.rs:86:pub const DOMAIN_BASE: u32 = 6;
sw4p-backend/src/cctp_burn.rs:87:pub const DOMAIN_POLYGON: u32 = 7;
sw4p-backend/src/cctp_burn.rs:249:            DOMAIN_SOLANA,
sw4p-backend/src/cctp_burn.rs:592:        DOMAIN_ETHEREUM => "Ethereum",
sw4p-backend/src/cctp_burn.rs:593:        DOMAIN_AVALANCHE => "Avalanche",
sw4p-backend/src/cctp_burn.rs:594:        DOMAIN_OPTIMISM => "Optimism",
sw4p-backend/src/cctp_burn.rs:595:        DOMAIN_ARBITRUM => "Arbitrum",
sw4p-backend/src/cctp_burn.rs:596:        DOMAIN_SOLANA => "Solana",
sw4p-backend/src/cctp_burn.rs:597:        DOMAIN_BASE => "Base",
sw4p-backend/src/cctp_burn.rs:598:        DOMAIN_POLYGON => "Polygon",
sw4p-backend/src/cctp_burn.rs:611:        "ethereum" | "eth" | "mainnet" => Some(DOMAIN_ETHEREUM),
sw4p-backend/src/cctp_burn.rs:612:        "avalanche" | "avax" => Some(DOMAIN_AVALANCHE),
sw4p-backend/src/cctp_burn.rs:613:        "optimism" | "op" => Some(DOMAIN_OPTIMISM),
sw4p-backend/src/cctp_burn.rs:614:        "arbitrum" | "arb" | "arbitrum-one" => Some(DOMAIN_ARBITRUM),
sw4p-backend/src/cctp_burn.rs:615:        "solana" | "sol" => Some(DOMAIN_SOLANA),
sw4p-backend/src/cctp_burn.rs:616:        "base" => Some(DOMAIN_BASE),
sw4p-backend/src/cctp_burn.rs:617:        "polygon" | "matic" => Some(DOMAIN_POLYGON),
sw4p-backend/src/cctp_burn.rs:1253:        assert_eq!(domain_to_chain_name(DOMAIN_BASE), "Base");
sw4p-backend/src/cctp_burn.rs:1254:        assert_eq!(domain_to_chain_name(DOMAIN_POLYGON), "Polygon");
sw4p-backend/src/cctp_burn.rs:1255:        assert_eq!(domain_to_chain_name(DOMAIN_SOLANA), "Solana");
sw4p-backend/src/networks.rs:26://! - **P6** `cctp_burn.rs` shipped `DOMAIN_ZKSYNC = 324` with a literal
sw4p-backend/src/networks.rs:439:        const EVM_TESTNET_TOKEN_MESSENGER: &str = "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";
sw4p-backend/src/networks.rs:440:        const EVM_TESTNET_MESSAGE_TRANSMITTER: &str = "0xe737e5cebeeba77efe34d4aa090756590b1ce275";
sw4p-backend/src/networks.rs:448:                EVM_TESTNET_TOKEN_MESSENGER,
sw4p-backend/src/networks.rs:449:                EVM_TESTNET_MESSAGE_TRANSMITTER,
sw4p-backend/src/networks.rs:461:                EVM_TESTNET_TOKEN_MESSENGER,
sw4p-backend/src/networks.rs:462:                EVM_TESTNET_MESSAGE_TRANSMITTER,
sw4p-backend/src/networks.rs:474:                EVM_TESTNET_TOKEN_MESSENGER,
sw4p-backend/src/networks.rs:475:                EVM_TESTNET_MESSAGE_TRANSMITTER,
sw4p-backend/src/networks.rs:487:                EVM_TESTNET_TOKEN_MESSENGER,
sw4p-backend/src/networks.rs:488:                EVM_TESTNET_MESSAGE_TRANSMITTER,
sw4p-backend/src/networks.rs:512:                EVM_TESTNET_TOKEN_MESSENGER,
sw4p-backend/src/networks.rs:513:                EVM_TESTNET_MESSAGE_TRANSMITTER,
sw4p-backend/src/networks.rs:525:                EVM_TESTNET_TOKEN_MESSENGER,
sw4p-backend/src/networks.rs:526:                EVM_TESTNET_MESSAGE_TRANSMITTER,
```

Protocol confirms canonical values match Circle's documented V2 set:

- EVM `TokenMessengerV2` = `0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa`
- EVM `MessageTransmitterV2` = `0xe737e5cebeeba77efe34d4aa090756590b1ce275`
- Solana `TokenMessengerMinterV2` = `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe`
- Solana `MessageTransmitterV2` = `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC`
- Canonical domain IDs: Ethereum=0, Avalanche=1, Optimism=2, Arbitrum=3, Solana=5, Base=6, Polygon=7.

## Step 2: Circle Iris sandbox liveness

Command:
```
curl -sS -i "https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=0x0..."
```

Response:
```
HTTP/2 404 
date: Sun, 17 May 2026 04:31:28 GMT
content-type: application/json; charset=utf-8
content-length: 53
access-control-allow-origin: *
cache-control: no-store
etag: W/"35-qrxXZTuHNcTjE8ljjAWIo8t8uyM"
pragma: no-cache
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: DENY
set-cookie: __cf_bm=qqh2L2uKSy2mGWsFn4AN3b56WnoPCMVp79Cvw_KFWD8-1778992288.6103687-1.0.1.1-aO66hDi46wPREz9NzmivnkaKC.SW5_KosOxwgEzgLRKw1GVZF8FtFyvlWWWGzt2P0gFbvhe4xAPz9cKqIxQZEygBOlHOiTKRSAM3t4Di9RsYOXuLA8o3ZgrY610HUvIG; HttpOnly; SameSite=None; Secure; Path=/; Domain=circle.com; Expires=Sun, 17 May 2026 05:01:28 GMT
set-cookie: _cfuvid=EXa2M6l_4FfUJL3xK7ci5sX3RffZu7_XNDSiCbJ0HxI-1778992288.6103687-1.0.1.1-kGgVbAXu6EtDD_ihlfkDW9hB4Jik4KvmJbTDpnzDNXU; HttpOnly; SameSite=None; Secure; Path=/; Domain=circle.com
cf-cache-status: DYNAMIC
server: cloudflare
cf-ray: 9fcfe48bcdeff785-DFW

{"error":"Message not found for provided parameters"}
```

Verdict: endpoint live (HTTP/2 404 with structured `{"error":"Message not found for provided parameters"}` JSON body served by Cloudflare-fronted `iris-api-sandbox.circle.com`; 404 is the expected response for the zero transaction hash and proves the V2 messages route is reachable).

## Step 3: EVM testnet bytecode probes

Probe tool: `cast code ADDR --rpc-url RPC` (Foundry 1.6.0). The `bytes` column reports the byte count of the hex string emitted by `cast code` (4352 hex chars + trailing newline = 4353); the deployed runtime bytecode is therefore 2176 bytes per contract, identical across all six chains, confirming Circle's "same address" deployment.

| Chain | RPC | TokenMessengerV2 bytes | MessageTransmitterV2 bytes | Verdict |
|---|---|---|---|---|
| Ethereum Sepolia | `https://ethereum-sepolia-rpc.publicnode.com` | 4353 | 4353 | deployed |
| Base Sepolia | `https://sepolia.base.org` | 4353 | 4353 | deployed |
| Arbitrum Sepolia | `https://sepolia-rollup.arbitrum.io/rpc` | 4353 | 4353 | deployed |
| Optimism Sepolia | `https://sepolia.optimism.io` | 4353 | 4353 | deployed |
| Avalanche Fuji | `https://api.avax-test.network/ext/bc/C/rpc` | 4353 | 4353 | deployed |
| Polygon Amoy | `https://rpc-amoy.polygon.technology` | 4353 | 4353 | deployed |

Raw output:
```
=== ethereum-sepolia (https://ethereum-sepolia-rpc.publicnode.com) ===
  TokenMessengerV2 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA bytes=4353
  MessageTransmitterV2 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 bytes=4353
=== base-sepolia (https://sepolia.base.org) ===
  TokenMessengerV2 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA bytes=4353
  MessageTransmitterV2 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 bytes=4353
=== arbitrum-sepolia (https://sepolia-rollup.arbitrum.io/rpc) ===
  TokenMessengerV2 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA bytes=4353
  MessageTransmitterV2 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 bytes=4353
=== optimism-sepolia (https://sepolia.optimism.io) ===
  TokenMessengerV2 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA bytes=4353
  MessageTransmitterV2 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 bytes=4353
=== avalanche-fuji (https://api.avax-test.network/ext/bc/C/rpc) ===
  TokenMessengerV2 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA bytes=4353
  MessageTransmitterV2 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 bytes=4353
=== polygon-amoy (https://rpc-amoy.polygon.technology) ===
  TokenMessengerV2 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA bytes=4353
  MessageTransmitterV2 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 bytes=4353
```

## Step 4: Solana CCTP V2 programs on devnet

Probe tool: `solana program show PROGRAM_ID --url https://api.devnet.solana.com` (solana-cli 4.2.0-alpha.0, Agave client).

| Program | Program ID | Exists on devnet | Data length |
|---|---|---|---|
| TokenMessengerMinterV2 | `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe` | yes | 717392 bytes (0xaf250) |
| MessageTransmitterV2 | `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC` | yes | 495640 bytes (0x79018) |

Raw output:
```
Program Id: CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: 9ZEnLvCp3weopBnSaoSSjn7hoVk6zMXMpfH3LjNzBFFF
Authority: 9fg8YxVnsszHR1tjKeof4aETMabNBaE15qLFPFRGAW11
Last Deployed In Slot: 383709630
Data Length: 717392 (0xaf250) bytes
Balance: 4.9942524 SOL
```

```
Program Id: CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: 2w2zCf9f5iyr7qcuWQH4DFNNahBZHgYkL4UVU3p5T1iS
Authority: 9fg8YxVnsszHR1tjKeof4aETMabNBaE15qLFPFRGAW11
Last Deployed In Slot: 383716739
Data Length: 495640 (0x79018) bytes
Balance: 3.45085848 SOL
```

Both programs are owned by the upgradeable BPF loader (`BPFLoaderUpgradeab1e11111111111111111111111`) and share a common upgrade authority (`9fg8YxVnsszHR1tjKeof4aETMabNBaE15qLFPFRGAW11`), consistent with Circle's deployed devnet program set.

## Conclusion

- Circle Iris sandbox V2 messages route (`https://iris-api-sandbox.circle.com/v2/messages/0`) is reachable and serves a structured JSON 404 for an unknown transaction hash.
- All six W1 candidate EVM testnets (Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Avalanche Fuji, Polygon Amoy) carry both `TokenMessengerV2` (`0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`) and `MessageTransmitterV2` (`0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`) at identical 2176-byte runtime sizes, confirming Circle's same-address deployment claim.
- Both Solana CCTP V2 programs (`TokenMessengerMinterV2` and `MessageTransmitterV2`) are live on Solana devnet under the upgradeable BPF loader with substantial program data (717392 and 495640 bytes respectively).
- Protocol code in `sw4p-backend/src/cctp_burn.rs` and `sw4p-backend/src/networks.rs` already references the same canonical addresses and program IDs verified above; no protocol-vs-Circle drift detected.

This row of the Live Dependency Matrix is marked: PASS, all CCTP V2 endpoints live across the six EVM testnets and on Solana devnet, Iris sandbox V2 reachable.
