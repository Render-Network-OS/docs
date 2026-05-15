# sw4p Frontier Engine Approach A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Approach A of the sw4p Frontier Engine: one canonical Solana program, one canonical V4-derived EVM contract across the six EVM chains, two day-one rails (CCTP V2 + Allbridge Core), engine-wide 3-phase atomicity, and audited devnet/testnet-to-mainnet promotion across the eight day-one chains.

**Architecture:** The plan is audit-first. WS0 establishes ground truth for Solana deployments, EVM live paths, P-Token activation, and EVM safety controls before any destructive migration or sunset work. Implementation then proceeds through the canonical Solana program, canonical EVM contract, rail consolidation, state-machine/atomicity hardening, layout reorg, validation loop, audit, and gated mainnet promotion.

**Tech Stack:** Rust 2021, Solana/Pinocchio target program work, `solana` CLI, TypeScript frontend/services, Rust backend with SQLx/Postgres, Solidity/Hardhat, Circle CCTP V2, Allbridge Core, Uniswap Universal Router, Permit2, Markdown corpus artifacts.

---

## Source Artifacts

| Artifact | Role |
|---|---|
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | Architecture source of truth: diagrams, A/B/C boundary, sunset ordering, 3-phase discipline. |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` | Workstreams WS0-WS9, milestones M0-M6, acceptance criteria. |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md` | 113 requirements: 68 functional, 45 non-functional. |

## Current Research Anchors

Official external references checked before this plan:

| Topic | Source | Plan consequence |
|---|---|---|
| Circle CCTP | `https://www.circle.com/cross-chain-transfer-protocol` | CCTP V2 is the canonical CCTP; V1 is legacy and not backwards compatible with V2 contracts/APIs. |
| Circle Gateway | `https://developers.circle.com/gateway/references/supported-blockchains` | Gateway is real and supports a subset of native-USDC chains, but remains Approach B, not Approach A. |
| ERC-7683 | `https://eips.ethereum.org/EIPS/eip-7683` | ERC-7683 is Draft; Approach A keeps the state model interface-agnostic but defers runtime ERC-7683 order ingestion to Approach C. |
| Solana P-Token | `https://solana.com/it/upgrades/p-token` and Anza feature-gate tracker | P-Token is activation-gated per target cluster; do not claim mainnet compute wins or require `batch` until activation is verified. |
| Uniswap v4 deployments | `https://docs.uniswap.org/contracts/v4/deployments` | Universal Router and Permit2 addresses are per-chain registry inputs, not hard-coded assumptions. |

## File Structure Map

| Area | Paths | Responsibility |
|---|---|---|
| Solana canonical program | `sw4p/programs/sw4p-native/src/`, `sw4p/programs/sw4p-native/tests/`, `sw4p/programs/sw4p-native/Cargo.toml` | Survivor program, Pinocchio migration target, security-control parity, P-Token activation-gated batch path. |
| Retiring Anchor program | `sw4p/programs/sw4p/`, `sw4p/sw4p-frontend/services/koraBridge.ts`, `sw4p/sw4p-backend/src/watcher.rs`, `sw4p/render.yaml`, `sw4p/kora/kora.toml` | Old program and current consumer references that must migrate before retirement. |
| Backend orchestration | `sw4p/sw4p-backend/src/state_machine.rs`, `sw4p/sw4p-backend/src/route_selector.rs`, `sw4p/sw4p-backend/src/allbridge.rs`, `sw4p/sw4p-backend/src/relay.rs`, `sw4p/sw4p-backend/src/relay_handler.rs`, `sw4p/sw4p-backend/src/solver_auction.rs`, `sw4p/sw4p-backend/src/sdk_bridge.rs` | Intent lifecycle, rail routing, 3-phase discipline, Allbridge lifecycle, explicit routing observability. |
| Backend tests | `sw4p/sw4p-backend/tests/`, `sw4p/sw4p-backend/src/*_tests.rs` | Regression tests for state transitions, route selection, watcher/relay atomicity, SDK behavior. |
| EVM contracts | `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol`, `sw4p/sw4p-backend/contracts/contracts/ZapAndBridge.sol`, `sw4p/sw4p-backend/contracts/contracts/ZapNative.sol`, `sw4p/sw4p-backend/contracts/contracts/mocks/` | Canonical V4-derived contract, legacy V3, gated ZapNative deletion, mock contracts. |
| EVM deploy/test | `sw4p/sw4p-backend/contracts/test/`, `sw4p/sw4p-backend/contracts/scripts/`, `sw4p/sw4p-backend/contracts/hardhat.config.cjs`, `sw4p/sw4p-backend/contracts/package.json` | Contract tests, deployment scripts, deployed-address inventory. |
| Frontend | `sw4p/sw4p-frontend/services/koraBridge.ts`, `sw4p/sw4p-frontend/components/apps/BridgeApp.tsx`, `sw4p/sw4p-frontend/abis/` | Bridge UI/service calls, old ABI references, canonical program/contract wiring. |
| Local/testnet harness | `sw4p/localnet/`, `sw4p/testnet/` | Mock services and end-to-end validation for CCTP, Allbridge, frontend, SDK, auth, and worker regressions. |
| Corpus evidence | `docs/superpowers/audits/`, `docs/superpowers/plans/`, `docs/superpowers/specs/` | Audit outputs, plan, design/SOW/TRD traceability. |

## Execution Rules

- Execute in a clean isolated worktree when implementation starts; use `superpowers:using-git-worktrees` at execution time.
- Each task below lands as one commit unless a task explicitly says it is documentation-only evidence for later commits.
- Do not delete `ZapNative.sol`, retire V3, or retire `programs/sw4p` until the named gate in this plan is satisfied.
- Do not add Gateway runtime behavior in Approach A; document B-only seams but leave implementation out.
- Do not add ERC-7683 runtime ingestion in Approach A; keep the state model interface-agnostic and defer the listener/front-door work to C.
- Do not proceed to mainnet promotion until the final candidate has rerun and passed the full testnet suite and the Solana devnet validation/deploy path again after all consolidation, audit-remediation, and registry changes are in place.
- Prefer primary verification commands listed in each task; if a command requires network and fails due sandbox restrictions, rerun with approved escalation.

---

## Phase 0: WS0 Ground Truth Gates

### Task 0.1: Create the WS0 live-state audit file

**Files:**
- Create: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`

- [x] **Step 1: Confirm the plan source documents exist**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
ls docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-{design,sow,trd}.md
```

Expected: all three files are printed.

