# sw4p Devnet-Frontier W0 Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the W0 foundation for the sw4p devnet-frontier execution cycle: per-sub-repo worktrees on dated staging branches, evidence bundle skeleton at parent root, six-row Live Dependency Matrix with real probe responses, AWS/Cloudflare landing cutover for `sw4p.io`, real Circle gas-sponsor probe outcome on Solana devnet, and a real Base Sepolia ↔ Solana Devnet CCTP V2 baseline round-trip. All evidence is real-chain or real-service per the cycle's ZERO-MOCKS constraint.

**Architecture:** Two git worktrees (one per sub-repo) check out a new `staging/devnet-frontier-2026-05-16` branch. Six probe categories populate a Live Dependency Matrix at `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md`. AWS landing deploy + Cloudflare DNS happens through real-action authorization gates. Circle gas sponsorship is probed against real Solana devnet; outcome branches the rest of the cycle on Kora retirement candidacy. Baseline CCTP round-trip via existing sw4p protocol binaries captures the v0 evidence reference.

**Tech Stack:** Git worktrees; bash; curl; `cast` (Foundry); `dig`; `solana feature status`; `solana confirm`; Hardhat dry-run scripts (existing `deploy_testnet.cjs`); existing sw4p protocol binaries (`test_cctp_mint`, `simulate_cctp_burn`, watcher); Cloudflare API; `kubectl` (AWS landing).

**Spec reference:** `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` (Section 4, W0).

---

## Source Artifacts

| Artifact | Role |
|---|---|
| `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` | Cycle spec; W0 acceptance criteria. |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | Frontier Engine design source of truth. |
| `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md` | Live-state audit; baseline truths for testnet/devnet. |
| `sw4p-kit/PLANNING_LOCAL.md` | Source SOW. |

## External References (checked at plan-time)

| Topic | Source |
|---|---|
| Circle Gas Station semantics | `https://developers.circle.com/wallets/gas-station` |
| Circle Solana CCTP programs | `https://developers.circle.com/cctp/references/solana-programs` |
| Uniswap Universal Router deploy addresses | `https://github.com/Uniswap/universal-router/tree/main/deploy-addresses` |
| Allbridge Core REST API | `https://docs-core.allbridge.io/sdk/allbridge-core-rest-api` |
| Circle CCTP V2 | `https://developers.circle.com/cctp` |

## File Structure Map

| Area | Paths | Responsibility |
|---|---|---|
| Parent gitignore | `/.gitignore` | Track `.worktrees/` exclusion. |
| Worktrees | `.worktrees/sw4p-devnet-frontier-2026-05-16/`, `.worktrees/sw4p-kit-devnet-frontier-2026-05-16/` | Isolated per-sub-repo checkouts on the dated staging branch. |
| Evidence bundle | `DEVNET_FRONTIER_EVIDENCE_2026-05-16/` | Cycle-wide evidence directory at parent root. |
| W0 evidence | `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/` | Live dependency matrix, acceptance, prs, commands, handoff. |
| sw4p staging | `<sw4p worktree>/` on `staging/devnet-frontier-2026-05-16` | All sw4p W0 changes commit here. |
| sw4p-kit staging | `<sw4p-kit worktree>/` on `staging/devnet-frontier-2026-05-16` | All sw4p-kit W0 changes commit here. |

## Execution Rules

- All real-action gates (DNS, AWS deploy, funded testnet tx, sponsored Solana tx) **STOP and request explicit user authorization** before executing. Plan steps mark these gates explicitly.
- Every probe writes its raw response into the evidence directory.
- No mocks anywhere in W0 evidence. Live dependency probes hit real public endpoints.
- Commit after every task that produces persistent artifacts. Parent-root commits are local-only (parent has no remote).
- No `--author` overrides, no `Co-Authored-By:` trailers, no AI attributions, no em dashes anywhere.

---

## Phase 1: Worktree + branch + evidence skeleton

### Task 1.1: Add `.worktrees/` to parent `.gitignore`

**Files:**
- Modify: `/.gitignore` (parent root)

- [ ] **Step 1: Inspect current parent `.gitignore`**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
cat .gitignore | tail -20
```

Expected: existing entries are visible; no `.worktrees/` entry.

- [ ] **Step 2: Append `.worktrees/` exclusion**

Edit `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.gitignore`. Append:

```
# Per-sub-repo worktrees created by execution cycles
.worktrees/
```

- [ ] **Step 3: Verify gitignore takes effect**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git check-ignore -v .worktrees/test
```

Expected: prints the matching `.gitignore` line.

- [ ] **Step 4: Commit gitignore change (parent, local-only)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add .gitignore
git -c commit.gpgsign=false commit -m "chore(parent): gitignore .worktrees/ for execution-cycle isolation"
```

Expected: commit lands; parent stays on its current branch.

---

### Task 1.2: Create sw4p worktree on dated staging branch

**Files:**
- Create: `.worktrees/sw4p-devnet-frontier-2026-05-16/` (parent root)
- Create branch: `staging/devnet-frontier-2026-05-16` in `Render-Network-OS/sw4p-pro`

- [ ] **Step 1: Confirm `master` is the intended base in sw4p**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git fetch origin master
git log origin/master -1 --oneline
```

Expected: latest commit on `origin/master` visible (no error).

- [ ] **Step 2: Create worktree on new staging branch from `master`**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git worktree add \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16" \
  -b staging/devnet-frontier-2026-05-16 \
  origin/master
```

Expected: "Preparing worktree (new branch 'staging/devnet-frontier-2026-05-16')" followed by HEAD set to the master commit.

- [ ] **Step 3: Verify worktree state**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git status
git branch --show-current
git rev-parse HEAD
```

Expected: clean working tree; branch `staging/devnet-frontier-2026-05-16`; HEAD matches `origin/master`.

- [ ] **Step 4: Push the new staging branch to origin**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git push -u origin staging/devnet-frontier-2026-05-16
```

Expected: new branch created on `git@github.com:Render-Network-OS/sw4p-pro.git`.

---

### Task 1.3: Create sw4p-kit worktree on dated staging branch

**Files:**
- Create: `.worktrees/sw4p-kit-devnet-frontier-2026-05-16/` (parent root)
- Create branch: `staging/devnet-frontier-2026-05-16` in `Render-Network-OS/sw4p-kit`

- [ ] **Step 1: Confirm `main` is the intended base in sw4p-kit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git fetch origin main
git log origin/main -1 --oneline
```

Expected: latest commit on `origin/main` visible.

- [ ] **Step 2: Create worktree on new staging branch from `main`**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git worktree add \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16" \
  -b staging/devnet-frontier-2026-05-16 \
  origin/main
```

Expected: worktree created; HEAD at `origin/main`.

- [ ] **Step 3: Verify worktree state**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16"
git status
git branch --show-current
git rev-parse HEAD
```

Expected: clean; branch `staging/devnet-frontier-2026-05-16`; HEAD matches `origin/main`.

