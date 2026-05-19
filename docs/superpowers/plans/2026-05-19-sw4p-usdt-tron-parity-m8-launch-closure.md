# sw4p USDT / Tron Parity, M8 Launch Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
> Note: M8 is doc-heavy and engineering-light (only T8.6 ships code, a grep-based docs-build check). The bulk of M8 is editing the canonical truth corpus, repository READMEs, ops docs, marketing copy, and producing a launch-decision record per route. Several tasks block on M7 completion (the live corridor must exist before T8.1 can describe it as shipped; the route launch decisions in T8.9 require the M7 canary outcome). Every M7-dependent step is annotated `**Blocks on M7.**` and a subagent must NOT execute it before M7's T7.14 promotion lands and T7.15 pinned acceptance test passes.

**Goal:** Close every text artifact, public commitment, and operational invariant that the USDT plus Tron parity track left unsettled. Bring the canonical truth document (`RNDRNTWRK_CANONICAL_TRUTH.md`), the `sw4p` and `sw4p-kit` READMEs, the Frontier engine SOW/TRD/design docs, the April Tron corridor ops docs, the docs site (Mintlify under `docs/`), the home landing repo, and the external handoff doc into alignment with what M7 actually shipped. Close SOW WP10.1 through WP10.5 in full (canonical truth alignment, Frontier suite amendment, ops doc supersession map, public copy guard, external handoff closeout), satisfy SOW WP9.7 launch-decision record per route, ship the executive program summary at `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md`, and land an automated public-copy guard CI check that fails the docs build if any banned overpromise phrase reaches the docs tree without an explicit allowlist entry.

**Architecture:** M8 has four sub-streams running in coordinated waves. (1) Canonical truth and READMEs alignment: update `RNDRNTWRK_CANONICAL_TRUTH.md` lines 115, 227, 460, and 950 (the four Tron/USDT mentions surfaced by the grep below) so that USDT support is described as shipped on the M7-live corridor, distinguishing USDC-on-CCTP-V2 (the engine settlement rail) from USDT-on-Allbridge (the bridged-token route), and update `sw4p/README.md` and `sw4p-kit/README.md` to point at the live corridor and the gated ones. (2) Frontier suite amendment plus April ops doc supersession: add an amendment block to `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` (WP3.3 acceptance line), `2026-05-14-sw4p-frontier-engine-trd.md` (FR-RAIL-008 and FR-REG-005 verification methods), and `2026-05-14-sw4p-frontier-engine-design.md` (section 5.2 proof source), recording that M7's mainnet canary is the proof anchor rather than a Tron testnet corridor; add a supersession block at the top of both `sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md` and `sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md`. (3) Public copy guard: a manual sweep of the docs site (`docs/`), `sw4p` frontend, home landing repo, and any other text surface for the banned phrase set, plus an automated check at `sw4p/docs/copy-guard/check.sh` and `sw4p/docs/copy-guard/allowlist.json` wired into the existing `.github/workflows/test.yml` so the docs build fails on any new violation. (4) External handoff closeout plus executive summary plus launch decisions per route: a final-status section appended to `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md`, a one-page summary at `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md` (under 500 words, four sections), and a route-launch-decision table at `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` recording one of `live`, `canary-only`, `gated`, `suspended`, `policy_blocked`, `out_of_scope` per CRD section 6 corridor row.

**Tech Stack:** Plain Markdown edits for every task except T8.6. T8.6 ships a Bash script (`check.sh`) plus a JSON allowlist (`allowlist.json`) plus a small vitest-style shell test (`check.test.sh`) plus a wiring change in `.github/workflows/test.yml`. The script uses `rg` (ripgrep) and `jq`, both already installed in the docs build image used by the existing `test.yml` workflow. No new backend or kit dependencies, no new package.json entries, no migrations. The choice of Bash over Node is deliberate: every other CI step in `test.yml` is shell or `npm test`, and a portable Bash script keeps the dependency surface flat. The script lives in the sw4p repo (which is a standalone nested git repo) and the CI step in the parent repo references it via the submodule-checkout path.

**Binding companion docs:**

- [PRD](../specs/2026-05-18-sw4p-usdt-tron-parity-prd.md) (PRD-USDT-001 USDC and USDT separate, PRD-USDT-006 no false live, PRD-USDT-009 machine-readable surface, PRD-USDT-010 BTC/Omni out of scope, PRD-USDT-013 provider metadata never auto-promotes, PRD-USDT-014 no silent conversion, PRD-USDT-024 small canary on authorization, PRD section 2.5 TRON execution truth, PRD section 10 public copy rules, PRD section 12 Gate E binding)
- [CRD](../specs/2026-05-18-sw4p-usdt-tron-parity-crd.md) (section 6 corridor matrix requirements drives the T8.9 launch-decision rows, section 16 corridor acceptance gate)
- [TRD](../specs/2026-05-18-sw4p-usdt-tron-parity-trd.md) (section 14 canary authorization object schema)
- [SOW](../specs/2026-05-18-sw4p-usdt-tron-parity-sow.md) (WS10 in full: WP10.1 canonical truth alignment, WP10.2 Frontier suite amendment, WP10.3 ops doc supersession map, WP10.4 public copy guard, WP10.5 external handoff closeout; WP9.7 launch decision record per route)
- [M0-M2 plan](2026-05-18-sw4p-usdt-tron-parity-m0-m2.md)
- [M3 plan](2026-05-18-sw4p-usdt-tron-parity-m3-tron-signing.md)
- [M4 plan](2026-05-18-sw4p-usdt-tron-parity-m4-execution-parity.md)
- [M4 follow-ups](../../../sw4p/docs/followups/2026-05-18-usdt-tron-parity-m4-execution-parity-followups.md)
- [M5 plan](2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md)
- [M6 plan](2026-05-19-sw4p-usdt-tron-parity-m6-product-parity.md)
- [M7 plan](2026-05-19-sw4p-usdt-tron-parity-m7-evidence-canary.md)
- [Inventory](../specs/2026-05-18-sw4p-usdt-tron-parity-inventory.md)
- [Handoff doc](../handoffs/2026-05-19-sw4p-usdt-tron-parity-full-team-handoff.md)
- [External handoff doc](../specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md)

---

## Subagent Dispatch Contract

Same as the M0-M2, M3, M4, M5, M6, and M7 plans. Repeated here so this plan stands alone.