- [x] **Step 2: Create the audit skeleton**

```markdown
# sw4p Frontier Engine Live-State Audit

**Date:** 2026-05-15
**Scope:** Approach A WS0 gates.
**Inputs:** design spec, SOW, TRD, local filesystem, public RPC checks, official Circle/Solana/Uniswap/EIP sources.

## Gate Summary

| Gate | Status | Evidence |
|---|---|---|
| Solana deployment-status audit | Open | Filled by Task 0.2. |
| EVM live-path audit | Open | Filled by Task 0.3. |
| P-Token activation-status check | Open | Filled by Task 0.4. |
| EVM safety-control scoping | Open | Filled by Task 0.5. |

## Decisions Produced

| Decision | Value | Reason |
|---|---|---|
| Can WS1 migration sequence start? | Open | Requires Solana deployment-status audit. |
| Can ZapNative be deleted? | Open | Requires EVM live-path audit. |
| Can P-Token batch be required on target mainnet? | Open | Requires target-cluster activation check. |
| What EVM safety controls must V4-derived canonical contract carry? | Open | Requires V4 safety-control scope. |
```

- [x] **Step 3: Commit the skeleton**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
git commit -m "docs(superpowers): add frontier engine WS0 live-state audit skeleton"
```

### Task 0.2: Complete Solana deployment-status audit

**Files:**
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`
- Read: `sw4p/sw4p-frontend/services/koraBridge.ts`
- Read: `sw4p/render.yaml`
- Read: `sw4p/kora/kora.toml`
- Read: `sw4p/sw4p-backend/scripts/update_native_config.ts`

- [x] **Step 1: Inventory local program IDs and consumer references**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
rg -n '555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG|555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf|SW4P_NATIVE_PROGRAM_ID|SW4P_PROGRAM_ID' sw4p -g '!target' -g '!node_modules' -g '!artifacts'
```

Expected: references identify the native program ID, Anchor program ID, devnet native ID in `koraBridge.ts`, render/Kora config, and backend scripts.

- [x] **Step 2: Check mainnet program accounts**

```bash
solana program show 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG --url https://api.mainnet-beta.solana.com
solana program show 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3 --url https://api.mainnet-beta.solana.com
```

Expected: record whether each account exists. If an account is missing, record the exact `AccountNotFound` result rather than inferring deletion.

- [x] **Step 3: Check devnet program accounts**

```bash
solana program show 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG --url https://api.devnet.solana.com
solana program show 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3 --url https://api.devnet.solana.com
solana program show HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf --url https://api.devnet.solana.com
```

Expected: record program data address, upgrade authority, deployment slot, and data length for every existing account.

- [x] **Step 4: Write the Solana section**

Add this table to the audit file and fill every cell with command output:

```markdown
## Solana Deployment Status

| Program label | Program ID | Mainnet status | Devnet status | Consumers | Migration consequence |
|---|---|---|---|---|---|
| Native canonical candidate | `555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG` |  |  |  |  |
| Anchor legacy | `555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3` |  |  |  |  |
| Devnet native reference | `HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf` | Not expected on mainnet |  |  |  |
```

- [x] **Step 5: Commit the Solana audit section**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
git commit -m "docs(superpowers): record sw4p solana deployment status"
```

### Task 0.3: Complete EVM deployment and live-path audit

**Files:**
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`
- Read: `sw4p/sw4p-backend/contracts/scripts/deployed_addresses.json`
- Read: `sw4p/sw4p-backend/src/main.rs`
- Read: `sw4p/sw4p-backend/src/deploy_zap_native.rs`
- Read: `sw4p/sw4p-frontend/components/apps/BridgeApp.tsx`
- Read: `sw4p/sw4p-backend/contracts/contracts/ZapNative.sol`
- Read: `sw4p/sw4p-backend/contracts/contracts/ZapAndBridge.sol`
- Read: `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol`

- [x] **Step 1: Inventory local deployment artifacts**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
jq '.' sw4p/sw4p-backend/contracts/scripts/deployed_addresses.json
```

Expected: `ZapAndBridgeV4` has Base/Arbitrum/Polygon addresses, `ZapAndBridge_V2` has Ethereum/Base/Arbitrum/Polygon addresses, `ZapAndBridge_V3` and `ZapNative` maps may be empty.

- [x] **Step 2: Inventory local live-path references**

```bash
rg -n 'ZapNative|deploy_zap_native|ZapAndBridgeV4|ZapAndBridge_V2|ZapAndBridge_V3|ZAP_BRIDGE_V4|deployed_addresses|BridgeApp|zapWithPermit2|receiveMessage' sw4p/sw4p-backend sw4p/sw4p-frontend -g '!target' -g '!node_modules' -g '!artifacts'
```

Expected: record backend deploy path, frontend ABI/UI path, contract tests, deploy scripts, and deployed-address consumers.

- [x] **Step 3: Verify deployed bytecode where public RPC is available**

```bash
cast code 0x15f8de526744c2b438db430d2e16c45b00eee0b0 --rpc-url https://mainnet.base.org | wc -c
cast code 0xe0fa3c274d90d415c26adbca06293d97215ad11f --rpc-url https://arb1.arbitrum.io/rpc | wc -c
cast code 0x224d7b22a99bd9890454ced9209e47470894e7df --rpc-url https://polygon-bor-rpc.publicnode.com | wc -c
cast code 0xe10453fda879e89576602551904e5aeb056b8ed8 --rpc-url https://ethereum-rpc.publicnode.com | wc -c
```

Expected: a byte count greater than `3` means non-empty bytecode (`0x` is empty). Record byte counts, RPC URL, and date.

- [x] **Step 4: Write the EVM section**

Add this table to the audit file:

```markdown
## EVM Deployment / Live-Path Status

| Contract generation | Chain | Artifact address | Bytecode present | Local references | Retirement / deletion gate |
|---|---|---|---|---|---|
| `ZapAndBridgeV4` | Base |  |  |  | Keeper; canonical base. |
| `ZapAndBridgeV4` | Arbitrum |  |  |  | Keeper; canonical base. |
| `ZapAndBridgeV4` | Polygon |  |  |  | Keeper; canonical base. |
| `ZapAndBridgeV4` | Ethereum | Missing from artifact before Approach A | Not checked until deployed |  | Must deploy before V3 retirement. |
| `ZapAndBridge` / `ZapAndBridge_V2` | Ethereum |  |  |  | Retire only after V4 Ethereum cutover. |
| `ZapNative` | All EVM chains |  |  |  | Delete only if no live path depends on it. |
```