- [ ] **Step 4: Push the new staging branch to origin**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16"
git push -u origin staging/devnet-frontier-2026-05-16
```

Expected: new branch on `git@github.com:Render-Network-OS/sw4p-kit.git`.

---

### Task 1.4: Verify worktree health across both sub-repos

**Files:**
- Read: parent + both sub-repos

- [ ] **Step 1: List worktrees per sub-repo**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git worktree list
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git worktree list
```

Expected: each sub-repo lists the new worktree path; both worktrees marked as the dated staging branch.

- [ ] **Step 2: Confirm worktree heads match remote staging branches**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git rev-parse --short HEAD
git rev-parse --short @{u}

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16"
git rev-parse --short HEAD
git rev-parse --short @{u}
```

Expected: `HEAD` and upstream match per worktree.

---

### Task 1.5: Create evidence bundle skeleton at parent root

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/README.md`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W2-rail-consolidation/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W3-atomicity/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W4-kit-completion/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W5-distribution/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W6-intent-contracts/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W7-intent-ux-final/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W8-final-phases/`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/operational/.gitkeep`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/functional/.gitkeep`
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/visual/.gitkeep`

- [ ] **Step 1: Create directory tree**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
mkdir -p \
  DEVNET_FRONTIER_EVIDENCE_2026-05-16/{operational,functional,visual} \
  DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/{W0-setup,W1-canonical-evm,W2-rail-consolidation,W3-atomicity,W4-kit-completion,W5-distribution,W6-intent-contracts,W7-intent-ux-final,W8-final-phases}

touch \
  DEVNET_FRONTIER_EVIDENCE_2026-05-16/operational/.gitkeep \
  DEVNET_FRONTIER_EVIDENCE_2026-05-16/functional/.gitkeep \
  DEVNET_FRONTIER_EVIDENCE_2026-05-16/visual/.gitkeep
```

Expected: tree created; `.gitkeep` files allow empty directories to be tracked.

- [ ] **Step 2: Write the bundle README**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/README.md`:

```markdown
# sw4p Devnet-Frontier Execution Evidence (2026-05-16 cycle)

This directory captures real-chain, real-service evidence for every wave of the
sw4p devnet-frontier execution cycle. Every acceptance gate cites either a real
on-chain tx hash with a public explorer URL, or a real external-service response
capture. Mocks and synthetic fixtures are not cited here.

## Structure

- `waves/W{N}-<title>/`: per-wave evidence (acceptance, prs, commands, handoff).
- `operational/`: deploy logs, infra changes, secrets-management traces.
- `functional/`: real-chain tx hashes per acceptance gate.
- `visual/`: Playwright captures of UX changes.

## Wave status table

| Wave | Title | Status | Evidence link |
|---|---|---|---|
| W0 | Setup, Live Deps, Landing/AWS/Cloudflare, Baseline | pending | `waves/W0-setup/` |
| W1 | Canonical EVM (3-tier coverage) | not started | `waves/W1-canonical-evm/` |
| W2 | Rail consolidation + Allbridge live-route discovery | not started | `waves/W2-rail-consolidation/` |
| W3 | 3-phase atomicity | not started | `waves/W3-atomicity/` |
| W4 | Kit completion + Cloudflare Worker | not started | `waves/W4-kit-completion/` |
| W5 | Distribution | not started | `waves/W5-distribution/` |
| W6 | Intent contracts (E1 to E5) | not started | `waves/W6-intent-contracts/` |
| W7 | Engine last-resort + intent-first kit (E6 to E9) | not started | `waves/W7-intent-ux-final/` |
| W8 | Final phases WS5 to WS9 + audit prep + mainnet runbook docs | not started | `waves/W8-final-phases/` |

## Spec reference

`docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`
```

- [ ] **Step 3: Commit the skeleton to parent (local-only)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/
git -c commit.gpgsign=false commit -m "evidence(cycle): scaffold devnet-frontier 2026-05-16 evidence bundle"
```

Expected: parent commit with the new directory tree.

---

### Task 1.6: Verify env files present in worktrees

**Files:**
- Read: sw4p worktree `.env.testnet`, `.env.keys`, `.env.circle-sandbox.local`
- Read: sw4p-kit worktree `.env`, `.env.example`

- [ ] **Step 1: List env files in sw4p worktree**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
ls -la .env.testnet .env.keys .env.circle-sandbox.local 2>&1
```

Expected: all three files present. If any are missing in the worktree but present in the original checkout, copy them from the original sw4p directory into the worktree root.

- [ ] **Step 2: List env files in sw4p-kit worktree**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16"
ls -la .env .env.example 2>&1
```

Expected: both present. Copy from original sw4p-kit checkout if missing.

- [ ] **Step 3: Verify required env vars are populated (no values shown)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
for var in SOLANA_RELAYER_PRIVATE_KEY CIRCLE_SCP_API_KEY CIRCLE_SCP_ENTITY_SECRET IRIS_BASE_URL_TESTNET BACKEND_SIGNING_KEY; do
  if grep -q "^${var}=" .env.testnet .env.keys .env.circle-sandbox.local 2>/dev/null; then
    echo "OK ${var}"
  else
    echo "MISSING ${var}"
  fi
done
```

Expected: every var marked `OK`. If `MISSING` for any, STOP and escalate to user before proceeding.

---

## Phase 2: Live Dependency Matrix (W0.a)

### Task 2.1: Circle CCTP V2 testnet endpoint probes

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-cctp-v2.md`

- [ ] **Step 1: Read the canonical CCTP V2 testnet domain map from the protocol code**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
grep -n "TokenMessengerV2\|MessageTransmitterV2\|DOMAIN_" sw4p-backend/src/cctp_burn.rs | head -40
```

Expected: emits the protocol's canonical domain mapping for Ethereum/Base/Arbitrum/Optimism/Avalanche/Polygon/Solana testnet.

- [ ] **Step 2: Curl Circle Iris sandbox to verify it's live**

```bash
curl -sS -i "https://iris-api-sandbox.circle.com/v2/messages/0?transactionHash=0x0000000000000000000000000000000000000000000000000000000000000000" \
  | head -20 | tee /tmp/iris-sandbox-probe.txt
```

Expected: HTTP response from `iris-api-sandbox.circle.com` (likely 404 for the fake tx hash but proves the endpoint is live). Capture the headers + first lines of body.

- [ ] **Step 3: Verify each testnet TokenMessenger V2 + MessageTransmitter V2 bytecode**

For each chain (Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Avalanche Fuji, Polygon Amoy), use the canonical Circle addresses from `https://developers.circle.com/cctp/evm-smart-contracts`. Run a probe per chain. Example for Base Sepolia:

```bash
cast code 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA --rpc-url https://sepolia.base.org | wc -c
cast code 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 --rpc-url https://sepolia.base.org | wc -c
```

Expected: both byte counts > 3 (real deployed bytecode). Capture all chain results.

- [ ] **Step 4: Verify Solana CCTP V2 program IDs on devnet**

```bash
solana program show CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe --url https://api.devnet.solana.com
solana program show CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC --url https://api.devnet.solana.com
```

Expected: both program accounts exist on devnet with non-zero data length.

