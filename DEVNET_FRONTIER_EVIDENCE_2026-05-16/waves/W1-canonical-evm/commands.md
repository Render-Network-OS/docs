# W1 Commands (paste-ready for re-verification)

Mirrors the W0 commands.md structure. Every command here is exactly what a future verifier can re-run against the live state to confirm the W1 evidence still holds. Phase E commands are present but unexecuted this wave (CCTP-only Tier 2 burns require a faucet claim first).

Working directory throughout:

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
```

The sw4p-side commands run inside the worktree:

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
```

## Phase A: V4.1 safety-control + constructor-precondition coverage

```
# Hardhat install (one-time per fresh worktree)
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
npm install

# Unit-test runs (74 it-blocks PASS)
npx hardhat test test/Sw4pV4Controls.test.cjs
npx hardhat test test/ZapAndBridgeV41.test.cjs

# BASE-only fork suite (7 it-blocks PASS in lenient mode; ETH/ARB/MATIC skipped without HARDHAT_FORK_CHAIN_ID env)
npx hardhat test test/ZapAndBridgeV41.fork.test.cjs

# Source-anchor verification: grep all 5 control keywords against the live source
grep -nE "pause|globalDailyLimit|TIMELOCK_DELAY|PAUSER_ROLE|MAX_PLATFORM_FEE_BPS|defaultAdminDelay_" \
  contracts/Sw4pV4Controls.sol contracts/ZapAndBridgeV41.sol | wc -l
# Expected: 100+ matched lines (was 103 at evidence time)
```

## Phase B: Permit2 sourcing + per-chain verification

```
# Probe canonical CREATE2 Permit2 address on all 6 W1 candidate chains
PERMIT2_ADDR="0x000000000022D473030F116dDEE9F6B43aC78BA3"
for chain_rpc in \
  "ethereum-sepolia https://ethereum-sepolia-rpc.publicnode.com" \
  "base-sepolia https://sepolia.base.org" \
  "arbitrum-sepolia https://sepolia-rollup.arbitrum.io/rpc" \
  "optimism-sepolia https://sepolia.optimism.io" \
  "avalanche-fuji https://api.avax-test.network/ext/bc/C/rpc" \
  "polygon-amoy https://rpc-amoy.polygon.technology" ; do
  chain="${chain_rpc%% *}" ; rpc="${chain_rpc##* }"
  bytecode=$(curl -sS -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"${PERMIT2_ADDR}\",\"latest\"],\"id\":1}" \
    "${rpc}")
  echo "${chain}: bytecode_chars=$(echo "$bytecode" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(len(r.get("result","0x"))-2)')"
done
# Expected: every chain reports 18304 bytecode chars

# Registry-resolution dry-run (`deploy_testnet.cjs` reads tier1.json)
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
npx hardhat test test/deploy_testnet.test.cjs
# Expected: 11 resolution tests PASS

# Sanity-check the registry JSON files exist and resolve Base Sepolia universal router to the canonical value
python3 -c "import json; r=json.load(open('registry/tier1.json'))['base-sepolia']; assert r['universalRouter'] == '0x95273d871c8156636e114b63797d78D7E1720d81', r; print('Base Sepolia router OK')"
```

## Phase C: Tier 1 SCP deploys (re-verification only; deploy was one-shot)

```
# Verify on-chain bytecode size at each Tier 1 contract address
curl -sS -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665","latest"],"id":1}' \
  https://ethereum-sepolia-rpc.publicnode.com | python3 -c "import sys,json; r=json.load(sys.stdin); print('Sepolia V41 bytecode chars =', len(r['result'])-2)"
# Expected: 38784

curl -sS -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed","latest"],"id":1}' \
  https://base-sepolia-rpc.publicnode.com | python3 -c "import sys,json; r=json.load(sys.stdin); print('Base Sepolia V41 bytecode chars =', len(r['result'])-2)"
# Expected: 38784

# Verify SCA deployer native balance is still 0 on both chains (Gas Station sponsorship invariant)
for chain_rpc in \
  "sepolia https://ethereum-sepolia-rpc.publicnode.com" \
  "base-sepolia https://base-sepolia-rpc.publicnode.com" ; do
  chain="${chain_rpc%% *}" ; rpc="${chain_rpc##* }"
  bal=$(curl -sS -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x7ddba97f140f936a53669aa1ba73f04dd25557d4","latest"],"id":1}' \
    "$rpc")
  echo "$chain SCA native balance: $bal"
done
# Expected: both chains return "0x0"

# Explorer URL HEAD checks
curl -sS -o /dev/null -w "Sepolia tx: %{http_code}\n" -I "https://sepolia.etherscan.io/tx/0x6c68bd21311b4562e6137724542a261bef30840fd23528a065b9cc0ed12d77aa"
curl -sS -o /dev/null -w "Sepolia addr: %{http_code}\n" -I "https://sepolia.etherscan.io/address/0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665"
curl -sS -o /dev/null -w "Base Sepolia tx: %{http_code}\n" -I "https://sepolia.basescan.org/tx/0x48e137534ce6c032a23528817a4b9d04877ca9343376fc7e70af392df9b33e87"
curl -sS -o /dev/null -w "Base Sepolia addr: %{http_code}\n" -I "https://sepolia.basescan.org/address/0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed"
# Expected: all four return HTTP 200
```

