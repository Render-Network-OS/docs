# 10 - Team Handoff Notes

## What the team should understand immediately

SW4P Earn is closer to a financial accounting and reward-distribution system than a normal staking frontend. The frontend matters, but the hard part is the correctness loop underneath it.

The team should not build this as:

```txt
stake -> show APY -> claim token
```

The correct model is:

```txt
real economic event -> eligibility -> fee policy -> source-tagged epoch -> claim -> proof dashboard
```

## First meeting agenda

1. Confirm P0 scope.
2. Assign P0 owners.
3. Convert `P0_BACKLOG.csv` to GitHub issues.
4. Review P0 critical blockers.
5. Decide LP/stake split policy.
6. Decide reward publication security design.
7. Freeze chain topology.
8. Start cross-chain invariant fix immediately.

## Decisions needed from leadership

### D-001 - LP/stake real-fee split

Recommendation: accept 70/30 for P0 but make it explicit.

### D-002 - Reward root publication

Recommendation: queue-to-Safe publish path for P0.

### D-003 - DEX LP fee modelling

Recommendation: separate direct LP fee APR from protocol-routed reward APR.

### D-004 - Pump creator fee activation

Recommendation: accounting-ready but not included in public APR until fee owner/source path is confirmed.

### D-005 - Launch posture

Recommendation: Stage 3 public Earn only after P0 gates green and a low-value mainnet canary has completed.

## Suggested GitHub labels

```txt
p0-launch-blocker
p0-security
p0-crosschain
p0-contracts
p0-services
p0-anti-wash
p0-dashboard
p0-ops
p0-policy
p1-post-launch
p2-scale
needs-founder-decision
needs-safe-tx
needs-auditor-review
```

## Suggested branch naming

```txt
feat/earn-p0-crosschain-invariant
feat/earn-p0-reward-safe-publish
feat/earn-p0-anti-wash-persistence
feat/earn-p0-pol-vault-hardening
feat/earn-p0-policy-manifest
feat/earn-p0-proof-dashboard
feat/earn-p0-ci-gates
```

## Engineering order

Start with:

```txt
1. Cross-chain invariant
2. Anti-wash persistence
3. Reward root Safe path
4. Contract test gaps
5. Policy manifest
6. Dashboard proof
7. Drills and launch gates
```

Do not start with cosmetic dashboard changes. Proof data comes first.

## Handoff statement for team

```txt
P0 is the launch product. We are not shipping Earn until the team can prove source-labelled rewards from real eligible volume, correct cross-chain supply, Safe-controlled epoch publication, and a dashboard that shows truth rather than marketing metrics. Every P0 issue must close with an evidence artifact.
```