- [ ] **Step 5: Write the probe evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-cctp-v2.md` containing the captured output from steps 2 to 4 with commands and timestamps.

- [ ] **Step 6: Commit the probe evidence (parent local-only)**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-cctp-v2.md
git -c commit.gpgsign=false commit -m "evidence(W0.a): Circle CCTP V2 testnet endpoint probes"
```

---

### Task 2.2: Uniswap Universal Router deploy-addresses inventory

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md`

- [ ] **Step 1: Fetch the official Uniswap deploy-addresses directory listing**

```bash
curl -sS "https://api.github.com/repos/Uniswap/universal-router/contents/deploy-addresses" \
  | tee /tmp/uniswap-deploy-addresses-listing.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(sorted([e['name'] for e in d if e['name'].endswith('.json')])))"
```

Expected: list of every per-chain `<network>.json` file in the official Uniswap repo. Capture both the raw JSON and the file-name list.

- [ ] **Step 2: Verify each W1 candidate testnet's presence or absence**

For each of `sepolia.json`, `base-sepolia.json`, `arbitrum-sepolia.json`, `op-sepolia.json`, `avalanche-fuji.json`, `polygon-amoy.json`: check the file list emitted in step 1.

Capture:
- File name found → "Tier 1 candidate (router + CCTP overlap)"
- File name absent → "Tier 2 (CCTP-only, NOT canonical V4.1 acceptance per spec)"

- [ ] **Step 3: For each present file, fetch the Universal Router + Permit2 address**

Example for Base Sepolia (if `base-sepolia.json` is present):

```bash
curl -sS "https://raw.githubusercontent.com/Uniswap/universal-router/main/deploy-addresses/base-sepolia.json" \
  | tee "/tmp/uniswap-base-sepolia.json"
```

Expected: JSON with `UniversalRouter` and `Permit2` keys. Capture per-chain.

- [ ] **Step 4: Write the inventory evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md` with a chain table:

```markdown
| Chain | Universal Router | Permit2 | W1 Tier (per spec) |
|---|---|---|---|
| Sepolia | <addr or "absent"> | <addr or "absent"> | Tier 1 if both present |
| Base Sepolia | ... | ... | ... |
| Arbitrum Sepolia | ... | ... | ... |
| Optimism Sepolia | ... | ... | ... |
| Avalanche Fuji | ... | ... | ... |
| Polygon Amoy | ... | ... | ... |
```