- [x] **Step 5: Decide the ZapNative gate from evidence**

Write one of these exact decisions in the audit file:

```markdown
**ZapNative deletion gate:** CLEAR. Local references are non-live build/test/deploy residue, no deployed bytecode or runtime consumer path depends on `ZapNative`. WP0.3 may delete it.
```

or:

```markdown
**ZapNative deletion gate:** BLOCKED. The EVM deployment / live-path table above names the live path that depends on `ZapNative`. WP0.3 must not delete it until that path migrates to the canonical V4-derived contract.
```

- [x] **Step 6: Commit the EVM audit section**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
git commit -m "docs(superpowers): record sw4p evm live-path status"
```

### Task 0.4: Complete P-Token activation-status check

**Files:**
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`
- Read: official Solana P-Token upgrade page
- Read: Anza feature-gate tracker
- Read: target-cluster RPC output

- [x] **Step 1: Record official source state**

```bash
# Browser/source check, not a code command:
# 1. Open https://solana.com/it/upgrades/p-token
# 2. Open https://github.com/anza-xyz/agave/wiki/Feature-Gate-Tracker-Schedule
# 3. Record whether SIMD-0266 is pending or activated for the target cluster.
```

Expected: source links and observed status recorded with access date.

- [x] **Step 2: Check target cluster directly**

Use the feature gate key for SIMD-0266 from the Anza tracker and verify the target cluster state using the Solana CLI or a reliable RPC feature endpoint. Record the command used, the cluster URL, and the output.

```bash
solana feature status --url https://api.mainnet-beta.solana.com | rg '0266|Efficient Token|ptok|P-Token'
solana feature status --url https://api.devnet.solana.com | rg '0266|Efficient Token|ptok|P-Token'
```

Expected: activation state recorded for mainnet-beta and devnet. If the CLI output does not expose the feature by name, record that limitation and use the Anza tracker plus any available program/feature-account RPC evidence.

- [x] **Step 3: Write the P-Token decision**

Add this section to the audit file:

```markdown
## P-Token Activation Status

| Cluster | Source evidence | Direct cluster evidence | Approach-A mode |
|---|---|---|---|
| mainnet-beta |  |  | `batch` active or fallback active |
| devnet |  |  | `batch` active or fallback active |

**Implementation decision:** Use P-Token batch on activated clusters; keep individual-CPI fallback on non-activated clusters. Do not claim compute savings on a cluster until activation evidence exists.
```

- [x] **Step 4: Commit the activation check**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
git commit -m "docs(superpowers): record p-token activation gate"
```

### Task 0.5: Complete EVM safety-control scoping

**Files:**
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`
- Read: `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol`
- Read: `sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs`
- Read: `sw4p/programs/sw4p-native/src/processor.rs`
- Read: `sw4p/programs/sw4p-native/src/state.rs`
- Read: `sw4p/programs/sw4p-native/tests/`

- [x] **Step 1: Inventory Solana carried controls**

```bash
rg -n 'pause|paused|timelock|daily|limit|fee|signature|squads|multisig|admin|authority' sw4p/programs/sw4p-native/src sw4p/programs/sw4p-native/tests
```

Expected: signature-gated fee, pause, 24h timelock, daily limits, and admin authority references are inventoried.

- [x] **Step 2: Inventory V4 controls**

```bash
rg -n 'pause|paused|Pausable|Ownable|AccessControl|timelock|daily|limit|cap|max|admin|owner|authority|fee' sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs
```

Expected: the current V4 control surface is recorded exactly. Missing controls are explicitly listed.

- [x] **Step 3: Write required canonical EVM controls**

Add this section to the audit file:

```markdown
## EVM Safety-Control Scope

| Control | Solana canonical source | Present in V4 today | Required in canonical EVM contract | Verification required |
|---|---|---|---|---|
| Pause |  |  | Yes | Unit test: paused value movement reverts. |
| Daily / per-period movement limit |  |  | Yes | Unit test: over-limit value movement reverts; reset behavior tested. |
| Timelocked config changes |  |  | Yes | Unit test: change cannot execute before delay, can execute after delay. |
| Admin authority / multisig handoff |  |  | Yes | Inspection: owner/admin set to governed address; tests cover only authorization. |
| Fee-take guardrails |  |  | Yes | Unit test: invalid fee config reverts, valid fee deducted exactly once. |
```

- [x] **Step 4: Commit the safety-control scope**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
git commit -m "docs(superpowers): scope evm safety controls for frontier engine"
```

---

## Phase 1: WS1 Canonical Solana Program

### Task 1.1: Pinocchio rebuild plan and security parity harness

**Files:**
- Modify: `sw4p/programs/sw4p-native/Cargo.toml`
- Modify: `sw4p/programs/sw4p-native/src/lib.rs`
- Modify: `sw4p/programs/sw4p-native/src/processor.rs`
- Modify: `sw4p/programs/sw4p-native/src/state.rs`
- Modify: `sw4p/programs/sw4p-native/tests/unit_tests.rs`
- Modify: `sw4p/programs/sw4p-native/tests/fuzz_processor.rs`

- [x] **Step 1: Establish current tests before changing program internals**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/programs/sw4p-native"
cargo test
```

Expected: current pass/fail baseline recorded in the task notes. If existing tests fail before edits, capture failures and fix or split blocker before rebuild work.

- [x] **Step 2: Add security parity tests before changing behavior**

Add failing tests that cover each carried control from Task 0.5: signature-gated fee, pause rejection, 24h timelock, daily limit, admin authority. Name tests with this exact prefix so the audit grep can find them: `frontier_parity_`.

```bash
rg -n 'frontier_parity_' sw4p/programs/sw4p-native/tests
```

Expected before adding tests: no hits. Expected after adding tests: one hit per carried control.

- [x] **Step 3: Migrate internals to the chosen Pinocchio shape**

Use the design spec's rule: carry behavior first, optimize second. Do not remove a control until its `frontier_parity_` test passes against the new shape.