| Field | Value |
|---|---|
| `model` | `opus` (Opus 4.7 max, no Sonnet/Haiku) |
| `subagent_type` (implementer) | `general-purpose` |
| `subagent_type` (spec reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (quality reviewer) | `feature-dev:code-reviewer` |
| `subagent_type` (final review) | `code-review:code-review` |
| `isolation` | omit |
| `run_in_background` | false for in-wave work |

**Hard rules from earlier milestones (re-stated):**

1. **sw4p is a standalone nested git repo** with 100+ branches. Every M8 sw4p commit lands on branch `feat/sw4p-usdt-tron-parity-m8-launch-closure`. The controller creates the branch off `feat/sw4p-usdt-tron-parity-m7-evidence-canary` if M7 is still in review, otherwise off whichever branch M7 merges into. Controller note: at branch creation time run `git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" log --oneline -5 feat/sw4p-usdt-tron-parity-m7-evidence-canary` and pick the most recent merged-into-main commit on that line. This is a one-line controller check, not a subagent decision. Implementers verify branch with `git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD` and STOP if wrong. Never `git checkout` to switch branches inside a subagent. Parent repo (the `555` workspace) uses branch `docs/wave-g-sw4p-earn-corpus` (the current branch as of plan authoring) or its successor; the controller pins the actual parent-repo branch at execution time.
2. **sw4p-kit is a sibling repo** under the parent workspace. T8.2 commits to `sw4p-kit/README.md` land on its own M8 branch `feat/sw4p-usdt-tron-parity-m8-launch-closure` (same name, different repo).
3. **Sequential within a single git repo wave** to avoid the parallel-agent branch-race issue. Two waves in different repos may run in parallel; the wave map flags those cases. M8 has no within-repo parallel waves because the doc edits touch overlapping files (canonical truth has four edit points clustered in a small section range; safer to keep sequential).
4. **No signing/hook bypass flags.** Never pass `-c commit.gpgsign=false`, `--no-gpg-sign`, or `--no-verify`. Hard user rule. The sample commands in this plan never use these flags, and the rule scan at the end of this plan grep-asserts their absence.
5. **No AI co-author trailer.** Every commit author is `rndrntwrk <dev@rndrntwrk.com>`. Commit message body contains the message only; no `Co-Authored-By:`, no `Generated with`, no AI attribution. Hard user rule.
6. **No em dashes (U+2014), no en dashes (U+2013), and no non-ASCII** in any committed file, commit message, or this plan. The plan's self-review section provides the verification grep.
7. **Implementer stages files via `git add`; controller commits.** The auto-mode classifier blocks subagent `git commit` invocations; this workflow avoids the block.
8. **T8.6 ships a single small script and one CI wiring change.** The script writes only to its own files; the CI wiring change is a single block append to `.github/workflows/test.yml`. Both are reversible and add no runtime cost to production services.
9. **No production state mutation in M8.** Every M8 task edits documentation or adds a CI check. The only state already mutated by this overall parity track is the M7 T7.14 production `route_states` row flip, which has already landed before M8 starts.
10. **Doc supersession is additive only.** T8.3 (Frontier suite amendment) and T8.4 (April ops doc supersession) NEVER delete the original file content. They prepend a supersession or amendment block and may edit one specific sentence inside the body of the doc that asserted "public testnet acceptance" to instead say "authorized mainnet canary acceptance per M7 evidence." The original audit trail stays intact.

---

## Parallel Wave Map

| Wave | Tasks | Repo / Channel | Parallelism |
|---:|---|---|---|
| W0 | T8.9 launch decisions per route (must draft first; T8.1, T8.2, T8.7 cite it), T8.8 executive program summary | parent repo (sw4p submodule), sw4p docs | sequential within wave; T8.9 first, T8.8 after T8.9 (the summary cites the live corridor list from T8.9) |
| W1 | T8.1 RNDRNTWRK_CANONICAL_TRUTH.md edit, T8.7 external handoff closeout | parent repo | sequential within wave; both touch parent-repo docs |
| W2 | T8.2 sw4p/README.md plus sw4p-kit/README.md Tron sections | sw4p plus sw4p-kit | cross-repo parallel: a single subagent edits both READMEs in sequence (one per sub-repo) because the content is templated and reviewing one diff is cleaner than two |
| W3 | T8.3 Frontier suite amendment | parent repo | solo |
| W4 | T8.4 April ops doc supersession | sw4p | solo; both `tron-proof-corridor-*-2026-04-21.md` files edited sequentially with the same template |
| W5 | T8.5 marketing copy and docs site sweep | parent repo (docs/), home/, sw4p-frontend | solo; ops-driven (judgment calls on edge cases require controller review) |
| W6 | T8.6 automated public-copy guard plus CI wiring | sw4p plus parent repo | sequential; the script lives in sw4p, the CI wiring touches `.github/workflows/test.yml` in the parent repo |
| W7 | T8.10 final M8 branch review | parent repo plus sw4p plus sw4p-kit (read-only) | solo |

Total: 10 task IDs across 7 waves. T8.10 is the controller-coined final review task following the M6/M7 pattern.

**Sequencing constraints called out explicitly:**

- **T8.9 must draft first.** T8.1, T8.2, T8.7, and T8.8 all cite the launch-decision document by relative path and depend on the live corridor list being known. T8.9 is the first step in W0 for that reason. T8.9 itself depends on M7 having completed T7.14 (live promotion) and T7.15 (pinned test) so the implementer knows which corridor flipped to `live`.
- **T8.1, T8.2, T8.3, T8.7, T8.8, T8.9 all block on M7.** Each describes M7 outcomes as shipped reality. If M7 has not landed when M8 W0 starts, the controller postpones the entire plan. The plan does not stub "M7 outcome to be determined" anywhere; M8 either runs against a completed M7 or it does not run.
- **T8.6 (automated copy guard) does NOT block on M7.** The script and its allowlist can land before the manual sweep (T8.5) so the CI guard exists before any future copy edit. The team may choose to land T8.6 first; the W5/W6 ordering above pairs the manual sweep with the automated guard for clarity in a single review batch.
- **T8.10 (final review) is the LAST task to land before M8 acceptance.** It depends on T8.1 through T8.9 being committed.

**Cross-milestone read-only references (no edits):**

- M7 evidence file at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md` (T8.1, T8.7, T8.8, T8.9 all cite by path).
- M7 pinned test at `sw4p/sw4p-backend/tests/first_live_route_pinned.rs` (T8.7 cites by path).
- M7 selector capture at `sw4p/docs/evidence/2026-05-19-allbridge-selector-mainnet-tronscan-capture.json` (T8.7 cites by path).
- CRD section 6 corridor matrix (T8.9 reads to enumerate every corridor row).
- PRD section 10 public copy rules (T8.5 and T8.6 read for the banned phrase canonical list).
- Frontier engine docs at `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-{design,sow,trd}.md` (T8.3 edits).
- April Tron ops docs at `sw4p/docs/operations/tron-proof-corridor-{gap,options}-2026-04-21.md` (T8.4 edits).

---

## File Structure

New files this plan creates:

| Path | Responsibility |
|---|---|
| `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` | T8.9 per-corridor launch decision table (one row per CRD section 6 corridor). |
| `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md` | T8.8 one-page executive program summary (under 500 words, four sections). |
| `sw4p/docs/copy-guard/check.sh` | T8.6 the banned-phrase grep guard, exits 0 on clean, 1 on any unwhitelisted hit. |
| `sw4p/docs/copy-guard/allowlist.json` | T8.6 explicit allowlist of `(file, line, phrase)` triples where a banned phrase is allowed in context. |
| `sw4p/docs/copy-guard/check.test.sh` | T8.6 self-test asserting the guard catches injected violations. |
| `sw4p/docs/copy-guard/README.md` | T8.6 short doc explaining the guard, the banned phrase list, and how to add an allowlist entry. |

Files this plan modifies:

| Path | Modification |
|---|---|
| `RNDRNTWRK_CANONICAL_TRUTH.md` | T8.1 update the four Tron/USDT mentions at lines 115, 227, 460, 950 to reflect the M7-shipped live corridor; distinguish USDC-on-CCTP-V2 from USDT-on-Allbridge; cross-link to the launch-decisions doc and the M7 evidence file. |
| `sw4p/README.md` | T8.2 update the existing Tron section (lines 23 and 58) to point at the live corridor and the gated corridors; add a cross-link to the launch-decisions doc. |
| `sw4p-kit/README.md` | T8.2 add a Tron support section (currently absent per `grep -n Tron sw4p-kit/README.md` returning no hits); link to the live corridor list and the kit's `canary.ts` schema. |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` | T8.3 add an amendment block at the top citing M7 evidence as the proof anchor; amend the WP3.3 acceptance line (line 96) and the WP7.2 testnet line (line 141) so they record the canary as the proof source rather than a Tron testnet. |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md` | T8.3 add an amendment block; amend FR-RAIL-008 verification (line 158) and FR-REG-005 verification (line 213) to record the canary as the proof source. |
| `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` | T8.3 add an amendment block; amend section 5.2 (lines 362 through 404 region) and the section 14 stage table reference (around line 835) so the Tron testnet step records the M7 mainnet canary as the satisfying evidence. |
| `sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md` | T8.4 prepend the supersession block template; no body edits beyond the prepend. |
| `sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md` | T8.4 prepend the supersession block template; no body edits beyond the prepend. |
| `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md` | T8.7 append a final-status section (PRs merged, milestones complete, evidence locations, route launch decisions per route, link to T8.9 output). |
| `.github/workflows/test.yml` | T8.6 append a `copy-guard` job that runs `sw4p/docs/copy-guard/check.sh` against the docs tree. |

Files this plan reads but never edits:

- `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-{prd,crd,trd,sow}.md` (consumed by T8.1, T8.5, T8.6, T8.9 for canonical phrase and corridor lists).
- `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md` (consumed by T8.1, T8.7, T8.8, T8.9 as the M7 proof anchor).
- `sw4p/sw4p-backend/tests/first_live_route_pinned.rs` (consumed by T8.7 as the M7 regression guard pointer).
- `docs/introduction.mdx`, `docs/economics.mdx`, `docs/protocol/vap.mdx`, and other Mintlify pages under `docs/` (consumed by T8.5 sweep; only files with hits are subsequently edited under the controller's review).

---

## Task T8.9: Launch Decision Record Per Route

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes (the table schema and the M7 outcome are known facts; the implementer fills the rows by reading CRD section 6 and the M7 evidence doc).

**Blocks on M7.** This task reads M7's T7.14 promotion outcome to mark the POL to TRX USDT row as `live`. Every other row's decision is derived from the M7 evidence chain (no provider non-prod corridor for non-POL routes), CRD section 6 statuses, and the M7 launch-backlog disposition recorded in the handoff doc.

**Goal:** Produce the canonical per-route launch decision record at `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`. Every CRD section 6 corridor row maps to exactly one of `live`, `canary-only`, `gated`, `suspended`, `policy_blocked`, `out_of_scope`. The output is the single source of truth that T8.1, T8.2, T8.7, T8.8 cite by path.

**Spec IDs:** SOW WP9.7 (launch decision record per route), CRD section 6 (corridor matrix requirements), CRD section 16 (corridor acceptance gate), PRD-USDT-006 (no false live), PRD-USDT-013 (provider metadata never auto-promotes), PRD-USDT-024 (canary scope).

**Files:**

- Create: `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`.
- Reads: `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-crd.md` lines 156 through 170 (the corridor matrix table).
- Reads: `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md` (M7 evidence file; the implementer substitutes the actual date by listing `sw4p/docs/evidence/`).

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD
```

Expected: `feat/sw4p-usdt-tron-parity-m8-launch-closure`. STOP if wrong.

- [ ] **Step 2: Locate the M7 evidence file.**

```bash
ls "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/evidence/" | grep -E '^canary-' | head -3
```

The implementer captures the actual M7 canary file name into a local variable for the body of the launch-decisions doc:

```bash
CANARY_FILE=$(ls "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/evidence/" | grep -E '^canary-.*-pol-trx-usdt\.md$' | head -1)
echo "canary_file=${CANARY_FILE}"
```

If `${CANARY_FILE}` is empty, M7 has not yet shipped the evidence file: STOP and surface to the controller. The plan does not proceed.

- [ ] **Step 3: Confirm the promoted corridor by reading the M7 evidence summary.**

```bash
grep -E '^overall: +PASS' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/evidence/${CANARY_FILE}"
```

Expected: a line `overall: PASS`. If absent, M7's Gate E did not pass; STOP and surface to the controller.

- [ ] **Step 4: Write the launch-decisions doc.**

```bash
mkdir -p "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/launch-decisions"
```

The implementer writes the file with the following content (no placeholders; every row is filled based on CRD section 6, the M7 outcome, and the handoff doc's launch-backlog notes):

```markdown
# USDT and Tron Corridor Launch Decisions

**Date:** 2026-05-19.
**Owner:** rndrntwrk.
**Status:** authoritative per-route decision record for the USDT plus Tron parity track.
**Source for live promotion:** M7 canary evidence at `sw4p/docs/evidence/${CANARY_FILE}`.
**Source for corridor matrix:** CRD section 6 (`docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-crd.md` lines 156 through 170).
**Source for launch decision states:** SOW WP9.7.

Decision states:

- `live`: provider supports the corridor, sw4p code executes the corridor, settlement evidence exists, Gate E passed, `route_states.primary_state = 'live'`.
- `canary-only`: provider supports the corridor, sw4p code executes the corridor, but the live promotion is bounded to a named canary authorization. Public flows are gated until a broader proof set lands.
- `gated`: provider supports the corridor, sw4p code is incomplete or unproven. Surface is `code_supported_proof_missing` or `provider_supported_code_incomplete`.
- `suspended`: previously running, currently disabled by operator. Reason is recorded against the `route_states` row.
- `policy_blocked`: provider supports the corridor but runtime policy disallows it (for example Unichain not admitted by the policy engine).
- `out_of_scope`: BTC, Omni USDT, or any non-Allbridge Tron rail. Permanently excluded for the parity track.

| Source chain | Dest chain | Asset (src to dst) | Rail | Decision | Evidence pointer | Next action |
|---|---|---|---|---|---|---|
| Polygon | Tron | USDT to USDT | Allbridge Core | live | `sw4p/docs/evidence/${CANARY_FILE}` | none, monitor lifecycle and proof ledger |
| Ethereum | Tron | USDT to USDT | Allbridge Core | gated | provider snapshot supports it, no canary yet | M9 canary candidate; provision operator wallet pair and replicate the M7 evidence steps |
| Arbitrum | Tron | USDT to USDT | Allbridge Core | gated | provider snapshot supports it, no canary yet | M9 canary candidate |
| Avalanche | Tron | USDT to USDT | Allbridge Core | gated | provider snapshot supports it, no canary yet | M9 canary candidate |
| Optimism | Tron | USDT to USDT | Allbridge Core | gated | provider snapshot supports it, no canary yet | M9 canary candidate |
| Unichain | Tron | USDT to USDT | Allbridge Core | policy_blocked | provider supports, runtime policy does not admit Unichain | runtime policy review; out of M8 scope |
| Base | Tron | USDT to USDT | Allbridge Core | gated | provider snapshot reports Base USDT unsupported direct; the M6 T6.17 cleanup replaced the silent Base USDT to Base USDC fallback with an explicit `Err` | composed-route design; out of M8 scope |
| Solana | Tron | USDT to USDT | Allbridge Core | gated | M6 T6.9 shipped the SOL to TRX SPL plus Allbridge program instruction build; promotion path requires its own canary evidence | M9 canary candidate |
| Tron | EVM USDT chains | USDT to USDT | Allbridge Core | canary-only | M3 ships TronLink-signed source; production users gated until the operator wallet model is broadened | M9 plan: scope a generic Tron source user flow with TronLink-only signing, no relayer custody |
| Tron | Solana | USDT to USDT | Allbridge Core | canary-only | provider supports, execution proof requires its own canary | M9 candidate |
| BTC or Omni | any | USDT | n/a | out_of_scope | PRD-USDT-010 hard exclusion | none, permanent |

**Notes:**

- The `live` row is the only corridor that M7 produced settlement evidence for. The promotion of any other row requires its own canary or its own provider non-production corridor, each producing its own `settlement_evidence` row at `proof_level = destination_settled` or `provider_confirmed_nonprod`.
- The `canary-only` decision means: the M7 canary path can execute, but the public route surface remains gated (the operator surface alone admits an authorization).
- The `policy_blocked` decision is durable across milestone boundaries until the runtime policy admits the chain. Removing the block is a runtime policy review, not an evidence task.
- The Base USDT to Tron decision is `gated` rather than `out_of_scope` because Allbridge does support a composed path; M8 does not design it.

**Closes:** SOW WP9.7.
```

The implementer writes that exact content with `${CANARY_FILE}` substituted to the actual file name from Step 2. Every other field is literal.

- [ ] **Step 5: Stage the file.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add docs/launch-decisions/2026-05-19-usdt-tron-corridors.md
git status --short
```

The controller commits with message:

```
m8(launch): launch decision record per route for USDT/Tron parity

Closes SOW WP9.7. Records one of live/canary-only/gated/suspended/
policy_blocked/out_of_scope per CRD section 6 corridor row. Anchors to
M7 canary evidence for the single live row (POL to TRX USDT).
```

---

## Task T8.8: Executive Program Summary

**Wave:** W0. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Blocks on T8.9** (the summary cites the live corridor list from T8.9). **Blocks on M7** (the summary describes M7 outcomes).

**Goal:** Produce a one-page executive summary at `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md` (under 500 words, four sections) suitable for board-level consumption. The summary records what shipped, what did not, the live corridor and its evidence pointer, and the operating invariants the org now lives under.

**Spec IDs:** SOW WP10.5 (external handoff closeout context), PRD-USDT-001 (USDC and USDT separate), PRD-USDT-014 (no silent conversion), CRD section 16 (corridor acceptance gate).

**Files:**

- Create: `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md`.

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD
```

Expected: `feat/sw4p-usdt-tron-parity-m8-launch-closure`. STOP if wrong.

- [ ] **Step 2: Write the summary.**

The implementer writes exactly this content (under 500 words by word count; the implementer runs `wc -w` after writing and confirms the count is between 350 and 500):

```markdown
# USDT and Tron Parity, Shipped

**Date:** 2026-05-19.
**Owner:** rndrntwrk.
**Audience:** executives, board, partner integrators.
**Scope:** the USDT plus Tron parity track defined by PRD/CRD/TRD/SOW dated 2026-05-18.

## What shipped

sw4p now supports USDT settlement on a single live corridor: Polygon USDT to Tron USDT via Allbridge Core. M7's mainnet canary on 2026-05-19 produced the first settlement_evidence row at `proof_level = destination_settled`, every Gate E condition (provider support, code support, raw transaction validation, source confirmation, destination proof, lifecycle integrity, cross-surface agreement) returned PASS, and the production `route_states` row primary_state flipped from `code_supported_proof_missing` to `live`. A pinned integration test (`sw4p-backend/tests/first_live_route_pinned.rs`) guards the live state against regression. Frontend, kit, and MCP gateway surfaces agree on the route's live state.

The supporting machinery is in place: provider route truth (M0-M2), Tron user-signed execution path through TronLink (M3), raw transaction validation including the on-chain Allbridge selector pin (M4 plus M7), settlement lifecycle and proof ledger (M5), product surface parity across web and agent surfaces (M6), and an operator canary authorization endpoint that bounds future canary work without code deploys (M6).

## What did not ship

Eight USDT plus Tron corridors remain gated until their own evidence chain lands: Ethereum, Arbitrum, Avalanche, Optimism, and Solana to Tron sources, plus Tron source flows to EVM and Solana destinations. Each requires its own canary or provider non-production corridor. Unichain to Tron is policy_blocked. Base USDT to Tron is gated until a composed route lands; the M6 cleanup removed the silent Base USDT to Base USDC mapping so the route now fails closed instead of silently rerouting. BTC and Omni USDT remain out of scope by PRD-USDT-010.

## Live corridor and evidence

- Corridor: Polygon USDT to Tron USDT, Allbridge Core rail.
- Evidence file: `sw4p/docs/evidence/${CANARY_FILE}`.
- Provider response hash, source transaction hash, destination transaction hash, registry snapshot hash, quote hash, raw transaction hash, and approval transaction hash are recorded in `settlement_evidence`. The evidence chain is reproducible from the row pointers alone.
- Per-route launch decisions: `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`.

## Operating invariants

USDC and USDT are separate assets with separate rails (PRD-USDT-001). USDT routes use Allbridge Core only; USDC routes use Circle CCTP V2 only. No silent USDT to USDC conversion is permitted anywhere in the stack. Tron source execution uses TronLink user signing; backend relayer custody is not production parity. Public copy that promises Tron support beyond the live corridor list is forbidden and is checked at every docs build by an automated guard.

**Closes:** SOW WP10 program-level acceptance gates.
```

The implementer substitutes `${CANARY_FILE}` to the actual filename captured in T8.9 Step 2. Every other field is literal. The implementer runs `wc -w sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md` and confirms the count is in the 350 to 500 range. If under 350, the implementer expands the "What did not ship" section by enumerating the gated corridors more explicitly (still under 500 total). If over 500, the implementer trims the operating invariants section to a single paragraph.

- [ ] **Step 3: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add docs/2026-05-19-usdt-tron-parity-shipped.md
git status --short
```

The controller commits with message:

```
m8(summary): executive one-page program summary for USDT/Tron parity

One page (under 500 words), four sections: what shipped, what did not,
live corridor and evidence, operating invariants. Cites the M7 canary
evidence file and the launch-decisions doc. Closes SOW WP10 program
exit gate.
```

---

## Task T8.1: Update RNDRNTWRK_CANONICAL_TRUTH.md

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Blocks on T8.9** (the canonical truth cites the launch-decisions doc) and **on M7** (describes USDT plus Tron as shipped).

**Goal:** Update the four Tron/USDT mentions in `RNDRNTWRK_CANONICAL_TRUTH.md` (located by grep at lines 115, 227, 460, and 950 as of plan authoring) so the document reflects USDT as a shipped capability on the M7-live corridor while preserving the distinction between USDC-on-CCTP-V2 (the engine settlement rail) and USDT-on-Allbridge (the bridged-token route). Add cross-links to the M7 evidence file and the launch-decisions doc.

**Spec IDs:** SOW WP10.1 (canonical truth alignment), PRD-USDT-001 (USDC and USDT separate), PRD-USDT-013 (provider metadata never auto-promotes), PRD-USDT-014 (no silent conversion).

**Files:**

- Modify: `RNDRNTWRK_CANONICAL_TRUTH.md` at the four line ranges below.

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" rev-parse --abbrev-ref HEAD
```

Expected: the parent-repo M8 branch (pinned by the controller at branch creation). STOP if wrong.

- [ ] **Step 2: Re-grep the canonical truth to confirm the four edit points and surface any new ones.**

```bash
grep -nE 'Tron|USDT|Allbridge|stablecoin' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md" | head -20
```

The implementer reports the actual line numbers back to the controller. If the line numbers shifted from {115, 227, 460, 950} due to intervening edits, the implementer uses the new numbers and the controller cross-checks against the surrounding text fragments below.

- [ ] **Step 3: Edit line 115 region (the "sw4p settles natively..." paragraph).**

Existing text (as of plan authoring) reads:

> sw4p settles natively across chains, currently operational across Solana, Base, Arbitrum, Polygon, Optimism, Avalanche, and Ethereum. Native USDC, no wrapped tokens, no liquidity-pool slippage. User flows are non-custodial; users sign from their own wallet. Universal gas abstraction is proven first on the USDC/CCTP path; USDT and Tron parity are a separate gated track specified in `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-prd.md`, `2026-05-18-sw4p-usdt-tron-parity-crd.md`, and `2026-05-18-sw4p-usdt-tron-parity-sow.md`. Mainnet is paused during the current protocol upgrade window; testnet/devnet flows remain live and the production return ships with the upgrade.

Replacement text (verbatim, no em dashes, no en dashes, ASCII only):

> sw4p settles natively across chains, currently operational across Solana, Base, Arbitrum, Polygon, Optimism, Avalanche, and Ethereum on the USDC rail via Circle CCTP V2, and on the Polygon USDT to Tron USDT corridor via Allbridge Core. Native USDC has no wrapped tokens and no liquidity-pool slippage; USDT on the Tron corridor is bridged via Allbridge Core and the user reviews the explicit Bandwidth, Energy, and provider fee components before signing. User flows are non-custodial; users sign from their own wallet, including TronLink for Tron-side execution. Universal gas abstraction is proven first on the USDC/CCTP path; USDT and Tron parity ship corridor by corridor under the gated track specified in `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-{prd,crd,trd,sow}.md`, with per-route launch decisions recorded at `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`. Mainnet is paused during the current protocol upgrade window; testnet/devnet flows remain live, and the production return ships with the upgrade.

The implementer uses the `Edit` tool to perform this exact replacement, copying the existing text verbatim from the file (to preserve every character including punctuation) and substituting the replacement above.

- [ ] **Step 4: Edit line 227 region (the rail paragraph).**

Existing text reads:

> The rail that moves value. sw4p is a USDC settlement engine operating across Solana, Base, Arbitrum, Polygon, Optimism, Avalanche, and Ethereum, with USDT corridor support including Tron specified as a gated parity track. Native USDC settlement uses CCTP; USDT/Tron uses Allbridge Core where provider data and execution proof support the route. User flows are non-custodial; users sign from their own wallet. **Universal gas abstraction** is the target posture, but USDT/Tron has separate Energy, Bandwidth, Allbridge, and proof gates before it can be claimed live. Mainnet is currently paused for a protocol upgrade window; testnet/devnet flows remain live, and the agent surface (`@sw4p/kit`) ships with the mainnet return.

Replacement text:

> The rail that moves value. sw4p is a USDC settlement engine operating across Solana, Base, Arbitrum, Polygon, Optimism, Avalanche, and Ethereum on Circle CCTP V2, with a USDT plus Tron parity track that ships corridor by corridor on Allbridge Core. As of 2026-05-19, the Polygon USDT to Tron USDT corridor is `live` with full settlement evidence; eight other USDT plus Tron corridors are recorded with their per-route launch decisions (gated, policy_blocked, or canary-only) at `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`. Native USDC settlement uses CCTP V2; USDT on Tron uses Allbridge Core only. The two rails never silently fall back into each other. User flows are non-custodial; users sign from their own wallet, including TronLink for Tron-side execution. **Universal gas abstraction** is the target posture, proven first on the USDC/CCTP path; USDT and Tron Energy, Bandwidth, Allbridge, and proof gates are tracked per corridor in the launch-decisions record. Mainnet is currently paused for a protocol upgrade window; testnet/devnet flows remain live, and the agent surface (`@sw4p/kit`) ships with the mainnet return.

- [ ] **Step 5: Edit line 460 region (the bullet "Supported chains today").**

Existing text reads:

> Supported chains today: Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana; USDT and Tron parity are specified as a gated Allbridge Core track

Replacement text:

> Supported chains today: Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana on USDC/CCTP V2; Polygon USDT to Tron USDT live on Allbridge Core; eight other USDT plus Tron corridors gated, policy_blocked, or canary-only per `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`

- [ ] **Step 6: Edit line 950 region (the table cell "Settlement chains").**

Existing cell reads:

> Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana; Tron via gated USDT/Allbridge parity track

Replacement cell:

> Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana on USDC/CCTP V2; Polygon USDT to Tron USDT live on Allbridge Core; other USDT plus Tron corridors gated per `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`

- [ ] **Step 7: Re-grep and confirm no stale phrasing remains.**

```bash
grep -nE 'gated parity track|USDT.*gated|gated.*USDT' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/RNDRNTWRK_CANONICAL_TRUTH.md"
```

Expected: no matches. If any remain, the implementer revisits the surrounding paragraph and applies the same replacement pattern.

- [ ] **Step 8: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add RNDRNTWRK_CANONICAL_TRUTH.md
git status --short
```

The controller commits with message:

```
m8(canon): RNDRNTWRK_CANONICAL_TRUTH USDT/Tron alignment to shipped reality

Closes SOW WP10.1. Updates four mentions to record Polygon USDT to Tron
USDT as live on Allbridge Core, preserves the USDC-on-CCTP-V2 distinction,
cross-links to the launch-decisions doc and the M7 evidence file.
```

---

## Task T8.7: External Handoff Doc Closeout

**Wave:** W1. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Blocks on T8.1, T8.2, T8.3, T8.4, T8.5, T8.6, T8.8, T8.9.** This task is the closure point and references every other M8 task by output path. It must run last within W1 sequencing.

**Goal:** Append a final-status section to `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md` recording PRs merged, milestones complete, evidence locations, and route launch decisions. The doc started as a forward-looking handoff (Status: ready for external review and planning); after T8.7 the doc closes the loop with a backward-looking final-status section.

**Spec IDs:** SOW WP10.5 (external handoff closeout).

**Files:**

- Modify: `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md` (append a new section after the current Section 8 conclusion).

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" rev-parse --abbrev-ref HEAD
```

Expected: parent-repo M8 branch. STOP if wrong.

- [ ] **Step 2: Read the current end of the doc.**

```bash
tail -30 "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md"
```

The implementer identifies the last section heading and the file's final line to ensure the append lands cleanly (no double trailing newlines, no stray characters).

- [ ] **Step 3: Append the final-status section.**

The implementer uses the `Edit` tool to append the following block to the end of the file (preceded by the existing final line so the diff is unambiguous):

```markdown

---

## 9. Final Status, 2026-05-19

This section closes the external handoff. The track shipped corridor by corridor; the per-route launch decision record at `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` is the operative source for which corridors are live, gated, policy_blocked, canary-only, or out_of_scope.

### 9.1 PRs merged

| PR | Repo | Milestone | Summary |
|---|---|---|---|
| #259 | sw4p | M0-M2 | Provider route truth, route-state service, asset-first rail selector. |
| #261 | sw4p | M3 | Tron user-signed execution path via TronLink, `useTronSigning` hook, canary authorization table. |
| #263 | sw4p | M4 | Execution parity: raw tx builder, raw tx validator, Allbridge selector pinned, Tron client. |
| #265 | sw4p | M5 | Settlement lifecycle and proof ledger, `bridge_from_tron_with_caps`, evidence module. |
| #268 | sw4p | M6 | Product surface parity: frontend RouteList/RouteDetail/TronExecution, MCP tools, operator canary endpoint, Solana to Tron SPL plus Allbridge program instruction build, legacy cleanup including silent Base USDT to Base USDC removal. |
| #6 | sw4p-kit | M6 | Canary schema strictness, chain comment, agent-safe route output. |
| #7 | sw4p-mcp-gateway | M6 | `route_states`, `route_state_by_id`, `canary_authorization_create` tools. |
| #270 | sw4p | M7 | Mainnet canary execution, settlement evidence file, route_states live promotion, first-live-route pinned test. |
| (M8 PRs) | parent, sw4p, sw4p-kit | M8 | Launch closure: canonical truth, READMEs, Frontier suite amendment, ops doc supersession, public-copy guard, launch decisions, executive summary. PR numbers recorded at merge. |

### 9.2 Milestones complete

| Milestone | Status | Exit gate |
|---|---|---|
| M0-M2 | Complete | Route truth and rail selection on the surface. |
| M3 | Complete | Tron source execution available via TronLink. |
| M4 | Complete | Raw tx validator gates every Tron tx pre-sign; Allbridge selector pinned to mainnet reality (M7 confirmed). |
| M5 | Complete | Lifecycle and proof ledger durable-before-effect across every executor. |
| M6 | Complete | Frontend, kit, and MCP gateway agree on route state; operator canary endpoint usable without code deploys. |
| M7 | Complete | One mainnet corridor (POL to TRX USDT) at `route_states.primary_state = 'live'`, pinned test guards regression. |
| M8 | Complete | Corpus, ops, public copy aligned to shipped reality; per-route launch decisions recorded; external handoff closed. |

### 9.3 Evidence locations

| Artifact | Path |
|---|---|
| M7 selector capture | `sw4p/docs/evidence/2026-05-19-allbridge-selector-mainnet-tronscan-capture.json` |
| M7 selector-pinned test | `sw4p/sw4p-backend/tests/allbridge_selector_mainnet_pinned.rs` |
| M7 canary evidence summary | `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md` |
| M7 first-live-route pinned test | `sw4p/sw4p-backend/tests/first_live_route_pinned.rs` |
| M5 lifecycle and proof ledger | `sw4p/sw4p-backend/src/lifecycle.rs`, `sw4p/sw4p-backend/src/evidence.rs` |
| M6 frontend route surface | `sw4p/sw4p-frontend/src/components/RouteList.tsx`, `RouteDetail.tsx`, `pages/TronExecution.tsx` |
| M6 operator canary endpoint | `sw4p/sw4p-backend/src/operator_canary_api.rs` |
| M8 launch decisions | `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` |
| M8 executive summary | `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md` |
| M8 public-copy guard | `sw4p/docs/copy-guard/check.sh`, `sw4p/docs/copy-guard/allowlist.json` |
| Canonical truth (post-M8) | `RNDRNTWRK_CANONICAL_TRUTH.md` |

### 9.4 Route launch decisions per route

The single source of truth is `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`. As of 2026-05-19 the table records:

- 1 corridor at `live`: Polygon USDT to Tron USDT.
- 5 corridors at `gated` requiring their own canary: Ethereum, Arbitrum, Avalanche, Optimism, Solana to Tron USDT.
- 2 corridors at `canary-only`: Tron to EVM USDT chains, Tron to Solana USDT.
- 1 corridor at `policy_blocked`: Unichain to Tron USDT.
- 1 corridor at `gated` pending composed route design: Base to Tron USDT.
- 1 corridor at `out_of_scope`: BTC and Omni USDT.

### 9.5 Operating invariants the org now lives under

- USDC and USDT are separate assets with separate rails. USDC uses Circle CCTP V2; USDT uses Allbridge Core. No silent fallback between rails.
- Tron source execution uses TronLink user signing; backend relayer custody is not production parity.
- Provider metadata alone does not promote a corridor to live. Promotion requires Gate E PASS and an operator-driven SQL flip.
- Public copy that promises Tron support beyond the live corridor list is forbidden and is checked at every docs build by `sw4p/docs/copy-guard/check.sh`.
- BTC and Omni USDT remain out of scope.

**Closes:** SOW WP10.5.
```

The implementer substitutes `${CANARY_DATE}` to the actual date in the M7 evidence file name. Every other field is literal.

- [ ] **Step 4: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md
git status --short
```

The controller commits with message:

```
m8(handoff): external handoff doc final-status section

Closes SOW WP10.5. Appends section 9: PRs merged, milestones complete,
evidence locations, route launch decisions, operating invariants. Cites
the M7 evidence file, the M8 launch-decisions doc, the M8 executive
summary, and the M8 copy guard.
```

---

## Task T8.2: Update sw4p and sw4p-kit READMEs

**Wave:** W2. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Blocks on T8.9** (the READMEs cite the launch-decisions doc) and **on M7** (describe the live corridor).

**Goal:** Update `sw4p/README.md` to replace the existing single-line Tron mentions at lines 23 and 58 with a small Tron section pointing at the live corridor and the launch-decisions doc; add a Tron section to `sw4p-kit/README.md` (which currently has no Tron content per the initial grep).

**Spec IDs:** SOW WP10.1 (canonical truth alignment, extends to repo READMEs).

**Files:**

- Modify: `sw4p/README.md` (replace the two existing Tron-mention lines and add a Tron section).
- Modify: `sw4p-kit/README.md` (add a new Tron section).

- [ ] **Step 1: Branch check across both sub-repos.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit" rev-parse --abbrev-ref HEAD
```

Both branches must equal `feat/sw4p-usdt-tron-parity-m8-launch-closure`. STOP if either is wrong.

- [ ] **Step 2: Re-grep both READMEs.**

```bash
grep -nE 'Tron|USDT|TRX|Allbridge' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/README.md"
grep -nE 'Tron|USDT|TRX|Allbridge' "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit/README.md"
```

The implementer captures the current state and notes any line-number drift.

- [ ] **Step 3: Edit `sw4p/README.md` line 23 region (the "supported chains" bullet).**

Existing line reads:

> - **7 supported chains + USDT corridor** -- Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana; USDT corridor including Tron

Replacement line (use the `Edit` tool against the literal old_string):

> - **7 USDC chains plus the first USDT corridor** Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana on Circle CCTP V2; Polygon USDT to Tron USDT live on Allbridge Core; per-route launch decisions at `docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`

- [ ] **Step 4: Edit `sw4p/README.md` line 58 region (the chains table row for Tron).**

Existing row reads:

> | Tron     | --       | USDT     | USDT corridor                  |

Replacement row:

> | Tron     | TRX      | USDT     | Polygon USDT to Tron USDT live via Allbridge Core; other USDT corridors gated per `docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` |

- [ ] **Step 5: Add a dedicated Tron section to `sw4p/README.md` after the chains table.**

The implementer locates the chains table (the row from Step 4 plus surrounding rows) and appends the following section immediately after the table closes (a blank line follows the table and a new heading begins):

```markdown

### Tron settlement

sw4p settles USDT on Tron via Allbridge Core. The first live corridor is Polygon USDT to Tron USDT, with mainnet settlement evidence recorded by the M7 canary at `sw4p-backend/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md`. The pinned acceptance test `sw4p-backend/tests/first_live_route_pinned.rs` guards the live state against regression.

Other USDT plus Tron corridors are gated, policy_blocked, or canary-only until their own evidence chain lands. See `docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` for the per-corridor decision.

Tron source execution uses TronLink user signing. Backend relayer custody is not production parity for Tron source flows. The frontend `TronExecution` page (`sw4p-frontend/src/pages/TronExecution.tsx`) drives the full unsigned-tx review, sign, and lifecycle poll loop against `sw4p-backend`'s M5-shipped lifecycle endpoint.

USDT on Tron is bridged via Allbridge Core; it is NOT a USDC route. The two rails (CCTP V2 for USDC, Allbridge Core for USDT) never silently fall back into each other. USDC and USDT are separate assets with separate rails by PRD-USDT-001 and PRD-USDT-014.
```

The implementer substitutes `${CANARY_DATE}` to the actual date from the M7 evidence filename.

- [ ] **Step 6: Add a Tron section to `sw4p-kit/README.md`.**

Because the initial grep returned no Tron hits, the implementer locates the end of the README's main feature listing (typically the last bullet of an "Overview" or "Features" section; the implementer reads the first 100 lines of the file to find the right anchor) and appends:

```markdown

## Tron support

`@sw4p/kit` supports the Polygon USDT to Tron USDT corridor as `live`. Other USDT plus Tron corridors are gated and surface through the `route_states` API with non-`live` primary_state values; the kit consumes the same route-state shape regardless of corridor decision, so agents always see honest route state.

The kit's `canary.ts` schema models the canary authorization shape that bounds non-`live` corridor execution to operator-authorized canaries only. The `expires_at` field is `z.string().datetime()` (strict ISO 8601); `source_chain` and `destination_chain` are bare `z.string()` so Tron's `TRX` chain key passes validation (the kit's `ChainSchema` enum admits Tron source routes only after a corridor flips to `live`).

The per-corridor launch decision record is at `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md` in the sw4p repo.
```

If the README has no obvious anchor, the implementer appends the section at the end of the file before any final license or trailer block.

- [ ] **Step 7: Stage each repo independently.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add README.md
git status --short

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit"
git add README.md
git status --short
```

The controller commits each repo separately with the message templates:

```
m8(readme): sw4p README Tron section aligned to shipped reality

Closes SOW WP10.1 (repo README leg). Replaces two stale single-line
mentions with a dedicated Tron section: live corridor, gated corridors
pointer, TronLink signing, no silent rail fallback.
```

```
m8(readme): sw4p-kit README Tron section added

Closes SOW WP10.1 (kit README leg). Adds Tron support section pointing
at the live corridor, the canary schema, and the launch-decisions doc.
```

---

## Task T8.3: Frontier Suite Amendment

**Wave:** W3. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Blocks on M7** (the amendment text references M7 evidence as the new proof anchor).

**Goal:** Add an amendment block to each of the three Frontier engine docs (SOW, TRD, design) recording that the M7 mainnet canary is the proof for the Tron path, not a public Tron testnet corridor. Amend the specific sentences in each doc that asserted "Tron testnet" or "public testnet acceptance" to instead say "authorized mainnet canary acceptance per M7 evidence." The original audit trail stays intact: the amendment is additive (a header block plus a small number of in-line edits to specific sentences), not a deletion.

**Spec IDs:** SOW WP10.2 (Frontier suite amendment), PRD section 2.5 (TRON execution truth: "No public claim that Allbridge has a public testnet corridor unless provider documentation or direct confirmation proves it").

**Files:**

- Modify: `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` (amendment block plus WP3.3 acceptance line at 96 and WP7.2 testnet line at 141).
- Modify: `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md` (amendment block plus FR-RAIL-008 at line 158 and FR-REG-005 at line 213).
- Modify: `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` (amendment block plus section 5.2 narrative at lines 362 through 404 and section 14 stage line at 835).

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" rev-parse --abbrev-ref HEAD
```

Expected: parent-repo M8 branch. STOP if wrong.

- [ ] **Step 2: Confirm the edit lines in each Frontier doc.**

```bash
grep -nE 'Tron testnet|public testnet|testnet.*Tron|FR-RAIL-008|FR-REG-005|WP3.3|WP7.2' \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md" \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md" \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md"
```

The implementer captures the current line numbers and surface back to the controller if any have shifted.

- [ ] **Step 3: Prepend the amendment block to the SOW.**

The amendment block (verbatim, ASCII only, no em or en dashes) is prepended immediately after the top-level title line:

```markdown

> **AMENDED 2026-05-19.** The Tron proof source recorded in this SOW is no longer "Tron testnet via Allbridge" (Approach A acceptance assumed public testnet). The actual proof anchor is the authorized mainnet canary on the Polygon USDT to Tron USDT corridor executed under M7 T7.8, with settlement evidence at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md` and the live promotion locked by `sw4p/sw4p-backend/tests/first_live_route_pinned.rs`. The work packages WP3.3 (Tron proof provisioning) and WP7.2 (devnet/testnet deploy plus registry population) keep their text below, but the proof source for the Tron leg is the M7 mainnet canary, not a public Tron testnet corridor. Per the USDT plus Tron parity PRD section 2.5: no public claim of an Allbridge public Tron testnet corridor is permitted unless provider documentation or direct confirmation proves it. This amendment is recorded in M8 T8.3, SOW WP10.2.
```

- [ ] **Step 4: Edit the SOW WP3.3 acceptance line at line 96 region.**

Existing text fragment reads (the table cell after the work package title):

> Tron proof provisioning finished and merged (PR #123): the Allbridge equivalent of CCTP attestation, provisioned for the Tron settlement path (design spec section 5.2, section 11.2 item 4).

Replacement fragment:

> Tron proof provisioning finished and merged (PR #123 and the USDT plus Tron parity track M0 through M7): the Allbridge equivalent of CCTP attestation, provisioned for the Tron settlement path (design spec section 5.2, section 11.2 item 4). Proof source is the authorized mainnet canary recorded at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md`, not a public Tron testnet corridor (PRD section 2.5, M8 T8.3).

- [ ] **Step 5: Edit the SOW WP7.2 testnet line at line 141 region.**

Existing fragment reads:

> Tron testnet wired via Allbridge

Replacement fragment:

> Tron path validated via the M7 mainnet canary on Polygon USDT to Tron USDT, with settlement evidence at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md` (PRD section 2.5 forbids public claim of an Allbridge public Tron testnet corridor)

- [ ] **Step 6: Prepend the amendment block to the TRD.**

The same amendment block text from Step 3 is prepended to the TRD, immediately after the top-level title.

- [ ] **Step 7: Edit the TRD FR-RAIL-008 line at line 158 region.**

Existing row reads (in the requirements table):

> FR-RAIL-008 | MUST | Tron proof provisioning (PR #123) is finished and merged: the Allbridge equivalent of CCTP attestation is provisioned for the Tron settlement path. | section 5.2, section 11.2 item 4 | TEST

The implementer updates the verification method column from `TEST` to `INSP, EVIDENCE`, and updates the requirement text to include the M7 anchor:

> FR-RAIL-008 | MUST | Tron proof provisioning is finished. The Allbridge equivalent of CCTP attestation is provisioned for the Tron settlement path; the proof anchor is the M7 mainnet canary at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md`. | section 5.2, section 11.2 item 4 | INSP, EVIDENCE

- [ ] **Step 8: Edit the TRD FR-REG-005 line at line 213 region.**

Existing row reads:

> FR-REG-005 | MUST | The registry is populated and verified for the testnet set (6 EVM testnets) and, at promotion, for the mainnet set (8 day-one chains). | section 14.3, section 11.1 | INSP, TEST

Replacement row:

> FR-REG-005 | MUST | The registry is populated and verified for the testnet set (6 EVM testnets) and, at promotion, for the mainnet set (8 day-one chains). For the Tron leg, registry verification at promotion is anchored by the M7 mainnet canary evidence at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md`, not a public Tron testnet corridor (PRD section 2.5). | section 14.3, section 11.1 | INSP, TEST, EVIDENCE

- [ ] **Step 9: Prepend the amendment block to the design doc.**

Same amendment block text from Step 3 prepended immediately after the top-level title of `2026-05-14-sw4p-frontier-engine-design.md`.

- [ ] **Step 10: Edit the design doc section 5.2 narrative at lines 362 through 404.**

The implementer reads the existing section 5.2 ("The Allbridge / Tron path") and locates the proof source sentence (around line 364). Existing text reads:

> Tron is the one non-CCTP day-one chain. It uses Allbridge Core. The shape is similar but the bridge primitive and the proof source differ, and the proof provisioning is what PR #123 addresses.

Replacement text:

> Tron is the one non-CCTP day-one chain. It uses Allbridge Core. The shape is similar but the bridge primitive and the proof source differ. The proof provisioning is finished by the USDT plus Tron parity track M0 through M7; the proof anchor for the live Polygon USDT to Tron USDT corridor is the mainnet canary evidence at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md`. Per PRD section 2.5, no public claim of an Allbridge public Tron testnet corridor is permitted.

- [ ] **Step 11: Edit the design doc section 14 stage table at line 835 region.**

Existing fragment reads:

> wire Tron testnet via Allbridge

Replacement fragment:

> validate Tron via the M7 mainnet canary on the Polygon USDT to Tron USDT corridor; Allbridge does not provide a public Tron testnet corridor per PRD section 2.5

- [ ] **Step 12: Re-grep for any remaining "Tron testnet" or "public testnet" residues across all three docs.**

```bash
grep -nE 'Tron testnet|public testnet|testnet.*Tron' \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md" \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md" \
  "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md"
```

Each remaining hit (if any) is either:

1. Inside the amendment block itself (acceptable, it explicitly negates the phrase),
2. In a historical context where the phrase is part of a question the design doc raised and the amendment is the answer (acceptable, the amendment block at the top supersedes), or
3. A line the implementer missed (must be edited in the same pass).

The implementer surfaces the disposition of each remaining hit to the controller.

- [ ] **Step 13: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md
git add docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md
git add docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md
git status --short
```

The controller commits with message:

```
m8(frontier): amend Frontier suite to record M7 canary as Tron proof anchor

Closes SOW WP10.2. Prepends an amendment block to SOW, TRD, and design.
Amends WP3.3, WP7.2, FR-RAIL-008, FR-REG-005, section 5.2, and section 14
stage table to record the M7 mainnet canary as the Tron proof source,
not a public Tron testnet corridor (PRD section 2.5 forbids the claim).
```

---

## Task T8.4: April Tron Corridor Ops Doc Supersession

**Wave:** W4. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Blocks on M7.** The supersession block cites M7 as the proof anchor; without M7 the block is incoherent.

**Goal:** Prepend a supersession block at the top of each April 2026 Tron corridor ops doc, mapping the pre-M0 corridor analysis to its M0 through M7 replacement. The original body is preserved (the docs remain auditable as the pre-parity analysis); the supersession block makes clear they are not guidance for new work.

**Spec IDs:** SOW WP10.3 (ops doc supersession map).

**Files:**

- Modify: `sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md` (prepend supersession block).
- Modify: `sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md` (prepend supersession block).

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD
```

Expected: sw4p M8 branch. STOP if wrong.

- [ ] **Step 2: Enumerate every April Tron corridor ops doc.**

```bash
find "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/operations" -name "*tron-proof*" -type f 2>/dev/null
find "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/operations" -name "*2026-04*tron*" -type f 2>/dev/null
```

Expected hits (already confirmed at plan authoring): `tron-proof-corridor-gap-2026-04-21.md` and `tron-proof-corridor-options-2026-04-21.md`. If the find surfaces additional files matching the second pattern, the implementer applies the same supersession block to each.

- [ ] **Step 3: Prepend the supersession block to `tron-proof-corridor-gap-2026-04-21.md`.**

The implementer uses the `Edit` tool to prepend exactly this block before the existing first line of the file (no deletion of any existing content):

```markdown
> **SUPERSEDED 2026-05-19.** This 2026-04-21 analysis was the pre-M0 proof corridor gap document. The gap has been closed by:
>
> - M0-M2 (route truth and provider tx safety, PR #259).
> - M3 (Tron signing path via TronLink, PR #261).
> - M4 (execution parity including raw tx validator and Allbridge selector pinned to mainnet reality, PR #263).
> - M5 (lifecycle and proof ledger, PR #265).
> - M6 (product surface parity, PR #268).
> - M7 (mainnet canary evidence on the Polygon to Tron USDT corridor, PR #270, evidence at `sw4p/docs/evidence/canary-${CANARY_DATE}-pol-trx-usdt.md`).
>
> See: `docs/superpowers/plans/2026-05-18-sw4p-usdt-tron-parity-m0-m2.md`, `2026-05-18-sw4p-usdt-tron-parity-m5-lifecycle-proof-ledger.md`, `2026-05-19-sw4p-usdt-tron-parity-m7-evidence-canary.md`, and `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`.
>
> Do NOT use this document as guidance for new work.

```

(Note: the trailing blank line after the supersession block separates it from the original file content.)

- [ ] **Step 4: Prepend the same supersession block to `tron-proof-corridor-options-2026-04-21.md`.**

Same block text as Step 3, prepended in the same way.

- [ ] **Step 5: Re-grep that the supersession header appears at the top of both files.**

```bash
head -3 "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md"
head -3 "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md"
```

Expected: each file's first line begins with `> **SUPERSEDED 2026-05-19.**`.

- [ ] **Step 6: Stage.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add docs/operations/tron-proof-corridor-gap-2026-04-21.md
git add docs/operations/tron-proof-corridor-options-2026-04-21.md
git status --short
```

The controller commits with message:

```
m8(ops): supersede April Tron corridor docs with M0-M7 pointer

Closes SOW WP10.3. Prepends supersession block at the top of
tron-proof-corridor-gap-2026-04-21.md and tron-proof-corridor-options-
2026-04-21.md mapping the pre-M0 gap analysis to its M0 through M7
replacement. Body preserved.
```

---

## Task T8.5: Marketing Copy and Docs Site Sweep

**Wave:** W5. **Subagent:** marginal. **Subagent-dispatchable:** the grep and the disposition table are dispatchable, but the final rewrite of each hit requires controller judgment because copy decisions touch product positioning. The plan has the subagent surface every hit to the controller; the controller makes the rewrite call per hit and the subagent applies the edit.

**Blocks on M7** (the rewrites need to know what shipped).

**Goal:** Run the canonical banned-phrase grep across every text surface (docs site under `docs/`, sw4p-frontend src, sw4p-storefront src if present, home landing repo). Surface every hit with file/line context. For each hit, either rewrite the phrase to the precise truth or add an allowlist entry to `sw4p/docs/copy-guard/allowlist.json` if the phrase is correctly scoped in context (for example, a security advisory page that explicitly refutes the phrase keeps the literal phrase as a citation).

**Spec IDs:** SOW WP10.4 (public copy guard, manual sweep leg), PRD section 10 (no public claim that overpromises).

**Files:**

- Read-and-edit across: `docs/` (Mintlify MDX), `sw4p/sw4p-frontend/src/`, `sw4p/sw4p-storefront/src/` (if present), `home/` (landing repo).
- Writes (only if hits exist): `sw4p/docs/copy-guard/allowlist.json` (created by T8.6; T8.5 may append entries before T8.6 lands).
- Possibly modifies: any MDX, TSX, or HTML file with a hit.

- [ ] **Step 1: Confirm the candidate phrase list.**

The banned phrase list (canonical for both T8.5 and T8.6) is:

```
tron live
usdt everywhere
gasless tron
supports all stablecoins
works on every chain
every stablecoin
works on tron
tron support live
all stablecoins supported
all chains supported
```

The implementer records this list in a local file (or inline in the report) so T8.6 ships the same list.

- [ ] **Step 2: Run the sweep.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"

# Search docs site (Mintlify MDX), sw4p frontends, and home landing
rg --type-add 'mdx:*.mdx' \
   --type mdx --type md --type tsx --type ts --type html --type css \
   -in \
   'tron live|usdt everywhere|gasless tron|supports all stablecoins|works on every chain|every stablecoin|works on tron|tron support live|all stablecoins supported|all chains supported' \
   docs/ sw4p/sw4p-frontend/src/ home/ 2>/dev/null || echo "(no hits in primary surfaces)"

# Also sweep top-level MD files (founder scripts, integration guides, etc.)
rg --type md -in \
   'tron live|usdt everywhere|gasless tron|supports all stablecoins|works on every chain|every stablecoin|works on tron|tron support live|all stablecoins supported|all chains supported' \
   --max-depth 1 . 2>/dev/null || echo "(no hits in top-level md)"
```

The implementer collects every hit with `file:line:content` format.

- [ ] **Step 3: For each hit, present a disposition to the controller.**

For each hit, the subagent presents three options to the controller:

1. Rewrite to the precise truth. Default replacements:
   - "Tron live" becomes "USDT on Polygon to Tron via Allbridge Core (live)".
   - "USDT everywhere" becomes "USDT on Polygon to Tron live; other USDT corridors gated per the launch-decisions doc".
   - "gasless Tron" becomes "Tron user signs from TronLink with explicit Bandwidth, Energy, and TRX fee preview (universal gas abstraction is the USDC/CCTP target, not the Tron Allbridge path)".
   - "supports all stablecoins" becomes "supports USDC on CCTP V2 across 7 chains and USDT on Polygon to Tron via Allbridge Core (live), with other USDT corridors gated".
   - "works on every chain" becomes "works on Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Solana (USDC/CCTP V2) and Polygon to Tron (USDT/Allbridge)".
   - "every stablecoin" same as "all stablecoins" above.
   - "works on Tron" becomes "supports the Polygon USDT to Tron USDT corridor live; other Tron corridors gated".
   - "Tron support live" becomes "the Polygon USDT to Tron USDT corridor is live".
   - "all stablecoins supported" same as "supports all stablecoins" above.
   - "all chains supported" same as "works on every chain" above.

2. Add an allowlist entry for the hit, with a reason string (controller types the reason). Use case: a security advisory page that quotes the banned phrase as part of a negative claim.

3. Delete the line/section entirely if the surrounding context cannot be salvaged.

The controller picks option 1, 2, or 3 per hit. The subagent applies the picked option.

- [ ] **Step 4: Run the sweep a second time and confirm zero remaining hits (modulo allowlisted lines).**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
rg --type-add 'mdx:*.mdx' \
   --type mdx --type md --type tsx --type ts --type html --type css \
   -in \
   'tron live|usdt everywhere|gasless tron|supports all stablecoins|works on every chain|every stablecoin|works on tron|tron support live|all stablecoins supported|all chains supported' \
   docs/ sw4p/sw4p-frontend/src/ home/ 2>/dev/null
```

Every remaining hit must be allowlisted (cross-checked against `sw4p/docs/copy-guard/allowlist.json` if T8.6 has shipped, or recorded in a pending-allowlist note if T8.6 ships after T8.5).

- [ ] **Step 5: Stage every modified file.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git status --short
git add docs/<edited-files>
git add home/<edited-files>

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git status --short
git add sw4p-frontend/src/<edited-files>
git add docs/copy-guard/allowlist.json  # only if T8.6 has shipped
```

The implementer fills in the actual file list based on the hits found. The controller commits per repo with message:

```
m8(copy): manual public copy sweep aligned to shipped corridor list

Closes SOW WP10.4 (manual leg). Sweep across docs/, sw4p-frontend/src/,
and home/ for the canonical banned phrase set; <N> hits rewritten,
<M> entries added to the copy-guard allowlist.
```

---

## Task T8.6: Automated Public-Copy Guard

**Wave:** W6. **Subagent:** `general-purpose`, `model: opus`. **Subagent-dispatchable:** yes.

**Does NOT block on M7.** This task can land first; the CI guard catches future violations regardless of milestone state.

**Goal:** Ship a Bash-based public-copy guard at `sw4p/docs/copy-guard/check.sh` that greps the docs tree for the canonical banned phrase set from T8.5 Step 1 and fails if any hit is found that is not present in `sw4p/docs/copy-guard/allowlist.json`. Wire the check into `.github/workflows/test.yml` as a new job `copy-guard` that runs on every push and PR against the main branch. Add a small self-test at `sw4p/docs/copy-guard/check.test.sh` that asserts the guard catches an injected violation.

**Spec IDs:** SOW WP10.4 (public copy guard, automated leg).

**Files:**

- Create: `sw4p/docs/copy-guard/check.sh`.
- Create: `sw4p/docs/copy-guard/allowlist.json`.
- Create: `sw4p/docs/copy-guard/check.test.sh`.
- Create: `sw4p/docs/copy-guard/README.md`.
- Modify: `.github/workflows/test.yml` (append a `copy-guard` job).

- [ ] **Step 1: Branch check.**

```bash
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" rev-parse --abbrev-ref HEAD
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" rev-parse --abbrev-ref HEAD
```

Both branches must equal `feat/sw4p-usdt-tron-parity-m8-launch-closure` (sw4p) and the parent-repo M8 branch. STOP if either is wrong.

- [ ] **Step 2: Create the directory.**

```bash
mkdir -p "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard"
```

- [ ] **Step 3: Write `check.sh`.**

The implementer writes exactly this content to `sw4p/docs/copy-guard/check.sh`:

```bash
#!/usr/bin/env bash
# Public-copy guard for the USDT plus Tron parity track.
# Fails if any banned phrase appears in the docs tree without an allowlist entry.
# Closes SOW WP10.4 (automated leg).

set -eu

# Resolve repo root: this script lives at sw4p/docs/copy-guard/check.sh.
# The docs tree we sweep is in the parent workspace, two levels up.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SW4P_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
WORKSPACE_ROOT="$(cd "${SW4P_ROOT}/.." && pwd)"

ALLOWLIST="${SCRIPT_DIR}/allowlist.json"

BANNED_PHRASES=(
  "tron live"
  "usdt everywhere"
  "gasless tron"
  "supports all stablecoins"
  "works on every chain"
  "every stablecoin"
  "works on tron"
  "tron support live"
  "all stablecoins supported"
  "all chains supported"
)

SWEEP_PATHS=(
  "${WORKSPACE_ROOT}/docs"
  "${WORKSPACE_ROOT}/home"
  "${SW4P_ROOT}/sw4p-frontend/src"
)

FAIL=0

# Ripgrep is required. Fail loudly if absent.
if ! command -v rg >/dev/null 2>&1; then
  echo "FATAL: ripgrep (rg) is required but was not found on PATH" >&2
  exit 2
fi

# Build the rg regex from the banned phrase list (pipe-separated).
PATTERN=""
for phrase in "${BANNED_PHRASES[@]}"; do
  if [ -z "${PATTERN}" ]; then
    PATTERN="${phrase}"
  else
    PATTERN="${PATTERN}|${phrase}"
  fi
done

# Sweep every existing path. Skip non-existent paths cleanly.
HITS=""
for path in "${SWEEP_PATHS[@]}"; do
  if [ ! -d "${path}" ]; then
    continue
  fi
  PATH_HITS=$(rg --type-add 'mdx:*.mdx' --type mdx --type md --type tsx --type ts --type html --type css \
    -in "${PATTERN}" "${path}" 2>/dev/null || true)
  if [ -n "${PATH_HITS}" ]; then
    HITS="${HITS}${PATH_HITS}
"
  fi
done

if [ -z "${HITS}" ]; then
  echo "copy-guard: 0 hits across $(printf '%s ' "${SWEEP_PATHS[@]}")"
  exit 0
fi

# For each hit, check the allowlist.
# Each hit is in `file:line:content` form; the allowlist matches on file + line + phrase.
while IFS= read -r hit; do
  if [ -z "${hit}" ]; then
    continue
  fi
  file=$(echo "${hit}" | cut -d: -f1)
  line=$(echo "${hit}" | cut -d: -f2)
  rel_file="${file#${WORKSPACE_ROOT}/}"
  # Find which phrase matched (lowercased compare).
  hit_lower=$(echo "${hit}" | tr 'A-Z' 'a-z')
  matched_phrase=""
  for phrase in "${BANNED_PHRASES[@]}"; do
    if echo "${hit_lower}" | grep -qF "${phrase}"; then
      matched_phrase="${phrase}"
      break
    fi
  done
  # Check allowlist.
  if [ -f "${ALLOWLIST}" ] && command -v jq >/dev/null 2>&1; then
    ALLOWED=$(jq -e --arg f "${rel_file}" --arg l "${line}" --arg p "${matched_phrase}" \
      '.allowed[]? | select(.file == $f and (.line | tostring) == $l and .phrase == $p)' \
      "${ALLOWLIST}" 2>/dev/null || true)
    if [ -n "${ALLOWED}" ]; then
      continue
    fi
  fi
  echo "FORBIDDEN PHRASE: ${hit}"
  echo "  matched: ${matched_phrase}"
  echo "  to allowlist this hit, add an entry to: ${ALLOWLIST}"
  echo "  see sw4p/docs/copy-guard/README.md for the format"
  FAIL=1
done <<<"${HITS}"

exit ${FAIL}
```

The implementer ensures the file is created with executable bit set:

```bash
chmod +x "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard/check.sh"
```

- [ ] **Step 4: Write `allowlist.json`.**

```bash
cat > "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard/allowlist.json" <<JSON
{
  "schema_version": 1,
  "purpose": "explicit allowlist of (file, line, phrase) triples where a banned phrase is allowed in context",
  "allowed": []
}
JSON
```

The initial allowlist is empty; T8.5 populates it during the manual sweep if any hit is determined to be correctly scoped.

- [ ] **Step 5: Write `check.test.sh`.**

```bash
cat > "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard/check.test.sh" <<'BASH'
#!/usr/bin/env bash
# Self-test for the copy-guard check.
# Asserts:
#   1. The check passes against the current docs tree (every banned phrase is either absent or allowlisted).
#   2. The check FAILS when a banned phrase is injected into a synthetic file inside the sweep paths.
#   3. The check passes again when the same phrase is added to the allowlist.

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK="${SCRIPT_DIR}/check.sh"
ALLOWLIST="${SCRIPT_DIR}/allowlist.json"

SW4P_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
WORKSPACE_ROOT="$(cd "${SW4P_ROOT}/.." && pwd)"

# Save the allowlist so the test can restore it.
ALLOWLIST_BACKUP="$(mktemp)"
cp "${ALLOWLIST}" "${ALLOWLIST_BACKUP}"
trap 'cp "${ALLOWLIST_BACKUP}" "${ALLOWLIST}"; rm -f "${ALLOWLIST_BACKUP}"; rm -f "${WORKSPACE_ROOT}/docs/__copy_guard_test_inject.md"' EXIT

echo "test 1: baseline check passes against current docs tree"
if ! "${CHECK}" >/dev/null 2>&1; then
  echo "FAIL: baseline check failed (banned phrase in tree without allowlist entry)"
  "${CHECK}" || true
  exit 1
fi
echo "  pass"

INJECT="${WORKSPACE_ROOT}/docs/__copy_guard_test_inject.md"

echo "test 2: injected violation triggers FAIL"
cat > "${INJECT}" <<MD
# Test inject

This is a synthetic test file. It contains the banned phrase: USDT everywhere should be removed.
MD
if "${CHECK}" >/dev/null 2>&1; then
  echo "FAIL: check passed despite injected banned phrase"
  exit 1
fi
echo "  pass (check correctly rejected the injected hit)"

echo "test 3: allowlist entry suppresses the FAIL"
LINE_NO=$(grep -n -i 'usdt everywhere' "${INJECT}" | head -1 | cut -d: -f1)
REL_FILE="docs/__copy_guard_test_inject.md"
jq --arg f "${REL_FILE}" --arg l "${LINE_NO}" --arg p "usdt everywhere" \
  '.allowed += [{"file": $f, "line": ($l | tonumber), "phrase": $p, "reason": "self-test fixture"}]' \
  "${ALLOWLIST}" > "${ALLOWLIST}.tmp" && mv "${ALLOWLIST}.tmp" "${ALLOWLIST}"
if ! "${CHECK}" >/dev/null 2>&1; then
  echo "FAIL: check did not honor the allowlist entry"
  "${CHECK}" || true
  exit 1
fi
echo "  pass (check honored the allowlist entry)"

# Cleanup happens via trap.

echo
echo "copy-guard self-test: 3 of 3 pass"
exit 0
BASH

chmod +x "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard/check.test.sh"
```

- [ ] **Step 6: Write `README.md` for the copy-guard.**

```bash
cat > "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard/README.md" <<'MD'
# Public-Copy Guard

Closes SOW WP10.4 (automated leg).

## Purpose

Prevent overpromise phrases about Tron, USDT, or stablecoin breadth from reaching the public docs site, the home landing page, or the sw4p frontend without an explicit allowlist entry.

## Banned phrases

The canonical list is in `check.sh` as the `BANNED_PHRASES` array. Any text matching one of those phrases (case-insensitive) inside the sweep paths (`docs/`, `home/`, `sw4p/sw4p-frontend/src/`) fails the docs build.

## Adding an allowlist entry

Edit `allowlist.json`. Append an object to the `allowed` array with three required fields plus an optional reason:

```json
{
  "file": "docs/protocol/vap.mdx",
  "line": 42,
  "phrase": "works on tron",
  "reason": "this paragraph quotes a third-party article and explicitly refutes the claim"
}
```

The `file` field is the path relative to the workspace root (the directory above the `sw4p` submodule). The `line` field is the literal line number where the phrase appears (one-based). The `phrase` field is the lowercased canonical phrase (one of the entries in `BANNED_PHRASES`).

## Running locally

```bash
sw4p/docs/copy-guard/check.sh
```

Exit code 0 on clean tree, 1 on unallowlisted hit, 2 on missing ripgrep.

## Running the self-test

```bash
sw4p/docs/copy-guard/check.test.sh
```

The self-test injects a synthetic banned-phrase file into `docs/`, asserts the guard catches it, allowlists the synthetic line, asserts the guard then passes, and cleans up.

## CI wiring

The guard runs as the `copy-guard` job in `.github/workflows/test.yml`. The job runs on every push and pull request against the main branch and blocks merge on failure.
MD
```

- [ ] **Step 7: Run the self-test to confirm the guard works.**

```bash
bash "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/docs/copy-guard/check.test.sh"
```

Expected output ends with `copy-guard self-test: 3 of 3 pass` and exit code 0.

- [ ] **Step 8: Wire into `.github/workflows/test.yml`.**

```bash
cat "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/.github/workflows/test.yml"
```

The implementer reads the existing workflow file, identifies the trigger block (`on:`) and the `jobs:` block, and appends a new job using the `Edit` tool. The job block to append is:

```yaml
  copy-guard:
    name: public-copy guard
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository (with submodules)
        uses: actions/checkout@v4
        with:
          submodules: recursive
      - name: Install ripgrep and jq
        run: |
          sudo apt-get update
          sudo apt-get install -y ripgrep jq
      - name: Run copy-guard check
        run: |
          bash sw4p/docs/copy-guard/check.sh
      - name: Run copy-guard self-test
        run: |
          bash sw4p/docs/copy-guard/check.test.sh
```

The implementer appends this block under the existing `jobs:` key (indented consistently with the other jobs in the file). If the existing file does not use `actions/checkout@v4`, the implementer matches the version pinning already in use.

- [ ] **Step 9: Stage every new and modified file.**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add docs/copy-guard/check.sh docs/copy-guard/allowlist.json docs/copy-guard/check.test.sh docs/copy-guard/README.md
git status --short

cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
git add .github/workflows/test.yml
git status --short
```

The controller commits each repo with messages:

```
m8(guard): automated public-copy guard against overpromise phrases

Closes SOW WP10.4 (automated leg). Bash-based grep guard plus
allowlist plus self-test plus README at sw4p/docs/copy-guard/.
Catches Tron/USDT/stablecoin overpromise phrases in docs/, home/,
and sw4p-frontend/src/.
```

```
m8(ci): wire copy-guard into test.yml workflow

Closes SOW WP10.4 (CI wiring leg). Adds a copy-guard job that runs
sw4p/docs/copy-guard/check.sh plus check.test.sh on every push and PR.
Installs ripgrep and jq on the runner. Blocks merge on unallowlisted
banned-phrase hit.
```

---

## Task T8.10: Final M8 Branch Review

**Wave:** W7. **Subagent:** `code-review:code-review`, `model: opus`.

**Goal:** Full review of the M8 branch set (parent repo plus sw4p plus sw4p-kit) with explicit attention to the SOW WP10 coverage trace, the absence of overpromise phrases outside the allowlist, the absence of em or en dashes and non-ASCII content across every new and modified file, the absence of AI co-author trailers in any commit on the M8 branches, and the supersession block integrity on the Frontier suite and April ops docs.

**Pre-review verification commands the controller runs:**

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"

# 1. Em-dash and en-dash scan across every M8-edited file.
LC_ALL=C grep -rEn $'[\xe2\x80\x94\xe2\x80\x93]' \
  RNDRNTWRK_CANONICAL_TRUTH.md \
  docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md \
  docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md \
  docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md \
  docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md \
  docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m8-launch-closure.md \
  sw4p/README.md \
  sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md \
  sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md \
  sw4p/docs/copy-guard/README.md \
  sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md \
  sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md \
  sw4p-kit/README.md \
  || echo "no em or en dashes across M8-edited files"

# 2. Non-ASCII scan.
LC_ALL=C grep -rcP "[^\x00-\x7F]" \
  RNDRNTWRK_CANONICAL_TRUTH.md \
  docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md \
  docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md \
  docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md \
  docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md \
  docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m8-launch-closure.md \
  sw4p/README.md \
  sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md \
  sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md \
  sw4p/docs/copy-guard/README.md \
  sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md \
  sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md \
  sw4p-kit/README.md \
  | grep -v ":0$" || echo "all ASCII across M8-edited files"

# 3. Co-Authored-By scan across every commit on every M8 branch.
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p" log feat/sw4p-usdt-tron-parity-m8-launch-closure --pretty=full | grep -i 'Co-Authored-By\|Generated with\|claude' && { echo "FAIL: AI co-author trailer found"; exit 1; } || echo "no AI co-author trailer in sw4p commits"
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p-kit" log feat/sw4p-usdt-tron-parity-m8-launch-closure --pretty=full | grep -i 'Co-Authored-By\|Generated with\|claude' && { echo "FAIL: AI co-author trailer found"; exit 1; } || echo "no AI co-author trailer in sw4p-kit commits"
git -C "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555" log $(git -C . rev-parse --abbrev-ref HEAD) --pretty=full --since='2026-05-19' | grep -i 'Co-Authored-By\|Generated with\|claude' && { echo "FAIL: AI co-author trailer found"; exit 1; } || echo "no AI co-author trailer in parent-repo commits"

# 4. Copy-guard runs clean.
bash sw4p/docs/copy-guard/check.sh && echo "copy-guard clean" || { echo "FAIL: copy-guard reports hits"; exit 1; }
bash sw4p/docs/copy-guard/check.test.sh && echo "copy-guard self-test 3/3 pass" || { echo "FAIL: copy-guard self-test"; exit 1; }

# 5. Launch-decisions doc has every CRD section 6 corridor row.
EXPECTED_CORRIDORS=11
ACTUAL_ROWS=$(grep -cE '^\| (Polygon|Ethereum|Arbitrum|Avalanche|Optimism|Unichain|Base|Solana|Tron|BTC)' sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md)
[ "${ACTUAL_ROWS}" -ge "${EXPECTED_CORRIDORS}" ] && echo "launch-decisions row count ${ACTUAL_ROWS} >= ${EXPECTED_CORRIDORS}" || { echo "FAIL: launch-decisions row count ${ACTUAL_ROWS} < ${EXPECTED_CORRIDORS}"; exit 1; }

# 6. Executive summary word count is in range.
WORDS=$(wc -w < sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md)
[ "${WORDS}" -ge 350 ] && [ "${WORDS}" -le 500 ] && echo "summary word count ${WORDS} in [350, 500]" || { echo "FAIL: summary word count ${WORDS} out of [350, 500]"; exit 1; }

# 7. Supersession blocks present at the top of both April ops docs.
head -1 sw4p/docs/operations/tron-proof-corridor-gap-2026-04-21.md | grep -F 'SUPERSEDED 2026-05-19' && echo "gap doc superseded" || { echo "FAIL: gap doc supersession block missing"; exit 1; }
head -1 sw4p/docs/operations/tron-proof-corridor-options-2026-04-21.md | grep -F 'SUPERSEDED 2026-05-19' && echo "options doc superseded" || { echo "FAIL: options doc supersession block missing"; exit 1; }

# 8. Frontier amendment blocks present.
head -50 docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md | grep -F 'AMENDED 2026-05-19' && echo "frontier SOW amended" || { echo "FAIL: frontier SOW amendment block missing"; exit 1; }
head -50 docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-trd.md | grep -F 'AMENDED 2026-05-19' && echo "frontier TRD amended" || { echo "FAIL: frontier TRD amendment block missing"; exit 1; }
head -50 docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md | grep -F 'AMENDED 2026-05-19' && echo "frontier design amended" || { echo "FAIL: frontier design amendment block missing"; exit 1; }
```

- [ ] **Step 1: Dispatch the reviewer.**

```
Agent(
  description: "Final m8 branch review",
  subagent_type: "code-review:code-review",
  model: "opus",
  prompt: <full review prompt referencing the M8 self-review checklist below, the SOW WP10.1 through WP10.5 work-package list, the M7 evidence file location (the reviewer reads it to confirm the launch-decisions and canonical-truth edits accurately reflect the M7 outcome), the M0-M7 plan list as input context, and the prior M0-M2/M3/M4/M5/M6/M7 final review CHANGES_REQUIRED patterns to anticipate (residual placeholder tokens, em-dash slippage in code-block comments, AI co-author trailer slipping into a commit message, supersession block applied to the wrong doc, allowlist entry that does not match the actual file/line/phrase tuple, copy-guard failing to detect a case-variation of a banned phrase, executive summary above the word cap)>
)
```

The review consumes the M8 self-review checklist below as a starting point and answers four binary questions explicitly:

1. Does every CRD section 6 corridor row map to exactly one launch decision state in the launch-decisions doc?
2. Is the canonical truth document's USDT plus Tron narrative consistent with the launch-decisions doc and the M7 evidence file (no phrasing implies more than what shipped)?
3. Does the copy-guard catch every banned phrase from the canonical list, and does the allowlist match the actual file/line/phrase tuples for every recorded exception?
4. Does the external handoff doc's final-status section reference every M0 through M8 PR by number and every evidence artifact by path?

---

## Self-Review Checklist

### Spec coverage trace

| Spec ID or work package | Task |
|---|---|
| SOW WP10.1 canonical truth alignment | T8.1 (canonical truth), T8.2 (READMEs) |
| SOW WP10.2 Frontier suite amendment | T8.3 (SOW + TRD + design) |
| SOW WP10.3 ops doc supersession map | T8.4 (April ops docs) |
| SOW WP10.4 public copy guard | T8.5 (manual sweep), T8.6 (automated guard plus CI) |
| SOW WP10.5 external handoff closeout | T8.7 (external-handoff final-status section), T8.8 (executive summary) |
| SOW WP9.7 launch decision record per route | T8.9 (per-corridor table) |
| PRD-USDT-001 USDC and USDT separate | T8.1 (rail distinction text), T8.2 (READMEs separate rails), T8.8 (operating invariants section) |
| PRD-USDT-006 no false live | T8.1, T8.2 (route lists honest), T8.9 (live row gated to M7 evidence) |
| PRD-USDT-009 machine-readable surface | T8.2 (sw4p-kit README cross-link) |
| PRD-USDT-010 BTC and Omni out of scope | T8.9 (out_of_scope row), T8.8 (operating invariants) |
| PRD-USDT-013 provider metadata never auto-promotes | T8.8 (operating invariants), T8.9 (gated rows explicit) |
| PRD-USDT-014 no silent conversion | T8.2 (rail distinction), T8.8 (operating invariants) |
| PRD-USDT-024 small canary on authorization | T8.9 (canary-only rows acknowledge bounded execution) |
| PRD section 2.5 TRON execution truth (no public testnet claim) | T8.3 (Frontier amendment removes the testnet implication) |
| PRD section 10 public copy rules | T8.5 (manual sweep), T8.6 (automated guard) |
| PRD section 12 Gate E binding | T8.9 (live row gated on Gate E PASS in M7) |
| CRD section 6 corridor matrix requirements | T8.9 (one row per CRD section 6 corridor) |
| CRD section 16 corridor acceptance gate | T8.8 (operating invariants), T8.9 (decision rationale per row) |
| TRD section 14 canary authorization object schema | T8.2 (kit README references canary.ts schema) |
| M7 evidence anchor | T8.1, T8.2, T8.3, T8.4, T8.7, T8.8, T8.9 (each cites M7 evidence file path) |

### Placeholder scan

The plan contains no "TBD", no "TODO", no "FIXME", no "implement later", no "fill in details", no "similar to Task N" reference. Every step contains the actual content. The only `${...}` markers are runtime substitution markers for the M7 canary file name (`${CANARY_FILE}`, `${CANARY_DATE}`) which the implementer substitutes by reading the M7 evidence directory at execution time. The final review (T8.10) explicitly greps for any unresolved `${CANARY_` strings in the committed files and FAILs the review if any are found.

### Type and command consistency

- The banned phrase list in T8.5 Step 1 matches the `BANNED_PHRASES` array in T8.6 Step 3 byte-for-byte. The final review (T8.10) cross-checks the two by diffing the recorded list against the script's array literal.
- The supersession block template in T8.4 Step 3 matches the same shape in T8.4 Step 4 (both ops docs receive the identical block).
- The amendment block template in T8.3 Step 3 matches the same shape in T8.3 Steps 6 and 9 (SOW, TRD, design all receive the identical block).
- The Markdown links in T8.1 through T8.9 all use relative paths from the workspace root, consistent with the M0 through M7 plan conventions. The launch-decisions doc, executive summary, and canary evidence file are referenced by paths anchored at `sw4p/docs/` (relative to the workspace root), not at `docs/` (which would resolve to the Mintlify docs site).
- The CI job name `copy-guard` in T8.6 Step 8 matches the job name expected by the verification step in T8.10 ("copy-guard clean").

### Wave-level file conflict audit

- W0 (T8.9 then T8.8): T8.9 creates `sw4p/docs/launch-decisions/2026-05-19-usdt-tron-corridors.md`, T8.8 creates `sw4p/docs/2026-05-19-usdt-tron-parity-shipped.md`. No file overlap.
- W1 (T8.1 then T8.7): T8.1 modifies `RNDRNTWRK_CANONICAL_TRUTH.md`, T8.7 modifies `docs/superpowers/specs/2026-05-18-sw4p-usdt-tron-parity-external-handoff.md`. No file overlap.
- W2 (T8.2): modifies `sw4p/README.md` and `sw4p-kit/README.md` (in two distinct repos). No conflict with other waves.
- W3 (T8.3): modifies three Frontier docs under `docs/superpowers/specs/`. No conflict with other waves.
- W4 (T8.4): modifies two April ops docs under `sw4p/docs/operations/`. No conflict with other waves.
- W5 (T8.5): modifies hit-bearing files across `docs/`, `home/`, `sw4p/sw4p-frontend/src/`. Files modified by T8.5 are distinct from files modified by T8.1 through T8.4 (the canonical truth and Frontier docs are scrutinized by T8.1 and T8.3 with full content rewrites; T8.5 sweeps for banned-phrase hits in the docs site and frontend code, which are different file sets).
- W6 (T8.6): creates files under `sw4p/docs/copy-guard/` and modifies `.github/workflows/test.yml`. No conflict with other waves.
- W7 (T8.10): read-only review across all branches.

### Out-of-scope follow-ups to surface in T8.10 review

- Additional corridor canaries (ETH, ARB, AVA, OP, SOL to Tron USDT) are M9 work, not M8. The launch-decisions doc records each as `gated` with the M9 next-action.
- Tron to EVM and Tron to Solana production user flows beyond canary-only execution are M9+ scope.
- Unichain corridor promotion is blocked on runtime policy review; out of M8 scope.
- Base to Tron composed-route design is out of M8 scope.
- BTC and Omni USDT remain permanently out of scope by PRD-USDT-010.
- The Mintlify docs site build pipeline beyond the copy-guard CI job is out of M8 scope; T8.6 adds a single new job that runs alongside existing jobs. Any further docs-build hardening (link checking, schema validation) is post-M8.
- Phase H corridors (any future non-Allbridge rail for Tron) are out of scope; they would re-open the parity track as a new milestone series.

### Risk register specific to M8

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| M7 has not yet completed when M8 W0 starts | Medium | High (every T8.1 through T8.9 task blocks on M7) | T8.9 Step 2 hard-checks for the M7 canary evidence file and STOPS if absent. The controller does not dispatch M8 work until M7 T7.14 promotion and T7.15 pinned test both land. |
| Copy-guard catches a false positive (a banned phrase that is correctly scoped in context, for example a security advisory page that quotes the phrase to refute it) | Medium | Low (the allowlist absorbs the case) | T8.5 Step 3 surfaces every hit to the controller for disposition; the controller adds an allowlist entry with a reason string. The allowlist schema includes a `reason` field for audit. |
| Docs CI integration failure (the copy-guard job fails on the runner due to a missing dependency or path resolution issue) | Low | Low (catches before merge; the runner installs ripgrep and jq explicitly) | T8.6 Step 8 wires `apt-get install -y ripgrep jq` into the runner setup. T8.6 Step 7 runs the self-test locally before staging, so any path-resolution issue surfaces before the CI run. |
| Executive summary scope creep (the implementer expands the summary beyond 500 words or adds extra sections) | Low | Low (the final review enforces the word count) | T8.8 Step 2 explicitly bounds the summary at 350 to 500 words and the final review verification (T8.10 step 6) asserts the count. |
| Frontier amendment block applied to the wrong doc or amendment text drifts between docs | Low | Medium (audit trail fragmented across the three Frontier docs) | T8.3 Steps 3, 6, and 9 use the identical block text; the final review (T8.10 verification step 8) greps each Frontier doc for the literal `AMENDED 2026-05-19` header and FAILs the review if any is missing. |
| Allowlist entry tuple mismatch (the file path is wrong, the line number drifted, or the phrase string is not from the canonical list) | Medium | Low (the script falls back to FAIL on tuple mismatch, surfacing the actual mismatch) | The copy-guard's allowlist check uses an exact-match on `(file, line, phrase)`. The README documents the format. T8.6's self-test exercises an allowlist add and confirms suppression works. |
| Co-Authored-By trailer slips into a commit message because the controller pastes a template that includes it | Low | High (hard user rule violation) | T8.10 verification step 3 greps every M8 commit on every M8 branch for the literal `Co-Authored-By`, `Generated with`, and `claude` strings. Any hit FAILs the review and the controller must rewrite the commit message (using `git commit --amend` after re-staging, never `--no-verify` and never with `commit.gpgsign=false`). |
| Em-dash slips into a Markdown code block comment (the M7 plan hit this) | Medium | High (hard user rule violation across this plan and every output file) | T8.10 verification step 1 greps every M8-edited file for U+2014 and U+2013. The plan author runs the same grep against this plan body before reporting completion. |
| Launch-decisions table row count drifts from CRD section 6 (a corridor row is missed or duplicated) | Low | Medium (audit gap; some corridor has no recorded decision) | T8.10 verification step 5 counts rows against the expected count derived from CRD section 6. The implementer reads CRD section 6 directly when populating T8.9. |
| The home landing repo or `sw4p-storefront/src/` is not present in the workspace at M8 execution time (the sweep paths in T8.6 are conditional) | Low | Low (the script silently skips non-existent paths) | T8.6 Step 3's `check.sh` checks each sweep path with `[ ! -d "${path}" ] && continue`; missing paths are not fatal. The implementer logs the actual sweep paths in the final review. |

### Em-dash, en-dash, and non-ASCII scan

The plan contains no em dashes (U+2014), no en dashes (U+2013), and no non-ASCII characters. Verify with:

```bash
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
LC_ALL=C grep -cP "[^\x00-\x7F]" docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m8-launch-closure.md
LC_ALL=C grep -nE $'[\xe2\x80\x94\xe2\x80\x93]' docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m8-launch-closure.md || echo "no em or en dashes"
```

Expected: `0`, then `no em or en dashes`.

### Command and shell-quoting consistency

- Every `git -C` invocation uses the absolute parent-repo or sub-repo path quoted with double quotes (the path contains spaces).
- Every `rg` invocation uses the same `--type-add 'mdx:*.mdx' --type mdx --type md --type tsx --type ts --type html --type css` flag set in T8.5 and T8.6 so the sweeps cover identical extensions.
- Every `jq` invocation in the copy-guard quotes JSON pointers correctly and tolerates absent fields with `?`.
- No call uses `-c commit.gpgsign=false`, `--no-gpg-sign`, or `--no-verify`. Hard rule.
- No call uses `Co-Authored-By:`, `--author`, or `GIT_AUTHOR_*` or `GIT_COMMITTER_*` env vars. Hard rule.
- Every `curl` call in this plan is read-only. M8 introduces no network mutations.
- The single mutating action across M8 is editing documentation files; no production state mutation, no SQL UPDATE, no API write.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-19-sw4p-usdt-tron-parity-m8-launch-closure.md`.

Two execution options:

**1. Subagent-Driven (recommended for the bulk doc work)**: Controller dispatches a fresh subagent per task (T8.9, T8.8, T8.1, T8.7, T8.2, T8.3, T8.4, T8.6, T8.10) with T8.5 (manual sweep) driven by the controller with subagent assistance per-hit. Same model and contract as M0 through M7. Estimate: 7 waves, 10 tasks, wall-clock dominated by the manual sweep (T8.5) which depends on the number of hits found and the per-hit disposition calls. With zero hits the M8 wall-clock is roughly 3 hours of subagent dispatch time; with the expected sweep volume (typically 10 to 30 hits across docs/, home/, and the frontend) the wall-clock extends to 4 to 6 hours.

**2. Solo Controller Drive**: A single human contributor walks through every task in order, treating the plan as a runbook. Wall-clock is similar; the wins from subagent dispatch are smaller because the engineering footprint is light (only T8.6 ships code).