Plus the source commit SHA of the Uniswap deploy-addresses directory at probe time (captured from step 1's JSON `sha` field).

- [ ] **Step 5: Commit the inventory evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/uniswap-deploy-addresses.md
git -c commit.gpgsign=false commit -m "evidence(W0.a): Uniswap Universal Router deploy-addresses inventory per W1 candidate testnet"
```

---

### Task 2.3: Allbridge Core REST API discovery

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md`

- [ ] **Step 1: Read the Allbridge Core API docs**

Open `https://docs-core.allbridge.io/sdk/allbridge-core-rest-api` and confirm the production endpoint (`https://core.api.allbridgecoreapi.net`). Note any testnet-specific endpoint documented.

- [ ] **Step 2: Probe the production token-info endpoint**

```bash
curl -sS "https://core.api.allbridgecoreapi.net/token-info" \
  | tee /tmp/allbridge-token-info.json \
  | python3 -m json.tool | head -40
```

Expected: real JSON with `chains` map. Capture every supported chain.

- [ ] **Step 3: Identify whether any documented testnet endpoint exists**

Search the docs and the API response for any `testnet`, `staging`, `devnet`, or `sandbox` indicator. If a testnet endpoint is documented (for example a sandbox URL), probe it the same way.

- [ ] **Step 4: Enumerate every chain pair supported by Allbridge**

From the captured JSON, extract the list of supported chains. For each chain, list the supported tokens (USDT/USDC) and bridging routes.

- [ ] **Step 5: Determine W2 Phase 2 path**

Per spec W2 Phase 2:
- If a public testnet corridor exists with USDT routes between two of Allbridge's supported chains: W2 Path A (real testnet execution).
- If no public testnet corridor exists: W2 Path B (escalate at W2 start, do not proceed silently).

Record the path determination in the evidence doc; do NOT execute W2 in this task (W2 has its own plan).

- [ ] **Step 6: Write the discovery evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md` containing the production JSON capture, any testnet endpoint findings, the chain-pair table, and the W2 Phase 2 path determination.

- [ ] **Step 7: Commit the discovery evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/allbridge-discovery.md
git -c commit.gpgsign=false commit -m "evidence(W0.a): Allbridge Core REST API discovery + W2 Phase 2 path determination"
```

---

### Task 2.4: Cloudflare DNS state probes

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/cloudflare-dns.md`

- [ ] **Step 1: Probe current DNS state for each domain in scope**

```bash
for host in sw4p.io www.sw4p.io api.sw4p.io mcp.sw4p.io app.sw4p.io console.sw4p.io 555.sw4p.io; do
  echo "=== ${host} ==="
  dig +short "${host}"
  dig +short "${host}" CNAME
  dig +short -t MX "${host}"
  dig +short "${host}" NS
done 2>&1 | tee /tmp/sw4p-dns-state.txt
```

Expected: per-host A / CNAME / MX / NS records. Capture all output.

- [ ] **Step 2: Probe TLS certificate state for the public hosts**

```bash
for host in sw4p.io api.sw4p.io mcp.sw4p.io; do
  echo "=== ${host} ==="
  echo "" | openssl s_client -servername "${host}" -connect "${host}:443" 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates 2>/dev/null \
    || echo "(no cert / host unreachable)"
done 2>&1 | tee /tmp/sw4p-tls-state.txt
```

Expected: certificate subject, issuer, validity dates per reachable host.

- [ ] **Step 3: Determine `mcp.sw4p.io` current state**

If DNS resolves: capture the target. Likely either NXDOMAIN (subdomain not yet created; W4 will create it) or pointing to a placeholder. Either is fine; record as-is.

- [ ] **Step 4: Write the DNS probe evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/cloudflare-dns.md` with the captured DNS and TLS state per host, plus a "W0.b cutover target" note for `sw4p.io` if its current A/CNAME does not point to the AWS ingress (per `b0e95fd feat(ops): route sw4p landing hosts to aws ingress`).

- [ ] **Step 5: Commit the probe evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/cloudflare-dns.md
git -c commit.gpgsign=false commit -m "evidence(W0.a): Cloudflare DNS + TLS state probes per host"
```

---

### Task 2.5: Compile Live Dependency Matrix v1

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md`

- [ ] **Step 1: Aggregate findings from tasks 2.1 to 2.4 into the matrix**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md`:

```markdown
# Live Dependency Matrix (W0.a)

**Generated:** <UTC timestamp at completion of task 2.5>
**Spec reference:** `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md` (Section 4, W0.a)

## Rows

| Dependency | Source of truth | Probe | Evidence file | Status |
|---|---|---|---|---|
| Circle CCTP V2 testnet endpoints | `developers.circle.com/cctp` | byte-count + Iris sandbox HTTP | `probes/circle-cctp-v2.md` | <fill> |
| Uniswap Universal Router testnet addresses | `Uniswap/universal-router/deploy-addresses/` | per-chain JSON presence | `probes/uniswap-deploy-addresses.md` | <fill> |
| Allbridge Core live routes | `core.api.allbridgecoreapi.net` | `GET /token-info` | `probes/allbridge-discovery.md` | <fill, plus W2 Phase 2 path> |
| Circle Solana gas sponsor | Circle Gas Station + CCTP semantics | filled by W0.c | `probes/circle-gas-sponsor.md` (pending Phase 4) | pending |
| Cloudflare zone for sw4p.io / mcp.sw4p.io / api.sw4p.io | Cloudflare account | `dig` + `openssl s_client` | `probes/cloudflare-dns.md` | <fill> |
| AWS landing target | existing commit `b0e95fd` | filled by W0.b | `probes/aws-landing.md` (pending Phase 3) | pending |

## W1 tier determination (preliminary)

Based on Uniswap deploy-addresses inventory crossed with Circle CCTP V2 testnet presence:

- Tier 1 (canonical V4.1 acceptance, real testnet deploy): <fill chain list>
- Tier 2 (real CCTP-only proof, NOT canonical V4.1 acceptance): <fill chain list>
- Tier 3 (mainnet-fork compat only): <fill chain list>

## W2 Phase 2 path (preliminary)

<Path A | Path B1 | Path B2> per task 2.3 step 5.
```

Fill in every `<fill>` from the evidence captured in tasks 2.1 to 2.4.

- [ ] **Step 2: Commit the matrix v1**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md
git -c commit.gpgsign=false commit -m "evidence(W0.a): Live Dependency Matrix v1 (Circle gas sponsor + AWS rows pending Phases 3 + 4)"
```

---

## Phase 3: Landing / AWS / Cloudflare cutover (W0.b)

### Task 3.1: Verify existing AWS landing deployment health

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md`

- [ ] **Step 1: Locate the existing AWS landing config in sw4p worktree**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git log --oneline | grep -i "aws\|eks\|ingress" | head -10
git show --stat b0e95fd 2>&1 | head -40
```

Expected: shows the AWS landing ingress commit; identifies the relevant files (likely under `sw4p-landing/` or `ops/`).

- [ ] **Step 2: Inspect the kubernetes / AWS configuration**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
find . -name "ingress*.yaml" -not -path "*/node_modules/*" -not -path "*/target/*" 2>/dev/null | head -10
find . -name "deployment*.yaml" -not -path "*/node_modules/*" -not -path "*/target/*" 2>/dev/null | head -10
```

Expected: paths to Kubernetes manifests. Read them to confirm intended host (`sw4p.io`).

- [ ] **Step 3: Verify the AWS deployment is live**

If `kubectl` is configured with the right context (likely `staging-eks` or similar), run:

```bash
kubectl get ingress -A 2>&1 | grep -i sw4p
kubectl get pods -A 2>&1 | grep -i landing
```

If `kubectl` is not configured locally, STOP and escalate: AWS deploy verification is a real-action gate requiring cluster access.

- [ ] **Step 4: Curl the AWS deployment directly (bypassing DNS)**

If the AWS ingress has a known load-balancer hostname (from `kubectl get ingress`), curl it directly with a Host header for `sw4p.io`:

```bash
curl -sS -i -H "Host: sw4p.io" "http://<aws-elb-hostname>/" | head -30
```

Expected: HTTP 200 from the AWS deployment. Capture the response body hash (for comparison after DNS swap).

- [ ] **Step 5: Write the AWS landing probe evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md` with the kubernetes inventory, the load-balancer hostname, and the direct-curl HTTP 200 capture.

- [ ] **Step 6: Commit the probe evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md
git -c commit.gpgsign=false commit -m "evidence(W0.b): AWS landing deployment health probe pre-DNS-cutover"
```

---

### Task 3.2: Real-action authorization checkpoint for DNS swap

**Files:** none (procedural gate)

- [ ] **Step 1: STOP and request explicit user authorization**

Present the user with a concise authorization request containing:

```
W0.b DNS swap authorization request.

Action: change `sw4p.io` (and `www.sw4p.io` if applicable) Cloudflare DNS
        from <current target captured in Task 2.4> to <AWS load-balancer
        hostname captured in Task 3.1>.

Reversible? Yes (DNS can be reverted).
TTL impact: Cloudflare's standard 1-300s if proxied; up to 5 minutes propagation.
Pre-flight verification: AWS endpoint returns HTTP 200 for Host: sw4p.io
                        (captured in Task 3.1 Step 4).
Post-flight verification: curl https://sw4p.io after swap; expect same body hash.

Authorize the DNS swap? (yes/no)
```

Wait for explicit `yes`. If `no` or no reply, halt Phase 3 and proceed to Phase 4 (the cycle does not depend on landing cutover for subsequent waves; landing cutover is parallel evidence).

If `yes`, proceed to Task 3.3.

---

### Task 3.3: Execute Cloudflare DNS swap (only after authorization)

**Files:**
- Modify: Cloudflare DNS record for `sw4p.io` (external service)
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/dns-swap-trace.md`

- [ ] **Step 1: Identify the Cloudflare zone + record ID for `sw4p.io`**

```bash
# Assumes CLOUDFLARE_API_TOKEN is in environment, with Zone:Edit + DNS:Edit scopes.
CF_TOKEN="$(grep '^CLOUDFLARE_API_TOKEN=' /Volumes/OWC\ Envoy\ Pro\ FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/.env.testnet 2>/dev/null | cut -d= -f2-)"
if [ -z "${CF_TOKEN}" ]; then
  echo "STOP: CLOUDFLARE_API_TOKEN not present in env. Escalate to user."
  exit 1
fi

curl -sS -H "Authorization: Bearer ${CF_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=sw4p.io" \
  | python3 -m json.tool > /tmp/cf-zone.json

ZONE_ID="$(python3 -c "import json; print(json.load(open('/tmp/cf-zone.json'))['result'][0]['id'])")"
echo "Zone ID: ${ZONE_ID}"

curl -sS -H "Authorization: Bearer ${CF_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=sw4p.io" \
  | python3 -m json.tool > /tmp/cf-record.json

cat /tmp/cf-record.json | head -40
```

Expected: zone ID + the record details (current type, content, proxied flag, TTL).

- [ ] **Step 2: PATCH the DNS record to the AWS ELB hostname**

Replace `<RECORD_ID>` and `<NEW_TARGET>` from the captures above:

```bash
RECORD_ID="$(python3 -c "import json; print(json.load(open('/tmp/cf-record.json'))['result'][0]['id'])")"
NEW_TARGET="<AWS ELB hostname captured in Task 3.1>"

curl -sS -X PATCH \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"sw4p.io\",\"content\":\"${NEW_TARGET}\",\"proxied\":true}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  | python3 -m json.tool > /tmp/cf-patch-response.json

cat /tmp/cf-patch-response.json
```

Expected: `success: true` in the response. Capture full response.

- [ ] **Step 3: Write the swap trace**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/dns-swap-trace.md`:

```markdown
# sw4p.io Cloudflare DNS swap trace

**Authorized by user:** <timestamp from Task 3.2>
**Pre-swap state:** <captured from Task 2.4>
**Post-swap state (captured from Cloudflare API response):** <fill>
**Cloudflare API success flag:** <true | false>
**TTL:** <captured>
**Propagation start:** <timestamp>
```

- [ ] **Step 4: Commit the swap trace**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/dns-swap-trace.md
git -c commit.gpgsign=false commit -m "evidence(W0.b): sw4p.io Cloudflare DNS swap trace post-authorization"
```

---

### Task 3.4: Post-swap verification

**Files:**
- Update: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md`

- [ ] **Step 1: Wait for propagation, then re-probe**

```bash
for i in 1 2 3 4 5; do
  echo "=== probe ${i} (delay 30s) ==="
  sleep 30
  dig +short sw4p.io
  curl -sS -o /tmp/sw4p-post-swap.html -w "HTTP:%{http_code} TIME:%{time_total}s\n" "https://sw4p.io/"
  shasum /tmp/sw4p-post-swap.html
done 2>&1 | tee /tmp/sw4p-post-swap-probes.txt
```

Expected: at least one probe returns HTTP 200; body shasum matches the pre-flight capture from Task 3.1 Step 4.

- [ ] **Step 2: Capture final TLS cert state**

```bash
echo "" | openssl s_client -servername sw4p.io -connect sw4p.io:443 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -fingerprint -sha256 2>/dev/null
```

Expected: valid cert chain. Capture the SHA-256 fingerprint.

- [ ] **Step 3: Append post-swap evidence to the AWS landing probe doc**

Update `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md` with the propagation probes, the post-swap HTTP capture, and the cert fingerprint.

- [ ] **Step 4: Commit the verification evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/aws-landing.md
git -c commit.gpgsign=false commit -m "evidence(W0.b): sw4p.io post-cutover verification, AWS landing serving live"
```

---

## Phase 4: Circle gas sponsor baseline (W0.c)

### Task 4.1: Research Circle Gas Station + Circle Solana CCTP semantics

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-gas-sponsor.md`

- [ ] **Step 1: Read the Circle Gas Station overview**

Open `https://developers.circle.com/wallets/gas-station`. Note:
- Which networks support Gas Station sponsorship (EVM, Solana, both?).
- What signer / payer model Gas Station expects (Circle Wallet user-controlled-wallet versus Circle Wallet developer-controlled-wallet versus an arbitrary external signer with a Circle-funded fee account).
- What API surface invokes sponsored sends (transaction estimation flow vs direct submission).

- [ ] **Step 2: Read the Circle Solana CCTP programs doc**

Open `https://developers.circle.com/cctp/references/solana-programs`. Note:
- The exact program IDs (TokenMessengerV2 + MessageTransmitterV2 on Solana).
- Whether the CCTP V2 burn instruction has a designated fee-payer slot.
- Whether the doc explicitly says Gas Station can sponsor CCTP V2 Solana transactions, or whether sponsorship is scoped to Circle Wallet transaction flows.

- [ ] **Step 3: Compare sw4p's actual Solana CCTP signer flow**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
grep -n "fee_payer\|payer\|SOLANA_RELAYER" sw4p-backend/src/cctp_burn.rs sw4p-backend/src/cctp_mint.rs sw4p-backend/src/relayer.rs | head -20
```

Expected: sw4p currently uses `SOLANA_RELAYER_PRIVATE_KEY` as the fee payer. Question to resolve in next step: can that payer slot be filled by a Circle Gas Station sponsored account, or must the entire transaction go through a Circle Wallet flow?

- [ ] **Step 4: Determine fit**

Based on steps 1 to 3, write the determination in the probe evidence:

- **Fit confirmed:** Circle Gas Station supports sponsoring an arbitrary Solana fee-payer for transactions where the actual signer is sw4p's own relayer. Proceed to Task 4.2.
- **Fit not confirmed:** Gas Station only sponsors Circle Wallet-originated transactions, which would require sw4p to switch its Solana custody model to Circle Wallets. That is a far larger change and is out of scope for W0. Mark W0.c as "deferred" per spec; Kora remains primary; skip Task 4.2 and proceed to Task 4.4.

- [ ] **Step 5: Write the research probe evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-gas-sponsor.md`. Document:
- Sources read (URLs + access timestamp).
- Gas Station signer model summary.
- sw4p Solana CCTP signer flow summary.
- Determination: fit confirmed | fit not confirmed.

- [ ] **Step 6: Commit the research evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/probes/circle-gas-sponsor.md
git -c commit.gpgsign=false commit -m "evidence(W0.c): Circle Gas Station + Solana CCTP semantics research; fit determination"
```

---

### Task 4.2: Real-action authorization for sponsored Solana devnet tx (only if Task 4.1 fit confirmed)

**Files:** none (procedural gate)

- [ ] **Step 1: STOP and request explicit user authorization**

```
W0.c Circle-sponsored Solana devnet CCTP burn authorization request.

Action: submit one real Solana devnet CCTP V2 burn transaction with Circle
        Gas Station as the effective fee payer. Source: sw4p's Solana relayer.
        Destination: Base Sepolia (devnet -> testnet round-trip).
        Amount: 0.10 USDC devnet (small, recoverable).

Reversible? The fee spend is real; the burn is reversible by the matching
            mint on the destination chain (standard CCTP V2 round-trip).
Pre-flight: Circle Gas Station configured with sponsorship for sw4p's relayer
            account (configuration captured in Task 4.1).
Acceptance: real Solana devnet tx hash where the fee-payer account is the
            Circle-sponsored address, not sw4p's relayer.

Authorize the sponsored devnet burn? (yes/no)
```

Wait for `yes`. If `no`, halt Phase 4 and record the deferral via Task 4.4.

---

### Task 4.3: Execute Circle-sponsored Solana devnet CCTP burn (only if 4.2 authorized)

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsored-baseline.md`

- [ ] **Step 1: Configure Circle Gas Station sponsorship for sw4p's relayer**

Follow the exact configuration documented in Task 4.1 (whitelist the relayer's address with Gas Station, fund the sponsorship pool, etc.). Capture every configuration call as evidence.

- [ ] **Step 2: Submit the sponsored burn via the protocol's existing path**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/sw4p-backend"
cargo run --release --bin simulate_cctp_burn -- \
  --source-chain solana-devnet \
  --destination-chain base-sepolia \
  --amount-usdc 0.10 \
  --gas-sponsor circle 2>&1 | tee /tmp/circle-sponsored-burn.log
```

(If the binary does not yet accept a `--gas-sponsor circle` flag, this signals that Task 4.1 fit was actually "not confirmed without code change". Fall back to Task 4.4.)

Expected: real Solana devnet tx hash printed in the log.

- [ ] **Step 3: Verify the fee-payer slot on-chain**

```bash
TX_HASH="<captured from Step 2>"
solana confirm -v "${TX_HASH}" --url https://api.devnet.solana.com
```

Expected: the transaction's fee payer is the Circle-sponsored account (matches the configuration from Step 1). Capture the full `solana confirm -v` output.

- [ ] **Step 4: Write the sponsored-baseline evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsored-baseline.md` with the Gas Station configuration trace, the submit log, the `solana confirm -v` output with the fee-payer slot highlighted, and a public explorer URL (`https://explorer.solana.com/tx/<hash>?cluster=devnet`).

- [ ] **Step 5: Commit the evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsored-baseline.md
git -c commit.gpgsign=false commit -m "evidence(W0.c): real Solana devnet CCTP V2 burn with Circle-sponsored fee payer"
```

---

### Task 4.4: Write deferral document (only if Task 4.1 fit not confirmed OR Task 4.2 not authorized)

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsor-deferral.md`

- [ ] **Step 1: Write the deferral document**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsor-deferral.md`:

```markdown
# W0.c Circle Gas Station deferral

**Determination date:** <UTC timestamp>
**Reason:**
<one of:>
- Circle Gas Station sponsorship semantics do not fit sw4p's CCTP signer flow.
  Gas Station scopes to Circle Wallet-originated transactions; sw4p uses an
  independent Solana relayer keypair. Switching to Circle Wallets for Solana
  is out of W0 scope.
- User did not authorize the sponsored devnet burn at Task 4.2.

**Consequence per spec Section W8.f:**
- Kora remains the Solana fee-payer.
- Kora retirement candidacy is deferred (not documented as a PR in W8).
- Dependency matrix row "Circle Solana gas sponsor" reflects this finding.

**What would unblock:**
<list concrete steps; for example "Circle releases Gas Station support for
arbitrary Solana fee-payer accounts (not just Circle Wallet flows)", or
"Project decides to migrate Solana custody to Circle Wallets".>
```

- [ ] **Step 2: Commit the deferral**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/circle-sponsor-deferral.md
git -c commit.gpgsign=false commit -m "evidence(W0.c): Circle Gas Station sponsorship deferral with unblock criteria"
```

---

### Task 4.5: Update Live Dependency Matrix Circle row

**Files:**
- Modify: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md`

- [ ] **Step 1: Update the Circle Solana gas sponsor row**

Edit the matrix row in `live-dependency-matrix.md`:

- If Task 4.3 ran: row evidence = `circle-sponsored-baseline.md`; status = "real Solana devnet tx hash captured; Circle is effective fee payer; Kora retirement candidacy enabled".
- If Task 4.4 ran: row evidence = `circle-sponsor-deferral.md`; status = "deferred; Kora remains primary".

- [ ] **Step 2: Commit the matrix update**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md
git -c commit.gpgsign=false commit -m "evidence(W0.a): update Live Dependency Matrix with Circle gas sponsor outcome"
```

---

## Phase 5: Baseline CCTP V2 round-trip (W0.d)

### Task 5.1: Real-action authorization for baseline funded testnet tx

**Files:** none (procedural gate)

- [ ] **Step 1: STOP and request explicit user authorization**

```
W0.d baseline CCTP V2 round-trip authorization request.

Action: submit two real CCTP V2 transactions via the deployed sw4p protocol:
        1. Base Sepolia -> Solana Devnet burn-mint round-trip ($1 USDC).
        2. Solana Devnet -> Base Sepolia burn-mint round-trip ($1 USDC).

Reversible? No (real testnet spend); $2 total testnet USDC at risk.
Pre-flight: sw4p-backend healthy on Railway (confirmed via /health endpoint).
            Circle Iris sandbox available (confirmed in Task 2.1).
Acceptance: 4 tx hashes captured (2 burns + 2 mints), all real testnet.

Authorize the baseline round-trip? (yes/no)
```

Wait for `yes`. If `no`, halt Phase 5; W0 still completes with W0.a, W0.b, W0.c evidence.

---

### Task 5.2: Execute Base Sepolia -> Solana Devnet leg

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/baseline-base-to-solana.md`

- [ ] **Step 1: Verify the sw4p protocol is healthy**

```bash
curl -sS -o /tmp/sw4p-health.json -w "HTTP:%{http_code}\n" \
  "https://api.sw4p.io/health" 
cat /tmp/sw4p-health.json | python3 -m json.tool
```

Expected: HTTP 200 with a JSON body indicating watcher + workers operational.

- [ ] **Step 2: Submit the transfer via the protocol's `/sdk/v1/transfer` endpoint**

```bash
SW4P_API_KEY="$(grep '^SW4P_API_KEY=' /Volumes/OWC\ Envoy\ Pro\ FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16/.env | cut -d= -f2-)"
RECIPIENT_SOLANA="<sw4p-controlled Solana devnet test address>"
SOURCE_EVM="<sw4p-controlled Base Sepolia test address>"

curl -sS -X POST \
  -H "X-API-Key: ${SW4P_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"sourceChain\": \"base-sepolia\",
    \"destinationChain\": \"solana-devnet\",
    \"amountUsdc\": \"1.00\",
    \"from\": \"${SOURCE_EVM}\",
    \"to\": \"${RECIPIENT_SOLANA}\",
    \"network\": \"testnet\"
  }" \
  "https://api.sw4p.io/sdk/v1/transfer" \
  | tee /tmp/baseline-base-to-solana-submit.json \
  | python3 -m json.tool
```

Expected: response contains `intentId`; capture it.

- [ ] **Step 3: Poll status until terminal**

```bash
INTENT_ID="<captured from Step 2>"
for i in $(seq 1 60); do
  curl -sS -H "X-API-Key: ${SW4P_API_KEY}" \
    "https://api.sw4p.io/sdk/v1/status/${INTENT_ID}" \
    | tee /tmp/baseline-base-to-solana-status.json \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('state'), d.get('sourceTxHash'), d.get('destTxHash'))"
  STATE="$(python3 -c "import json; print(json.load(open('/tmp/baseline-base-to-solana-status.json')).get('state',''))")"
  if echo "${STATE}" | grep -qE "Completed|Settled|Failed"; then
    break
  fi
  sleep 5
