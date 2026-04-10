# Documentation Program Canon

This directory is the internal operating layer for the documentation program.

The public Mintlify site remains the curated outward-facing surface. These files
define how documentation work is scoped, written, evidenced, and closed across:

- `Render-Network-OS/docs`
- `Render-Network-OS/555-bot`
- `rndrntwrk/milaidy`
- `Render-Network-OS/stream` and `rndrntwrk/stream-plugin`
- `rndrntwrk/555-arcade-plugin`
- `rndrntwrk/sw4p-pro` and `sw4p`

## What lives here

- `ISSUE_BRIEF_STANDARD.md`
  The canonical GitHub issue body format for documentation and brand-positioning
  tickets.
- `BRANCH_RULES.md`
  The canonical pull-request scope and review-size rules for this repo.
- `PR_REVIEW_STATE_AUDIT_2026-04-10.md`
  The dated baseline audit for explicit reviewer state vs silent merges.
- `OPERATOR_DOC_CONTRACT.md`
  The required shape for operator-facing docs, runbooks, and recovery guides.
- `PROOF_ASSET_CONTRACT.md`
  The metadata contract for any artifact used to support a public or partner
  claim.
- `SOURCE_REGISTER.md`
  The system-of-record map for where claims, procedures, and product truth come
  from.
- `PROOF_ASSET_LIBRARY.md`
  The index of reusable evidence by audience and claim.
- `COMMUNICATION_OPERATING_SYSTEM.md`
  The cadence system and the rules for turning finished operator work into
  public, partner, and investor outputs.
- `ARTICLE_SERIES_ROADMAP.md`
  The proof-backed article sequence.
- `articles/`
  The first shipped article drafts linked from the roadmap.
- `PARTNER_VC_NARRATIVE.md`
  The concise positioning framework for partner and investor materials.
- `PARTNER_VC_ONE_PAGER.md`
  The short-form external brief derived from the proof-backed narrative.
- `LIGHTWEIGHT_DATA_ROOM.md`
  The minimum diligence room and link set for serious partner/investor review.
- `OUTREACH_MESSAGES.md`
  Proof-backed outreach drafts for partners, investors, and programs.
- `TARGET_DOSSIER_TEMPLATE.md`
  The one-page dossier template for specific targets and programs.
- `dossiers/`
  The live target-specific dossiers derived from the template.
- `CATEGORY_DECK_BRIEF.md`
  The current category-deck spine and proof expectations.
- `LAUNCH_STRATEGY_AND_NEXT_90.md`
  The launch type, launch bar, post-launch loop, and next-90 plan.
- `EXPLICIT_OVERLAP_THESIS.md`
  The rule for how adjacent products support the main 555 thesis.
- `artifacts/`
  First-cycle shipped artifacts for recurring communication tickets.

## Operating rules

1. Tickets are the unit of execution and acceptance.
2. Repo-local documentation remains canonical.
3. Board status must reflect default-branch or agreed canonical-branch reality,
   not the existence of work on a topic branch.
4. Public narrative is derived from operator truth and proof assets.
5. No doc ticket closes without evidence links.
6. Recurring/cadence tickets close only when the template exists and the first
   real artifact has shipped.
