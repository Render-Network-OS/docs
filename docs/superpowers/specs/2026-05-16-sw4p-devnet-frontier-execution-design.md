# sw4p Devnet-Frontier Execution Cycle 2026-05-16: Design Spec

**Status:** approved design, awaiting implementation plan.
**Date:** 2026-05-16.
**Cycle window:** approximately 7 to 8 weeks wall clock.
**Scope:** complete the sw4p Statement of Work at `sw4p-kit/PLANNING_LOCAL.md` and the Frontier Engine Approach-A plan at `docs/superpowers/plans/2026-05-15-sw4p-frontier-engine-approach-a.md`, ship all 9 waves to staging with real-chain evidence at every wave boundary, on devnet / testnet only. No mainnet execution in this cycle.
**Authors:** session 2026-05-16.

## 1. Goal

Ship every open deliverable in the active SOW and the Frontier Engine Approach-A plan, plus the kit slim-down completion, plus distribution, plus intent-based atomic settlement, completely on devnet / testnet, with real-chain evidence at every acceptance gate. Drive all changes through reviewed PRs into per-sub-repo staging branches. Collect operational, functional, and visual evidence into a dated bundle at the parent root.

### Non-goals (in this cycle)

- Mainnet promotion or any funded mainnet transaction (except where W2 Allbridge escalation explicitly authorizes a small one-time mainnet acceptance tx under user authorization).
- Audit material generation (per prior direction; audits remain explicitly out of scope).
- Cleaning up other teams' active branches.
- Refactors not required by the SOW or the Approach-A plan.

## 2. Hard constraints

These constraints are non-negotiable and bind every wave below.

### 2.1 Zero mocks in acceptance evidence

Every acceptance gate must produce evidence from a real chain or a real external service. Unit-test mocks may remain for type-level fixtures and regression coverage, but they cannot be cited as acceptance evidence.

**Explicit exclusion list (acceptance evidence MUST NOT cite):**
- `MockNoopMessageTransmitter` and any other CCTP / TokenMessenger / Iris mock fixture under `sw4p/sw4p-backend/contracts/contracts/mocks/`.
- Anything under `sw4p/localnet/mock-services/`.
- Any kit unit test using the in-process `SdkLike` stub. Wave-acceptance test suites must hit the real testnet protocol via the deployed `api.sw4p.io` or its testnet equivalent.
- Any contract test using a fork against synthetic state. Mainnet-fork compatibility tests use real block-pinned mainnet forks and are labeled accordingly.

**Acceptance evidence inclusion list (cite at minimum one of):**
- Real on-chain tx hash with public explorer URL.
- Real Circle Iris sandbox attestation hash with HTTP response capture.
- Real Postgres row from a real-chain-triggered state transition (with tx hash provenance).
- Real Cloudflare / npm / DNS API response with full capture.
- Real mainnet-fork CI run with block-pinned fork URL plus real upstream state hash (only for Tier 3 EVM compatibility evidence, explicitly labeled).

### 2.2 Per-sub-repo worktrees, dated staging branches

Worktree paths created in W0 day 1:
- `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-devnet-frontier-2026-05-16/`
- `/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.worktrees/sw4p-kit-devnet-frontier-2026-05-16/`

Branches per sub-repo:
- Staging (long-lived): `staging/devnet-frontier-2026-05-16`. All reviewed PRs merge here.
- Feature: `feat/<wave>-<slice>` per PR (for example `feat/w1-evm-canonical-pause-tier1`).

Parent root (`555/`) has no remote. All parent-side commits (gitlink updates, evidence bundles) are local-only by design.

### 2.3 PR mechanics