done
```

Expected: state reaches `Completed` (or `Failed` with clear reason). Capture both source and dest tx hashes.

- [ ] **Step 4: Verify both tx hashes on public explorers**

```bash
SRC_TX="<source tx hash from Step 3>"
DST_TX="<dest tx hash from Step 3>"

curl -sS -o /tmp/explorer-base-sepolia-src.html -w "HTTP:%{http_code}\n" \
  "https://sepolia.basescan.org/tx/${SRC_TX}"

solana confirm -v "${DST_TX}" --url https://api.devnet.solana.com \
  | tee /tmp/explorer-solana-devnet-dest.txt
```

Expected: Basescan returns 200 with the tx page; `solana confirm` shows a confirmed tx on devnet.

- [ ] **Step 5: Write the leg evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/baseline-base-to-solana.md`:

```markdown
# W0.d baseline leg 1: Base Sepolia -> Solana Devnet

**Submitted:** <UTC timestamp from Step 2>
**Intent ID:** <captured>
**Source tx hash:** <captured>
**Destination tx hash:** <captured>
**Final state:** <Completed | Failed>
**Total elapsed:** <seconds, from submit to terminal>

**Source explorer:** https://sepolia.basescan.org/tx/<src>
**Destination explorer:** https://explorer.solana.com/tx/<dst>?cluster=devnet

**Raw captures:**
- Submit response: <inline JSON>
- Final status response: <inline JSON>
- `solana confirm -v` output: <inline>
```

