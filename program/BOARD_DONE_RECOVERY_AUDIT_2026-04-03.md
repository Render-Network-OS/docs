# Board Done Recovery Audit – 2026-04-03

## Summary
- This audit reviews the **139 tickets removed from `Done`** during the board-truth cleanup.
- Recovery rule:
  - move back to `Done` only if the ticket is now **closed as completed**
  - or **closed as superseded** by later canonical tickets that are already complete
  - or a **recurring non-doc** ticket that should remain in `Done` between cycles under current board policy
- Current recovery result from the audited tranche:
  - **18** tickets restored to `Done` by closing them as completed or superseded
  - **7** recurring non-doc tickets restored to `Done` while remaining open
  - **114** tickets still stay open for now

## Verified Board Baseline
- Live readback after the second recovery tranche:
  - `Done`: **163**
  - `Backlog`: **247**
  - `Ready`: **10**
  - `In Progress`: **4**
- Live readback after the latest recovery tranche:
  - `Done`: **168**
  - `Backlog`: **242**
  - `Ready`: **10**
  - `In Progress`: **4**

## Closed And Restored To Done
These tickets were removed from `Done` during cleanup, then restored only after confirming that the canonical successor work or default-branch artifact already exists.

### Closed As Superseded
- [Render-Network-OS/555-bot#8](https://github.com/Render-Network-OS/555-bot/issues/8)
  - superseded by `DEP-002`
- [Render-Network-OS/555-bot#9](https://github.com/Render-Network-OS/555-bot/issues/9)
  - superseded by `DEP-003`
- [Render-Network-OS/555-bot#11](https://github.com/Render-Network-OS/555-bot/issues/11)
  - superseded by `DEP-005` and the broader smoke path shipped in `OPS-002`
- [Render-Network-OS/555-bot#18](https://github.com/Render-Network-OS/555-bot/issues/18)
  - superseded by `OPS-001`
- [Render-Network-OS/555-bot#19](https://github.com/Render-Network-OS/555-bot/issues/19)
  - superseded by `OPS-002`
- [Render-Network-OS/555-bot#25](https://github.com/Render-Network-OS/555-bot/issues/25)
  - superseded by `DEP-005` and `DEP-007`
- [Render-Network-OS/docs#11](https://github.com/Render-Network-OS/docs/issues/11)
  - superseded by `docs#103`
- [Render-Network-OS/docs#15](https://github.com/Render-Network-OS/docs/issues/15)
  - superseded by `OPS-007`
- [Render-Network-OS/docs#106](https://github.com/Render-Network-OS/docs/issues/106)
  - superseded by `OPS-001`
- [Render-Network-OS/stream#13](https://github.com/Render-Network-OS/stream/issues/13)
  - superseded by `STR-002`
- [Render-Network-OS/stream#14](https://github.com/Render-Network-OS/stream/issues/14)
  - superseded by `STR-003`
- [Render-Network-OS/stream#16](https://github.com/Render-Network-OS/stream/issues/16)
  - superseded by `STR-004` and `STR-008`
- [Render-Network-OS/stream#17](https://github.com/Render-Network-OS/stream/issues/17)
  - superseded by `STR-010`
- [Render-Network-OS/stream#19](https://github.com/Render-Network-OS/stream/issues/19)
  - superseded by `STR-011` and `DEP-004`
- [Render-Network-OS/stream#25](https://github.com/Render-Network-OS/stream/issues/25)
  - superseded by `STR-007` and `STR-010`
- [Render-Network-OS/docs#20](https://github.com/Render-Network-OS/docs/issues/20)
  - superseded by `SYS-005` and `STR-009`

### Closed As Completed
- [Render-Network-OS/docs#12](https://github.com/Render-Network-OS/docs/issues/12)
  - completed via the merged glossary and naming canon
- [Render-Network-OS/docs#14](https://github.com/Render-Network-OS/docs/issues/14)
  - completed via the merged first article and article-series roadmap

## Recurring Non-Doc Tickets Restored To Done
These remain open, but they were moved back to `Done` because current board policy keeps recurring non-doc cadence tickets in `Done` unless the next cycle is actively being worked.

- [Render-Network-OS/555-bot#36](https://github.com/Render-Network-OS/555-bot/issues/36)
  - Weekly product review
- [Render-Network-OS/555-bot#37](https://github.com/Render-Network-OS/555-bot/issues/37)
  - Weekly public progress update
- [Render-Network-OS/555-bot#38](https://github.com/Render-Network-OS/555-bot/issues/38)
  - Biweekly release gate review
- [Render-Network-OS/555-bot#39](https://github.com/Render-Network-OS/555-bot/issues/39)
  - Per-release postmortem
- [Render-Network-OS/555-bot#40](https://github.com/Render-Network-OS/555-bot/issues/40)
  - Per-candidate release review
- [Render-Network-OS/stream#11](https://github.com/Render-Network-OS/stream/issues/11)
  - Per-incident status update
- [Render-Network-OS/stream#70](https://github.com/Render-Network-OS/stream/issues/70)
  - Weekly demo cadence

## Stay Open For Now
These tickets were correctly removed from `Done` and should **not** be restored yet.

### Successor Work Still Open
The ticket body points at backlog IDs that are not yet done, so restoring `Done` credit would be premature.

- [Render-Network-OS/555-bot#10](https://github.com/Render-Network-OS/555-bot/issues/10)
  - depends on `DEP-004` and `OPS-008`; `OPS-008` is still open
- [Render-Network-OS/555-bot#13](https://github.com/Render-Network-OS/555-bot/issues/13)
  - depends on `FND-001` and `OPS-010`; both remain open
- [Render-Network-OS/555-bot#14](https://github.com/Render-Network-OS/555-bot/issues/14)
  - depends on `DEP-001` and `DEP-008`; `DEP-008` remains open
- [Render-Network-OS/555-bot#20](https://github.com/Render-Network-OS/555-bot/issues/20)
  - depends on `OPS-005`, which remains open
- [Render-Network-OS/555-bot#21](https://github.com/Render-Network-OS/555-bot/issues/21)
  - points at `OPS-006`, which remains open
- [Render-Network-OS/stream#12](https://github.com/Render-Network-OS/stream/issues/12)
  - depends on `STR-001` and `ARC-001`; `ARC-001` remains open
- [Render-Network-OS/stream#15](https://github.com/Render-Network-OS/stream/issues/15)
  - depends on `STR-004` and `STR-005`; `STR-005` remains open
- [Render-Network-OS/docs#13](https://github.com/Render-Network-OS/docs/issues/13)
  - depends on `STR-012` and `ARC-010`; both remain open
- [Render-Network-OS/docs#16](https://github.com/Render-Network-OS/docs/issues/16)
  - depends on `OPS-009`, which remains open
- [Render-Network-OS/docs#17](https://github.com/Render-Network-OS/docs/issues/17)
  - depends on `FND-001` and `OPS-010`; both remain open
- [Render-Network-OS/docs#18](https://github.com/Render-Network-OS/docs/issues/18)
  - depends on `OPS-010`, which remains open
- [Render-Network-OS/docs#19](https://github.com/Render-Network-OS/docs/issues/19)
  - depends on `MLD-009` and `FND-008`; both remain open

### Review, Gate, Metric, Risk, And Governance Wrappers
These are open checks, risk items, metric rows, or governance wrappers. They were inflating `Done` but do not yet justify closure.

- `555-bot#27-35`, `#48-64`, `#83`, `#87`, `#92`, `#95`
- `docs#49`, `#76-89`, `#93-94`, `#107`, `#109`, `#114`, `#117`
- `stream#21`, `#24`, `#26-33`, `#38`, `#42-53`, `#64`, `#69`, `#71-72`
- `555-arcade-plugin#2`, `#3`, `#25`
- `555-frontend#2`
- `milaidy#8-10`, `#14-18`, `#20`
- `stream-plugin#3`

## Practical Rule Going Forward
- A removed ticket should go back to `Done` only through one of these paths:
  - **Completed:** default-branch artifact exists and the issue is closed
  - **Superseded:** a later canonical issue replaced the work and is already complete
  - **Recurring non-doc cadence:** current board policy keeps it in `Done` between cycles
- Everything else stays in `Backlog` or `Ready` until the actual close condition is met.
