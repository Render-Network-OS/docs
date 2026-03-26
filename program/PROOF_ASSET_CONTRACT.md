# Proof Asset Contract

Every outward-facing claim must resolve to a reusable proof asset with explicit
metadata.

## Required metadata

- `claim`
  The statement this artifact supports.
- `audience`
  The consumer of the claim.
- `artifact_type`
  One of: `runbook`, `audit`, `screenshot`, `demo_clip`, `test_report`,
  `matrix`, `memo`, `deck`, `one_pager`.
- `source_repo_path`
  Repo-relative or workspace-relative source path.
- `date`
  The artifact date in `YYYY-MM-DD`.
- `reusability`
  One of: `single_use`, `campaign_reusable`, `evergreen`.

## Optional metadata

- `dependencies`
- `owner`
- `review_status`
- `claim_strength`
  One of: `direct`, `supporting`, `contextual`.

## Acceptance rules

1. No proof asset can point at an undocumented black box.
2. Time-sensitive assets must carry a date.
3. A public narrative artifact must cite at least one `direct` proof asset.
4. A partner or investor artifact must cite operator truth before market framing.
