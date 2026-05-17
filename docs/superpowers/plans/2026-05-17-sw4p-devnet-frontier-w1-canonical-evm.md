# sw4p Devnet-Frontier W1 Canonical EVM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver canonical V4.1 EVM coverage across the 3-tier roster locked by W0 (Tier 1 = Sepolia + Base Sepolia canonical deploys with safety-control acceptance; Tier 2 = real CCTP-only proof on Avalanche Fuji + Polygon Amoy; Tier 3 = mainnet-fork compatibility for V4.1 against Arbitrum Sepolia + Optimism Sepolia + Avalanche mainnet + Polygon mainnet). Every acceptance gate produces a real on-chain tx hash with a public explorer URL; no mocks in acceptance per cycle ZERO-MOCKS constraint.

**Architecture:** V4.1 (`ZapAndBridgeV41.sol`) already inherits `Sw4pV4Controls` which carries the full safety-control surface (pause + auto-unpause, per-period movement limits, timelocked role grants, governed admin with delayed handoff, fee guardrails). The W1 work is therefore not "build the controls" but rather "verify-on-real-testnet, register Permit2 separately, deploy to Tier 1, acceptance-test against real CCTP V2 + Universal Router, prove CCTP-only on Tier 2, prove mainnet-fork compat on Tier 3, then hand off to W2." The per-chain registry is hardened during W1 to source Permit2 from the official Uniswap/permit2 GitHub repository (not present in the universal-router deploy-addresses registry consumed in W0.a).

**Tech Stack:** Solidity 0.8.20, Hardhat with `hardhat-toolbox`, Foundry's `cast` for bytecode probes, OpenZeppelin contracts 5.x (AccessControlDefaultAdminRules, AccessControlEnumerable, Pausable, ReentrancyGuard, SafeERC20), Circle CCTP V2 testnet contracts (TokenMessengerV2 + MessageTransmitterV2 at the canonical addresses from W0.a probe evidence), Uniswap Universal Router + Permit2 (Tier 1 sourcing from Uniswap deploy-addresses commit `050b93cf4e9508b78412f23ad66e85d5c76a45b5` and the Uniswap/permit2 repo respectively), Circle Iris sandbox attestation API.

**Spec reference:** `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` (Section 4, W1).

**W0 handoff:** `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/next-wave-handoff.md`.

**Dependency:** sw4p-backend HTTP API must be reachable at `staging-api.sw4p.io` (or equivalent restored endpoint) per the W0 deferral. W1 acceptance gates that depend on `/sdk/v1/transfer` polling assume this is satisfied; if not, those gates remain BLOCKED until backend health is restored.

---

## Source Artifacts

| Artifact | Role |
|---|---|
| `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` (W1 section) | Tier roster + acceptance criteria + mock exclusion + real-action gates. |
| `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/next-wave-handoff.md` | Locked decisions from W0. |
| `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md` | Universal Router addresses + Tier roster derivation. |
| `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-cctp-v2.md` | Canonical Circle CCTP V2 addresses per chain. |
| `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md` (EVM Safety-Control Scope) | Source of truth for the safety-control table. |
| `sw4p/sw4p-backend/contracts/contracts/Sw4pV4Controls.sol` | Implemented control surface. |
| `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV41.sol` | V4.1 contract inheriting `Sw4pV4Controls`. |
| `sw4p/sw4p-backend/contracts/test/Sw4pV4Controls.test.cjs` | Existing unit tests for controls. |
| `sw4p/sw4p-backend/contracts/test/ZapAndBridgeV41.test.cjs` | Existing unit tests for V4.1 + controls integration. |
| `sw4p/sw4p-backend/contracts/test/ZapAndBridgeV41.fork.test.cjs` | Existing fork tests for V4.1. |

## External References (checked at plan-time)

| Topic | Source |
|---|---|
| Circle CCTP V2 EVM contracts | `https://developers.circle.com/cctp` |
| Circle Iris sandbox | `https://iris-api-sandbox.circle.com` |
| Uniswap Universal Router deploy addresses | `https://github.com/Uniswap/universal-router/tree/main/deploy-addresses` (commit `050b93cf...` pinned at W0.a) |
| Uniswap Permit2 deployments | `https://github.com/Uniswap/permit2` (deployed addresses doc) |
| OpenZeppelin AccessControlDefaultAdminRules | `https://docs.openzeppelin.com/contracts/5.x/api/access#AccessControlDefaultAdminRules` |
| Hardhat mainnet fork docs | `https://hardhat.org/hardhat-network/docs/guides/forking-other-networks` |

## File Structure Map

| Area | Paths | Responsibility |
|---|---|---|
| Contracts (existing) | `sw4p/sw4p-backend/contracts/contracts/{Sw4pV4Controls,ZapAndBridgeV41}.sol` | Survivor canonical EVM. No code changes expected in W1 beyond bug fixes surfaced by acceptance. |
| Registry (new) | `sw4p/sw4p-backend/contracts/registry/{tier1,tier2,tier3-mainnet-fork}.json` | Per-chain canonical-deployment metadata. |
| Permit2 sourcing (new) | `sw4p/sw4p-backend/contracts/registry/permit2.json` | Per-chain Permit2 addresses sourced from Uniswap/permit2 repo. |
| Deploy scripts (existing + extend) | `sw4p/sw4p-backend/contracts/scripts/deploy_testnet.cjs` | Already exists with router+CCTP overlap refusal; extend with W1 tier classification + registry consumption. |
| Tier 1 acceptance tests (new) | `sw4p/sw4p-backend/contracts/test/integration/tier1-{sepolia,base-sepolia}.cjs` | Real chain integration tests gated by env vars. |
| Tier 2 acceptance scripts (new) | `sw4p/sw4p-backend/contracts/scripts/tier2-cctp-only/{fuji,amoy}.cjs` | Real CCTP V2 burn-mint without V4.1 (canonical contracts only). |
| Tier 3 mainnet-fork tests (new) | `sw4p/sw4p-backend/contracts/test/fork/{avalanche-mainnet,polygon-mainnet,arbitrum-sepolia,optimism-sepolia}.cjs` | Block-pinned fork compatibility tests. |
| W1 evidence | `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/` | Per-phase acceptance evidence with real tx hashes + explorer URLs. |

