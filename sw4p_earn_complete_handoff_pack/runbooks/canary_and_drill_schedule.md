# Canary and Drill Schedule

## P0 required drills

| Timing | Drill | Owner | Pass evidence |
|---|---|---|---|
| T-21 | NTT round-trip canary | Protocol + cross-chain | tx hashes, invariant report |
| T-14 | Pause/unpause full system | Safe captain + SRE | pause/unpause tx hashes |
| T-10 | Synthetic reward epoch close | Backend lead | root JSON, Safe tx, claim proof |
| T-7 | Dashboard reconciliation diff | Dashboard lead | screenshot and diff report |
| T-7 | Hot-key rotation rehearsal | SRE + Safe captain | old key revoked, new key works |
| T-5 | Incident response tabletop | Full team | transcript, action list |
| T-3 | Service kill switch | SRE | alerts and dashboard stale banner |
| T-3 | CI cold build | DevOps | clean build, bytecode hash |
| T-1 | Final PASS/FAIL | Launch lead | signed launch decision |

## Drill log template

```txt
Drill:
Date:
Owner:
Environment:
Git commit:
Steps executed:
Expected result:
Actual result:
Artifacts:
Issues found:
Retest required:
Signoff:
```