- Every change lands via PR against the sub-repo's `staging/devnet-frontier-2026-05-16`.
- Review before every merge is HARD. Self-review of own work happens in chat using `feature-dev:code-reviewer`. No `gh pr merge` without an explicit review pass.
- Conventional commits: `feat(<area>):`, `fix(<area>):`, `test(<area>):`, `docs(<area>):`, `chore(<area>):`, `evidence(<area>):`.
- Squash-merge by default unless the commit chain itself is the evidence (rare).
- Author identity is `rndrntwrk <dev@rndrntwrk.com>`. No AI co-authors. No `Co-Authored-By:` trailers anywhere.
- No em dashes anywhere in user-facing text or commit messages.

### 2.4 Real-action authorization gates

Any irreversible, costly, or externally visible action requires explicit user authorization per action. Authorization is never blanket.

Gates that require explicit authorization before execution:
- Cloudflare DNS edits and Worker deploys.
- AWS deployment pushes.
- npm publishes (`@sw4p/kit`, `@sw4p/sdk`).
- MCP Registry submissions.
- Smithery submissions.
- Any funded testnet deploy that consumes real working capital from the deployer wallet.
- Any one-time mainnet tx authorized as an Allbridge escalation under W2 Phase 2 Path B1.

### 2.5 No em dashes

Per project memory. Use commas, colons, semicolons, periods, or parentheses instead.

## 3. Architecture overview

### 3.1 Two work surfaces plus parent root

- `sw4p` (origin `Render-Network-OS/sw4p-pro`, default `master`): protocol engine, contracts, programs, landing, frontend, console, storefront, kora.
- `sw4p-kit` (origin `Render-Network-OS/sw4p-kit`, default `main`): kit thin-client, MCP server, future Cloudflare Worker, init CLI, Eliza plugin.
- Parent `555/`: no remote, coordination and evidence only.

### 3.2 Wave inventory (9 waves)

| Wave | Title | Target days |
|---|---|---|
| W0 | Setup, Live Dependency Matrix, Landing/AWS/Cloudflare, Baseline | 2 |
| W1 | Canonical EVM, 3-tier coverage | 10 |
| W2 | Rail consolidation, Allbridge live-route discovery | 5 to 7 |
| W3 | 3-phase atomicity | 7 |
| W4 | Kit completion plus Cloudflare Worker gateway | 8 |
| W5 | Distribution | 7 |
| W6 | Intent-based settlement contracts (E1 to E5) | 10 |
| W7 | Engine last-resort plus intent-first kit UX (E6 to E9) | 10 |
| W8 | Final phases WS5 to WS9, audit prep, mainnet runbook docs | 5 |

Cross-wave is sequential. Within-wave parallelism happens via subagents on truly independent slices.

### 3.3 Evidence bundle

Location: parent-root directory `DEVNET_FRONTIER_EVIDENCE_2026-05-16/`.

```
DEVNET_FRONTIER_EVIDENCE_2026-05-16/
  README.md
  waves/
    W0-setup/
    W1-canonical-evm/
    W2-rail-consolidation/
    W3-atomicity/
    W4-kit-completion/
    W5-distribution/
    W6-intent-contracts/
    W7-intent-ux-final/
    W8-final-phases/
  operational/
  functional/
  visual/
```

Per-wave bundle (every wave produces all four):
1. `acceptance.md`: every acceptance gate with real tx hash plus public explorer URL or other ZERO-MOCKS-compliant evidence.
2. `prs.md`: PRs landed in the wave with reviewer notes.
3. `commands.md`: exact commands run plus output captures (paste-ready for verification).
4. `next-wave-handoff.md`: anything that surfaced that affects the next wave.

Visual evidence: Playwright MCP captures of landing, console, agent UX changes per wave, stored as PNGs under `visual/`.

## 4. Wave-by-wave plan

### W0: Setup, Live Dependency Matrix, Landing/AWS/Cloudflare, Baseline

#### W0.a: Live Dependency Matrix

Committed to `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W0-setup/live-dependency-matrix.md`. Every row backed by a source URL plus a real probe command plus a captured response.