## Execution Rules

- **Worktree:** all sw4p code changes commit to the `staging/devnet-frontier-2026-05-16` branch in the sw4p worktree at `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/`.
- **PR discipline:** every code change lands via PR against the staging branch. Self-review using `feature-dev:code-reviewer` before merge.
- **Test-driven development:** for every code change that touches contract behavior, write the failing test first, run it to confirm it fails, implement, run to confirm it passes, commit. Existing tests can serve as the "failing-test confirmation" baseline; if a behavior is already covered, document the coverage rather than duplicating it.
- **ZERO MOCKS in acceptance:** unit tests with mocks remain in `contracts/test/`. Acceptance gates (W1 evidence) cite only real chain tx hashes + Iris attestation responses + public explorer URLs. `MockNoopMessageTransmitter` and similar mocks must not appear in acceptance evidence.
- **Real-action authorization gates:** explicit user authorization required before any of: (1) funded Tier 1 testnet deploy, (2) funded Tier 2 CCTP burn, (3) any operation consuming the deployer wallet's testnet ETH/USDC float.
- **Author identity:** `rndrntwrk <dev@rndrntwrk.com>` from git config. NO `Co-Authored-By:` trailers, NO `--author` overrides, NO AI attributions.
- **No em dashes:** zero in code, comments, commit messages, evidence files.
- **Conventional commits:** `feat(contracts):`, `test(contracts):`, `fix(contracts):`, `chore(contracts):`, `evidence(W1.X):`.

---

## Phase A: V4.1 + Sw4pV4Controls verification (no code changes)

### Task A.1: Inventory existing safety-control coverage

**Files:**
- Read: `sw4p-backend/contracts/contracts/{Sw4pV4Controls,ZapAndBridgeV41}.sol`
- Read: `sw4p-backend/contracts/test/{Sw4pV4Controls,ZapAndBridgeV41}.test.cjs`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-a-control-coverage.md`

- [ ] **Step 1: Map every Solana control to its EVM implementation**

Per the EVM Safety-Control Scope table in `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`, the canonical EVM contract must carry:

1. Pause (with PAUSER_ROLE separation and auto-unpause)
2. Daily / per-period movement limit
3. Timelocked config changes
4. Governed admin / multisig handoff
5. Fee-take guardrails

For each of the 5 controls, locate the implementation in `Sw4pV4Controls.sol` and `ZapAndBridgeV41.sol`. Record:
- Solidity declaration (struct / constant / function with file:line).
- Solana counterpart (with file:line in `sw4p/programs/sw4p-native/src/`).
- Test coverage (which test file + which `it(...)` block).

Verification command:

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"

grep -nE "function pause|function unpause|paused\(\)|pausedAt|AUTO_UNPAUSE_SECONDS|globalDailyLimit|perUserDailyLimit|globalWeeklyLimit|TIMELOCK_DELAY|proposeSafetyConfig|executeSafetyConfig|MustGoThroughTimelock|ADMIN_ROLE|PAUSER_ROLE|DEFAULT_ADMIN_ROLE|MAX_PLATFORM_FEE_BPS|MAX_FEE_INCREASE_PER_PROPOSAL_BPS" \
  sw4p-backend/contracts/contracts/Sw4pV4Controls.sol sw4p-backend/contracts/contracts/ZapAndBridgeV41.sol \
  | tee /tmp/v41-control-grep.txt
```

Expected: lines for every named control surface. Capture in evidence.

- [ ] **Step 2: Run the existing unit + fork test suite locally**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
npm install 2>&1 | tail -10
npx hardhat test test/Sw4pV4Controls.test.cjs 2>&1 | tee /tmp/v41-controls-test.log
npx hardhat test test/ZapAndBridgeV41.test.cjs 2>&1 | tee /tmp/v41-zap-test.log
```

Expected: both suites green. Capture line counts (e.g., "23 passing"). If any failure, STOP and report BLOCKED with the specific failure.

Note: the existing fork test `ZapAndBridgeV41.fork.test.cjs` may require live RPC URLs in env. Only run it if env vars are present; otherwise mark "skipped, requires env" and proceed.

- [ ] **Step 3: Write the coverage evidence**

Create the evidence file with:
- The 5-control mapping table (Solana => Solidity => test coverage).
- The test run results (pass counts, file paths, durations).
- A definitive verdict: "all 5 controls implemented with unit coverage; W1 Phase A passes by inspection; no code changes needed".

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-a-control-coverage.md
git -c commit.gpgsign=false commit -m "evidence(W1.a): V4.1 safety-control coverage inventory + unit-test verification"
```

### Task A.2: Verify ZapAndBridgeV41 constructor preconditions hold for Tier 1

**Files:**
- Read: `sw4p-backend/contracts/contracts/ZapAndBridgeV41.sol`
- Read: `sw4p-backend/contracts/scripts/deploy_testnet.cjs` (line 127 router+CCTP overlap refusal)
- Append to: evidence from A.1 (no new file)

- [ ] **Step 1: Confirm Tier 1 chains satisfy V4.1 deploy preconditions**