- [x] **Step 4: Run Solana program tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/programs/sw4p-native"
cargo test frontier_parity_ -- --nocapture
cargo test
```

Expected: all parity tests and existing tests pass.

- [x] **Step 5: Commit Solana parity foundation**

```bash
git add sw4p/programs/sw4p-native
git commit -m "feat(sw4p): rebuild native program with frontier parity controls"
```

### Task 1.2: Add activation-gated P-Token batch path

**Files:**
- Modify: `sw4p/programs/sw4p-native/src/processor.rs`
- Modify: `sw4p/programs/sw4p-native/src/state.rs`
- Modify: `sw4p/programs/sw4p-native/tests/unit_tests.rs`
- Modify: `sw4p/programs/sw4p-native/tests/fuzz_processor.rs`

- [x] **Step 1: Add failing tests for both modes**

Required test names:

```text
frontier_ptoken_batch_uses_one_batch_when_active
frontier_ptoken_batch_falls_back_to_individual_cpis_when_inactive
frontier_ptoken_batch_does_not_change_settlement_amounts
```

- [x] **Step 2: Implement activation flag read path**

The program/config must expose an explicit activation mode: `PTokenBatchMode::Enabled` or `PTokenBatchMode::Fallback`. The value is set from the WS0 activation check, not inferred silently.

- [x] **Step 3: Implement batch path with fallback**

When active, build the batch instruction for multi-token-op settlement. When inactive, execute the existing individual token CPI sequence. Both paths must write the same settlement state and fee outputs.

- [x] **Step 4: Run targeted tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/programs/sw4p-native"
cargo test frontier_ptoken_batch_ -- --nocapture
```

Expected: all three P-Token tests pass.

- [x] **Step 5: Commit P-Token gate**

```bash
git add sw4p/programs/sw4p-native
git commit -m "feat(sw4p): gate p-token batch settlement by activation"
```

### Task 1.3: Migrate frontend Solana consumer off Anchor

**Files:**
- Modify: `sw4p/sw4p-frontend/services/koraBridge.ts`
- Modify: `sw4p/sw4p-frontend/e2e/swap-flow.spec.ts`
- Modify: `sw4p/sw4p-frontend/e2e/bridge-status.spec.ts`

- [x] **Step 1: Prove current Anchor references**

```bash
rg -n '555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|SW4P_PROGRAM_ID|SW4P_NATIVE_PROGRAM_ID|HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf' sw4p/sw4p-frontend/services/koraBridge.ts sw4p/sw4p-frontend/e2e
```

Expected: current references are visible.

- [x] **Step 2: Add e2e assertion for canonical program target**

Update frontend tests so a built bridge transaction targets the canonical program ID from config, not the hard-coded Anchor ID.

- [x] **Step 3: Replace Anchor default wiring**

`koraBridge.ts` must read the canonical program ID from one config source and must not keep the Anchor program as a default fallback. Devnet-only IDs must be named devnet-only.

- [x] **Step 4: Run frontend checks**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npm test -- --run
npx playwright test e2e/swap-flow.spec.ts e2e/bridge-status.spec.ts
```

Expected: unit tests and named e2e tests pass or existing environmental blockers are recorded with exact failure output.

- [x] **Step 5: Commit frontend migration**

```bash
git add sw4p/sw4p-frontend/services/koraBridge.ts sw4p/sw4p-frontend/e2e/swap-flow.spec.ts sw4p/sw4p-frontend/e2e/bridge-status.spec.ts
git commit -m "feat(sw4p): point frontend bridge flow at canonical solana program"
```

### Task 1.4: Migrate watcher/backend Solana consumer off Anchor

**Files:**
- Modify: `sw4p/sw4p-backend/src/watcher/mod.rs`
- Modify: `sw4p/sw4p-backend/src/watcher/tests.rs`
- Modify: `sw4p/sw4p-backend/tests/e2e_health.rs`
- Modify: `sw4p/sw4p-backend/kora.toml`
- Modify: `sw4p/kora/kora.toml`

- [x] **Step 1: Inventory backend Anchor references**

```bash
rg -n '555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|SW4P_PROGRAM_ID|SW4P_NATIVE_PROGRAM_ID|Anchor|programs/sw4p' sw4p/sw4p-backend sw4p/render.yaml sw4p/kora/kora.toml -g '!target'
```

Expected: all backend/config Anchor references are listed before edits.

- [x] **Step 2: Add tests for watcher canonical program subscription**

Create or extend a watcher integration test that asserts the watcher subscribes to the canonical program ID and ignores the Anchor program ID for new intents.

- [x] **Step 3: Replace watcher/native bridge program wiring**

Backend runtime config must expose one canonical Solana program ID. Any Anchor ID remains only in migration audit docs, not in runtime routing.

- [x] **Step 4: Run backend tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test native_bridge -- --nocapture
cargo test watcher -- --nocapture
cargo test
```

Expected: targeted tests pass before full backend pass is claimed.

- [x] **Step 5: Commit backend migration**

```bash
git add sw4p/sw4p-backend/src sw4p/sw4p-backend/tests sw4p/render.yaml sw4p/kora/kora.toml
git commit -m "feat(sw4p): migrate backend watcher to canonical solana program"
```

### Task 1.5: Strip Anchor runtime references but do not retire program yet

**Files:**
- Modify: runtime/config files found by grep in Task 1.4
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`

- [x] **Step 1: Run final runtime grep**

```bash
rg -n '555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|programs/sw4p|SW4P_PROGRAM_ID' sw4p/sw4p-backend sw4p/sw4p-frontend sw4p/render.yaml sw4p/kora/kora.toml -g '!target' -g '!node_modules'
```

Expected: only audit/docs references remain. Runtime references must be gone.

- [x] **Step 2: Record Anchor retirement state**

In the WS0 audit file, record:

```markdown
**Anchor consumer migration:** complete for runtime consumers. The Anchor program is not decommissioned here. Retirement remains gated on WP7.5 testnet cutover validation and WP9.3.
```

- [x] **Step 3: Commit consumer-strip evidence**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md sw4p/sw4p-backend sw4p/sw4p-frontend sw4p/render.yaml sw4p/kora/kora.toml
git commit -m "chore(sw4p): strip anchor program runtime references"
```

---

## Phase 2: WS2 Canonical EVM Contract

### Task 2.1: Add canonical EVM safety controls to V4-derived contract

**Files:**
- Modify: `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol`
- Modify: `sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs`

- [x] **Step 1: Add failing tests from Task 0.5 scope**

Required test names:

```text
frontier_reverts_value_movement_when_paused
frontier_reverts_when_daily_limit_exceeded
frontier_executes_config_change_only_after_timelock
frontier_rejects_unauthorized_admin_action
frontier_takes_fee_exactly_once
```

- [x] **Step 2: Implement the minimal controls**

Use OpenZeppelin primitives already available in `package.json` where appropriate. Controls must protect all value-movement entry points, including Permit2 and destination receive/swap paths.