| Dependency | Source of truth | Probe | Evidence required |
|---|---|---|---|
| Circle CCTP V2 testnet endpoints | `developers.circle.com` | curl Iris sandbox plus `cast code` per TokenMessenger / MessageTransmitter testnet contract | byte count plus Iris HTTP 200 |
| Uniswap Universal Router testnet addresses | `Uniswap/universal-router/deploy-addresses/` GitHub directory (official; do not assume) | clone repo, list per-chain `<network>.json` presence | per-chain "present / absent" with file path plus commit SHA |
| Allbridge Core live route corridors | Allbridge REST API discovery (no static assumption) | `GET https://core.api.allbridgecoreapi.net/token-info` plus any documented test endpoint | captured JSON listing every supported chain pair |
| Circle Solana gas sponsor | Circle Gas Station / Wallets sponsorship semantics | follow W0.c protocol below | real Solana devnet tx hash where Circle is the effective fee payer for the exact production path, OR a documented finding that the sponsorship path does not fit sw4p's CCTP signer flow |
| Cloudflare zone for `sw4p.io`, `mcp.sw4p.io`, `api.sw4p.io` | Cloudflare account | `dig +short` from local | DNS resolution plus cert chain |
| AWS deploy target for landing | existing commit `b0e95fd feat(ops): route sw4p landing hosts to aws ingress` | `kubectl get ingress`, curl deployed URL | live HTTP 200 from AWS, cert chain, served HTML hash |

Every cell becomes a real-action verification step before any wave-1 code lands.

#### W0.b: Landing / AWS / Cloudflare cutover

Deploy `sw4p.io` to AWS via the existing rail (`b0e95fd`, `e12cd41`, `ed174c1`), wire Cloudflare DNS plus SSL, verify live. Real-action authorization gate before any DNS swap.

#### W0.c: Circle-sponsored Solana gas baseline

Probe Circle Gas Station / Wallets sponsorship semantics first. Acceptance requires a real Solana devnet CCTP transaction where Circle is the effective fee payer for the exact production path. If Circle sponsorship only applies through Circle Wallet transaction flows that do not fit sw4p's CCTP signer flow, Kora remains fallback and retirement is deferred.

Outcome consequences:
- Sponsorship fits: Circle becomes the canonical gas-abstraction primary path; Kora demoted to fallback; W8 documents the Kora sunset PR (not executed in this cycle).
- Sponsorship does not fit: Kora remains the Solana fee-payer; W8 records the deferral; the dependency matrix row reflects the finding.

#### W0.d: Baseline CCTP V2 round-trip

One real Base Sepolia ↔ Solana Devnet round-trip via the existing protocol. Captures real tx hashes for both legs as the v0 evidence reference.

#### W0 real-action authorization gates

Cloudflare DNS edits; AWS deploy push; any funded-wallet tx for the W0.c gas-sponsor probe and the W0.d baseline.

### W1: Canonical EVM, 3-tier coverage

Frontier Engine Phase 2 (WS2). Adds the safety-control surface modeled in `sw4p-native` to V4-derived canonical EVM contracts. Limits canonical-V4.1 deploy acceptance to chains with real official Circle CCTP V2 plus official Uniswap Universal Router testnet overlap. Honest labeling of evidence everywhere.

#### W1 tier roster (binding)

- **Tier 1: canonical V4.1 acceptance, real testnet deploy.** Sepolia, Base Sepolia, Arbitrum Sepolia, and Optimism Sepolia if and only if `op-sepolia.json` is confirmed in `Uniswap/universal-router/deploy-addresses/` at wave start. Confirmation step is W1 day 1. If absent, Optimism Sepolia drops to Tier 3.