For each Tier 1 chain (Sepolia, Base Sepolia):
- Universal Router address: from `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md` (`UniversalRouterV2` per chain).
- Permit2 address: sourced separately (W1 Task B.1).
- CCTP TokenMessengerV2: `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` (per W0.a circle-cctp-v2.md).
- CCTP MessageTransmitterV2: `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` (per W0.a circle-cctp-v2.md).
- USDC testnet mint: from Circle official mapping (`https://developers.circle.com/cctp/usdc-on-test-networks`).
- WETH testnet: from canonical per-chain WETH list.

Capture the exact constructor argument vector per Tier 1 chain.

- [ ] **Step 2: Append constructor-argument verification to the Phase A evidence**

In `phase-a-control-coverage.md`, add a section "Tier 1 deploy constructor preconditions" with the 7-argument vector (universalRouter, permit2, tokenMessenger, messageTransmitter, usdc, weth, initialAdmin) per Tier 1 chain.

Commit as an amendment to A.1's evidence file (small follow-up commit):

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-a-control-coverage.md
git -c commit.gpgsign=false commit -m "evidence(W1.a): Tier 1 V4.1 deploy constructor preconditions per chain"
```

---

## Phase B: Per-chain registry hardening + Permit2 sourcing

### Task B.1: Source Permit2 addresses from Uniswap/permit2 repo

**Files:**
- Create: `sw4p-backend/contracts/registry/permit2.json` (in sw4p worktree)
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-b-permit2-sourcing.md`

The W0.a Uniswap deploy-addresses inventory established that the `universal-router` repository does NOT carry Permit2 addresses in its `deploy-addresses/` directory. Permit2 has its own repository.

- [ ] **Step 1: Probe Uniswap/permit2 for canonical deployment list**

```bash
# Permit2 is famously deployed at the same address across all major chains via CREATE2:
# 0x000000000022D473030F116dDEE9F6B43aC78BA3
# Verify the constant address across W1 candidate chains.

PERMIT2_ADDR="0x000000000022D473030F116dDEE9F6B43aC78BA3"

for chain_rpc in \
  "ethereum-sepolia https://ethereum-sepolia-rpc.publicnode.com" \
  "base-sepolia https://sepolia.base.org" \
  "arbitrum-sepolia https://sepolia-rollup.arbitrum.io/rpc" \
  "optimism-sepolia https://sepolia.optimism.io" \
  "avalanche-fuji https://api.avax-test.network/ext/bc/C/rpc" \
  "polygon-amoy https://rpc-amoy.polygon.technology" ; do
  chain="${chain_rpc%% *}"
  rpc="${chain_rpc##* }"
  echo "=== ${chain} ==="
  curl -sS -X POST -H "Content-Type: application/json" \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"${PERMIT2_ADDR}\",\"latest\"],\"id\":1}" \
    "${rpc}" 2>&1 | python3 -c "import sys,json; r=json.load(sys.stdin); print('code_len:', len(r.get('result','0x'))-2)"
done 2>&1 | tee /tmp/permit2-presence.txt
```

Expected: byte-count > 0 on every Tier 1 + Tier 2 chain (Permit2 is universally CREATE2-deployed via 0xINIT factory). Some chains may show 0 if Permit2 has not been bootstrapped on the chain's testnet; document any absence.

- [ ] **Step 2: Cross-check Uniswap/permit2 README documented addresses**

```bash
# Fetch the README from the official repo
curl -sS "https://raw.githubusercontent.com/Uniswap/permit2/main/README.md" 2>&1 | grep -iE "0x000000000022D473030F116dDEE9F6B43aC78BA3|deployment|deployed at" | head -10
```

Capture any contradicting evidence (e.g., chain-specific override addresses).

- [ ] **Step 3: Write `permit2.json` registry**

Create `sw4p-backend/contracts/registry/permit2.json` in the worktree:

```json
{
  "_source": "Uniswap/permit2 canonical CREATE2 address; verified on-chain at W1 plan-time",
  "_verifiedAt": "2026-05-17",
  "perChain": {
    "ethereum-sepolia": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "base-sepolia": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "arbitrum-sepolia": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "optimism-sepolia": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "avalanche-fuji": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    "polygon-amoy": "0x000000000022D473030F116dDEE9F6B43aC78BA3"
  }
}
```

If Step 1 found Permit2 absent on any chain, OMIT that chain's entry and document the absence in evidence (acceptance for that chain becomes contingent on Permit2 presence; Tier may downgrade).

- [ ] **Step 4: Write the sourcing evidence**

Create `phase-b-permit2-sourcing.md` with:
- Step 1 byte-count results per chain.
- Step 2 cross-check from Uniswap repo.
- Final per-chain Permit2 address.
- Conclusion: "Permit2 universally deployed (or list exceptions)".

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git add sw4p-backend/contracts/registry/permit2.json
git -c commit.gpgsign=false commit -m "feat(contracts): per-chain Permit2 registry sourced from Uniswap/permit2 canonical addresses"

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/phase-b-permit2-sourcing.md
git -c commit.gpgsign=false commit -m "evidence(W1.b): Permit2 sourcing + per-chain verification"
```

### Task B.2: Per-chain registry consolidation

**Files:**
- Read: `sw4p-backend/contracts/registry/testnet.json` (existing if present)
- Read: `sw4p-backend/contracts/scripts/deploy_testnet.cjs`
- Create or extend: `sw4p-backend/contracts/registry/{tier1,tier2,tier3-mainnet-fork}.json`

- [ ] **Step 1: Inspect existing registry shape**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
ls sw4p-backend/contracts/registry/ 2>/dev/null
cat sw4p-backend/contracts/registry/testnet.json 2>/dev/null | head -60
```

If `testnet.json` is the current canonical source, the W1 work adds 3 tier-specific files alongside (not replacing).

- [ ] **Step 2: Create `tier1.json`**