- [x] **Step 3: Run contract tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/contracts"
npm test -- --grep frontier_
npm test
```

Expected: targeted frontier tests and full contract tests pass.

- [x] **Step 4: Commit EVM controls**

```bash
git add sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs
git commit -m "feat(sw4p): add frontier safety controls to evm contract"
```

### Task 2.2: Build per-chain registry and Universal Router lookup

**Files:**
- Create: `sw4p/sw4p-backend/contracts/registry/mainnet.json`
- Create: `sw4p/sw4p-backend/contracts/registry/testnet.json`
- Create: `sw4p/sw4p-backend/src/chain_registry.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs`
- Modify: `sw4p/sw4p-backend/src/route_selector.rs`
- Modify: `sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol`
- Modify: `sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs`

- [x] **Step 1: Create registry schema from official addresses**

Each registry entry must include:

```json
{
  "chain": "base",
  "chain_id": 8453,
  "cctp_domain": 6,
  "usdc": "0x0000000000000000000000000000000000000000",
  "universal_router": "0x0000000000000000000000000000000000000000",
  "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  "rail": "cctp_v2"
}
```

Replace zero addresses with verified official registry values. Do not invent chain support; Approach A EVM chains are Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon.

Implementation note: mainnet registry covers all six Approach A EVM chains. Testnet registry is intentionally limited to the official CCTP + Universal Router overlap verified on 2026-05-15: Sepolia, Base Sepolia, and Arbitrum Sepolia. OP Sepolia, Avalanche Fuji, and Polygon Amoy remain Task 2.3 blockers unless an official Universal Router address or an explicit fallback is approved. Sources: [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses), [Circle CCTP contract addresses](https://developers.circle.com/cctp/references/contract-addresses), and [Uniswap deployments](https://developers.uniswap.org/docs/protocols/v4/deployments).

- [x] **Step 2: Add registry loader tests**

Add Rust tests that load both registry files and reject zero addresses, duplicate CCTP domains, missing Universal Router, and unsupported rails.

- [x] **Step 3: Wire route selector to registry**

`route_selector.rs` must use registry data for chain capability and Universal Router address. Hard-coded router/USDC/domain values should be deleted or limited to tests.

Implementation note: no `ZapAndBridgeV4.sol` change was required in this task. The contract remains constructor-injected; registry consumption is verified by the registry-backed constructor test and will be used by deploy tooling in Task 2.3.

- [x] **Step 4: Run registry tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test chain_registry -- --nocapture
cargo test route_selector -- --nocapture
```

Expected: registry validation and route selector tests pass.

- [x] **Step 5: Run contract registry tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/contracts"
npm test -- --grep registry
```

Expected: contract consumes registry-provided addresses in tests.

- [x] **Step 6: Commit registry work**

```bash
git add sw4p/sw4p-backend/contracts/registry sw4p/sw4p-backend/src/chain_registry.rs sw4p/sw4p-backend/src/lib.rs sw4p/sw4p-backend/src/route_selector.rs sw4p/sw4p-backend/contracts/contracts/ZapAndBridgeV4.sol sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs
git commit -m "feat(sw4p): add canonical per-chain address registry"
```

### Task 2.3: Deploy canonical EVM contract to six testnets

**Files:**
- Modify: `sw4p/sw4p-backend/contracts/scripts/deploy_v4.ts`
- Modify: `sw4p/sw4p-backend/contracts/scripts/deploy_testnet.ts`
- Create: `sw4p/sw4p-backend/contracts/scripts/deploy_testnet.cjs`
- Modify: `sw4p/sw4p-backend/contracts/hardhat.config.cjs`
- Modify: `sw4p/sw4p-backend/contracts/scripts/testnet_addresses.json`
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`

- [x] **Step 1: Add deploy script guardrails**

Deploy scripts must read from `contracts/registry/testnet.json`, refuse zero addresses, and print chain ID, CCTP domain, Universal Router, Permit2, USDC, admin, limit config, and timelock config.

Implementation note: this contracts package does not execute `.ts` Hardhat scripts directly under its current ESM setup (`ERR_UNKNOWN_FILE_EXTENSION`). The runnable testnet entrypoint is `scripts/deploy_testnet.cjs`; the `.ts` file is kept aligned as source/reference.

- [x] **Step 2: Run compile**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/contracts"
npm run compile
```

Expected: Hardhat compile succeeds.

- [x] **Step 3: Dry-run or deploy each testnet**

Run per-chain deployment only after RPC/env is configured:

```bash
FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network sepolia
FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network baseSepolia
FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network arbitrumSepolia
FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network optimismSepolia
FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network avalancheFuji
FRONTIER_DRY_RUN=true npx hardhat run scripts/deploy_testnet.cjs --network polygonAmoy
```

Expected: addresses written to `testnet_addresses.json`; if a chain cannot deploy due missing RPC/funds, record exact blocker in the audit file.

Result: Sepolia, Base Sepolia, and Arbitrum Sepolia dry-run ready. Optimism Sepolia, Avalanche Fuji, and Polygon Amoy are blocked by missing official CCTP + Universal Router registry entries; blockers are recorded in the audit file and `testnet_addresses.json`.

Non-dry-run deployment was not attempted because `PRIVATE_KEY` and the chain-specific testnet RPC env vars were missing from this local process.

- [x] **Step 4: Commit deploy tooling and evidence**

```bash
git add sw4p/sw4p-backend/contracts/scripts/deploy_v4.ts sw4p/sw4p-backend/contracts/scripts/deploy_testnet.ts sw4p/sw4p-backend/contracts/scripts/deploy_testnet.cjs sw4p/sw4p-backend/contracts/hardhat.config.cjs sw4p/sw4p-backend/contracts/scripts/testnet_addresses.json docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
git commit -m "chore(sw4p): prepare frontier evm testnet deployments"
```

---

## Phase 3: WS3 Rail Consolidation

### Task 3.1: Unify BridgeProtocol enum and CCTP V2 rail definitions

**Files:**
- Create: `sw4p/sw4p-backend/src/bridge_protocol.rs`
- Modify: `sw4p/sw4p-backend/src/lib.rs`
- Modify: `sw4p/sw4p-backend/src/route_selector.rs`
- Modify: `sw4p/sw4p-backend/src/native_bridge.rs`
- Modify: `sw4p/sw4p-backend/src/multi_hop.rs`
- Modify: `sw4p/sw4p-backend/src/metrics.rs`
- Verify/read: `sw4p/sw4p-backend/src/sdk_bridge.rs`
- Verify/read: `sw4p/sw4p-backend/src/cctp_burn.rs`
- Verify/read: `sw4p/sw4p-backend/src/cctp_mint.rs`
- Verify/read: `sw4p/sw4p-backend/src/cctp_attestation.rs`
- Verify/read: `sw4p/sw4p-backend/src/chains.rs`
- Verify/read: `sw4p/sw4p-backend/src/chains_tests.rs`

- [x] **Step 1: Prove duplicate enum state**

```bash
rg -n 'enum BridgeProtocol|BridgeProtocol::|bridge_protocol' sw4p/sw4p-backend/src sw4p/sdk sw4p/packages -g '!target' -g '!node_modules'
```

Expected: all enum definitions and consumers are listed.

- [x] **Step 2: Create one canonical enum module**

The canonical enum must include only Approach-A rails: `CctpV2` and `AllbridgeCore`. Gateway and ERC-7683 are not enum variants for Approach A.

- [x] **Step 3: Remove CCTP V1 routing from new flows**

Leave V1 decode code only where needed for drain-window support until Task 8.2. New routes must use V2.

- [x] **Step 4: Run backend rail tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test chains -- --nocapture
cargo test cctp -- --nocapture
cargo test route_selector -- --nocapture
```