- **Tier 2: real CCTP-only protocol proof, NOT canonical V4.1 acceptance.** Avalanche Fuji, Polygon Amoy. Real CCTP V2 burn-mint round-trip via Circle's deployed TokenMessengerV2 + MessageTransmitterV2 testnet contracts directly. Canonical V4.1 cannot deploy here: `ZapAndBridgeV41.sol:103` requires nonzero `universalRouter` and `ZapAndBridgeV41.sol:104` requires nonzero `permit2`; `deploy_testnet.cjs:127` correctly refuses chains without official CCTP + Universal Router overlap. We do not modify canonical V4.1 to satisfy missing testnet infra. Tier 2 evidence is labeled "real CCTP-only acceptance, not canonical V4.1 acceptance" in `acceptance.md`.

- **Tier 3: mainnet-fork compatibility.** V4.1 plus safety controls run against block-pinned Avalanche mainnet and Polygon mainnet forks (real Universal Router plus Permit2 plus CCTP V2 mainnet state). Labeled "mainnet-fork compatibility evidence", not "testnet acceptance", not "mainnet deploy".

#### W1 slices (parallel where independent)

- **W1.a:** Add canonical EVM safety controls to V4.1 (pause, per-period movement limit, timelocked config changes, governed admin / multisig handoff, fee-take guardrails) per the EVM Safety-Control Scope table in `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`.
- **W1.b:** Per-chain registry plus Universal Router lookup hardening.
- **W1.c:** Confirm or refute Optimism Sepolia `op-sepolia.json` in `Uniswap/universal-router/deploy-addresses/` at wave start. Update tier assignment accordingly.
- **W1.d:** Deploy canonical V4.1 plus safety controls to Tier 1 testnets. Real funded deploys.
- **W1.e:** Tier 2 acceptance: real CCTP V2 burn-mint round-trips via TokenMessengerV2 + MessageTransmitterV2 on Fuji and Amoy. No V4.1 deploy on these chains.
- **W1.f:** Tier 3 acceptance: block-pinned mainnet-fork CI run for V4.1 on Avalanche mainnet and Polygon mainnet, real Universal Router + Permit2 + CCTP V2 state.

#### W1 acceptance evidence

- Tier 1: real safety-control state changes (pause / unpause, timelock propose / execute, daily-limit hit), real CCTP V2 + Universal Router zap-and-bridge tx, real `receiveMessage` settle on destination.
- Tier 2: real CCTP V2 burn-mint round-trip tx hashes; safety-control state changes happen elsewhere (Tier 1 chains) where the canonical contract exists.
- Tier 3: mainnet-fork CI run committed with block-pinned fork URL plus real upstream state hash, explicitly labeled.

#### W1 mock exclusion

`MockNoopMessageTransmitter` and other CCTP mock fixtures stay in the Hardhat suite for unit / regression coverage. They are not cited in `acceptance.md`. The Tier 1 acceptance uses real Circle Iris sandbox attestation plus real `receiveMessage` on real testnet.

#### W1 real-action authorization gates

Every funded Tier 1 deploy. Every funded Tier 2 CCTP tx. No authorization needed for Tier 3 (read-only forks).

### W2: Rail consolidation plus Allbridge live-route discovery

Frontier Engine Phase 3 (WS3). Phase-1 discovery first, then phase-2 branching.

#### W2 Phase 1: Live-route discovery

Mandatory. No corridor assumed. Real probe against Allbridge Core REST API:

```
curl https://core.api.allbridgecoreapi.net/token-info
```

Plus any documented Allbridge test endpoint (find via `docs-core.allbridge.io`). Output: a real chain-pair table captured into evidence. Identifies whether any pair is testnet-addressable.

#### W2 Phase 2: Branching decision tree

Based on Phase 1 finding:

- **Path A: public Allbridge testnet corridor exists.** Execute real testnet USDT corridor, capture tx, ship rail consolidation.
- **Path B: no public Allbridge testnet corridor.** Escalate to user with two options:
  - **B1:** small-amount mainnet authorization (approximately $5 USDT, one-time, real Allbridge mainnet tx as acceptance evidence). Real-action authorization gate.
  - **B2:** defer Allbridge first-class wiring to a follow-up cycle. Ship the rail-consolidation code (BridgeProtocol enum cleanup, explicit routing observability) without the live Allbridge tx. Document the deferral.