```json
{
  "_tier": 1,
  "_description": "Canonical V4.1 acceptance: real testnet deploy with router+CCTP overlap",
  "_w0Source": "DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md (pinned to Uniswap/universal-router/deploy-addresses commit 050b93cf4e9508b78412f23ad66e85d5c76a45b5)",
  "chains": {
    "ethereum-sepolia": {
      "chainId": 11155111,
      "cctpDomain": 0,
      "universalRouter": "<paste from W0.a sepolia.json fetch>",
      "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      "tokenMessengerV2": "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      "messageTransmitterV2": "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      "usdc": "<from Circle official usdc-on-test-networks doc, sepolia>",
      "weth": "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
      "rpcEnvVar": "ETH_SEPOLIA_RPC_URL"
    },
    "base-sepolia": {
      "chainId": 84532,
      "cctpDomain": 6,
      "universalRouter": "<paste from W0.a base-sepolia.json fetch>",
      "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      "tokenMessengerV2": "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      "messageTransmitterV2": "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      "usdc": "<from Circle official usdc-on-test-networks doc, base-sepolia>",
      "weth": "0x4200000000000000000000000000000000000006",
      "rpcEnvVar": "BASE_SEPOLIA_RPC_URL"
    }
  }
}
```

The placeholders for `universalRouter`, `usdc` must be filled with REAL addresses from:
- Universal Router: re-fetch from `https://raw.githubusercontent.com/Uniswap/universal-router/main/deploy-addresses/<chain>.json` (or use W0.a captured values).
- USDC: from `https://developers.circle.com/cctp/usdc-on-test-networks` (real Circle doc).

- [ ] **Step 3: Create `tier2.json`**

```json
{
  "_tier": 2,
  "_description": "Real CCTP-only proof, NOT canonical V4.1 acceptance (no Universal Router on testnet)",
  "chains": {
    "avalanche-fuji": {
      "chainId": 43113,
      "cctpDomain": 1,
      "tokenMessengerV2": "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      "messageTransmitterV2": "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      "usdc": "<from Circle, avax-fuji>",
      "rpcEnvVar": "AVAX_FUJI_RPC_URL"
    },
    "polygon-amoy": {
      "chainId": 80002,
      "cctpDomain": 7,
      "tokenMessengerV2": "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
      "messageTransmitterV2": "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
      "usdc": "<from Circle, polygon-amoy>",
      "rpcEnvVar": "POLYGON_AMOY_RPC_URL"
    }
  }
}
```

- [ ] **Step 4: Create `tier3-mainnet-fork.json`**

```json
{
  "_tier": 3,
  "_description": "Mainnet-fork compatibility evidence only; not testnet acceptance; not mainnet deploy",
  "chains": {
    "arbitrum-sepolia": {
      "_note": "Drops from Tier 1 because Uniswap/universal-router has no arbitrum-sepolia.json; W1 covers via Arbitrum mainnet fork compat instead",
      "useMainnetForkOf": "arbitrum-one"
    },
    "optimism-sepolia": {
      "_note": "Drops from Tier 1 because op-sepolia.json carries UnsupportedProtocol (no Universal Router)",
      "useMainnetForkOf": "optimism-mainnet"
    },
    "avalanche-mainnet": {
      "chainId": 43114,
      "forkBlockEnv": "FORK_BLOCK_AVAX",
      "forkRpcEnv": "AVAX_MAINNET_RPC_URL"
    },
    "polygon-mainnet": {
      "chainId": 137,
      "forkBlockEnv": "FORK_BLOCK_POLYGON",
      "forkRpcEnv": "POLYGON_MAINNET_RPC_URL"
    }
  }
}
```

