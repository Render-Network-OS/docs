# 05 - Security, Risk, and Audit Remediation

## 1. Security posture

SW4P Earn touches user funds, treasury funds, reward accounting, and cross-chain supply. It should be treated as a DeFi launch, not a web-app launch.

The main risks are:

```txt
- unbacked 555 supply due to wrong NTT invariant
- malicious or mistaken reward root
- fake volume entering rewards
- treasury/router misallocation
- LP vault share-inflation or withdraw bugs
- adapter misconfiguration
- misleading APY
- ops endpoint exposure
- insufficient pause/recovery paths
```

## 2. Threat model layers

```txt
Layer 1: Plan invariants
Layer 2: Smart contracts
Layer 3: Services and DB
Layer 4: Ops and key management
Layer 5: Dashboard and public claims
```

A failure in one layer must be caught by another layer.

Example:

```txt
If anti-wash service fails, reward epoch builder must refuse to build.
If reward root differs from recomputed DB snapshot, publication must halt.
If supply invariant is unknown, dashboard must not show green.
```

## 3. Critical P0 risks

### R-001 - Wrong cross-chain supply invariant

Impact:

```txt
Silent false-positive dashboard, possible unbacked supply, public trust failure.
```

Mitigation:

```txt
- burn-and-mint aware invariant
- per-chain mint/burn counters
- round-trip canary
- CI gate
- dashboard proof
```

### R-002 - Publisher hot-key dual-role

Impact:

```txt
Compromised key can publish malicious epoch root and enable drain of reward balances.
```

Mitigation:

```txt
- Safe-mediated root publishing
- split funder and publisher secrets
- cooldown/challenge if direct publish remains
- root recomputation monitor
- alert on unknown root
```

### R-003 - Anti-wash inert or stale

Impact:

```txt
Fake volume farms rewards, dilutes legitimate LP/stakers, invalidates tokenomics.
```

Mitigation:

```txt
- implement persistence
- worker liveness metric
- reward build stale check
- synthetic wash integration test
- excluded volume dashboard
```

### R-004 - LP/POL contract coverage gaps

Impact:

```txt
share inflation, stuck funds, adapter misuse, untested withdraw paths.
```

Mitigation:

```txt
- add tests
- add pausable POL
- block adapter swap with active LP
- set adapter deployment topology
- external audit before scale
```

### R-005 - Misleading APY or policy drift

Impact:

```txt
users misunderstand yield, regulatory/trust risk, community backlash.
```

Mitigation:

```txt
- APY source separation
- sourceTag in claim leaves
- policy manifest hash
- dashboard labels
- drift alert
```

## 4. Role model

Required roles:

```txt
DEFAULT_ADMIN_ROLE     Safe / timelock
POLICY_ROLE            Safe / governance
PAUSER_ROLE            Guardian Safe, pause-only
POOL_ADMIN_ROLE        Safe / protocol ops
POOL_OPERATOR_ROLE     limited operator, no treasury withdraw
TREASURY_ROLE          Treasury Safe
FUNDER_ROLE            restricted funding path, not same as publisher
EPOCH_PUBLISHER_ROLE   Safe/co-signed/cooldown, not raw hot key
AUDITOR_READONLY       no write access
```

P0 rule:

```txt
No single hot key should be able to create a reward root and fund the reward contract in a way that drains balances.
```

## 5. Key management requirements

```txt
- production Safe signer list exported
- hot key inventory exported
- every hot key has purpose, scope, max loss, rotation path
- secrets have 90-day max age or explicit exception
- service account IAM is least privilege
- no shared secret across treasury-router and rewards-publisher
- break-glass process documented
```

## 6. Contract audit checklist

### `EVM555Token`

```txt
- NTT minter only
- decimals fixed
- pausable behavior
- owner is Safe
- permit safe if present
```

### `GlobalStakeVault`

```txt
- multiplier correctness
- totalWeighted invariant
- cooldown/early exit
- no lock bypass
- pause behavior
- emergency withdraw policy
```

### `LPVault`

```txt
- deposit ratio
- share mint formula
- share inflation
- withdraw/redeem
- multi-depositor ordering
- adapter trust
- reentrancy
- pause behavior
```

### `ProtocolOwnedLiquidityVault`

```txt
- source-tagged funding
- withdraw allowlist
- pause path
- adapter trust
- no tests gap closed
```

### `RewardsDistributor`

```txt
- leaf hash correctness
- sourceTag correctness
- duplicate claim prevention
- wrong proof rejection
- underfund behavior
- publish role safety
- funding sufficiency
```

## 7. Service audit checklist

```txt
- all workers idempotent
- all DB writes have idempotency keys
- route_event -> fee_event -> reward_leaf traceable
- anti-wash cannot fail open
- epoch builder deterministic
- dashboard never lies green on unknown state
- ops endpoints authenticated
- policy hash drift monitored
- outbox cannot double dispatch
```

## 8. Incident response triggers

Immediate pause / halt if:

```txt
- supply invariant broken
- reward root mismatch
- anti-wash stale past threshold during epoch close
- unexpected publisher transaction
- reward distributor underfunded after publication
- unauthorized ops endpoint access
- policy hash drift during active epoch
- claims spike > 10x median without matching real volume
```

## 9. External audit handoff

Auditor must receive:

```txt
- full repo at commit hash
- deployed addresses
- Safe role table
- contract tests and coverage
- service integration test logs
- policy manifest
- runbook evidence
- canary tx hashes
- known risk register
- exact P0 acceptance gates
```

## 10. Residual risks after P0

Even after P0, communicate internally:

```txt
- LPs face impermanent loss.
- Rewards depend on real volume and may fall.
- Cross-chain infrastructure has guardian/bridge dependencies.
- Product revenue bag inflows are variable and may be zero initially.
- Incentive APR can end or be reduced.
```
