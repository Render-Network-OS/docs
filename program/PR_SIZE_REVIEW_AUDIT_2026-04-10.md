# PR Size Review Audit 2026-04-10

This audit closes the review portion of `docs#86`.

## Scope

- Reviewed the most recent visible PR sample from `Render-Network-OS/docs`.
- GitHub currently exposes four recent PRs in the active repo history, not ten,
  so this audit uses the full available sample.

## Guideline used

- Docs-only PRs: `< 1000` changed lines
- Repo logic / workflow / config / UI PRs: `< 400` changed lines

## Recent PR sample

| PR | Title | Scope | Changed lines | Files | Result | Notes |
| --- | --- | --- | ---: | ---: | --- | --- |
| #183 | `docs: QA-SYS-03 first weekly security review — assign owners, set due…` | docs-only | 368 | 10 | Pass | Reviewable in one sitting. |
| #181 | `docs(program): codify default-branch board truth rule` | docs-only | 13 | 2 | Pass | Tight fix-up PR. |
| #180 | `docs(program): codify default-branch board truth rule` | docs-only | 1108 | 27 | Exceeds guideline | Oversized draft; later replaced by smaller merged PR #181. |
| #179 | `docs: land program canon, first article, and target dossiers` | docs-only | 1103 | 27 | Exceeds guideline | One-time canon bootstrap; should have carried an explicit large-PR justification. |

## Result

- 2 of 4 recent PRs fit the guideline cleanly.
- 2 of 4 recent PRs exceeded the docs-only threshold.
- The repo needs a standing warning surface so large PRs are called out before
  merge instead of being normalized after the fact.

## Landed controls

- Canonical rule: `program/BRANCH_RULES.md`
- PR template: `.github/PULL_REQUEST_TEMPLATE.md`
- Non-blocking warning workflow: `.github/workflows/pr-size-warning.yml`