- [ ] **Step 5: Stage + commit registry files**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git add sw4p-backend/contracts/registry/tier1.json sw4p-backend/contracts/registry/tier2.json sw4p-backend/contracts/registry/tier3-mainnet-fork.json
git -c commit.gpgsign=false commit -m "feat(contracts): W1 tier1/tier2/tier3-mainnet-fork registry files"
```

### Task B.3: Extend `deploy_testnet.cjs` to consume tier1.json explicitly

**Files:**
- Modify: `sw4p-backend/contracts/scripts/deploy_testnet.cjs`
- Test: extend `sw4p-backend/contracts/test/deploy_script_drift.test.cjs` if it tests deploy script behavior

- [ ] **Step 1: Write a failing test for tier1-driven deploy resolution**

Add to `deploy_script_drift.test.cjs` (or similar deploy-script test file):

```javascript
describe("deploy_testnet.cjs tier1 resolution", function () {
  it("resolves Sepolia constructor args from registry/tier1.json", function () {
    const tier1 = require("../registry/tier1.json");
    const sepolia = tier1.chains["ethereum-sepolia"];
    expect(sepolia.chainId).to.equal(11155111);
    expect(sepolia.cctpDomain).to.equal(0);
    expect(sepolia.universalRouter).to.match(/^0x[a-fA-F0-9]{40}$/);
    expect(sepolia.permit2).to.equal("0x000000000022D473030F116dDEE9F6B43aC78BA3");
    expect(sepolia.tokenMessengerV2).to.equal("0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA");
  });
  it("resolves Base Sepolia constructor args from registry/tier1.json", function () {
    const tier1 = require("../registry/tier1.json");
    const baseSepolia = tier1.chains["base-sepolia"];
    expect(baseSepolia.chainId).to.equal(84532);
    expect(baseSepolia.cctpDomain).to.equal(6);
    expect(baseSepolia.universalRouter).to.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
```

- [ ] **Step 2: Run test, confirm it passes (tier1.json was created in B.2)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
npx hardhat test test/deploy_script_drift.test.cjs 2>&1 | tee /tmp/deploy-drift-test.log
```

Expected: green (both new tests pass).

- [ ] **Step 3: Modify `deploy_testnet.cjs` to read from `tier1.json` for chain identification**

The existing script (per W0 finding, `deploy_testnet.cjs:127` refuses chains without official CCTP + Universal Router overlap) is correct in spirit. Extend it to:
- Load `tier1.json` instead of (or in addition to) the existing per-chain hardcoded blocks.
- Refuse to deploy a chain not in `tier1.json`'s `chains` map.
- Log the tier classification on dry-run output.

Implement minimally; don't restructure. Keep the existing refusal logic.

- [ ] **Step 4: Run the deploy script in dry-run mode against every Tier 1 chain to verify the integration**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
for net in sepolia baseSepolia; do
  echo "=== ${net} ==="
  FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network "${net}" 2>&1 | tail -15
done | tee /tmp/deploy-dry-run-tier1.log
```

Expected: both chains print the right CCTP domain, Universal Router address, Permit2 address, USDC address; no errors.

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git add sw4p-backend/contracts/scripts/deploy_testnet.cjs sw4p-backend/contracts/test/deploy_script_drift.test.cjs
git -c commit.gpgsign=false commit -m "feat(contracts): deploy_testnet.cjs reads tier1.json for Sepolia + Base Sepolia"
```

---

## Phase C: Tier 1 funded testnet deploys

### Task C.1: Real-action authorization gate for Tier 1 funded deploys

**Files:** none (procedural gate)

- [ ] **Step 1: STOP and request explicit user authorization**

Present the user with:

```
W1 Phase C funded Tier 1 deploy authorization.

Action: deploy ZapAndBridgeV41 to Ethereum Sepolia and Base Sepolia testnets
        using the deployer wallet configured in .env.testnet
        (PRIVATE_KEY env var).

Cost: testnet ETH only. Sepolia gas ~0.01-0.05 ETH; Base Sepolia gas ~0.005 ETH.
      Total approximately 0.06 testnet ETH ($0 USD).

Reversible: no, on-chain deploys are immutable. Re-deploys produce new
            addresses; old addresses remain.
Pre-flight: deploy script dry-runs all green (Task B.3 Step 4).
Acceptance: 2 funded deploy tx hashes captured + post-deploy address
            written to `deployed_addresses.json` + constructor argument
            vector matches tier1.json.

Authorize the funded Tier 1 deploys? (yes/no)
```

Wait for `yes`. If `no`, halt Phase C and skip to Phase E (Tier 2 CCTP-only) which uses canonical Circle contracts without a sw4p deploy.

### Task C.2: Deploy V4.1 to Ethereum Sepolia

**Files:**
- Modify: `sw4p-backend/contracts/scripts/deployed_addresses.json` (append Tier 1 Sepolia entry)
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-sepolia-deploy.md`

- [ ] **Step 1: Verify deployer wallet has Sepolia ETH**

```bash
DEPLOYER_ADDR="$(cd /Volumes/OWC\ Envoy\ Pro\ FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16 && node -e "const w = require('ethers').Wallet.createRandom(); require('fs').writeFileSync('/dev/null', ''); const k = process.env.PRIVATE_KEY; console.log(new (require('ethers')).Wallet(k).address);" 2>/dev/null)"
echo "Deployer: ${DEPLOYER_ADDR}"

curl -sS -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"${DEPLOYER_ADDR}\",\"latest\"],\"id\":1}" \
  "${ETH_SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}" \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print('balance wei:', int(r['result'], 16))"
```

Expected: balance >= 0.05 * 10^18 wei (0.05 ETH). If insufficient, STOP and request user top-up.

- [ ] **Step 2: Run the deploy against Sepolia**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
npx hardhat run scripts/deploy_testnet.cjs --network sepolia 2>&1 | tee /tmp/deploy-sepolia.log
```

Expected: log prints transaction hash + new contract address. Capture both.

- [ ] **Step 3: Verify deployment on Etherscan**

```bash
TX_HASH="<from Step 2 log>"
CONTRACT="<from Step 2 log>"

# Confirm bytecode at the new address
cast code "${CONTRACT}" --rpc-url "${ETH_SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}" | wc -c

# Capture the transaction page for evidence (Etherscan)
curl -sS -o /tmp/etherscan-sepolia-tx.html -w "HTTP:%{http_code}\n" \
  "https://sepolia.etherscan.io/tx/${TX_HASH}"
```

Expected: bytecode at address > 3 (real deployed contract); Etherscan page returns 200.

- [ ] **Step 4: Verify constructor args match tier1.json**

```bash
# Spot-check storage slots that hold the immutable constructor args
cast call "${CONTRACT}" "universalRouter()(address)" --rpc-url "${ETH_SEPOLIA_RPC_URL}" 
cast call "${CONTRACT}" "permit2()(address)" --rpc-url "${ETH_SEPOLIA_RPC_URL}"
cast call "${CONTRACT}" "tokenMessenger()(address)" --rpc-url "${ETH_SEPOLIA_RPC_URL}"
```

Each value must match `tier1.json/chains/ethereum-sepolia`. If any mismatch, the deploy is contaminated; capture as DONE_WITH_CONCERNS and surface for user.

- [ ] **Step 5: Append new address to `deployed_addresses.json`**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
python3 -c "
import json
d = json.load(open('scripts/deployed_addresses.json'))
d.setdefault('ZAP_BRIDGE_V41', {})['SEPOLIA'] = '<CONTRACT from Step 2>'
json.dump(d, open('scripts/deployed_addresses.json', 'w'), indent=2)
"
git diff scripts/deployed_addresses.json
```

- [ ] **Step 6: Write evidence and commit**

Create `tier1-sepolia-deploy.md` documenting tx hash, contract address, constructor verification (Step 4 output), Etherscan URL.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git add sw4p-backend/contracts/scripts/deployed_addresses.json
git -c commit.gpgsign=false commit -m "feat(contracts): record V4.1 Sepolia deploy address"

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-sepolia-deploy.md
git -c commit.gpgsign=false commit -m "evidence(W1.c): real Sepolia V4.1 funded deploy with constructor verification"
```

### Task C.3: Deploy V4.1 to Base Sepolia

Mirror Task C.2 for Base Sepolia: balance check, deploy, verify bytecode + constructor args on Basescan (`https://sepolia.basescan.org`), update `deployed_addresses.json`, write evidence `tier1-base-sepolia-deploy.md`, commit.

Same TDD/verification discipline. Same real-action gate (covered by C.1's authorization, no separate gate needed).

---

## Phase D: Tier 1 acceptance (safety controls + real CCTP round-trip)

### Task D.1: Exercise pause / unpause on real Sepolia + Base Sepolia deploys

**Files:**
- Create: `sw4p-backend/contracts/test/integration/tier1-pause-acceptance.cjs`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-pause-evidence.md`

- [ ] **Step 1: Write the integration test**

```javascript
// test/integration/tier1-pause-acceptance.cjs
// Runs against a real testnet deploy, gated by env var TIER1_CHAIN.
// Sends a real pause() tx, observes Paused event on-chain, then unpause(),
// observes Unpaused event. Confirms PAUSER_ROLE gate.

const { ethers } = require("hardhat");
const { expect } = require("chai");

const TIER1_CHAIN = process.env.TIER1_CHAIN;
if (!TIER1_CHAIN) {
  console.log("Skipping: TIER1_CHAIN not set");
  return;
}

const tier1 = require("../../registry/tier1.json");
const deployed = require("../../scripts/deployed_addresses.json");

describe(`Tier 1 ${TIER1_CHAIN} acceptance: pause`, function () {
  this.timeout(180000); // real testnet, allow 3 min

  it("pause emits Paused on real chain", async function () {
    const addr = deployed.ZAP_BRIDGE_V41[TIER1_CHAIN.toUpperCase().replace("-", "_")];
    const v41 = await ethers.getContractAt("ZapAndBridgeV41", addr);
    const tx = await v41.pause();
    const rcpt = await tx.wait();
    expect(rcpt.logs.some(l => l.fragment && l.fragment.name === "Paused")).to.be.true;
  });

  it("unpause emits Unpaused on real chain", async function () {
    const addr = deployed.ZAP_BRIDGE_V41[TIER1_CHAIN.toUpperCase().replace("-", "_")];
    const v41 = await ethers.getContractAt("ZapAndBridgeV41", addr);
    const tx = await v41.unpause();
    const rcpt = await tx.wait();
    expect(rcpt.logs.some(l => l.fragment && l.fragment.name === "Unpaused")).to.be.true;
  });
});
```

- [ ] **Step 2: Run against Sepolia**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
TIER1_CHAIN=ethereum-sepolia npx hardhat test test/integration/tier1-pause-acceptance.cjs --network sepolia 2>&1 | tee /tmp/tier1-pause-sepolia.log
```

Expected: 2 passing. Capture tx hashes from log.

- [ ] **Step 3: Run against Base Sepolia**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
TIER1_CHAIN=base-sepolia npx hardhat test test/integration/tier1-pause-acceptance.cjs --network baseSepolia 2>&1 | tee /tmp/tier1-pause-base.log
```

Expected: 2 passing. Capture tx hashes.

- [ ] **Step 4: Write evidence + commit**

Create `tier1-pause-evidence.md` with 4 tx hashes (pause + unpause per chain) and Etherscan/Basescan URLs.

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git add sw4p-backend/contracts/test/integration/tier1-pause-acceptance.cjs
git -c commit.gpgsign=false commit -m "test(contracts): Tier 1 real-testnet pause acceptance integration"

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-pause-evidence.md
git -c commit.gpgsign=false commit -m "evidence(W1.d): real Tier 1 pause + unpause acceptance per chain"
```

### Task D.2: Exercise timelock propose / execute on real Tier 1 chains

**Files:**
- Create: `sw4p-backend/contracts/test/integration/tier1-timelock-acceptance.cjs`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-timelock-evidence.md`

- [ ] **Step 1: Write the timelock integration test**

The test calls `proposeSafetyConfig` with a new fee config, attempts to `executeSafetyConfig` BEFORE TIMELOCK_DELAY (must revert), waits >= TIMELOCK_DELAY (use `evm_increaseTime` if Hardhat is talking to a fork-mode; against real testnet, the test asserts the revert behavior only since real time can't be advanced).

For real testnet, the test ONLY asserts:
- `proposeSafetyConfig` emits the proposal event (1 tx).
- `executeSafetyConfig` BEFORE delay reverts with `MustGoThroughTimelock` (no tx; assertion via `expect(...).to.be.revertedWith`).

This is the real-chain acceptance shape: we prove the protocol gate exists on-chain, not the time-machine assertion.

- [ ] **Step 2: Run against Sepolia + Base Sepolia**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
TIER1_CHAIN=ethereum-sepolia npx hardhat test test/integration/tier1-timelock-acceptance.cjs --network sepolia 2>&1 | tee /tmp/tier1-timelock-sepolia.log
TIER1_CHAIN=base-sepolia    npx hardhat test test/integration/tier1-timelock-acceptance.cjs --network baseSepolia 2>&1 | tee /tmp/tier1-timelock-base.log
```

Expected: green per chain. Capture propose tx hashes.

- [ ] **Step 3: Write evidence + commit (same structure as D.1)**

### Task D.3: Exercise per-period limit on real Tier 1 chains

**Files:**
- Create: `sw4p-backend/contracts/test/integration/tier1-limit-acceptance.cjs`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-limit-evidence.md`

Test shape: dust a known recipient with a deliberate over-limit movement, expect `DailyLimitExceeded` revert on-chain. Capture the failed-tx receipt.

Same TDD + evidence + commit pattern.

### Task D.4: Real CCTP V2 zap-and-bridge round-trip on Sepolia → Base Sepolia

**Files:**
- Create: `sw4p-backend/contracts/test/integration/tier1-cctp-roundtrip.cjs`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-cctp-roundtrip-evidence.md`

This is the headline acceptance for Phase D. Real $1 USDC moves Sepolia → Base Sepolia via the new V4.1 deployment, with Iris attestation, and `receiveMessage` on Base.

- [ ] **Step 1: Real-action authorization for funded round-trip**

Present user with auth gate (similar shape to W0 Task 5.1; ~$2 USDC testnet spend total per direction).

- [ ] **Step 2: Submit zap-and-bridge tx via V4.1 on Sepolia**

Use `zapWithPermit2` or `zapEthAndBridge` per `ZapAndBridgeV41.sol`. The exact call surface is documented in `sw4p-backend/contracts/contracts/ZapAndBridgeV41.sol`.

- [ ] **Step 3: Poll Circle Iris sandbox until attestation ready**

```bash
SRC_TX="<from Step 2>"
for i in $(seq 1 60); do
  RESP=$(curl -sS "https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=${SRC_TX}")
  STATUS=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('messages',[{}])[0].get('status',''))" 2>/dev/null)
  echo "[${i}] iris status=${STATUS}"
  if [ "${STATUS}" = "complete" ]; then break; fi
  sleep 5
done
echo "$RESP" > /tmp/iris-attestation.json
```

Expected: Iris returns `complete` within 5 minutes.

- [ ] **Step 4: Submit `receiveMessage` on Base Sepolia**

Use the attestation + message from Step 3.

- [ ] **Step 5: Verify destination chain mint**

`cast call USDC.balanceOf(recipient)` before and after, confirm delta = bridged amount.

- [ ] **Step 6: Write evidence**

Document all tx hashes + Iris attestation hash + balance deltas.

- [ ] **Step 7: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier1-cctp-roundtrip-evidence.md
git -c commit.gpgsign=false commit -m "evidence(W1.d): real Sepolia to Base Sepolia CCTP V2 round-trip via V4.1"
```

### Task D.5: Real CCTP V2 reverse round-trip Base Sepolia → Sepolia

Same shape as D.4, reversed. Separate evidence file `tier1-cctp-roundtrip-reverse-evidence.md`.

---

## Phase E: Tier 2 CCTP-only proof (Avalanche Fuji + Polygon Amoy)

### Task E.1: Real-action authorization for Tier 2 funded burns

Same gate format as C.1 / D.4. Total cost: ~$2 USDC testnet + minimal gas on Fuji + Amoy.

### Task E.2: Real CCTP V2 burn on Avalanche Fuji via canonical TokenMessengerV2 (NOT V4.1)

**Files:**
- Create: `sw4p-backend/contracts/scripts/tier2-cctp-only/fuji.cjs`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/tier2-fuji-evidence.md`

Script directly calls TokenMessengerV2's `depositForBurn` on Fuji with a known recipient on a Tier 1 destination chain (Base Sepolia or Sepolia). No V4.1 involvement; this proves CCTP V2 works on the chain.

- [ ] **Step 1: Write the script**

```javascript
// scripts/tier2-cctp-only/fuji.cjs
// Real $1 USDC burn from Avalanche Fuji to Base Sepolia via canonical
// Circle TokenMessengerV2. Proves CCTP V2 works on Fuji without depending
// on Uniswap router (which is absent on Fuji testnet).

const { ethers } = require("hardhat");
const tier2 = require("../../registry/tier2.json");
const tier1 = require("../../registry/tier1.json");

async function main() {
  const fuji = tier2.chains["avalanche-fuji"];
  const baseSepolia = tier1.chains["base-sepolia"];
  const amount = ethers.parseUnits("1", 6); // 1 USDC
  const mintRecipient = "0x" + "00".repeat(12) + (await ethers.getSigners())[0].address.slice(2);

  const usdc = await ethers.getContractAt("IERC20", fuji.usdc);
  const tm = await ethers.getContractAt("ITokenMessengerV2", fuji.tokenMessengerV2);

  await (await usdc.approve(fuji.tokenMessengerV2, amount)).wait();
  const tx = await tm.depositForBurn(amount, baseSepolia.cctpDomain, mintRecipient, fuji.usdc);
  const rcpt = await tx.wait();
  console.log("source tx:", rcpt.hash);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run against Fuji**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
npx hardhat run scripts/tier2-cctp-only/fuji.cjs --network avalancheFuji 2>&1 | tee /tmp/tier2-fuji.log
```

Capture source tx hash.

- [ ] **Step 3: Poll Iris + receive on Base Sepolia (same flow as D.4 steps 3-5)**

- [ ] **Step 4: Write evidence (labeled "Tier 2 CCTP-only acceptance, NOT canonical V4.1 acceptance")**

- [ ] **Step 5: Commit**

### Task E.3: Real CCTP V2 burn on Polygon Amoy via canonical TokenMessengerV2

Mirror E.2 for Polygon Amoy.

---

## Phase F: Tier 3 mainnet-fork compatibility

### Task F.1: Hardhat fork config for Avalanche mainnet + Polygon mainnet

**Files:**
- Modify: `sw4p-backend/contracts/hardhat.config.cjs`
- Create: `sw4p-backend/contracts/test/fork/avalanche-mainnet-compat.test.cjs`
- Create: `sw4p-backend/contracts/test/fork/polygon-mainnet-compat.test.cjs`

- [ ] **Step 1: Add fork network entries**

```javascript
// hardhat.config.cjs additions
networks: {
  // ...existing...
  forkAvalancheMainnet: {
    url: "hardhat",
    forking: {
      url: process.env.AVAX_MAINNET_RPC_URL,
      blockNumber: process.env.FORK_BLOCK_AVAX ? Number(process.env.FORK_BLOCK_AVAX) : undefined,
    }
  },
  forkPolygonMainnet: {
    url: "hardhat",
    forking: {
      url: process.env.POLYGON_MAINNET_RPC_URL,
      blockNumber: process.env.FORK_BLOCK_POLYGON ? Number(process.env.FORK_BLOCK_POLYGON) : undefined,
    }
  },
}
```

- [ ] **Step 2: Write the fork compat tests**

```javascript
// test/fork/avalanche-mainnet-compat.test.cjs
// Deploys ZapAndBridgeV41 against a block-pinned Avalanche mainnet fork
// using real Universal Router + Permit2 + CCTP V2 mainnet addresses.
// Asserts: constructor succeeds (real-state preconditions met), pause()
// works, sample zapWithPermit2 path completes.

const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("ZapAndBridgeV41 Avalanche mainnet fork compatibility", function () {
  if (!process.env.AVAX_MAINNET_RPC_URL) {
    this.skip();
  }
  // ... full setup using real Avalanche mainnet UniversalRouter, Permit2, CCTP V2 ...
});
```

- [ ] **Step 3: Run the fork tests in CI mode**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend/contracts"
AVAX_MAINNET_RPC_URL="${AVAX_MAINNET_RPC_URL}" FORK_BLOCK_AVAX="<pinned-block>" \
  npx hardhat test test/fork/avalanche-mainnet-compat.test.cjs --network forkAvalancheMainnet 2>&1 | tee /tmp/fork-avax.log

POLYGON_MAINNET_RPC_URL="${POLYGON_MAINNET_RPC_URL}" FORK_BLOCK_POLYGON="<pinned-block>" \
  npx hardhat test test/fork/polygon-mainnet-compat.test.cjs --network forkPolygonMainnet 2>&1 | tee /tmp/fork-polygon.log
```

Capture both logs.

- [ ] **Step 4: Write evidence (labeled "Tier 3 mainnet-fork compat, NOT testnet acceptance, NOT mainnet deploy")**

Block-pinned fork URL + block number + real upstream state hash.

- [ ] **Step 5: Commit**

---

## Phase G: W1 evidence consolidation + W2 handoff

### Task G.1 to G.5: aggregate per-task acceptance, prs, commands, next-wave-handoff, self-review

Mirror W0 Phase 6 structure. Five evidence files in `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/`:

- `acceptance.md`: every gate in Phases A-F with real tx hash / explorer URL / fork-CI log.
- `prs.md`: PR inventory (sw4p worktree commits on staging branch; parent local-only evidence commits).
- `commands.md`: paste-ready re-verification recipe.
- `next-wave-handoff.md`: locked decisions for W2 (rail-consolidation can now reference real V4.1 deployments).
- Self-review scans (em dash, placeholder, mock-citation) + matrix updates for W1 row.

### Task G.6: Close W1 + handoff to W2

Summarize wave outcome to user; request approval to write W2 plan.

---

## Self-review (writing-plans skill checklist)

**1. Spec coverage:** Every W1 acceptance gate in the cycle spec (Section 4, W1) maps to a Phase + Task above:
- W1 tier roster (Tier 1/2/3) → Phase B registry + Phase C-F tier-specific acceptance.
- Canonical V4.1 safety controls → Phase A (verify; controls already implemented).
- Tier 1 acceptance (real safety-control state + CCTP V2 zap-and-bridge + receiveMessage) → Phase D Tasks D.1 to D.5.
- Tier 2 acceptance (real CCTP-only burn-mint via canonical Circle contracts) → Phase E.
- Tier 3 acceptance (block-pinned mainnet-fork CI) → Phase F.
- Mock exclusion → repeated across phases; evidence files restate the exclusion.
- Real-action authorization gates → Tasks C.1, D.4, E.1 explicit.

**2. Placeholder scan:** The plan contains `<paste from W0.a sepolia.json fetch>`, `<from Circle official>`, `<from Step 2 log>`, etc. inside fenced code blocks that the executor fills with real captured data. These are template placeholders for the executor to resolve, not plan TODOs. The plan's own Phase G self-review gates on those placeholders being resolved before any acceptance.md commits.

**3. Type consistency:** Branch names (`staging/devnet-frontier-2026-05-16`), worktree paths (`/Volumes/.../.worktrees/sw4p-devnet-frontier-2026-05-16/`), and evidence paths (`DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/`) are consistent across all tasks. Permit2 address `0x000000000022D473030F116dDEE9F6B43aC78BA3` and CCTP V2 addresses are consistent across all references.

**4. Real-action gates explicitly marked:** Task C.1 (Tier 1 funded deploys), Task D.4 (Tier 1 funded round-trip), Task E.1 (Tier 2 funded burns). Three gates matching the cycle spec Section 2.4 + Section 4 W1.

**5. ZERO-MOCKS:** Every acceptance gate in Phases C/D/E/F cites real-chain or real-fork evidence. The MockNoopMessageTransmitter and similar fixtures stay in `contracts/test/*.test.cjs` for unit coverage; they are not cited in any evidence file.

**6. Em dash discipline:** None used in this plan.

**7. Backend dependency:** Phase C-D-E-F assume the sw4p-backend HTTP API is reachable. If the W0 deferral is not yet resolved at W1 start time, Phase D.4 / D.5 (which involve protocol-mediated paths) may degrade to "direct on-chain via V4.1 + Iris" without `/sdk/v1/transfer` polling; document the degradation in Phase D evidence.