## Phase D: Tier 1 acceptance (re-verification of revert selectors + receipt logs)

```
# Read V41 state on both chains, verifying pre/post flight invariants
SEPOLIA_V41="0xe2e85c4657bfaee8cbaa6c28ba1de68861b83665"
BASE_V41="0x0bb64d5796ec004c429af3fcd6fa92bb9c89bfed"

# paused() returns false (post-D.1 unpause state)
PAUSED_SELECTOR="0x5c975abb"
for chain_rpc in \
  "sepolia https://ethereum-sepolia-rpc.publicnode.com ${SEPOLIA_V41}" \
  "base-sepolia https://base-sepolia-rpc.publicnode.com ${BASE_V41}" ; do
  set -- $chain_rpc
  echo "$1 paused() =" $(curl -sS -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$3\",\"data\":\"$PAUSED_SELECTOR\"},\"latest\"],\"id\":1}" \
    "$2" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])")
done
# Expected: both chains return 0x0...0 (false)

# Verify pause + unpause receipt logs and event topics
for tx_chain in \
  "0x169f3df44b720394232f183596483240abd086f97eb003c315763d6f7cbcec79 https://ethereum-sepolia-rpc.publicnode.com Sepolia pause" \
  "0xba16e129e835675bbed2281752a6b81801ce039a26976c12c00faf08304bf720 https://ethereum-sepolia-rpc.publicnode.com Sepolia unpause" \
  "0xa9d57379f5cb1e23fa966bf92901e956a5c56e028a68fb508d7f38896ba443b2 https://base-sepolia-rpc.publicnode.com Base pause" \
  "0xf967864994749d35aaa3cdfd2c03a06dff2cfd1a90096a6128c80a59c826c33e https://base-sepolia-rpc.publicnode.com Base unpause" ; do
  set -- $tx_chain
  echo "$3 $4: status =" $(curl -sS -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionReceipt\",\"params\":[\"$1\"],\"id\":1}" \
    "$2" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['status'])")
done
# Expected: all four return 0x1 (success)

# Independent revert-data confirmation of MustGoThroughTimelock() via eth_call from SCA
# selector(grantRole(bytes32,address)) = 0x2f2ff15d ; PAUSER_ROLE = 0x75f50ac5...c5e5 ; target = 0x...dEaD
# Expected return: 0xe99beb96 (MustGoThroughTimelock()) on both chains

# Independent revert-data confirmation of TimelockPending(uint64) via eth_call from SCA
# selector(executeSafetyConfig()) = 0xe8b87a3a
# Expected return: 0xa80691a5 + uint64 remainingSeconds on both chains (while pending eta is in the future)
```

## Phase E: Tier 2 CCTP-only burn-mint (structural + approve + ABI gates PASS; burn deferred on USDC funding)