- [ ] **Step 6: Commit the evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/baseline-base-to-solana.md
git -c commit.gpgsign=false commit -m "evidence(W0.d): real Base Sepolia -> Solana Devnet CCTP V2 baseline round-trip"
```

---

### Task 5.3: Execute Solana Devnet -> Base Sepolia leg

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/baseline-solana-to-base.md`

- [ ] **Step 1: Submit the reverse-direction transfer**

```bash
SW4P_API_KEY="$(grep '^SW4P_API_KEY=' /Volumes/OWC\ Envoy\ Pro\ FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16/.env | cut -d= -f2-)"
RECIPIENT_EVM="<sw4p-controlled Base Sepolia test address>"
SOURCE_SOLANA="<sw4p-controlled Solana devnet test address>"

curl -sS -X POST \
  -H "X-API-Key: ${SW4P_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"sourceChain\": \"solana-devnet\",
    \"destinationChain\": \"base-sepolia\",
    \"amountUsdc\": \"1.00\",
    \"from\": \"${SOURCE_SOLANA}\",
    \"to\": \"${RECIPIENT_EVM}\",
    \"network\": \"testnet\"
  }" \
  "https://api.sw4p.io/sdk/v1/transfer" \
  | tee /tmp/baseline-solana-to-base-submit.json \
  | python3 -m json.tool
```