No silent fallback to mocks. Escalation message follows Section 6.2.

#### W2 other slices

- **W2.b:** BridgeProtocol enum cleanup plus explicit routing observability.
- **W2.c:** Localnet allbridge blocker root-cause and fix (`d54da0c6 docs(sw4p): record localnet allbridge blocker`). Localnet mock-services may be repaired for dev convenience but the fix is not cited in acceptance.

#### W2 acceptance evidence

Path A: real Allbridge testnet USDT tx hash with public explorer URL. Path B1: real Allbridge mainnet tx hash (one-time, authorized). Path B2: deferral document plus the consolidated rail-protocol PRs landing without the live tx.

### W3: 3-phase atomicity

Frontier Engine Phase 4 (WS4).

#### W3 slices

- **W3.a:** Formalize 3-phase rule in `sw4p-backend/src/state_machine.rs` (proposed / prepared / committed with rollback on any failure).
- **W3.b:** Apply 3-phase rule to watcher (`sw4p-backend/src/watcher/`), relay (`sw4p-backend/src/relay.rs`, `sw4p-backend/src/relay_handler.rs`), and Allbridge lifecycle (`sw4p-backend/src/allbridge.rs`).
- **W3.c:** Restart-mid-state test on real Postgres. Kill the backend during a real testnet transfer's attestation poll, verify recovery via `CheckpointData` JSONB. Real chain, real interruption, real recovery.

#### W3 acceptance evidence

Real testnet transfer tx hash, log capture showing the kill plus restart timestamps, Postgres row dump of the `CheckpointData` JSONB before and after recovery, final destination tx hash.

#### W3 real-action authorization gates

None beyond W0 baseline (testnet wallet for the funded transfer).

### W4: Kit completion plus Cloudflare Worker gateway

SOW Track B items B7 through B13.

#### W4 slices (parallel where independent)

- **W4.a:** Streamable HTTP MCP transport, new binary `sw4p-mcp-http` in `sw4p-kit/src/mcp/http.ts`.
- **W4.b:** Cloudflare Worker gateway at `mcp.sw4p.io`. Stateless, CORS, X-API-Key forwarding, no secrets. Deploy via wrangler. Real-action authorization gate before deploy.
- **W4.c:** Real-protocol test suite for `sw4p.balance` plus `sw4p.send`. NOT mocked SDK. Hits the real testnet protocol via the deployed `api.sw4p.io` or its testnet equivalent. Captured output goes into evidence.
- **W4.d:** Strict zod input plus output validation on agent surface tools.
- **W4.e:** Backward-compat verification: the hackathon demo invocation shapes still work against the slim kit.

#### W4 acceptance evidence

- Cloudflare Worker live at `mcp.sw4p.io`, real `tools/call` request against real testnet protocol, full response capture.
- Playwright MCP screenshot of an agent (Claude Code or Cursor) successfully invoking `sw4p.balance` via the Worker.
- Real-protocol test suite green log capture.

#### W4 mock exclusion

Mocked SDK paths in `sw4p-kit/src/__tests__/` may remain for unit coverage but are not cited in `acceptance.md`.

#### W4 real-action authorization gates

Cloudflare Worker deploy. DNS record for `mcp.sw4p.io`.

### W5: Distribution

SOW Track C items C1 through C8.

#### W5 slices