```
# Pre-flight: verify TokenMessengerV2 + MessageTransmitterV2 + USDC bytecode on Fuji + Amoy
for chain_rpc in \
  "avalanche-fuji https://api.avax-test.network/ext/bc/C/rpc" \
  "polygon-amoy https://rpc-amoy.polygon.technology" ; do
  chain="${chain_rpc%% *}" ; rpc="${chain_rpc##* }"
  for addr_name in \
    "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA TokenMessengerV2" \
    "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 MessageTransmitterV2" ; do
    addr="${addr_name%% *}" ; name="${addr_name##* }"
    size=$(curl -sS -X POST -H "Content-Type: application/json" \
      --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"${addr}\",\"latest\"],\"id\":1}" "$rpc" \
      | python3 -c "import sys,json; r=json.load(sys.stdin); print(len(r.get('result','0x'))-2)")
    echo "$chain $name: bytecode_chars=$size"
  done
done
# Expected: TokenMessengerV2 = 4350 (or 4353), MessageTransmitterV2 = 4350 (Fuji/Amoy live shape) on both chains

# Verify on-chain allowance(SCA, TokenMessengerV2) on Fuji + Amoy (Phase E Gate A residual state)
for chain_rpc_usdc in \
  "fuji https://api.avax-test.network/ext/bc/C/rpc 0x5425890298aed601595a70AB815c96711a31Bc65" \
  "amoy https://rpc-amoy.polygon.technology 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" ; do
  set -- $chain_rpc_usdc
  # selector(allowance(address,address)) = 0xdd62ed3e
  # owner = SCA 0x7ddba97f..., spender = TM V2 0x8FE6B999...
  data="0xdd62ed3e0000000000000000000000007ddba97f140f936a53669aa1ba73f04dd25557d40000000000000000000000008fe6b999dc680ccfdd5bf7eb0974218be2542daa"
  echo "$1 allowance(SCA, TMV2) =" $(curl -sS -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"$3\",\"data\":\"$data\"},\"latest\"],\"id\":1}" \
    "$2" | python3 -c "import sys,json; print(int(json.load(sys.stdin)['result'],16))")
done
# Expected: both chains return 1000000 (1.0 USDC, the post-state from Phase E Gate A approve)

# Receipt verification for the two Phase E approves
for tx_chain in \
  "0x9a5aea2d5083d9a4aca32fe48c927f29fd215302a9d4933f54a72c177aae20d6 https://api.avax-test.network/ext/bc/C/rpc Fuji_approve" \
  "0x4d5ba05cf70b3ca888a6543c554cd884d781a834fb561ba47638376f81557f4e https://rpc-amoy.polygon.technology Amoy_approve" ; do
  set -- $tx_chain
  echo "$3 status =" $(curl -sS -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionReceipt\",\"params\":[\"$1\"],\"id\":1}" \
    "$2" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['status'])")
done
# Expected: both return 0x1

# Unblock + burn (UNEXECUTED; recipe only):
# 1. Claim 10 USDC at https://faucet.circle.com to SCA 0x7ddba97f140f936a53669aa1ba73f04dd25557d4 on Fuji + Amoy.
# 2. Via Circle SCP contractExecution, approve TokenMessengerV2 to spend USDC.
# 3. Call TokenMessengerV2.depositForBurn(amount, destinationDomain, mintRecipient, burnToken, destinationCaller, maxFee, minFinalityThreshold).
# 4. Poll Iris sandbox: curl https://iris-api-sandbox.circle.com/v2/messages/<srcDomain>?transactionHash=<srcTxHash> until status=complete.
# 5. Via SCP on destination chain, call MessageTransmitterV2.receiveMessage(message, attestation).
# 6. Confirm USDC delta at the SCA on the destination via eth_call balanceOf.
```

## Phase F: Tier 3 mainnet-fork compat

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"

# Avalanche C-Chain (43114) fork-compat suite (5 it-blocks)
HARDHAT_FORK_CHAIN_ID=43114 \
AVAX_MAINNET_FORK_RPC_URL="https://api.avax.network/ext/bc/C/rpc" \
npx hardhat test test/fork/avalanche-mainnet-compat.test.cjs

# Polygon PoS (137) fork-compat suite (5 it-blocks)
HARDHAT_FORK_CHAIN_ID=137 \
POLYGON_MAINNET_FORK_RPC_URL="https://polygon-bor-rpc.publicnode.com" \
npx hardhat test test/fork/polygon-mainnet-compat.test.cjs

# For deterministic CI replay, pin via:
#   AVAX_MAINNET_FORK_BLOCK=85654647
#   POLYGON_MAINNET_FORK_BLOCK=87012069
```

## Re-verification recipe

To re-run any phase and confirm the W1 state still holds, paste the corresponding block above. Mutable external state (chain head, USDC whale balance, Circle SCP rate-limit window) may drift; that drift is captured separately in `next-wave-handoff.md` if material. Read-only on-chain reads (`eth_getCode`, `eth_getBalance`, `eth_call`, `eth_getTransactionReceipt`) against the V4.1 contract addresses are immutable: the same tx hashes return the same receipts forever, and the SCA's native balance staying at `0x0` after Phase C + D continues to confirm Gas Station sponsorship.