Expected: one enum, CCTP V2 routes for CCTP chains, Allbridge only for Tron.

2026-05-15 verification notes:
- Red check: `cargo test frontier_approach_a_excludes_deferred_bitcoin_adapter -- --nocapture` failed before implementation because `BridgeProtocol::Bitcoin` was still eligible.
- `cargo test chains -- --nocapture`: 38 passed, 0 failed. A sandboxed rerun later hit an `os error 35` process-launch failure after the 38 target tests passed; escalated rerun exited 0.
- `cargo test cctp -- --nocapture`: sandboxed run hit macOS `system-configuration` dynamic-store panic in eight registry-backed client tests; escalated rerun passed with 78 passed, 0 failed, 8 ignored.
- `cargo test route_selector -- --nocapture`: 23 passed, 0 failed.

- [x] **Step 5: Commit rail enum work**

```bash
git add sw4p/sw4p-backend/src sw4p/sdk sw4p/packages
git commit -m "feat(sw4p): unify bridge protocol enum for frontier rails"
```

### Task 3.2: Finish Allbridge first-class rail and explicit routing

**Files:**
- Modify: `sw4p/sw4p-backend/src/allbridge.rs`
- Modify: `sw4p/sw4p-backend/src/tron_client.rs`
- Modify: `sw4p/sw4p-backend/src/tron_swap.rs`
- Modify: `sw4p/sw4p-backend/src/route_selector.rs`
- Modify: `sw4p/localnet/mock-services/src/allbridge.ts`
- Modify: `sw4p/localnet/tests/test-bridge.sh`

- [ ] **Step 1: Add explicit-routing tests**

Required behavior:

```text
Tron destination -> AllbridgeCore selected and logged.
CCTP-supported destination -> CctpV2 selected and logged.
Unsupported rail change -> visible failure, not silent fallback.
```

- [ ] **Step 2: Finish Allbridge lifecycle states**

Allbridge must flow through the canonical state machine: `Created -> Routed -> SwapInDone -> BridgeInitiated -> Attested -> Settled`, with `Stuck`, `SettleRetry`, and `Refunded` recovery paths.

- [ ] **Step 3: Run localnet Allbridge tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
./localnet/tests/test-bridge.sh
```

Expected: Allbridge mock path passes and logs chosen rail explicitly.

- [ ] **Step 4: Commit Allbridge rail work**

```bash
git add sw4p/sw4p-backend/src sw4p/localnet/mock-services/src/allbridge.ts sw4p/localnet/tests/test-bridge.sh
git commit -m "feat(sw4p): make allbridge an explicit frontier rail"
```

---

## Phase 4: WS4 Atomicity and State Machine

### Task 4.1: Formalize 3-phase rule in code and tests

**Files:**
- Modify: `sw4p/sw4p-backend/src/state_machine.rs`
- Modify: `sw4p/sw4p-backend/src/recovery.rs`
- Modify: `sw4p/sw4p-backend/tests/status_transitions.rs`
- Modify: `sw4p/sw4p-backend/tests/solver_auction_recovery.rs`
- Create or modify: `sw4p/sw4p-backend/tests/frontier_atomicity.rs`

- [ ] **Step 1: Add atomicity invariant tests**

Required tests:

```text
frontier_no_terminal_failed_after_bridge_initiated
frontier_settled_and_refunded_are_terminal
frontier_stuck_can_redrive_or_refund
frontier_phase2_failure_leaves_no_half_state
frontier_no_lock_guard_is_held_across_await
```

- [ ] **Step 2: Implement shared transition guard helpers**

The helper must enforce: DB intent state is authoritative, in-memory state is only cache/derived view, locks are released before async I/O, and external side effects occur after durable state transition or with idempotency key.

- [ ] **Step 3: Run atomicity tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test frontier_ --test frontier_atomicity -- --nocapture
cargo test status_transitions -- --nocapture
cargo test solver_auction_recovery -- --nocapture
```

Expected: all atomicity and transition tests pass.

- [ ] **Step 4: Commit atomicity rule**

```bash
git add sw4p/sw4p-backend/src/state_machine.rs sw4p/sw4p-backend/src/recovery.rs sw4p/sw4p-backend/tests
git commit -m "feat(sw4p): enforce frontier intent atomicity invariants"
```

### Task 4.2: Apply 3-phase rule to watcher, relay, and Allbridge lifecycle

**Files:**
- Modify: `sw4p/sw4p-backend/src/watcher.rs`
- Modify: `sw4p/sw4p-backend/src/relay.rs`
- Modify: `sw4p/sw4p-backend/src/relay_handler.rs`
- Modify: `sw4p/sw4p-backend/src/allbridge.rs`
- Modify: `sw4p/sw4p-backend/tests/frontier_atomicity.rs`

- [ ] **Step 1: Add injected-failure tests**

Each component needs tests for process death between durable transition and in-memory/cache update, DB failure mid-transaction, and idempotent retry after external side-effect uncertainty.

- [ ] **Step 2: Refactor component flows to shared rule**

Apply the same phase discipline consistently:

```text
Phase 1: decide under short lock, no await.
Phase 2: durable DB transition / idempotency write.
Phase 3: external side effect or cache/update, retryable by recovery worker.
```