- **W5.a:** `npx @sw4p/kit init` CLI in `sw4p-kit/src/cli/init.ts`. Detects Claude Code / Cursor / Continue / Goose / Codex / Cline / Aider / ElizaOS config locations and writes the correct config. Prompts for `SW4P_API_KEY` interactively. Opens browser to `console.sw4p.io` if the user needs to mint a key.
- **W5.b:** `npx @sw4p/kit doctor` CLI in `sw4p-kit/src/cli/doctor.ts`. Verifies API key valid, MCP server registered, network reachable, kit version vs SDK version.
- **W5.c:** `@sw4p/eliza-plugin` repo. Question 3 of Section 7 below decides whether this is a separate repo or a `sw4p-kit/packages/eliza/` subdirectory.
- **W5.d:** npm publish `@sw4p/kit@1.0.0` and `@sw4p/sdk@1.0.0`. Both require explicit user authorization. Both publish to the `@sw4p` scope (user-owned per W0 day 1 verification).
- **W5.e:** MCP Registry submission. User authorization required.
- **W5.f:** Smithery submission. User authorization required.
- **W5.g:** Launch video script plus 90-second cut.

#### W5 acceptance evidence

- Clean-machine test: fresh repo or temp directory, run `npx @sw4p/kit init`, configure Claude Code, run `sw4p.balance` against real testnet, capture full output plus Playwright screen recording.
- npm registry pages live for both packages (URL capture).
- MCP Registry plus Smithery listings live (URL capture).
- Eliza plugin install path validated end-to-end.

#### W5 real-action authorization gates

npm publish (both packages). MCP Registry submission. Smithery submission. DNS for any docs subdomain added in C7.

### W6: Intent-based settlement contracts (E1 to E5)

SOW Track E first half. All real testnet / devnet deploys; no mocks in acceptance.

#### W6 slices (parallel where independent)

- **W6.a:** `OriginSettler.sol` on Base Sepolia. Real deploy. Implements `open` plus `openFor` per ERC-7683. Integrates with Circle WaaS for source-side execution. Emits standardized intent event.
- **W6.b:** `DestinationSettler.sol` on every Tier 1 EVM testnet from W1. Real deploys. Solver calls `fill()` with the intent plus proof; releases native USDC to recipient.
- **W6.c:** Solana intent program at `sw4p/programs/sw4p-intent/`. Real devnet deploy. Mirrors the EVM intent semantics; integrates with the existing native settlement program for Solana destinations.
- **W6.d:** Solver registry, persisted to Postgres. Closes SOW Track A item A4 and Track E item E4 in one shot. Uses the existing migration `20260324000000_add_auction_tables.sql`.
- **W6.e:** Reference solver binary `sw4p_solver` at `sw4p/sw4p-backend/src/bin/sw4p_solver.rs`. Real solver running long-lived against the real testnet protocol. CCTP V2 used internally for reimbursement (invisible to the integrator).

#### W6 acceptance evidence

- Real intent submitted on Base Sepolia, real solver fills on a Tier 1 destination, real reimbursement via CCTP V2 underneath. Three tx hashes per round-trip: origin intent, destination fill, reimbursement.
- Solver registry row dump from Postgres before plus after a real registration.
- Reference solver process log capture from a long-running real test.

#### W6 real-action authorization gates

Every funded testnet deploy (E1, E2 per chain, E3). Solver working-capital authorization for the reference solver running on real testnet.

### W7: Engine last-resort plus intent-first kit UX (E6 to E9)

SOW Track E second half.

#### W7 slices

- **W7.a:** Engine fills the last-resort solver role when no external solver appears within SLA. Real evidence: kill the reference solver from W6.e, watch the engine fill.
- **W7.b:** Kit `sw4p.send` becomes intent-first. Returns the destination tx hash in seconds, not the source burn tx hash. Same MCP surface, faster UX.
- **W7.c:** Public copy updates per SOW Track E item E9. Most of this landed in Track D already; reconcile remaining language.
- **W7.d:** Visual evidence: Playwright capture of the intent-first UX from agent invocation to destination tx.

#### W7 acceptance evidence

- Real $1 testnet intent submitted, real engine-as-last-resort fill (with the reference solver killed), real reimbursement.
- Real kit invocation timing: seconds-to-destination versus seconds-to-source-burn comparison.
- Playwright capture of an agent calling `sw4p.send` and receiving a destination-tx response.

#### W7 mock exclusion

Same as W1 plus W4. Restated in `acceptance.md` for this wave.

