# Operator Doc Contract

Use this contract for any operator guide, runbook, readiness memo, or recovery
document.

## Required sections

### Purpose
Why this document exists and which critical path it covers.

### When to use
The trigger condition for using the document.

### Prereqs
Required repos, credentials, environment state, or earlier steps.

### Steps
Ordered action sequence. Keep it executable.

### Decision points
The forks where an operator must choose between paths.

### Failure modes
Known ways the flow can fail.

### Recovery
How to restore a safe or working state from each important failure.

### Evidence
What should be captured while following the document.

### Related tickets/docs
List the canonical neighbors rather than duplicating material.

## Writing rules

- Prefer short imperative steps.
- Name commands, IDs, and artifacts exactly.
- Mark deprecated paths explicitly instead of silently replacing them.
- If a flow spans repos, name one canonical owner and link outward.
- A readiness memo must end with a clear decision:
  `Go`, `Go with bounded exceptions`, or `Hold`.
