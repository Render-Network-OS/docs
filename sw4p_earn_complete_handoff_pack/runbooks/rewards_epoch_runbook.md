# Rewards Epoch Runbook

## Goal

Close an epoch, build a deterministic reward root, queue Safe publication, fund rewards, and prove claims.

## Steps

1. Confirm previous epoch reconciled.
2. Confirm supply invariant is healthy.
3. Confirm anti-wash worker lag below threshold.
4. Freeze route and fee snapshot.
5. Export policy snapshot and hash.
6. Build reward leaves.
7. Verify sum of REAL_FEE leaves equals real-fee pool.
8. Verify sum of INCENTIVE leaves equals incentive budget.
9. Generate Merkle root and reproduction JSON.
10. Queue Safe transaction to publish root.
11. Safe quorum signs.
12. Publish epoch.
13. Fund distributor.
14. Verify distributor balance >= total claims.
15. Enable claimability.
16. Update dashboard.
17. Store evidence.

## Halt conditions

```txt
- policy hash mismatch
- supply invariant unhealthy
- anti-wash stale
- different root on retry
- insufficient reward funding
- unknown sourceTag
- ineligible event included
```
