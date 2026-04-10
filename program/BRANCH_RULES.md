# Branch And PR Rules

This file is the canonical review-scope rule for `Render-Network-OS/docs`.

## Default-branch truth

- Board status must reflect `main`, not a topic branch.
- No docs ticket closes on draft work alone.
- If a change is still waiting on review or merge, the ticket stays open.

## PR size guideline

PRs must stay small enough for one reviewer to understand the full change in one
sitting.

- Docs-only PRs should stay under `1000` changed lines.
- Repo logic, workflow, config, or UI PRs should stay under `400` changed lines.
- Lock files do not count toward the advisory threshold.

For this repo, "repo logic, workflow, config, or UI" includes files such as:

- `.github/**`
- `components/**`
- `styles/**`
- `docs.json`
- `package.json`
- any script or config file that changes how docs are built or reviewed

## If a PR exceeds the guideline

- Split it when the work can be separated without hiding coupling.
- If it cannot be split cleanly, explain why in the PR body.
- Reviewer should explicitly acknowledge the exception before merge.

Large one-time migrations are allowed only when the PR body explains:

- why the change is coupled
- why the current slice is the smallest reviewable unit
- what the reviewer should focus on first

## Reviewer expectation

- Reviewer must be able to explain the full change after one pass through the
  diff.
- If that is not realistic, the PR is too large or the PR body is too weak.

## No silent merges

- Do not merge a PR with only comments or no recorded review state.
- Reviewer must use an explicit GitHub review state: `APPROVED` or
  `CHANGES_REQUESTED`.
- Bot comments do not count as the final review decision.
- Until branch protection requires reviews automatically, the PR review-state
  comment must be updated before merge so the current review state is visible on
  the PR itself.

## Required PR body fields

Every PR should include:

- summary of change
- related issue
- PR size classification
- validation performed
- explicit reviewer notes
- review-state note if the branch is being merged without required-review
  enforcement

Use the repo PR template as the default shape.
