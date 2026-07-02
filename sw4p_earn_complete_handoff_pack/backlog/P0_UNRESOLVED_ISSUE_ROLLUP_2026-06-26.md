# SW4P Earn P0 Unresolved Issue Rollup
Generated: 2026-06-26
Source: sw4p_earn_complete_handoff_pack/backlog/P0_BACKLOG.csv + P0_ISSUE_CARDS.md + P0_SYNTHESIS_STATUS_2026-06-26.md

## Objective
Convert unresolved P0 backlog into explicit execution tickets with owner, dependency, and evidence closure conditions tied to launch gates.

## 1) P0-005 — Add MM/POL wallet exclusion classes
- Ticket title: `P0-005 Backend: Add MM/POL wallet exclusion classes`  
- Owner: Backend  
- Severity: Critical  
- Dependencies: P0-004  
- Workstream: Anti-wash  
- Labels: `p0-anti-wash,p0-mm`  
- Acceptance: MM route excluded from rewards  
- Acceptance evidence:  
  - Route classification fixture proving MM and POL wallets map to excluded source classes
  - Integration test (synthetic wash + MM/POL route) showing excluded reward share
  - Dashboard/API evidence showing excluded volume increases and MM/POL exclusion reflected
- Launch gate mapping: `G5 Anti-wash` and `G6 Reward epoch`
- PR target: new ticket under sw4p-earn `main` (orchestrator handoff branch)

## 2) P0-006 — Add ProtocolOwnedLiquidityVault tests and pause path
- Ticket title: `P0-006 Solidity: ProtocolOwnedLiquidityVault tests + pause path`  
- Owner: Solidity  
- Severity: High  
- Dependencies: None  
- Workstream: Contracts  
- Labels: `p0-contracts`  
- Acceptance: Foundry coverage report; pause test green  
- Acceptance evidence:  
  - Foundry pass + coverage package includes full POL vault matrix
  - Pause path test proving non-treasury funding/withdraw behaviors under pause
  - Repro report linking policy on pause/withdraw semantics
- Launch gate mapping: `G3 Contract tests`
- PR target: `chore`/`fix` branch on sw4p-earn (contract workspace)

## 3) P0-007 — Add LPVault withdraw/share inflation/multi-depositor tests
- Ticket title: `P0-007 Solidity: LPVault withdraw/share inflation and multi-depositor tests`  
- Owner: Solidity  
- Severity: High  
- Dependencies: None  
- Workstream: Contracts  
- Labels: `p0-contracts`  
- Acceptance: Withdraw and inflation tests green  
- Acceptance evidence:  
  - Foundry suites for multi-depositor share math and inflation resistance
  - Passing scenario covering adapter/withdraw lifecycle and pause-relevant boundaries
  - Coverage + failing case regression retained in CI artifact
- Launch gate mapping: `G3 Contract tests`

## 4) P0-008 — Resolve adapter topology
- Ticket title: `P0-008 Solidity: Resolve adapter topology across vault reward paths`  
- Owner: Solidity  
- Severity: High  
- Dependencies: P0-006, P0-007  
- Workstream: Contracts  
- Labels: `p0-contracts`  
- Acceptance: Deployment topology documented and tested  
- Acceptance evidence:  
  - Finalized architecture decision (one adapter per vault or multi-vault adapter safe refactor)
  - Deployment graph and test proving routing to correct adapter(s)
  - Regression check that no funds become inaccessible or misrouted under pause/withdraw
- Launch gate mapping: `G3 Contract tests`, `G4 Service tests`

## 5) P0-009 — Centralize policy manifest and bucket registry
- Ticket title: `P0-009 Backend: Centralize policy manifest and bucket registry`  
- Owner: Backend/Tokenomics  
- Severity: High  
- Dependencies: None  
- Workstream: Policy  
- Labels: `p0-policy`  
- Acceptance: Policy snapshot endpoint returns hash  
- Acceptance evidence:  
  - Single policy module implemented
  - JSON policy manifest and bucket registry in repo
  - `/v1/policy` (or equivalent) hash endpoint returns golden hash
  - Golden hash versioning documented in changelog
- Launch gate mapping: `G6 Reward epoch`, `G10 Audit handoff`

## 6) P0-010 — Decide LP/stake 70/30 split
- Ticket title: `P0-010 Founder/Tokenomics: Explicitly decide LP/stake split policy`  
- Owner: Founder/Tokenomics  
- Severity: High  
- Dependencies: P0-009  
- Workstream: Policy  
- Labels: `needs-founder-decision`  
- Acceptance: Dashboard shows split; epoch snapshot includes split  
- Acceptance evidence:  
  - Signed policy decision note with timestamp
  - Epoch snapshot schema update reflecting chosen split (constant-per-epoch or fixed)
  - Dashboard proof showing explicit split visibility
