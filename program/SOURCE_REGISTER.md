# Source Register

This file defines where canonical truth lives for each major documentation
domain.

| Domain | Canonical sources | Use for | Refresh rule |
| --- | --- | --- | --- |
| Public product narrative | `render_hub/docs/*` public pages | public site, partner summaries | refresh when product claims change |
| Alice / deployer operations | `555-bot/docs/*`, `555-bot/alice_knowledge/*`, `milaidy/docs/ops/*`, `milaidy/knowledge/*` | setup, deploy, runtime, boundary docs | refresh on deploy/runtime contract change |
| Alice product/operator behavior | `milaidy/docs/*`, `milaidy/knowledge/*` | install, config, operator flows, eval/safety | refresh on UX or runtime lifecycle change |
| Stream operator truth | `stream-plugin/docs/*`, `555stream/*evidence*`, `555stream/*acceptance*` | setup, go-live, approvals, release readiness | refresh on operator action or runtime parity change |
| Arcade operator truth | `arcade-plugin/docs/*`, `arcade-plugin/src/mastery/dossiers/*` | gameplay, progression, mastery, release docs | refresh on catalog, actions, or progression semantics change |
| SW4P technical truth | `sw4p/docs/*`, `sw4p/docs/internal/*`, `sw4p/docs/funding/*` | routes, ops, security, integration, economics | refresh on chain support, fee model, or control changes |
| Proof assets | evidence indices, audits, test packets, screenshots, clips, memos | public claims, partner decks, release readiness | refresh when underlying proof ages out or product changes |

## Rules

- If multiple repos discuss the same flow, the source register decides the
  canonical owner.
- Mirrors can summarize but must link back to the canonical source.
- Dated audits are evidence, not default evergreen docs, unless promoted into an
  evergreen document.
