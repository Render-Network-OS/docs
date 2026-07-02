# P0 Issue Ownership Enforcement (sw4p-earn)

Date: 2026-06-26
Owner policy: all `P0-*` issues in `render-network-os/sw4p-earn` are assigned to **`rndrntwrk`**.

## Verification (current)
- Scope: open issues with `P0-` in title search, milestone optional.
- Command used:
  - `gh issue list --repo render-network-os/sw4p-earn --state open --search "P0-" --json number,assignees`
- Result at verification time: no `P0-*` issue is unassigned or assigned to someone other than `rndrntwrk`.

## Runbook
Use this after any new P0 issue creation:

```bash
cd '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555'
bash sw4p_earn_complete_handoff_pack/backlog/enforce_p0_rndrntwrk.sh
```

## Ownership invariants
1. Assignee must be exactly `rndrntwrk`.
2. Milestone for unresolved-blocker work: **P0 Unresolved Gate Closure**.
3. Labels include lane tags used by Codex orchestration (`codex-spark-*`) for subagent routing.