#### W7 real-action authorization gates

Funded testnet intent tx (under W5-funded wallet). No new authorization beyond W6.

### W8: Final phases WS5 to WS9, audit prep, mainnet runbook docs

Frontier Engine Phases 5 through 9, plus a Kora retirement decision conditional on W0.c.

#### W8 slices

- **W8.a:** WS5 on-chain / off-chain boundary confirmation document plus assertions.
- **W8.b:** WS6 physical layout reorg. Only after ZapNative gate is unblocked (per the live-state audit: backend deploy subcommand plus frontend ABI constants must migrate first).
- **W8.c:** WS7 full validation rerun (fork sims plus testnet cutover). Aggregates evidence from all prior waves.
- **W8.d:** WS8 audit-prep package. Compiles all wave evidence into an audit-ready bundle (the *package*; per direction, audit *content generation* remains out of scope).
- **W8.e:** WS9 mainnet promotion runbook. Documented only; no mainnet execution.
- **W8.f:** Kora retirement candidacy decision (conditional on W0.c outcome):
  - If W0.c sponsorship fits sw4p's CCTP signer flow: W8 documents the Kora sunset PR (sw4p-kora Railway service decommission ordering). PR drafted, not executed.
  - If W0.c sponsorship does not fit: W8 records the deferral, Kora stays in the architecture, dependency matrix row reflects the finding.

#### W8 acceptance evidence

- WS5 boundary doc committed.
- WS6 reorg PRs landed (if gate unblocked) or deferral document (if blocked).
- WS7 full-validation rerun log capture.
- WS8 audit-prep bundle committed.
- WS9 mainnet runbook committed.
- W8.f Kora outcome document committed.

## 5. Subagent orchestration

### 5.1 Spawning model

- Foreground subagents: when the output drives my next step (for example `feature-dev:code-explorer` to map a module before editing).
- Background subagents: when slices within a wave are truly independent (for example W1.a, W1.b, W1.c can run concurrently).
- One slice = one background subagent + foreground review on completion.

### 5.2 Agent types this cycle uses

- `feature-dev:code-explorer`: map existing code before changes.
- `feature-dev:code-architect`: design layered changes.
- `feature-dev:code-reviewer`: review my own PRs before merge (HARD per memory).
- `general-purpose`: for fetches, multi-step research, browser captures.
- `Explore`: for lookups.

### 5.3 Per-subagent brief contents

Every subagent brief contains:
1. Self-contained context (no reliance on parent conversation).
2. File paths plus line numbers.
3. Acceptance criteria with ZERO-MOCKS constraint cited.
4. Evidence path to write outputs into.
5. Branch name to commit to.
6. Real-action authorization reminders if any apply.

## 6. Risk model and escalation

### 6.1 Known risks at design time

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | Allbridge testnet corridor absent (W2 Phase 2 Path B) | High | Path B escalation tree. B1 small mainnet authorization or B2 deferral. No mock fallback. |
| R2 | Circle Gas Station sponsorship does not fit sw4p's CCTP signer flow (W0.c) | Medium | W8.f deferral path. Kora stays. |
| R3 | Optimism Sepolia `op-sepolia.json` absent from Uniswap deploy-addresses (W1.c) | Medium | Drops to Tier 3. |
| R4 | Cloudflare Worker rate limits or DDoS targeting `mcp.sw4p.io` (W4.b) | Low to Medium | Cloudflare WAF, per-API-key rate limit, Worker holds no secrets. |
| R5 | npm scope `@sw4p` authentication issues at publish time (W5.d) | Low | W0 day 1 verifies token plus 2FA. |
| R6 | Reference solver working-capital float exhausted during W6.e or W7.a (real testnet) | Low | Top-up authorization gate; reference solver runs against testnet (cheap). |
| R7 | Frontier Engine Phase 6 reorg blocked by uncleaned ZapNative paths (W8.b) | Medium | Audit identified the path; W8.b includes the migration before reorg or records deferral. |
| R8 | A wave overruns its target days | Medium | Cycle pauses cleanly at any wave boundary; staging branch state is always shippable. |