- Launch gate mapping: `G6 Reward epoch`, `G7 APY truth`, `G8 Dashboard proof`

## 7) P0-011 — Resolve DEX LP fee APY treatment
- Ticket title: `P0-011 Founder/Tokenomics: Resolve DEX LP fee APY treatment (avoid double count)`  
- Owner: Founder/Tokenomics  
- Severity: High  
- Dependencies: P0-009  
- Workstream: Policy  
- Labels: `needs-founder-decision`  
- Acceptance: No double count; no hidden haircut  
- Acceptance evidence:  
  - Policy memo that splits direct LP fees vs protocol-routed APR explicitly
  - API contract proof returning sourceTag-specific APR components
  - Dashboard screenshot proving Real FEE split components and no hidden 20% implicit subtraction
- Launch gate mapping: `G7 APY truth`, `G8 Dashboard proof`

## 8) P0-012 — Fee ledger/outbox integration test
- Ticket title: `P0-012 Backend: Fee ledger + outbox integration test harness`  
- Owner: Backend  
- Severity: High  
- Dependencies: P0-009  
- Workstream: Services  
- Labels: `p0-services`  
- Acceptance: No duplicate dispatch; trace available  
- Acceptance evidence:  
  - Real PgFeeLedgerStore + outbox integration test + fake on-chain harness
  - Idempotency proof (replay/disconnected retries)
  - Trace IDs linking route_event → fee_event → fee_outbox → dispatch
- Launch gate mapping: `G4 Service tests`, `G6 Reward epoch`

## 9) P0-017 — Pause/unpause drill
- Ticket title: `P0-017 Ops: Execute pause/unpause system drill`  
- Owner: SRE/Safe Captain  
- Severity: Critical  
- Dependencies: P0-015  
- Workstream: Ops  
- Labels: `p0-ops`  
- Acceptance: Tx hashes + drill log  
- Acceptance evidence:  
  - Full drill log using pause/recovery runbook
  - Safe tx hashes for pause and unpause actions
  - Dashboard/service behavior proof (stale/paused banner and recover)
- Launch gate mapping: `G9 Ops drills`, `G9` includes reconciliation readiness

## 10) P0-018 — Reward epoch synthetic close drill
- Ticket title: `P0-018 Ops: Reward epoch synthetic close / wrong root rejection drill`  
- Owner: Backend/Safe Captain  
- Severity: Critical  
- Dependencies: P0-003, P0-013  
- Workstream: Ops  
- Labels: `p0-ops,p0-rewards`  
- Acceptance: Drill evidence and root export  
- Acceptance evidence:  
  - Root export JSON + reproduced root validation artifact
  - Safe publish tx for valid close
  - Demonstrated reject path for different root retry
  - Claim proof output from successful synthetic close
- Launch gate mapping: `G6 Reward epoch`, `G9 Ops drills`

## 11) P0-019 — Anti-wash liveness 24h gate
- Ticket title: `P0-019 Backend/SRE: Anti-wash worker 24h liveness gate`  
- Owner: Backend/SRE  
- Severity: Critical  
- Dependencies: P0-004  
- Workstream: Ops  
- Labels: `p0-anti-wash,p0-ops`  
- Acceptance: 24h liveness report  
- Acceptance evidence:  
  - 24h lag/heartbeat report with alert thresholds and no stale windows at epoch-close boundary
  - Incident readiness checks for anti-wash stale > threshold
  - Evidence that stale anti-wash blocks epoch build
- Launch gate mapping: `G5 Anti-wash`, `G6 Reward epoch`, `G9 Ops drills`

## 12) P0-020 — Assemble external audit evidence pack
- Ticket title: `P0-020 Audit: Assemble external audit evidence package`  
- Owner: Audit Captain  
- Severity: High  
- Dependencies: all  
- Workstream: Audit  
- Labels: `p0-audit`  
- Acceptance: Audit folder complete  
- Acceptance evidence:  
  - Closed evidence index mapping each P0 item to artifact path
  - Residual risk memo and acceptance rationale for any deferred decisions
  - Signoff log and launch-stage evidence checklist
- Launch gate mapping: `G10 Audit handoff`, `G0 Scope freeze` (if needed)

## Sequencing recommendation
- Phase A: P0-005, P0-006, P0-007, P0-009 (parallel with distinct owner lanes)
- Phase B: P0-008 (after A completes), P0-012, P0-010/011 (tokenomics signoff)
- Phase C: P0-017, P0-018, P0-019 (ops drills)
- Phase D: P0-020 (final evidence bundle)
