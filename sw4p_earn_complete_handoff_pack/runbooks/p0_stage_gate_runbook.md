# P0 Stage Gate Runbook

## Purpose

This runbook tells the launch lead how to decide whether SW4P Earn can move from P0 build to Stage 3 public launch.

## Gate owner

Launch lead, with signoff from protocol lead, backend lead, SRE, Safe captain, dashboard lead, and audit captain.

## Required inputs

```txt
- git commit
- contract addresses
- Safe role table
- CI report
- test report
- cross-chain invariant report
- anti-wash report
- reward epoch report
- dashboard proof screenshot
- drill logs
- risk register
```

## PASS criteria

```txt
[ ] all critical blockers closed
[ ] no P0-blocking high severity issue unaccepted
[ ] no unknown supply status
[ ] no stale anti-wash at epoch close
[ ] no untested reward publication path
[ ] no unauthenticated ops endpoint
[ ] no APY-only blended display
[ ] no fake volume paid in synthetic test
[ ] no unresolved Safe role ambiguity
```

## FAIL criteria

Any one of these fails launch:

```txt
- supply invariant broken/unknown
- reward root not reproducible
- publisher/funder hot-key dual-role unresolved
- anti-wash cannot persist/exclude
- dashboard falsely green on stale/unknown state
- contract tests missing for core withdraw/claim/fund paths
- Safe role table missing
- pause drill not completed
```

## Signoff format

```txt
SW4P Earn P0 Stage Gate Decision
Date:
Git commit:
Decision: PASS / FAIL
Open risks:
Accepted residual risks:
Required follow-ups:
Signers:
```