Expected: `intentId` returned.

- [ ] **Step 2: Poll status until terminal (same loop as Task 5.2 Step 3)**

Replicate the polling loop with the new `intentId`. Capture both source and destination tx hashes.

- [ ] **Step 3: Verify both tx hashes on public explorers (same as Task 5.2 Step 4)**

```bash
SRC_TX="<source tx hash, this leg>"
DST_TX="<dest tx hash, this leg>"

solana confirm -v "${SRC_TX}" --url https://api.devnet.solana.com
curl -sS -o /tmp/explorer-base-sepolia-dst-leg2.html -w "HTTP:%{http_code}\n" \
  "https://sepolia.basescan.org/tx/${DST_TX}"
```

Expected: both verifications succeed.

- [ ] **Step 4: Write the leg evidence**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/baseline-solana-to-base.md` mirroring the structure of `baseline-base-to-solana.md`.

- [ ] **Step 5: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/baseline-solana-to-base.md
git -c commit.gpgsign=false commit -m "evidence(W0.d): real Solana Devnet -> Base Sepolia CCTP V2 baseline round-trip"
```

---

## Phase 6: W0 evidence consolidation + handoff to W1

### Task 6.1: Write W0 acceptance.md

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/acceptance.md`

- [ ] **Step 1: Aggregate every W0 acceptance gate**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/acceptance.md`:

```markdown
# W0 Acceptance

| Gate | Evidence link | Result |
|---|---|---|
| Worktree sw4p on `staging/devnet-frontier-2026-05-16` (Task 1.2) | branch on `Render-Network-OS/sw4p-pro` | pass |
| Worktree sw4p-kit on `staging/devnet-frontier-2026-05-16` (Task 1.3) | branch on `Render-Network-OS/sw4p-kit` | pass |
| Evidence skeleton at parent root (Task 1.5) | `DEVNET_FRONTIER_EVIDENCE_2026-05-16/` | pass |
| Env files present in worktrees (Task 1.6) | local | pass |
| Live Dependency Matrix populated (Task 2.5) | `live-dependency-matrix.md` | pass |
| Circle CCTP V2 testnet probes (Task 2.1) | `probes/circle-cctp-v2.md` | pass |
| Uniswap deploy-addresses inventory (Task 2.2) | `probes/uniswap-deploy-addresses.md` | pass |
| Allbridge live-route discovery (Task 2.3) | `probes/allbridge-discovery.md` | pass; W2 path = <A | B1 | B2> |
| Cloudflare DNS state captured (Task 2.4) | `probes/cloudflare-dns.md` | pass |
| AWS landing probe (Task 3.1) | `probes/aws-landing.md` | pass |
| sw4p.io DNS swap to AWS (Tasks 3.2-3.4) | `dns-swap-trace.md` + `probes/aws-landing.md` | <pass | deferred (user did not authorize)> |
| Circle Gas Station semantics determined (Task 4.1) | `probes/circle-gas-sponsor.md` | pass |
| Circle-sponsored Solana devnet baseline (Tasks 4.2-4.3) | `circle-sponsored-baseline.md` | <pass | deferred (see deferral)> |
| Circle gas sponsor deferral document (Task 4.4) | `circle-sponsor-deferral.md` | <N/A | written> |
| Live Dependency Matrix Circle row updated (Task 4.5) | `live-dependency-matrix.md` | pass |
| Baseline Base Sepolia -> Solana Devnet (Tasks 5.1-5.2) | `baseline-base-to-solana.md` | <pass | deferred> |
| Baseline Solana Devnet -> Base Sepolia (Task 5.3) | `baseline-solana-to-base.md` | <pass | deferred> |

## Per-gate real evidence

<For every gate with `pass`, paste the relevant tx hash + public explorer URL
or service response capture.>

## ZERO-MOCKS check

No mock fixtures cited above. Every `pass` entry cites either a real tx hash
on a public explorer, a real Cloudflare API response, a real Uniswap GitHub
SHA, a real Allbridge JSON response, or a real on-chain `solana program show`
output.
```

- [ ] **Step 2: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/acceptance.md
git -c commit.gpgsign=false commit -m "evidence(W0): consolidated acceptance.md"
```

---

### Task 6.2: Write W0 prs.md

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/prs.md`

- [ ] **Step 1: Inventory every commit + PR landed in W0**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git log --oneline --since="2026-05-16" | head -30

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16"
git log origin/master..HEAD --oneline | head -30

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16"
git log origin/main..HEAD --oneline | head -30
```

- [ ] **Step 2: Write the PR + commit inventory**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/prs.md`:

```markdown
# W0 PR + commit inventory

## Parent (local-only, no remote)
<list of parent commits with hashes and subjects>

## sw4p staging branch (Render-Network-OS/sw4p-pro)
<list of commits on staging/devnet-frontier-2026-05-16 not yet on master>
PRs filed (if any): <list>

## sw4p-kit staging branch (Render-Network-OS/sw4p-kit)
<list of commits on staging/devnet-frontier-2026-05-16 not yet on main>
PRs filed (if any): <list>

## Reviewer notes
W0 is primarily evidence + setup; no protocol code changed in sw4p.
W0.b landing/AWS changes (if any) reviewed before DNS authorization.
```

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/prs.md
git -c commit.gpgsign=false commit -m "evidence(W0): PR + commit inventory"
```

---

### Task 6.3: Write W0 commands.md

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/commands.md`

- [ ] **Step 1: Aggregate the exact commands run across phases 1 to 5**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/commands.md`. Include the canonical command-line for every probe + action in W0, paste-ready for a future verifier:

```markdown
# W0 commands (paste-ready for verification)