- [ ] **Step 3: Run injected-failure tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test injected_failure -- --nocapture
cargo test frontier_ -- --nocapture
```

Expected: injected failures leave no desync or half-state.

- [ ] **Step 4: Commit component atomicity work**

```bash
git add sw4p/sw4p-backend/src/watcher.rs sw4p/sw4p-backend/src/relay.rs sw4p/sw4p-backend/src/relay_handler.rs sw4p/sw4p-backend/src/allbridge.rs sw4p/sw4p-backend/tests/frontier_atomicity.rs
git commit -m "feat(sw4p): apply three-phase atomicity to watcher relay and allbridge"
```

---

## Phase 5: WS5 On-Chain / Off-Chain Boundary Confirmation

### Task 5.1: Add boundary confirmation document and assertions

**Files:**
- Create: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-boundary-confirmation.md`
- Modify: `sw4p/sw4p-backend/src/route_selector.rs`
- Modify: `sw4p/sw4p-backend/src/fee_collector.rs`
- Modify: `sw4p/sw4p-backend/src/fee_signer.rs`
- Modify: `sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs`

- [ ] **Step 1: Create boundary matrix**

```markdown
# sw4p Frontier Engine Boundary Confirmation

| Concern | Boundary | Evidence | Test |
|---|---|---|---|
| Swap-then-bridge atomicity | On-chain |  |  |
| Fee take | On-chain |  |  |
| Fee quote | Off-chain |  |  |
| Pause / limits / timelock | On-chain |  |  |
| CCTP attestation polling | Off-chain by necessity |  |  |
| Route selection | Off-chain decision, explicit log |  |  |
| State persistence | Durable DB + 3-phase discipline |  |  |
```

- [ ] **Step 2: Add tests for on-chain fee/safety boundary**

Tests must prove fee take and safety controls cannot be bypassed by off-chain caller behavior.

- [ ] **Step 3: Run boundary tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test fee -- --nocapture
cd contracts && npm test -- --grep frontier_
```

Expected: fee and safety boundary tests pass.

- [ ] **Step 4: Commit boundary confirmation**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-boundary-confirmation.md sw4p/sw4p-backend/src sw4p/sw4p-backend/contracts/test/ZapAndBridgeV4.test.cjs
git commit -m "docs(sw4p): confirm frontier on-chain off-chain boundaries"
```

---

## Phase 6: WS6 Physical Layout Reorg

### Task 6.1: Move contracts/programs to canonical layout after ZapNative gate

**Files:**
- Move: `sw4p/sw4p-backend/contracts/` -> `sw4p/contracts/`
- Keep: `sw4p/programs/sw4p-native/` under `sw4p/programs/`
- Modify: `sw4p/sw4p-backend/package.json`
- Modify: `sw4p/sw4p-backend/Dockerfile`
- Modify: `sw4p/README.md`
- Modify: CI/local scripts that reference `sw4p-backend/contracts`

- [ ] **Step 1: Verify ZapNative gate before moving**

```bash
rg -n 'ZapNative deletion gate: CLEAR|ZapNative deletion gate: BLOCKED' docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md
```

Expected: gate has explicit status. If blocked, carry `ZapNative.sol` only in a quarantined legacy folder named in the audit; do not silently delete it.

- [ ] **Step 2: Move contracts with history**

```bash
git mv sw4p/sw4p-backend/contracts sw4p/contracts
```

- [ ] **Step 3: Update references**

```bash
rg -n 'sw4p-backend/contracts|contracts/contracts|../contracts|./contracts' sw4p -g '!target' -g '!node_modules'
```

Expected: every reference is either updated or intentionally still points to the new `sw4p/contracts` path.

- [ ] **Step 4: Run moved contract tests**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/contracts"
npm test
```

Expected: Hardhat tests pass from the new location.

- [ ] **Step 5: Commit layout reorg**

```bash
git add sw4p
git commit -m "chore(sw4p): move contracts to canonical frontier layout"
```

---

## Phase 7: WS7 Validation Loop

### Task 7.1: Simulate canonical flows against fork/local state

**Files:**
- Modify: `sw4p/localnet/tests/run-all.sh`
- Modify: `sw4p/localnet/tests/test-bridge.sh`
- Modify: `sw4p/localnet/mock-services/src/circle.ts`
- Modify: `sw4p/localnet/mock-services/src/allbridge.ts`
- Modify: `sw4p/testnet/tests/run-all.sh`

- [ ] **Step 1: Add day-one flow coverage**

Coverage must include EVM->Solana CCTP V2, Solana->EVM CCTP V2, EVM->Tron Allbridge, explicit unsupported-route failure, P-Token active/fallback modes, and recovery states.

- [ ] **Step 2: Run localnet suite**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
./localnet/tests/run-all.sh
```

Expected: localnet suite passes or each pre-existing blocker is recorded with exact command output.

- [ ] **Step 3: Commit validation harness**

```bash
git add sw4p/localnet sw4p/testnet
git commit -m "test(sw4p): cover frontier canonical day-one flows"
```

### Task 7.2: Testnet cutover validation

**Files:**
- Modify: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`
- Modify: `sw4p/testnet/tests/`

- [ ] **Step 1: Deploy or attach to devnet/testnet artifacts**

Use addresses produced by Tasks 1.1-2.3. Record Solana program ID, EVM testnet contract addresses, and registry checksums in the audit file.

- [ ] **Step 2: Run testnet suite**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
./testnet/tests/run-all.sh
```

Expected: testnet suite passes across CCTP routes and frontend/watcher migration. If credentials/funds are unavailable, record exact missing env/funds rather than claiming pass.

- [ ] **Step 3: Record cutover validation**

Add this statement only after the testnet command passes:

```markdown
**Cutover validation:** PASS. Frontend and watcher operate against the canonical Solana program on testnet/devnet; V4-derived EVM contract deploy and CCTP V2 flow validated on the named testnets. Anchor retirement and V3 retirement may proceed only at their M6 gates.
```

- [ ] **Step 4: Commit validation evidence**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md sw4p/testnet/tests
git commit -m "test(sw4p): record frontier testnet cutover validation"
```

---

## Phase 8: WS8 Audit Prep and Remediation

### Task 8.1: Prepare external audit package

**Files:**
- Create: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-audit-package.md`
- Read: all files changed in Phases 1-7

- [ ] **Step 1: Produce audit package index**

```markdown
# sw4p Frontier Engine Audit Package

## Scope

- Canonical Solana program: `sw4p/programs/sw4p-native/`
- Canonical EVM contract: `sw4p/contracts/contracts/ZapAndBridgeV4.sol`
- Registry: `sw4p/contracts/registry/`
- Backend state-machine and rail lifecycle: named files and commit SHAs.

## Security Controls

| Control | Solana evidence | EVM evidence | Tests |
|---|---|---|---|
| Pause |  |  |  |
| Timelock |  |  |  |
| Limits |  |  |  |
| Admin authority |  |  |  |
| Fee take |  |  |  |
| 3-phase atomicity |  |  |  |
```

