# W0 Commands (paste-ready for verification)

This file aggregates the exact commands run across W0 phases 1 through 5, so a future verifier can re-run any probe and confirm the W0 state still holds.

## Phase 1: worktrees + evidence skeleton

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git check-ignore -v .worktrees/test
git -C sw4p worktree list | grep devnet-frontier
git -C sw4p-kit worktree list | grep devnet-frontier
ls -la DEVNET_FRONTIER_EVIDENCE_2026-05-16/
```

## Phase 2: Live Dependency Matrix probes

```
# Circle CCTP V2
curl -sS -i "https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=0x0000000000000000000000000000000000000000000000000000000000000000" | head -20
for chain_rpc in "ethereum-sepolia https://ethereum-sepolia-rpc.publicnode.com" "base-sepolia https://sepolia.base.org" "arbitrum-sepolia https://sepolia-rollup.arbitrum.io/rpc" "optimism-sepolia https://sepolia.optimism.io" "avalanche-fuji https://api.avax-test.network/ext/bc/C/rpc" "polygon-amoy https://rpc-amoy.polygon.technology" ; do
  chain="${chain_rpc%% *}"; rpc="${chain_rpc##* }"
  echo "=== $chain ===" ; cast code 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA --rpc-url "$rpc" | wc -c
done
solana program show CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe --url https://api.devnet.solana.com

# Uniswap Universal Router deploy-addresses
curl -sS "https://api.github.com/repos/Uniswap/universal-router/contents/deploy-addresses" | python3 -c "import json,sys; [print(e['name']) for e in sorted(json.load(sys.stdin), key=lambda x: x['name'])]"

# Allbridge
curl -sS "https://core.api.allbridgecoreapi.net/token-info" | python3 -m json.tool | head -50

# Cloudflare DNS
for host in sw4p.io api.sw4p.io mcp.sw4p.io; do dig +short A "$host" ; done
```

## Phase 3: AWS landing

```
curl -sS -I "https://sw4p.io/" | head -10
echo "" | openssl s_client -servername sw4p.io -connect sw4p.io:443 2>/dev/null | openssl x509 -noout -fingerprint -sha256
```

## Phase 4: Circle gas sponsor

```
# Documentation re-fetch
curl -sS "https://developers.circle.com/wallets/gas-station" | head -200
curl -sS "https://developers.circle.com/cctp/references/solana-programs" | head -200
```

## Phase 5: Protocol endpoint discovery

```
curl -sS -o /dev/null -w "%{http_code}\n" https://api.sw4p.io
curl -sS -o /dev/null -w "%{http_code}\n" https://staging-api.sw4p.io
```

## Re-verification recipe

To re-run any probe and confirm the W0 state still holds at a future point, run the corresponding command block above. Probes that captured mutable external state (DNS, Uniswap deploy-addresses SHA, Allbridge chain list) may return different values; that drift is captured separately in `next-wave-handoff.md` if material.