### 6.2 Escalation rules

Escalate to the user when:
- An external blocker requires authorization (real-action gate, cross-team coordination, working capital).
- A real testnet probe contradicts a SOW assumption (for example W2 Phase 1 result, W0.c outcome).
- A spec ambiguity affects an acceptance criterion.

Do not escalate for:
- Code questions answerable from the repo.
- Test failures that can be investigated locally.
- Format or convention choices within established norms.

Escalation message format: terse, names the blocker, what was tried, what is needed from the user, and a default action if no reply within the session.

## 7. Open questions resolved at W0 start

These are resolved by W0 day 1 probes, not by asking up front:

1. `mcp.sw4p.io` DNS current state. Probe via `dig`.
2. Hackathon-judge worker mock: keep alive or sunset on C4 publish? Resolved by reading the existing worker code plus deciding under user input if needed.
3. Eliza plugin: separate `Render-Network-OS/sw4p-eliza-plugin` repo or `sw4p-kit/packages/eliza/` subdirectory? Resolved by inspection plus user input if needed.
4. MPC adoption: deferred per SOW recommendation; confirm at W0 day 1.
5. Circle Gas Station applicability to sw4p's CCTP signer flow: resolved by W0.c probe.
6. AWS landing target production-readiness: resolved by W0.b verification.
7. Allbridge testnet corridor existence: resolved by W2 Phase 1 discovery.
8. Optimism Sepolia Universal Router availability: resolved by W1.c at wave start.

## 8. Acceptance for the cycle

The cycle is complete when:
1. All 9 waves have committed evidence bundles in `DEVNET_FRONTIER_EVIDENCE_2026-05-16/`.
2. Both sub-repo `staging/devnet-frontier-2026-05-16` branches have all wave PRs reviewed and merged.
3. Parent root has the consolidated cycle README plus wave evidence subdirectories.
4. No mocks in acceptance, every gate cites real-chain or real-service evidence.
5. All real-action authorizations were obtained per Section 2.4.
6. No mainnet executions occurred (except a one-time Allbridge mainnet acceptance tx under W2 Path B1 if and only if user-authorized).
7. Open questions from Section 7 are answered in evidence.

## 9. Diagrams index

| Diagram | Section | Format | Purpose |
|---|---|---|---|
| Wave inventory | 3.2 | Markdown table | 9-wave cycle overview |
| Evidence bundle layout | 3.3 | Tree | Per-wave evidence structure |
| W1 tier roster | W1 | Markdown | EVM testnet coverage policy |
| W2 branching decision tree | W2 Phase 2 | Markdown | Allbridge escalation logic |

## 10. References

- `sw4p-kit/PLANNING_LOCAL.md`: source SOW.
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md`: design source of truth for the engine.
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md`: WS0 to WS9 SOW.
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md`: 113 requirements.
- `docs/superpowers/plans/2026-05-15-sw4p-frontier-engine-approach-a.md`: Approach-A implementation plan.
- `docs/superpowers/audits/2026-05-15-sw4p-frontier-engine-live-state.md`: live-state audit.
- `RNDRNTWRK_CANONICAL_TRUTH.md`: canonical truth manuscript.
- Circle CCTP: `https://www.circle.com/cross-chain-transfer-protocol`.
- Circle Gas Station: `https://developers.circle.com/wallets/gas-station`.
- Circle Solana CCTP programs: `https://developers.circle.com/cctp/references/solana-programs`.
- Uniswap Universal Router deploy addresses: `https://github.com/Uniswap/universal-router/tree/main/deploy-addresses`.
- Allbridge Core REST API: `https://docs-core.allbridge.io/sdk/allbridge-core-rest-api`.
- ERC-7683: `https://eips.ethereum.org/EIPS/eip-7683`.
