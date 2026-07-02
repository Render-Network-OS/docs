# P0 Issue Cards

## P0-001 - Fix burn-and-mint supply invariant

**Workstream:** Cross-chain  
**Severity:** Critical  
**Owner:** Protocol/Cross-chain  
**Labels:** `p0-crosschain`  
**Dependencies:** P0-002

### Problem

Implement global minted/burned counters and invariant formula

### Acceptance

Invariant test green; dashboard healthy; canary txs attached

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-002 - Make decimal verifier blocking

**Workstream:** Cross-chain  
**Severity:** Critical  
**Owner:** Protocol/SRE  
**Labels:** `p0-crosschain,p0-ci`  
**Dependencies:** None

### Problem

Production config + CI hard gate for SPL/EVM/SDK decimals

### Acceptance

CI fails on mismatch; artifact attached

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-003 - Remove publisher hot-key dual-role

**Workstream:** Security  
**Severity:** Critical  
**Owner:** Backend/Safe Captain  
**Labels:** `p0-security`  
**Dependencies:** P0-015

### Problem

Split publisher/funder secrets and move publish to Safe queue or cooldown design

### Acceptance

No single hot key can publish and fund; Safe tx evidence

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-004 - Implement anti-wash persistence

**Workstream:** Anti-wash  
**Severity:** Critical  
**Owner:** Backend  
**Labels:** `p0-anti-wash`  
**Dependencies:** None

### Problem

Implement unprocessedSinceLast/markIncluded/markExcluded + migration

### Acceptance

Synthetic wash excluded in integration test

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-005 - Add MM/POL wallet exclusion classes

**Workstream:** Anti-wash  
**Severity:** Critical  
**Owner:** Backend  
**Labels:** `p0-anti-wash,p0-mm`  
**Dependencies:** P0-004

### Problem

Classify market_maker and protocol_owned_liquidity wallets

### Acceptance

MM route excluded from rewards

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-006 - Add ProtocolOwnedLiquidityVault tests and pause path

**Workstream:** Contracts  
**Severity:** High  
**Owner:** Solidity  
**Labels:** `p0-contracts`  
**Dependencies:** None

### Problem

Full test suite + Pausable or equivalent

### Acceptance

Foundry coverage report; pause test green

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-007 - Add LPVault withdraw/share inflation/multi-depositor tests

**Workstream:** Contracts  
**Severity:** High  
**Owner:** Solidity  
**Labels:** `p0-contracts`  
**Dependencies:** None

### Problem

Close LPVault coverage gaps

### Acceptance

Withdraw and inflation tests green

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-008 - Resolve adapter topology

**Workstream:** Contracts  
**Severity:** High  
**Owner:** Solidity  
**Labels:** `p0-contracts`  
**Dependencies:** P0-006,P0-007

### Problem

One adapter per vault or multi-vault adapter refactor

### Acceptance

Deployment topology documented and tested

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-009 - Centralize policy manifest and bucket registry

**Workstream:** Policy  
**Severity:** High  
**Owner:** Backend/Tokenomics  
**Labels:** `p0-policy`  
**Dependencies:** None

### Problem

Single policy module + JSON manifest + golden hash

### Acceptance

Policy snapshot endpoint returns hash

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-010 - Decide LP/stake 70/30 split

**Workstream:** Policy  
**Severity:** High  
**Owner:** Founder/Tokenomics  
**Labels:** `needs-founder-decision`  
**Dependencies:** P0-009

### Problem

Make split explicit or per-epoch required

### Acceptance

Dashboard shows split; epoch snapshot includes split

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-011 - Resolve DEX LP fee APY treatment

**Workstream:** Policy  
**Severity:** High  
**Owner:** Founder/Tokenomics  
**Labels:** `needs-founder-decision`  
**Dependencies:** P0-009

### Problem

Separate direct LP fee APR vs protocol-routed APR

### Acceptance

No double count; no hidden 20% haircut

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-012 - Fee ledger/outbox integration test

**Workstream:** Services  
**Severity:** High  
**Owner:** Backend  
**Labels:** `p0-services`  
**Dependencies:** P0-009

### Problem

Real PgFeeLedgerStore + outbox + fake on-chain harness

### Acceptance

No duplicate dispatch; trace available

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-013 - Deterministic epoch root reproduction

**Workstream:** Rewards  
**Severity:** Critical  
**Owner:** Backend  
**Labels:** `p0-rewards`  
**Dependencies:** P0-004,P0-009

### Problem

Snapshot hash, policy hash, merkle tree export

### Acceptance

Root can be recomputed; different root halts

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-014 - Source-tagged claim API/UI

**Workstream:** Rewards  
**Severity:** High  
**Owner:** Backend/Frontend  
**Labels:** `p0-dashboard`  
**Dependencies:** P0-013

### Problem

REAL_FEE and INCENTIVE exposed per claim

### Acceptance

UI and API never return blended-only APY

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-015 - Safe role table and role rotation

**Workstream:** Ops  
**Severity:** Critical  
**Owner:** SRE/Safe Captain  
**Labels:** `p0-ops,p0-security`  
**Dependencies:** None

### Problem

Export roles, rotate admin to Safe, separate guardian

### Acceptance

Role table attached; unsafe owners removed

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-016 - Build proof dashboard endpoints

**Workstream:** Dashboard  
**Severity:** High  
**Owner:** Frontend/Backend  
**Labels:** `p0-dashboard`  
**Dependencies:** P0-001,P0-004,P0-013

### Problem

/v1/dashboard/555-proof with invariant, excluded volume, epoch, APY

### Acceptance

Non-zero proof metrics in canary

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-017 - Pause/unpause drill

**Workstream:** Ops  
**Severity:** Critical  
**Owner:** SRE/Safe Captain  
**Labels:** `p0-ops`  
**Dependencies:** P0-015

### Problem

Rehearse pause and recovery on testnet

### Acceptance

Tx hashes + drill log

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-018 - Reward epoch synthetic close drill

**Workstream:** Ops  
**Severity:** Critical  
**Owner:** Backend/Safe Captain  
**Labels:** `p0-ops,p0-rewards`  
**Dependencies:** P0-003,P0-013

### Problem

Close epoch, retry same root, reject different root

### Acceptance

Drill evidence and root export

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-019 - Anti-wash liveness 24h gate

**Workstream:** Ops  
**Severity:** Critical  
**Owner:** Backend/SRE  
**Labels:** `p0-anti-wash,p0-ops`  
**Dependencies:** P0-004

### Problem

Worker liveness and lag alert before launch

### Acceptance

24h liveness report

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```

## P0-020 - Assemble external audit evidence pack

**Workstream:** Audit  
**Severity:** High  
**Owner:** Audit Captain  
**Labels:** `p0-audit`  
**Dependencies:** all

### Problem

Compile artifacts and residual risks

### Acceptance

Audit folder complete

### Required evidence

```txt
- PR link
- tests added/updated
- evidence artifact path
- dashboard/API/tx screenshot where relevant
- rollback note
```