## Phase 1 (worktree + evidence skeleton)

<exact commands from Tasks 1.1 to 1.6>

## Phase 2 (Live Dependency Matrix probes)

<exact commands from Tasks 2.1 to 2.5>

## Phase 3 (Landing / AWS / Cloudflare)

<exact commands from Tasks 3.1 to 3.4>

## Phase 4 (Circle gas sponsor)

<exact commands from Tasks 4.1 to 4.5>

## Phase 5 (Baseline CCTP round-trip)

<exact commands from Tasks 5.1 to 5.3>

## Re-verification recipe

To re-run any probe and confirm the W0 state still holds at a future point,
run the corresponding command block above in order. Probes that captured
mutable external state (DNS, Allbridge token-info, Uniswap deploy-addresses
SHA) will return different values; that drift is captured separately in
`next-wave-handoff.md`.
```

- [ ] **Step 2: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/commands.md
git -c commit.gpgsign=false commit -m "evidence(W0): paste-ready commands.md"
```

---

### Task 6.4: Write W0 next-wave-handoff.md

**Files:**
- Create: `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/next-wave-handoff.md`

- [ ] **Step 1: Identify everything W0 surfaced that W1 needs**

Specifically:
- The W1 tier roster per Task 2.2: which testnets are Tier 1 / Tier 2 / Tier 3.
- The W2 Phase 2 path per Task 2.3: A, B1, or B2.
- The Kora retirement status per Task 4.5: enabled (Circle fits) or deferred.
- The AWS / Cloudflare state per Task 3.4: cutover landed or deferred.
- Any blocker raised during W0 that W1 must resolve.

- [ ] **Step 2: Write the handoff**

Create `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/next-wave-handoff.md`:

```markdown
# W0 -> W1 handoff

## Decisions locked

| Decision | Value | Source evidence |
|---|---|---|
| W1 Tier 1 (canonical V4.1 testnet acceptance) | <chain list> | Task 2.2 |
| W1 Tier 2 (real CCTP-only proof) | <chain list> | Task 2.2 |
| W1 Tier 3 (mainnet-fork compat) | <chain list> | Task 2.2 |
| W2 Phase 2 path | <A | B1 | B2> | Task 2.3 |
| Kora retirement candidacy | <enabled | deferred> | Task 4.5 |
| sw4p.io AWS / Cloudflare state | <cutover live | deferred> | Task 3.4 |

## Blockers carried forward to W1

<list, or "none">

## Inputs to the W1 plan writer

The W1 plan can now be authored with concrete chain rosters and authoritative
Uniswap + CCTP addresses. The Optimism Sepolia router question is resolved.
The Allbridge corridor question is resolved (relevant to W2 but not W1).
The Circle gas sponsor question is resolved (relevant to W8 but cited in W1
acceptance gates for any Solana-side test transfers).
```

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/next-wave-handoff.md
git -c commit.gpgsign=false commit -m "evidence(W0): W1 handoff with tier roster, path, and carried blockers"
```

---

### Task 6.5: Self-review W0 evidence bundle

**Files:**
- Read: every file under `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/`

- [ ] **Step 1: Verify every file is committed**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git status DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/
```

Expected: no untracked or modified files in the W0 directory.

- [ ] **Step 2: Em dash scan across W0 evidence**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -rn "—\|–" DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/ 2>&1 | head -20
```

Expected: zero matches.

- [ ] **Step 3: Placeholder scan**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -rn "TBD\|TODO\|XXX\|FIXME\|<fill>\|<captured>" DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/ 2>&1 | head -20
```

Expected: zero matches.

- [ ] **Step 4: Mock-citation scan**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
grep -rnE "mock|MOCK|fake|FAKE|stub|STUB|MockNoop|mock-services" DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/ 2>&1 | head -20
```

Expected: zero matches in `acceptance.md`. If matches appear only inside `commands.md` describing an exclusion rule, that's allowed.

- [ ] **Step 5: ZERO-MOCKS attestation**

If steps 2 to 4 pass, the W0 evidence bundle is ZERO-MOCKS clean. Update `DEVNET_FRONTIER_EVIDENCE_2026-05-16/README.md` wave-status table to mark W0 = "complete".

- [ ] **Step 6: Commit final state**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add DEVNET_FRONTIER_EVIDENCE_2026-05-16/README.md
git -c commit.gpgsign=false commit -m "evidence(W0): mark W0 complete in cycle README"
```

---

### Task 6.6: Close W0 + signal handoff

**Files:** none (signaling)

- [ ] **Step 1: Summarize W0 outcome to the user**

Output a terse summary citing:
- W0 wave status: complete.
- W1 tier roster (per handoff).
- W2 Phase 2 path (per handoff).
- Kora retirement candidacy (per handoff).
- sw4p.io AWS / Cloudflare state (per handoff).
- Total commits landed in W0: <count from `commands.md` git-log captures>.
- Real-action authorizations exercised: <list>.

- [ ] **Step 2: Request approval to write the W1 plan**

Ask the user:

```
W0 complete. Ready to write the W1 plan (canonical EVM, 3-tier coverage)
informed by the W0 tier roster handoff?
```

Wait for explicit yes before invoking writing-plans for W1.

---

## Self-review (writing-plans skill checklist)

**1. Spec coverage:** Every W0 acceptance gate in the spec (Section 4, W0) maps to a Phase + Task above.
- Spec W0.a Live Dependency Matrix → Phase 2 (Tasks 2.1 to 2.5).
- Spec W0.b Landing / AWS / Cloudflare cutover → Phase 3 (Tasks 3.1 to 3.4).
- Spec W0.c Circle-sponsored Solana gas baseline → Phase 4 (Tasks 4.1 to 4.5).
- Spec W0.d Baseline CCTP V2 round-trip → Phase 5 (Tasks 5.1 to 5.3).
- Plus pre-W0.a setup (worktrees, branches, skeleton, env verification) → Phase 1.
- Plus W0 consolidation + handoff to W1 → Phase 6.

**2. Placeholder scan:** No "TBD" / "TODO" / "implement later" / "fill in details" inside step bodies. Evidence template strings (`<fill>`, `<captured>`) appear inside markdown templates that the executor fills with real probe responses, which is the intended pattern and not a plan placeholder. The plan's own self-review (Task 6.5) gates on those template strings being resolved.

**3. Type consistency:** No types defined. Branch names (`staging/devnet-frontier-2026-05-16`), worktree paths (`.worktrees/sw4p-devnet-frontier-2026-05-16/`), and evidence paths (`DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/`) are consistent across all tasks. Real-action gate language is consistent: "STOP and request explicit user authorization".

**4. Real-action gates explicitly marked:** Task 3.2 (DNS swap), Task 4.2 (Circle-sponsored Solana tx), Task 5.1 (baseline funded testnet round-trip). Three gates total in W0, matching the spec Section 2.4.

**5. ZERO-MOCKS:** Every acceptance gate in Task 6.1 cites real-chain or real-service evidence. The self-review in Task 6.5 includes an explicit mock-citation scan.

**6. Em dash discipline:** None used in this plan.
