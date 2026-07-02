# Engineering Dispatch Prompt

You are working on SW4P Earn P0. Treat P0 as the launch product, not as a patch list.

Start with the P0 issue assigned to you. For every PR, include:

```txt
- problem statement
- files changed
- tests added
- evidence artifact
- acceptance gate affected
- rollback plan
```

Do not add P1/P2 scope. Do not change economic constants without updating the policy manifest and dashboard labels.

Non-negotiables:

```txt
- no fake volume in rewards
- no misleading APY
- no false supply invariant
- no hot-key dual-role
- no unlabelled treasury movement
```
