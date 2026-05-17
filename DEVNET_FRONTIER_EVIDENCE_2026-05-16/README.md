# sw4p Devnet-Frontier Execution Evidence (2026-05-16 cycle)

This directory captures real-chain, real-service evidence for every wave of the
sw4p devnet-frontier execution cycle. Every acceptance gate cites either a real
on-chain tx hash with a public explorer URL, or a real external-service response
capture. Mocks and synthetic fixtures are not cited here.

## Critical blockers

| Blocker | Discovered | Impact | Unblock criteria |
|---|---|---|---|
| sw4p-backend HTTP API not reachable | W0.d (commit `d3146d72`) | Gates W1 through W8 ZERO-MOCKS acceptance | See `waves/W0-setup/phase-5-baseline-deferred.md` |

## Structure

- `waves/W{N}-<title>/`: per-wave evidence (acceptance, prs, commands, handoff).
- `operational/`: deploy logs, infra changes, secrets-management traces.
- `functional/`: real-chain tx hashes per acceptance gate.
- `visual/`: Playwright captures of UX changes.

## Wave status table

| Wave | Title | Status | Evidence link |
|---|---|---|---|
| W0 | Setup, Live Deps, Landing/AWS/Cloudflare, Baseline | partial: probes complete; baseline deferred BLOCKED | `waves/W0-setup/` |
| W1 | Canonical EVM (3-tier coverage) | not started | `waves/W1-canonical-evm/` |
| W2 | Rail consolidation + Allbridge live-route discovery | not started | `waves/W2-rail-consolidation/` |
| W3 | 3-phase atomicity | not started | `waves/W3-atomicity/` |
| W4 | Kit completion + Cloudflare Worker | not started | `waves/W4-kit-completion/` |
| W5 | Distribution | not started | `waves/W5-distribution/` |
| W6 | Intent contracts (E1 to E5) | not started | `waves/W6-intent-contracts/` |
| W7 | Engine last-resort + intent-first kit (E6 to E9) | not started | `waves/W7-intent-ux-final/` |
| W8 | Final phases WS5 to WS9 + audit prep + mainnet runbook docs | not started | `waves/W8-final-phases/` |

## Spec reference

`docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md`
