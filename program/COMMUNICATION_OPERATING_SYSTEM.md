# Communication Operating System

This file defines how recurring communication tickets are executed and closed.

## Rule of completion

A cadence ticket is only complete when both of these exist:

1. the reusable template / SOP
2. the first real artifact produced from it

## Canonical artifact families

| Artifact | Primary audience | Inputs | Required proof discipline | First-cycle output convention |
| --- | --- | --- | --- | --- |
| Founder EOD note | founder / internal | active ticket evidence, blockers, decisions | no unsupported progress claims | `community/founder-eod-YYYY-MM-DD.md` |
| Founder operating memo | founder / internal | weekly ticket status, risks, gates | every claim links a repo-local source | `community/founder-operating-memo-YYYY-MM-DD.md` |
| Public build log | public | operator-ready wins, proof assets, demos | no speculative roadmap claims presented as shipped | `community/public-build-log-YYYY-MM-DD.mdx` |
| Partner mini-brief | partner | product state, proof library, wedge | every strategic claim maps to product proof | `community/partner-mini-brief-YYYY-MM-DD.md` |
| Investor update | investor | proof library, metrics, risks, next 90 | separate proof from ambition explicitly | `community/investor-update-YYYY-MM-DD.md` |
| Category deck refresh | founder / investor | proof library, wedge, why now, roadmap | deck claims must reference named proof assets | `community/category-deck-refresh-YYYY-MM-DD.md` |

## Editorial rules

- Lead with operator truth, then product truth, then market framing.
- Never claim reliability, automation, safety, or economic performance without a
  linked proof asset.
- A public build log should highlight what is now proven, what is still bounded,
  and what remains open.
- Partner and investor artifacts must clearly separate:
  - what is live
  - what is operator-ready
  - what is still a next-step or launch-bound item

## First-cycle agenda

- Founder EOD note: summarize the documentation program normalization and the
  first repo-local doc indexes shipped.
- Founder operating memo: document repo-by-repo readiness, blockers, and the
  next tranche of ticket closures.
- Public build log: publish the proof-first operator narrative with explicit
  references to Alice deploy docs, stream evidence, arcade mastery, and SW4P
  security/ops docs.
- Partner mini-brief and investor update: derive from the proof library, not
  from roadmap rhetoric.
