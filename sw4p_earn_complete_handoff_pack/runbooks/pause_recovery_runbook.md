# Pause and Recovery Runbook

## Scope

This runbook handles emergency pause for staking, LP, POL, rewards, services, and dashboard.

## Triggers

```txt
- supply invariant broken
- malicious root suspected
- anti-wash failure during epoch close
- reward distributor underfunded
- exploit in vault
- unauthorized treasury movement
- public dashboard proof mismatch
```

## Immediate actions

1. Declare incident severity.
2. Pause affected contracts/services.
3. Snapshot balances and DB state.
4. Freeze reward epoch building.
5. Notify Safe signers.
6. Add dashboard incident banner.
7. Preserve logs.
8. Start root cause timeline.

## Recovery sequence

1. Identify affected scope.
2. Reconcile on-chain and DB state.
3. Recompute reward root if needed.
4. Decide corrective epoch path.
5. Apply patch.
6. Run tests.
7. Run staging drill.
8. Safe unpause.
9. Publish incident report internally/publicly depending severity.