- [ ] **Step 2: Run pre-audit verification suite**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/programs/sw4p-native" && cargo test
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend" && cargo test
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/contracts" && npm test
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" && ./localnet/tests/run-all.sh
```

Expected: all suites pass or exact blockers are recorded before audit handoff.

- [ ] **Step 3: Commit audit package**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-audit-package.md
git commit -m "docs(superpowers): prepare frontier engine audit package"
```

---

## Phase 9: WS9 Mainnet Promotion and Sunset Gates

### Task 9.1: Mainnet promotion runbook

**Files:**
- Create: `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-mainnet-promotion.md`
- Modify: deploy scripts/config files used by final promotion

- [ ] **Step 1: Write promotion preflight**

The runbook must include these hard gates:

```markdown
## Hard Gates

- WS0 live-state audit complete.
- P-Token target-cluster mode recorded.
- ZapNative gate resolved.
- Canonical Solana program testnet cutover validated.
- Canonical EVM contract deployed and validated on all six EVM testnets.
- Full localnet and testnet validation pass.
- Fresh final-candidate rerun on Solana devnet and the full testnet suite passes after all audit remediations and before any mainnet transaction is prepared.
- External audit has no open high/critical findings.
- Mainnet deploy keys/admin/multisig addresses recorded.
```

- [ ] **Step 2: Record rollback and freeze rules**

The runbook must state that V3, CCTP V1 decode, and Anchor program remain available until their specific post-promotion gates are satisfied.

- [ ] **Step 3: Commit promotion runbook**

```bash
git add docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-mainnet-promotion.md
git commit -m "docs(superpowers): add frontier engine mainnet promotion runbook"
```

### Task 9.2: Execute post-promotion sunset in safe order

**Files:**
- Modify/delete only after gates pass:
- `sw4p/contracts/contracts/ZapNative.sol`
- `sw4p/contracts/contracts/ZapAndBridge.sol`
- CCTP V1 decode paths in `sw4p/sw4p-backend/src/cctp_*`
- Anchor runtime/config references found by grep

- [ ] **Step 1: Verify mainnet canonical deploys**

```bash
test -n "$ETHEREUM_V4_ADDRESS" && test -n "$ETHEREUM_RPC_URL"
test -n "$BASE_V4_ADDRESS" && test -n "$BASE_RPC_URL"
test -n "$ARBITRUM_V4_ADDRESS" && test -n "$ARBITRUM_RPC_URL"
test -n "$OPTIMISM_V4_ADDRESS" && test -n "$OPTIMISM_RPC_URL"
test -n "$AVALANCHE_V4_ADDRESS" && test -n "$AVALANCHE_RPC_URL"
test -n "$POLYGON_V4_ADDRESS" && test -n "$POLYGON_RPC_URL"
test -n "$CANONICAL_SOLANA_PROGRAM_ID"

cast code "$ETHEREUM_V4_ADDRESS" --rpc-url "$ETHEREUM_RPC_URL" | wc -c
cast code "$BASE_V4_ADDRESS" --rpc-url "$BASE_RPC_URL" | wc -c
cast code "$ARBITRUM_V4_ADDRESS" --rpc-url "$ARBITRUM_RPC_URL" | wc -c
cast code "$OPTIMISM_V4_ADDRESS" --rpc-url "$OPTIMISM_RPC_URL" | wc -c
cast code "$AVALANCHE_V4_ADDRESS" --rpc-url "$AVALANCHE_RPC_URL" | wc -c
cast code "$POLYGON_V4_ADDRESS" --rpc-url "$POLYGON_RPC_URL" | wc -c
solana program show "$CANONICAL_SOLANA_PROGRAM_ID" --url https://api.mainnet-beta.solana.com
```

Expected: all EVM bytecode checks non-empty and Solana canonical program exists.

- [ ] **Step 2: Retire V3 only after Ethereum V4 cutover**

Remove V3 runtime routing only after Ethereum inbound path is proven on V4. Keep historical artifacts if required for audit, but remove active deploy/runtime paths.

- [ ] **Step 3: Drop CCTP V1 only after drain window**

Verify no new V1 transfers can start and existing V1 transfers have completed or been refunded before deleting V1 decode paths.

- [ ] **Step 4: Retire Anchor program only after testnet-validated cutover and mainnet stability**

The Anchor program retirement is a mainnet sunset step, not a M1 consumer-migration step. Record the exact retirement action and authority used.

- [ ] **Step 5: Run final grep gates**

```bash
rg -n 'ZapNative|ZapAndBridge.sol|CCTP V1|MessageTransmitter V1|555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|SW4P_PROGRAM_ID' sw4p -g '!target' -g '!node_modules' -g '!artifacts'
```

Expected: only historical audit/docs references remain.

- [ ] **Step 6: Commit sunset completion**

```bash
git add sw4p docs/superpowers/audits
git commit -m "chore(sw4p): complete frontier engine post-promotion sunset"
```

---

## Final Verification

Run these commands before claiming Approach A implementation complete:

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/programs/sw4p-native"
cargo test

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/contracts"
npm test

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npm test -- --run
npx playwright test e2e/swap-flow.spec.ts e2e/bridge-status.spec.ts

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
./localnet/tests/run-all.sh
./testnet/deploy-solana-devnet.sh
./testnet/tests/run-all.sh

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
rg -n 'Gateway|ERC-7683 runtime|ZapNative deletion gate: BLOCKED|TO[D]O|T[D]D' docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-*.md docs/superpowers/plans/2026-05-15-sw4p-frontier-engine-approach-a.md docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-*.md
```

Expected:

- All unit, contract, frontend, localnet, and testnet suites pass.
- `Gateway` appears only as Approach B / deferred language.
- ERC-7683 runtime language appears only as Approach C / deferred language.
- No unresolved `ZapNative deletion gate: BLOCKED` remains before deletion is claimed complete.
- No placeholder markers remain in plan/audit/spec docs.

## Execution Handoff

Plan complete when this file is saved and the spec suite verifies. Execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh worker per phase or per task, review each diff before moving to the next gate.
2. **Inline Execution** — execute this plan in the current session with explicit checkpoints after WS0, WS1+WS2, WS3+WS4, WS7, and WS9.
