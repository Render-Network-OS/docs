# Issue Brief Standard

Every documentation and brand-positioning ticket must be normalized into this
shape before writing begins.

## Required sections

### Goal
State the concrete outcome in one sentence. Use an action verb and a measurable
 object.

### Audience
Name the primary audience first, then optional secondary audiences.

Examples:
- Operator
- Internal reviewer
- Partner / VC
- Founder
- Public user

### Owning repo/path
List the canonical repo and the target docs path or directory.

### Source-of-truth inputs
List the docs, audits, code paths, dashboards, screenshots, or prior packets
that define what is true for this ticket.

### Required outputs
List the exact artifacts that must exist when the ticket closes.

Examples:
- one canonical runbook
- one public summary page
- one release-readiness memo
- one first-cycle weekly operating memo

### Non-goals
List what this ticket must not expand into.

### Dependencies
List blocking tickets, required evidence, or prerequisite docs.

### Acceptance criteria
Use flat checklist items only. Each line should be externally verifiable.

### Evidence required
List what must be linked back into the issue before closure.

Examples:
- file paths
- screenshots
- preview/build output
- audit packet
- demo clip

### Close condition
Define the single sentence that makes the ticket closable.

## Example skeleton

```md
## Goal
Create the canonical stream operator handbook for setup, go-live, recovery, and release review.

## Audience
- Primary: operator
- Secondary: reviewer, founder

## Owning repo/path
- Repo: `rndrntwrk/stream-plugin`
- Canonical path: `docs/`

## Source-of-truth inputs
- `docs/GET_STARTED.md`
- `docs/ACTIONS_REFERENCE.md`
- `../555stream/ECOSYSTEM_EVIDENCE_INDEX.md`

## Required outputs
- `docs/OPERATOR_HANDBOOK_INDEX.md`
- `docs/STREAM_RELEASE_READINESS_MEMO.md`

## Non-goals
- Rewriting unrelated product marketing pages

## Dependencies
- STR-001
- STR-002

## Acceptance criteria
- [ ] The handbook covers setup, live operation, and recovery.
- [ ] The readiness memo links concrete evidence for each claim.

## Evidence required
- Links to changed files
- Preview/build output

## Close condition
The owning repo has one canonical operator entrypoint and the issue contains evidence links to it.
```
