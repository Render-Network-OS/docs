# sw4p Frontier Engine — Technical Requirements Document

**Status:** TRD — for review.
**Date:** 2026-05-14.
**Derives from:** `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` (the Frontier Engine Design Spec — the sole architectural source of truth) and `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` (the Statement of Work — the work-breakdown lens). This TRD is the *requirements lens*: the design spec says "here is the architecture," the SOW says "here is the work," and this TRD enumerates every discrete, testable requirement the built thing must satisfy and the method by which each is verified. Section references below (§N) point into the design spec unless prefixed `SOW §N`.

---

## Summary in one paragraph

This Technical Requirements Document enumerates the discrete, testable requirements for the **sw4p Frontier Engine — Approach A**: the day-one consolidation onto one canonical Pinocchio-based Solana program, one V4-derived EVM contract deployed across all 6 EVM chains, two rails (CCTP V2 + Allbridge Core), the engine-wide 3-phase atomicity discipline, the off-chain→on-chain confirmation pass, a clean physical layout, a full external audit of the consolidated set, and mainnet promotion across the 8 day-one chains. Every requirement carries an ID, a priority (MUST / SHOULD / MAY), a single checkable statement, a rationale tied to a design-spec section, and a verification method tied to the design spec's §14 testing stages and the SOW's acceptance criteria. **Approach B** (Circle Gateway) and **Approach C** (the ERC-7683 canonical interface) requirement *areas* are named in §8 and explicitly marked not-required-for-A; no MUST-level requirement in this document is outside Approach-A scope. This is a requirements artifact: it contains no code and no work breakdown — it states *what the system must do and how well, and how each will be verified*.

---

## 1. Purpose & scope

### 1.1 What this TRD specifies

This TRD specifies the **requirements** for the Frontier Engine — Approach A, as scoped by design spec §11.2 and decomposed into ten workstreams (WS0–WS9) by SOW §2. It enumerates:

- **Functional requirements** (§4) — what each component of the consolidated engine must do: the canonical Solana program, the canonical EVM contract, the rail layer, the reduced-role orchestration layer, the intent-lifecycle state machine, and the per-chain address registry.
- **Non-functional requirements** (§5) — how well the engine must do it, grouped by quality attribute: atomicity, security, performance, observability, compatibility/migration, and multi-chain.
- **The verification matrix** (§6) — the method by which each requirement is verified.
- **Traceability** (§7) — the mapping from each requirement to its design-spec section and SOW workstream, proving nothing is orphaned.

Approach B and Approach C requirement areas are noted in §8 as **deferred** — named, bounded, and explicitly *not required for Approach A*. They do not appear in §4, §5, §6, or §7.

### 1.2 Out of scope

Per design spec §15 and SOW §1.2 / §10, this TRD does **not** specify requirements for:

- **`sw4p-earn`** — the separate staking/rewards product (`Render-Network-OS/sw4p-earn`); referenced only as a downstream consumer of settlement-fee revenue.
- **`@sw4p/kit` SDK internals** — the kit is a *consumer* of the canonical interface; this TRD's only constraint touching the kit is interface stability (captured as a compatibility NFR), not the kit's own requirements.
- **The parent 555 monorepo canonical-corpus alignment** — separate docs work.
- **Approach B (Circle Gateway) and Approach C (ERC-7683 interface) at requirement depth** — their requirement *areas* are named in §8; each gets its own TRD after A.
- **The task-by-task implementation plan** — the `writing-plans` artifact; separate.
- **Re-adding any rejected rail** — Wormhole NTT, Hyperlane, zkSync/Starknet, LayerZero are rejected in design spec §10 and stay rejected; Chainlink CCIP is the conditional-future pick and is not day-one. No requirement in this TRD admits any of them.
- **Any code** — this is a requirements document.

---

## 2. Requirement conventions

### 2.1 ID scheme

Every requirement has a unique, stable ID of the form `<CLASS>-<GROUP>-<NNN>`.

- **`<CLASS>`** is `FR` (functional requirement — *what* the system does) or `NFR` (non-functional requirement — *how well* the system does it).
- **`<GROUP>`** identifies the component (for FRs) or the quality attribute (for NFRs):

  | Class | Group | Meaning |
  |---|---|---|
  | FR | `SOL` | The canonical Solana program (§4.1) |
  | FR | `EVM` | The canonical EVM contract (§4.2) |
  | FR | `RAIL` | The rail layer (§4.3) |
  | FR | `ORC` | The orchestration layer — reduced-role `sw4p-backend` (§4.4) |
  | FR | `SM` | The intent-lifecycle state machine (§4.5) |
  | FR | `REG` | The per-chain address registry (§4.6) |
  | NFR | `ATOM` | Atomicity (§5.1) |
  | NFR | `SEC` | Security (§5.2) |
  | NFR | `PERF` | Performance (§5.3) |
  | NFR | `OBS` | Observability (§5.4) |
  | NFR | `MIG` | Compatibility / migration (§5.5) |
  | NFR | `MC` | Multi-chain (§5.6) |

- **`<NNN>`** is a zero-padded sequence number within the group. IDs are never reused or renumbered.

Example: `FR-SOL-003` is the third functional requirement of the canonical Solana program; `NFR-ATOM-002` is the second atomicity non-functional requirement.

### 2.2 Priority levels

Each requirement carries one priority, using RFC-2119-style force:

- **MUST** — mandatory for Approach A. The built thing does not satisfy this TRD if any MUST is unmet. **Every MUST-level requirement in this document is Approach-A scope** (design spec §11.2).
- **SHOULD** — strongly expected for Approach A; an omission requires a recorded, justified decision. Not a release blocker on its own, but the default is "do it."
- **MAY** — permitted and desirable, at implementation discretion within Approach A. Absence is not a defect.

Approach B and C requirements appear only in §8 and are marked **DEFERRED** — they carry no MUST/SHOULD/MAY force in this document.

### 2.3 Verification

**Every requirement has exactly one primary verification method**, drawn from this fixed set and tied to the design spec §14 testing stages and the SOW §5 acceptance criteria:

| Method | Abbrev. | What it means | Design-spec tie |
|---|---|---|---|
| **Inspection** | INSP | Read the artifact (code, registry, doc, tree) and confirm the property by examination; includes verified grep-passes. | §13.2 R1, R5, R6; §14.4 |
| **Simulation** | SIM | The property holds when the canonical set is run against forked chain state and the CCTP V2 / Allbridge flows *before* deploy. | §14.3 "Simulate" |
| **Devnet/testnet test** | TEST | The property is exercised and passes on Solana devnet / the 6 EVM testnets / Tron testnet. | §14.3 "Test", §14.4 |
| **Injected-failure test** | INJ | The property holds when a failure class is *deliberately induced* (process death between Phase 2 and Phase 3, DB failure mid-transaction, a lock-across-`await` would-be regression). | §14.3 "Test", §14.4 |
| **Audit** | AUDIT | The property is confirmed by the full external audit of the consolidated set; the gate is no open high/critical findings. | §14.3 "Audit", §11.2 #11 |

Where a requirement's full confidence needs more than one method, the verification matrix (§6) records the primary method and notes the corroborating one. The verification method is part of the requirement — a requirement with no verification method is not a valid requirement (see §9 for the one honest flag against this rule).

---

## 3. *(reserved — requirements begin at §4)*

> Section number kept aligned with the brief's required-section list; functional requirements begin at §4.

---

## 4. Functional requirements

Grouped by component. Each requirement is a single checkable statement. Rationale cites the design-spec section; verification method per §2.3; full source/SOW traceability in §7.

### 4.1 The canonical Solana program (`FR-SOL`)

Basis: the consolidation of `programs/sw4p-native`, rebuilt on Pinocchio, P-Token `batch`-aware (design spec §7.1, Decision 1). SOW workstream WS1.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **FR-SOL-001** | MUST | Exactly one canonical Solana program exists; the Anchor program `programs/sw4p` (ID `555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3`) is retired after migration, not before. | §7.1, Decision 1, §12.1 #4 | INSP |
| **FR-SOL-002** | MUST | The canonical Solana program is built on Pinocchio (the zero-copy base P-Token is built on). | §7.1 "Why Pinocchio" | INSP |
| **FR-SOL-003** | MUST | The canonical Solana program's multi-token-op settlement path uses the P-Token `batch` instruction (one CPI paying the 1,000-CU floor once, not N CPIs). | §7.1 "P-Token awareness", §11.2 #7 | INSP, SIM |
| **FR-SOL-004** | MUST | The program performs swap-in on the Solana side via CPI into the swap venue, then into the CCTP path. | §7.1 "What the Solana program owns" | TEST |
| **FR-SOL-005** | MUST | The program performs the CCTP V2 burn and mint interaction on the Solana side. | §7.1, §3.2 | TEST |
| **FR-SOL-006** | MUST | The program enforces a signature-gated fee take. | §7.1 (carried from `sw4p-native`) | TEST, AUDIT |
| **FR-SOL-007** | MUST | The program can be paused, and a paused program rejects value-movement instructions. | §7.1 (carried) | TEST, AUDIT |
| **FR-SOL-008** | MUST | Configuration changes are gated by a 24-hour timelock. | §7.1 (carried) | TEST, AUDIT |
| **FR-SOL-009** | MUST | The program enforces per-day value-movement limits on-chain. | §7.1 (carried) | TEST, AUDIT |
| **FR-SOL-010** | MUST | Admin authority on the program is a Squads multisig. | §7.1 (carried) | INSP, AUDIT |
| **FR-SOL-011** | MUST | Every security control carried from `sw4p-native` (FR-SOL-006 through FR-SOL-010) has a passing test proving it survived the Pinocchio rebuild. | §13.2 R6 | TEST |
| **FR-SOL-012** | MUST | The program exposes the canonical intent lifecycle (`Created → Routed → SwapInDone → BridgeInitiated → Attested → Settled`) to the orchestration layer for any leg it owns. | §7.3 | TEST |
| **FR-SOL-013** | SHOULD | The program's existing SPL Token CPIs obtain the SIMD-0266 compute reduction with no code change (same program ID under P-Token). | §7.1, §1.1 Pressure 4 | INSP, SIM |

### 4.2 The canonical EVM contract (`FR-EVM`)

Basis: V4-derived (`ZapAndBridgeV4.sol`), deployed to all 6 EVM chains (design spec §7.2, Decision 1). SOW workstream WS2.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **FR-EVM-001** | MUST | Exactly one canonical EVM contract exists, V4-derived; `ZapNative.sol` is deleted and `ZapAndBridge.sol` ("V3") is retired per the §12.1 ordering. | §7.2, Decision 1, §12.1 #1/#3 | INSP |
| **FR-EVM-002** | MUST | The canonical EVM contract is deployed to all 6 EVM chains: Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon. | §7.2, §11.1, §13.1 Q1 | INSP, TEST |
| **FR-EVM-003** | MUST | The contract routes swap-in through the Universal Router (v3 + v4 best-execution); it does not hard-pin a v3 router. | §7.2, §11.2 #8 | TEST, SIM |
| **FR-EVM-004** | MUST | The contract performs the CCTP V2 burn on the source side (burns USDC, emits the CCTP message). | §7.2 | TEST |
| **FR-EVM-005** | MUST | The contract performs CCTP V2 mint/settle on the destination side (verifies the attestation, mints, finalizes settlement, takes the fee). | §7.2 | TEST |
| **FR-EVM-006** | MUST | The contract pulls the input token via Permit2. | §7.2 | TEST |
| **FR-EVM-007** | MUST | The fee on moved value is taken in-contract. | §7.2 | TEST, AUDIT |
| **FR-EVM-008** | MUST | The contract reads the per-chain address registry for the Universal Router address, USDC address, and CCTP domain on the chain it is deployed to. | §7.2, §11.2 #9 | TEST, INSP |
| **FR-EVM-009** | MUST | The contract carries a safety-control surface — pause, limits, timelock — equivalent in role to the Solana program's; this closes the §9.6 / §13.2 R8 gap. | §9.6, §13.2 R8, §7.3 | TEST, AUDIT |
| **FR-EVM-010** | MUST | A pause on the canonical EVM contract causes it to reject value-movement calls; the limits and timelock controls are enforced by the contract, not by an off-chain service. | §3.7, §9.6 | TEST, AUDIT |
| **FR-EVM-011** | MUST | The contract exposes the canonical intent lifecycle (§7.3) to the orchestration layer for any leg it owns. | §7.3 | TEST |
| **FR-EVM-012** | MUST | The contract does **not** use Uniswap v4 hooks for the cross-chain flow; swap-then-bridge atomicity is achieved by performing both in a single transaction. | §7.2 "A note on Uniswap v4 hooks", §10 | INSP, AUDIT |

### 4.3 The rail layer (`FR-RAIL`)

CCTP V2 across the 7 CCTP chains, Allbridge Core for Tron — two rails, eight chains, no more (design spec §3.3, Decision 2, §11.1). SOW workstream WS3.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **FR-RAIL-001** | MUST | The engine uses exactly two rails for Approach A: CCTP V2 and Allbridge Core. No third rail is present. | Decision 2, §11.1, §13.2 R7 | INSP |
| **FR-RAIL-002** | MUST | CCTP V2 is the rail for the 7 CCTP chains: Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon, and Solana. | §3.3, §11.1 | TEST |
| **FR-RAIL-003** | MUST | Allbridge Core is the rail for Tron (the one non-CCTP day-one chain) and is a first-class rail with a full lifecycle, not a fallback hack. | §3.3, §11.2 #4 | TEST |
| **FR-RAIL-004** | MUST | Every CCTP V1 decode path is removed from the backend (`cctp_burn.rs`, `cctp_mint.rs`, `cctp_attestation.rs`); the backend's CCTP code has no V2/V1 dual paths. | §11.2 #3, §12.1 #2 | INSP |
| **FR-RAIL-005** | MUST | CCTP V1 paths are removed only after the canonical EVM contract is on CCTP V2 on every mainnet chain *and* a drain window (no new V1 transfers, existing V1 transfers allowed to complete) has elapsed. | §12.1 #2, §13.2 R4 | INSP |
| **FR-RAIL-006** | MUST | There is exactly one canonical `BridgeProtocol` enum; the two previously separate enums are unified and every consumer is migrated onto it. | §13.1 Q2, §9.1 | INSP |
| **FR-RAIL-007** | MUST | The Allbridge Core lifecycle (PR #113) is finished and merged, built to the §8 3-phase rule from the start — not retrofitted. | §8.4, §11.2 #4, §13.2 R3 | INSP, INJ |
| **FR-RAIL-008** | MUST | Tron proof provisioning (PR #123) is finished and merged: the Allbridge equivalent of CCTP attestation is provisioned for the Tron settlement path. | §5.2, §11.2 #4 | TEST |
| **FR-RAIL-009** | MUST | Rail selection is explicit: the route selector picks Allbridge for Tron via a deliberate, logged routing decision; there is no silent Allbridge↔CCTP fallback path. | §13.1 Q3, §9.1 | INSP, TEST |
| **FR-RAIL-010** | SHOULD | Where Fast Transfer is available on a CCTP V2 route, the rail layer uses it; standard finality is used only where Fast Transfer is unavailable. | §3.3, §10 | TEST, SIM |

### 4.4 The orchestration layer — reduced-role `sw4p-backend` (`FR-ORC`)

The backend in its reduced role: decide, observe, relay, serve (design spec §3.5, §9). SOW workstreams WS3–WS5.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **FR-ORC-001** | MUST | The orchestration layer performs route selection over live, cross-venue liquidity off-chain; the route decision is advisory and the contract enforces what actually happens. | §3.5, §9.1, §9.6 | INSP, TEST |
| **FR-ORC-002** | MUST | The orchestration layer performs fee *quoting* off-chain; the fee *take* is on-chain (FR-SOL-006, FR-EVM-007). | §9.2, §9.6 | INSP |
| **FR-ORC-003** | MUST | The solver auction's *matching* runs off-chain; the fill it produces is executed on-chain by the canonical contract set. | §9.3, §9.6 | INSP, TEST |
| **FR-ORC-004** | MUST | The watcher observes all 8 day-one chains for the events that drive the §6 state machine, and polls CCTP attestation and Allbridge proof off-chain. | §3.5, §9.4 | TEST |
| **FR-ORC-005** | MUST | The watcher observes the canonical Solana program, not the retired Anchor program. | §9.4, §12.1 #4 | INSP, TEST |
| **FR-ORC-006** | MUST | The relay submits the source-side transaction the decision produces, and submits the destination-side settlement transaction once attestation/proof lands. | §3.5, §9.5 | TEST |
| **FR-ORC-007** | MUST | The relay targets the one canonical contract per chain; it does not choose between contract generations. | §9.5 | INSP |
| **FR-ORC-008** | MUST | The orchestration layer serves the existing typed API as the canonical external interface for Approach A. | §3.5, Decision 5 | TEST |
| **FR-ORC-009** | MUST | The route selector reads the per-chain address registry instead of hard-coded addresses. | §9.1, §7.2 | INSP |
| **FR-ORC-010** | MUST | A documented on-chain/off-chain boundary confirmation pass exists, walking design spec §9 file-by-file, showing every value-custody/atomicity concern is on-chain on both halves of the canonical set and that route selection, fee quoting, auction matching, the watcher, attestation polling, and the relay correctly stay off-chain. | §9, §9.6, §11.2 #6 | INSP |

### 4.5 The intent-lifecycle state machine (`FR-SM`)

Every state and transition in design spec §6, including the recovery transitions, as requirements. The machine is interface-agnostic and rail-agnostic. SOW work packages WP4.4, WP7.3.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **FR-SM-001** | MUST | An intent is created in state `Created`, with the DB row written *first* (before any in-memory state). | §6, §8.3 | TEST, INJ |
| **FR-SM-002** | MUST | `Created → Routed` occurs when a route is selected, a rail chosen, and a fee quoted. | §6 | TEST |
| **FR-SM-003** | MUST | `Created → Failed` occurs when route selection fails (no viable rail / chain down); `Failed` is terminal with no value moved. | §6 | TEST |
| **FR-SM-004** | MUST | `Routed → SwapInDone` occurs when the source-side swap-in succeeds within the atomic source transaction. | §6 | TEST |
| **FR-SM-005** | MUST | `Routed → Failed` occurs when the source transaction reverts (swap-in + bridge revert together). | §6 | TEST, SIM |
| **FR-SM-006** | MUST | `SwapInDone → BridgeInitiated` occurs when the CCTP burn / Allbridge send is confirmed in the same atomic transaction as the swap-in. | §6 | TEST |
| **FR-SM-007** | MUST | `BridgeInitiated → Attested` occurs when the rail proof is ready (CCTP attestation or Allbridge proof). | §6 | TEST |
| **FR-SM-008** | MUST | `BridgeInitiated → Stuck` occurs when the attestation/proof has not arrived past the configured threshold. | §6 | TEST |
| **FR-SM-009** | MUST | `Attested → Settled` occurs when the destination mint + settlement finalize in the atomic destination transaction. | §6 | TEST |
| **FR-SM-010** | MUST | `Attested → SettleRetry` occurs on a transient destination-tx failure (gas, RPC, nonce). | §6 | TEST, INJ |
| **FR-SM-011** | MUST | `SettleRetry → Settled` occurs when a retry succeeds; `SettleRetry → Stuck` occurs when retries are exhausted. | §6 | TEST, INJ |
| **FR-SM-012** | MUST | From `Stuck`, an operator can re-drive to `Attested` or to `SettleRetry`, or route to `Refunded` when the situation is unrecoverable. | §6 | TEST |
| **FR-SM-013** | MUST | After `BridgeInitiated`, the only reachable terminal states are `Settled` and `Refunded`; `Failed` is unreachable once value has left the source chain. | §6 ("Why the failure split matters") | TEST, INJ |
| **FR-SM-014** | MUST | `Refunded` and `Settled` are terminal; `Refunded` returns value to the source, `Settled` delivers value, `Failed` is terminal with nothing moved. | §6 | TEST |
| **FR-SM-015** | MUST | The state machine is interface-agnostic: an intent flows through the identical states whether it arrived via the typed API or (in C) via an ERC-7683 order. | §6, §3.4, Decision 5 | INSP, TEST |
| **FR-SM-016** | MUST | The state machine is rail-agnostic: `Attested` means "the rail's proof is ready" for any rail; CCTP V2 and Allbridge both flow through the same states. | §6 | TEST |
| **FR-SM-017** | MUST | Every transition in the §6 diagram, including the recovery transitions `Stuck`, `SettleRetry`, and `Refunded`, is exercised and passes on devnet/testnet — not just the happy path. | §6, §14.3, §14.4 | TEST |

### 4.6 The per-chain address registry (`FR-REG`)

The canonical chain → address mapping, maintained off-chain, read on-chain by the EVM contract and consumed by the orchestration layer and watcher (design spec §7.2, §13.2 R5). SOW work package WP2.3.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **FR-REG-001** | MUST | The per-chain address registry holds, per chain: the Universal Router address, the USDC address, the CCTP domain, and the per-chain rail config. | §7.2, §11.2 #9 | INSP |
| **FR-REG-002** | MUST | The registry is maintained off-chain (it changes when a chain upgrades its Uniswap deployment) and is read on-chain by the canonical EVM contract. | §7.2, §3.7 | INSP |
| **FR-REG-003** | MUST | The registry also serves the orchestration layer (the route selector) and the watcher as their canonical address source. | §7.2, §9.1 | INSP |
| **FR-REG-004** | MUST | The registry has a named owner and a defined update-and-verify process. | §13.2 R5 | INSP |
| **FR-REG-005** | MUST | The registry is populated and verified for the testnet set (6 EVM testnets) and, at promotion, for the mainnet set (8 day-one chains). | §14.3, §11.1 | INSP, TEST |
| **FR-REG-006** | SHOULD | The watcher cross-checks that the registered Universal Router address for each chain is live, surfacing a stale-registry condition before it routes value through a dead address. | §13.2 R5 | TEST |

---

## 5. Non-functional requirements

Grouped by quality attribute. Each is a single checkable statement of *how well* the engine must behave.

### 5.1 Atomicity (`NFR-ATOM`)

The §8 3-phase pattern as testable requirements, applied engine-wide (design spec §8, Decision 4). SOW workstream WS4.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **NFR-ATOM-001** | MUST | The §8 3-phase pattern (read-only identify + pre-validate → single atomic DB transaction for all multi-row state moves → re-acquire write lock and mutate in-memory state only after the DB commit) is documented and adopted as the engine-wide design rule. | §8.2, §8.4, Decision 4 | INSP |
| **NFR-ATOM-002** | MUST | DB-write-first invariant: the durable store is the source of truth and is mutated before in-memory state in every dual-state operation; in-memory state is a derived cache, never the authority. | §8.3 invariant 1 | INSP, INJ |
| **NFR-ATOM-003** | MUST | No-lock-across-`await` invariant: no write lock is held across an `await` point anywhere in the engine. | §8.3 invariant 2 | INSP, INJ |
| **NFR-ATOM-004** | MUST | Every multi-row state move commits inside exactly one DB transaction — it commits as a unit or rolls back as a unit; there is no partial-commit window. | §8.2 Phase 2 | INSP, INJ |
| **NFR-ATOM-005** | MUST | The watcher's dual state ("chains/intents I'm tracking" ↔ DB intent rows) is brought under the §8 3-phase rule. | §8.4 (watcher row) | INSP, INJ |
| **NFR-ATOM-006** | MUST | The relay's dual state ("txs in flight" ↔ DB tx/intent rows) is brought under the §8 3-phase rule; the auction's double-broadcast bug does not recur in the relay. | §8.4 (relay row), §9.5 | INSP, INJ |
| **NFR-ATOM-007** | MUST | The Allbridge lifecycle's dual state (in-memory lifecycle state ↔ DB rows) is built to the §8 3-phase rule from the start. | §8.4 (Allbridge row), §13.2 R3 | INSP, INJ |
| **NFR-ATOM-008** | MUST | The intent-lifecycle state machine's dual state (in-memory position ↔ DB intent row) is under the §8 rule: every §6 transition is a 3-phase operation with the DB row moving first. | §8.4 (state-machine row), §6 | INSP, INJ |
| **NFR-ATOM-009** | MUST | Process death between Phase 2 and Phase 3 leaves no desync and no half-state: in-memory state is correctly rebuilt from the DB on restart. | §14.3, §14.4 | INJ |
| **NFR-ATOM-010** | MUST | A DB failure mid-transaction leaves the system in a recoverable, consistent state — neither the old state nor a half-applied new state. | §14.3, §14.4 | INJ |
| **NFR-ATOM-011** | MUST | A lock-held-across-`await` would-be regression is caught (by test or by inspection) and does not reach a release. | §8.3 invariant 2, §14.4 | INJ, INSP |
| **NFR-ATOM-012** | MUST | Swap-in and the bridge step (CCTP burn or Allbridge send) succeed or revert together in one source transaction — no half-completed swap-then-bridge. | §3.7, §5.1, §5.2 ("ATOMICITY BOUNDARY 1") | TEST, SIM |
| **NFR-ATOM-013** | MUST | Destination-side mint and settlement finalize together — they do not partially apply. | §5.1, §5.2 ("ATOMICITY BOUNDARY 2") | TEST |

### 5.2 Security (`NFR-SEC`)

The safety-control surface on both halves, audit-cleanliness as a gate, and the carried `sw4p-native` security lineage (design spec §7.1, §9.6, §13.2 R6/R8, §14.2). SOW workstreams WS5, WS8.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **NFR-SEC-001** | MUST | The safety-control surface — pause, limits/daily-limits, timelock, multisig — exists on **both** halves of the canonical set: the Solana program (FR-SOL-007/008/009/010) and the EVM contract (FR-EVM-009). | §9.6, §7.3, §13.2 R8 | TEST, AUDIT |
| **NFR-SEC-002** | MUST | The full `sw4p-native` audited security surface (signature-gated fee, pause, 24h timelock, daily limits, Squads-multisig admin, fuzz tests, audit-fix lineage) survives the Pinocchio rebuild — it is carried, not rebuilt from scratch. | §13.2 R6, §7.1, §12.3 | INSP, AUDIT |
| **NFR-SEC-003** | MUST | The Pinocchio rebuild is diffed against `sw4p-native`'s existing fuzz tests and audit-fix lineage, and the carried security surface is proven by that diff plus a passing test per carried control. | §13.2 R6 | INSP, TEST |
| **NFR-SEC-004** | MUST | A full external audit of the consolidated set — the one canonical Solana program and the one canonical EVM contract — is completed once consolidation is stable on testnet. | §11.2 #11, §14.3 | AUDIT |
| **NFR-SEC-005** | MUST | The audit outcome is **no open high or critical findings**; this is the gate to mainnet promotion. | §14.2, §14.3 | AUDIT |
| **NFR-SEC-006** | MUST | Audit findings are remediated; remediations route back through the §14 simulate/test loop as needed before promotion. | §14.3, SOW WP8.2 | AUDIT, TEST |
| **NFR-SEC-007** | MUST | Safety controls are enforced by the on-chain contract/program, not by an off-chain service that could be bypassed. | §3.7, §9.6 | AUDIT, TEST |
| **NFR-SEC-008** | MUST | The EVM safety-control gap (the §9.6 / §13.2 R8 gap) is scoped before the EVM contract build starts, built into the canonical contract, and confirmed closed by a dedicated confirmation pass. | §9.6, §13.2 R8, SOW WP0.2/WP2.1/WP5.2 | INSP, AUDIT |

### 5.3 Performance (`NFR-PERF`)

The compute and latency wins the consolidation captures (design spec §1.1 Pressure 4, §3.3, §7.1). SOW work packages WP1.2, WP3.1.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **NFR-PERF-001** | MUST | The canonical Solana program captures the P-Token (SIMD-0266) compute reduction for its SPL Token CPIs (achieved for free via the same program ID — no code change). | §1.1 Pressure 4, §7.1 | INSP, SIM |
| **NFR-PERF-002** | MUST | A multi-token-op settlement on Solana pays the P-Token 1,000-CU floor once via the `batch` instruction, not once per CPI. | §7.1, §11.2 #7 | SIM, INSP |
| **NFR-PERF-003** | SHOULD | CCTP V2 Fast Transfer (8–20s settlement) is used on routes where it is available, rather than standard finality (13+ minutes). | §3.3, §10 | TEST, SIM |
| **NFR-PERF-004** | MAY | Simulation records the compute/latency profile of the day-one flows so regressions against the captured wins are detectable. | §14.3 "Simulate" | SIM |

### 5.4 Observability (`NFR-OBS`)

Explicit routing, queryable state, no silent fallback (design spec §6, §9.1, §13.1 Q3). SOW work packages WP3.4, WP4.4.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **NFR-OBS-001** | MUST | Every rail-routing decision is explicit and logged; a rail change is a visible routing decision, never a silent catch. | §13.1 Q3, §9.1 | INSP, TEST |
| **NFR-OBS-002** | MUST | A request that would previously have silently fallen back between rails now either visibly routes or visibly fails. | §13.1 Q3, §5.2 | TEST |
| **NFR-OBS-003** | MUST | The position of any intent in the §6 state machine is queryable at any time. | §6, §3.5 | TEST |
| **NFR-OBS-004** | MUST | The system can always state, for any intent, whether value has left the source chain (i.e. whether the intent is at or past `BridgeInitiated`). | §6 ("Why the failure split matters") | TEST, INJ |
| **NFR-OBS-005** | SHOULD | The route selection decision (chosen rail, quoted fee, Fast-Transfer-vs-standard) is recorded against the intent. | §9.1, §3.3 | INSP, TEST |

### 5.5 Compatibility / migration (`NFR-MIG`)

The migration and retirement ordering constraints as testable gates (design spec §12, §13.2 R1/R2/R4, §14.4). SOW workstreams WS1, WS2, WS3, WS7, WS9.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **NFR-MIG-001** | MUST | The frontend `koraBridge.ts` and the backend `watcher` are migrated onto the canonical Solana program, and a verified grep-pass confirms no remaining reference to the Anchor program ID, *before* the Anchor program is retired. | §12.1 #4, §13.2 R1 | INSP |
| **NFR-MIG-002** | MUST | The frontend + watcher migration onto the canonical Solana program is validated on testnet *before* the corresponding mainnet sunset. | §14.4 | TEST |
| **NFR-MIG-003** | MUST | The V4-derived canonical contract reaches Ethereum mainnet with the Ethereum inbound path migrated to it *before* `ZapAndBridge.sol` ("V3") is retired. | §12.1 #3, §13.1 Q1, §13.2 R2 | INSP, TEST |
| **NFR-MIG-004** | MUST | The V4-to-Ethereum deploy is validated on testnet *before* the V3 mainnet sunset. | §14.4 | TEST |
| **NFR-MIG-005** | MUST | CCTP V1 paths are removed only after the canonical EVM contract is on CCTP V2 on every mainnet chain and after the drain window has completed (see FR-RAIL-005). | §12.1 #2, §13.2 R4 | INSP |
| **NFR-MIG-006** | MUST | `ZapNative.sol` is deleted from the tree; a grep confirms no remaining references. | §12.1 #1, SOW WP0.3 | INSP |
| **NFR-MIG-007** | MUST | The Solana deployment-status audit (resolving §13.1 Q4: clusters, the live mainnet program, on-chain version, and a verified consumer-reference inventory for both program IDs) is completed as the plan's first task, before the WS1 migration is sequenced. | §13.1 Q4, §13.2 R1 | INSP |
| **NFR-MIG-008** | MUST | The canonical interface (the typed API for Approach A) is and remains stable enough for `@sw4p/kit` and the in-repo SDKs to target it directly. | §3.6, §15 | INSP |
| **NFR-MIG-009** | MUST | `sw4p-backend`, Kora, and the `sw4p-native` security lineage are not retired — the backend is reduced in role, Kora is permanent supporting infrastructure, and the security lineage is carried onto Pinocchio. | §12.3 | INSP |

### 5.6 Multi-chain (`NFR-MC`)

The 8 day-one chains, the per-chain registry, no "same address everywhere" assumption (design spec §11.1, §7.2). SOW workstreams WS2, WS9.

| ID | Priority | Requirement | Rationale | Verify |
|---|---|---|---|---|
| **NFR-MC-001** | MUST | The Approach-A engine operates across exactly the 8 day-one chains: Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon, Solana, Tron. No ninth chain is added in A. | §11.1, §13.2 R7 | INSP, TEST |
| **NFR-MC-002** | MUST | The engine makes no "same contract address everywhere" assumption; per-chain addresses are resolved through the per-chain registry. | §1.1 Pressure 4, §7.2 | INSP |
| **NFR-MC-003** | MUST | The canonical contract set is promoted to mainnet across all 8 day-one chains — including Ethereum (the Decision-1 invariant). | §11.1, §13.1 Q1, §14.3 | INSP, TEST |
| **NFR-MC-004** | MUST | The Solana-vs-EVM responsibility split (§7.3) is exercised on **both** halves of the canonical set during validation — not just one. | §7.3, §14.4 | TEST |
| **NFR-MC-005** | MUST | Both halves of the canonical set expose the *same* intent lifecycle to the orchestration layer, so the state machine does not depend on which chain a leg is on. | §7.3, §6 | TEST |
| **NFR-MC-006** | SHOULD | Per-chain rail config (which rail covers which chain) is data in the registry, not hard-coded branching. | §7.2, §3.3 | INSP |

---

## 6. Verification matrix

Maps each requirement ID to its primary verification method and the design-spec §14 stage / SOW §5 acceptance gate at which it is checked. Methods per §2.3: **INSP** inspection, **SIM** simulation, **TEST** devnet/testnet test, **INJ** injected-failure test, **AUDIT** external audit. "Corroborating" names a secondary method that raises confidence where the primary alone is thin.

| Requirement(s) | Primary method | Corroborating | §14 stage / SOW gate |
|---|---|---|---|
| FR-SOL-001, FR-SOL-002, FR-SOL-010, FR-SOL-013 | INSP | SIM (013) | M1 acceptance (SOW §5) |
| FR-SOL-003 | INSP | SIM | Simulate; M1 / M4 |
| FR-SOL-004, FR-SOL-005, FR-SOL-012 | TEST | — | Test; M1 / M4 |
| FR-SOL-006 … FR-SOL-009 | TEST | AUDIT | Test + Audit; M1 / M5 |
| FR-SOL-011 | TEST | — | M1 acceptance (§13.2 R6) |
| FR-EVM-001, FR-EVM-002 | INSP | TEST (002) | M2 / M6 |
| FR-EVM-003, FR-EVM-004 … FR-EVM-008, FR-EVM-011 | TEST | SIM (003), INSP (008) | Simulate + Test; M2 / M4 |
| FR-EVM-009, FR-EVM-010 | TEST | AUDIT | Test + Audit; M2 / M5 |
| FR-EVM-012 | INSP | AUDIT | M2 / M5 |
| FR-RAIL-001, FR-RAIL-004, FR-RAIL-005, FR-RAIL-006 | INSP | — | M3 / M6 |
| FR-RAIL-002, FR-RAIL-003, FR-RAIL-008, FR-RAIL-010 | TEST | SIM (010) | M3 / M4 |
| FR-RAIL-007 | INSP | INJ | M3 + M4 (built-to-rule, then injected-failure proven) |
| FR-RAIL-009 | INSP | TEST | M3 acceptance |
| FR-ORC-001, FR-ORC-003 | INSP | TEST | M2 / M4 |
| FR-ORC-002, FR-ORC-007, FR-ORC-009, FR-ORC-010 | INSP | — | M2 (010) / M3 / M4 |
| FR-ORC-004, FR-ORC-006, FR-ORC-008 | TEST | — | M4 |
| FR-ORC-005 | INSP | TEST | M1 / M4 |
| FR-SM-001, FR-SM-010, FR-SM-011, FR-SM-013 | TEST | INJ | M4 (recovery + injected-failure) |
| FR-SM-002, FR-SM-003, FR-SM-004, FR-SM-006 … FR-SM-009, FR-SM-012, FR-SM-014, FR-SM-016, FR-SM-017 | TEST | — | M4 acceptance (full state machine incl. recovery) |
| FR-SM-005 | TEST | SIM | Simulate + Test; M4 |
| FR-SM-015 | INSP | TEST | M4 (interface-agnostic by construction) |
| FR-REG-001 … FR-REG-004 | INSP | — | M2 acceptance |
| FR-REG-005 | INSP | TEST | M2 (testnet set) / M6 (mainnet set) |
| FR-REG-006 | TEST | — | M4 |
| NFR-ATOM-001 | INSP | — | M4 (rule documented) |
| NFR-ATOM-002, NFR-ATOM-003, NFR-ATOM-004 | INSP | INJ | M4 (invariants; injected-failure corroborates) |
| NFR-ATOM-005 … NFR-ATOM-008 | INSP | INJ | M4 (per-component rule application, reviewable) |
| NFR-ATOM-009, NFR-ATOM-010, NFR-ATOM-013 | INJ | — | M4 acceptance (injected-failure gate) |
| NFR-ATOM-011 | INJ | INSP | M4 |
| NFR-ATOM-012 | TEST | SIM | Simulate + Test; M4 |
| NFR-SEC-001 | TEST | AUDIT | M2 + M5 |
| NFR-SEC-002, NFR-SEC-003, NFR-SEC-008 | INSP | AUDIT (002, 008), TEST (003) | M1 / M2 / M5 |
| NFR-SEC-004, NFR-SEC-005 | AUDIT | — | M5 acceptance (gate to promote) |
| NFR-SEC-006 | AUDIT | TEST | M5 |
| NFR-SEC-007 | AUDIT | TEST | M5 / M4 |
| NFR-PERF-001 | INSP | SIM | Simulate; M1 |
| NFR-PERF-002 | SIM | INSP | Simulate; M1 / M4 |
| NFR-PERF-003 | TEST | SIM | M3 / M4 |
| NFR-PERF-004 | SIM | — | Simulate |
| NFR-OBS-001 | INSP | TEST | M3 |
| NFR-OBS-002, NFR-OBS-003 | TEST | — | M3 / M4 |
| NFR-OBS-004 | TEST | INJ | M4 |
| NFR-OBS-005 | INSP | TEST | M3 / M4 |
| NFR-MIG-001, NFR-MIG-006, NFR-MIG-007, NFR-MIG-009 | INSP | — | M0 (007) / M1 (001, 009) / M6 (006) |
| NFR-MIG-002, NFR-MIG-004 | TEST | — | M4 (cutover validation before sunset) |
| NFR-MIG-003, NFR-MIG-005 | INSP | TEST (003) | M6 acceptance (hard-constraint gates) |
| NFR-MIG-008 | INSP | — | Ongoing; M6 |
| NFR-MC-001, NFR-MC-002, NFR-MC-006 | INSP | TEST (001) | M2 / M6 |
| NFR-MC-003 | INSP | TEST | M6 acceptance |
| NFR-MC-004, NFR-MC-005 | TEST | — | M4 (both halves exercised) |

> **Stage legend (design spec §14.3):** Simulate → Deploy devnet/testnet → Test → Iterate → Audit → Promote mainnet. **Milestone legend (SOW §4):** M0 audit+ZapNative-delete, M1 Solana program on devnet, M2 EVM contract on 6 testnets, M3 rails consolidated, M4 atomicity + validation-loop converged, M5 audit clean, M6 mainnet (Approach A live). A requirement's gate is the earliest milestone whose acceptance criteria (SOW §5) it must satisfy; many are re-checked at M4 (the converged loop) and again implicitly at M6.

---

## 7. Traceability

Maps every requirement group to its design-spec section(s) and SOW workstream(s)/work package(s). Shows nothing is orphaned: every requirement traces up to the design spec and across to the work that produces it.

| Requirement group | Requirement IDs | Design-spec section(s) | SOW workstream / work package(s) |
|---|---|---|---|
| Canonical Solana program | FR-SOL-001 … FR-SOL-013 | §7.1, §7.3, Decision 1, §1.1 Pressure 4, §3.2, §12.1 #4, §13.2 R6 | WS1 (WP1.1–WP1.5) |
| Canonical EVM contract | FR-EVM-001 … FR-EVM-012 | §7.2, §7.3, Decision 1, §9.6, §12.1 #1/#3, §13.1 Q1, §13.2 R8, §10 | WS2 (WP2.1–WP2.5), WS5 (WP5.2) |
| Rail layer | FR-RAIL-001 … FR-RAIL-010 | §3.3, Decision 2, §11.1, §11.2 #3/#4, §12.1 #2, §13.1 Q2/Q3, §13.2 R3/R4/R7, §9.1, §8.4, §5.2 | WS3 (WP3.1–WP3.5) |
| Orchestration layer | FR-ORC-001 … FR-ORC-010 | §3.5, §9 (all), §9.1–§9.6, §11.2 #6, Decision 5, §12.1 #4 | WS3 (WP3.1), WS4, WS5 (WP5.1) |
| Intent-lifecycle state machine | FR-SM-001 … FR-SM-017 | §6, §3.4, §8.3, §8.4, Decision 5, §14.3, §14.4 | WS4 (WP4.4), WS7 (WP7.3) |
| Per-chain address registry | FR-REG-001 … FR-REG-006 | §7.2, §3.7, §9.1, §11.2 #9, §13.2 R5, §14.3, §11.1 | WS2 (WP2.3) |
| Atomicity | NFR-ATOM-001 … NFR-ATOM-013 | §8 (all), §8.2, §8.3, §8.4, Decision 4, §3.7, §5.1, §5.2, §6, §14.3, §14.4 | WS4 (WP4.1–WP4.4), WS7 (WP7.4) |
| Security | NFR-SEC-001 … NFR-SEC-008 | §7.1, §7.3, §9.6, §12.3, §13.2 R6/R8, §14.2, §14.3, §11.2 #11, §3.7 | WS0 (WP0.2), WS5 (WP5.1/WP5.2), WS8 (WP8.1/WP8.2), WS1 (WP1.1) |
| Performance | NFR-PERF-001 … NFR-PERF-004 | §1.1 Pressure 4, §7.1, §3.3, §10, §11.2 #7, §14.3 | WS1 (WP1.2), WS3 (WP3.1), WS7 (WP7.1) |
| Observability | NFR-OBS-001 … NFR-OBS-005 | §13.1 Q3, §9.1, §6, §5.2, §3.3, §3.5 | WS3 (WP3.4), WS4 (WP4.4) |
| Compatibility / migration | NFR-MIG-001 … NFR-MIG-009 | §12 (all), §12.1 #1–#4, §12.3, §13.1 Q1/Q4, §13.2 R1/R2/R4, §14.4, §3.6, §15 | WS0 (WP0.1/WP0.3), WS1 (WP1.3–WP1.5), WS2 (WP2.4/WP2.5), WS3 (WP3.5), WS7 (WP7.5), WS9 (WP9.1/WP9.2) |
| Multi-chain | NFR-MC-001 … NFR-MC-006 | §11.1, §7.2, §7.3, §1.1 Pressure 4, §6, §13.1 Q1, §13.2 R7, §14.3, §14.4 | WS2 (WP2.3/WP2.4), WS9 (WP9.1) |

**Coverage check.** Every one of the 12 day-one items in design spec §11.2 is covered by at least one requirement group above: item 1 (one Solana program) → FR-SOL + NFR-MIG; item 2 (one EVM contract) → FR-EVM + NFR-MIG; item 3 (drop CCTP V1) → FR-RAIL + NFR-MIG; item 4 (two rails / Allbridge first-class) → FR-RAIL; item 5 (3-phase discipline engine-wide) → NFR-ATOM; item 6 (off-chain→on-chain pass) → FR-ORC + NFR-SEC; item 7 (P-Token `batch`) → FR-SOL + NFR-PERF; item 8 (Universal Router routing) → FR-EVM; item 9 (per-chain registry) → FR-REG; item 10 (one physical layout) → see §9 note below; item 11 (full audit) → NFR-SEC; item 12 (devnet→mainnet) → the verification matrix §6 and NFR-MC-003.

---

## 8. Deferred requirements (B & C)

Per design spec §11.3 / §11.4 and SOW §7, Approaches B and C are sequenced sub-projects *after* Approach A lands and is stable. Their requirement **areas** are named here and **explicitly marked not-required-for-Approach-A**. None carries MUST/SHOULD/MAY force in this document; none appears in §4, §5, §6, or §7; each gets its own TRD after A is live.

### 8.1 Approach B — Circle Gateway (DEFERRED)

B adds the Circle Gateway rail; it does **not** change the canonical contract set or the interface. The requirement areas a B-TRD will add:

- **Rail-layer extension** — Circle Gateway as a third rail in the `FR-RAIL` group: unified, pull-based, sub-second cross-chain USDC liquidity across the CCTP chains.
- **Liquidity-model requirements** — moving the engine off per-chain float and hand-rebalancing onto a unified balance; new requirements on balance management that have no Approach-A analogue.
- **Route-selector extension** — the route selector gains Gateway as a selectable rail; the explicit-routing observability requirement (`NFR-OBS-001`) extends to cover it.
- **State-machine reuse (no new states)** — the §6 state machine is already rail-agnostic, so Gateway flows through the existing states; B adds no new `FR-SM` requirement, only a new rail under `Attested`.

### 8.2 Approach C — ERC-7683 canonical interface (DEFERRED)

C exposes ERC-7683 as sw4p's canonical external intent interface; the rails (CCTP V2 + Allbridge + Gateway) become the execution layer underneath. C is additive — the §6 state machine is already interface-agnostic. The requirement areas a C-TRD will add:

- **Interface-layer requirements** — a new `FR-7683` group: accept an ERC-7683 `CrossChainOrder`, act as filler/settler, emit the ERC-7683 settlement receipt.
- **Listener requirements** — `erc7683.rs` / `erc7683_listener.rs` built into the canonical front door (order-opened event → intent created in the existing state machine).
- **Interface-agnostic reuse** — `FR-SM-015` already requires the state machine to be interface-agnostic; C exercises that property rather than adding new state-machine requirements.
- **Compatibility requirement** — `@sw4p/kit` gains an ERC-7683 path (kit-side, tracked in the kit's own corpus — not a sw4p-engine TRD requirement).

---

## 9. Open questions

The four open questions from design spec §13.1, framed as **requirements-affecting decisions**. The design spec answered each as a reasoned default (the user's run waived clarifying questions); the SOW carries them as §8.1 assumptions, each user-confirmable at review. Each is reversible at review, and reversing one reshapes the affected requirements as noted.

| # | Decision | Design spec's reasoned default | Requirements affected if reversed |
|---|---|---|---|
| **OQ1** | Does the V4-derived canonical contract go to Ethereum mainnet? | **Yes — forced.** "One canonical contract set" is a Decision-1 invariant, and V3 (the only live contract on Ethereum) cannot retire until its replacement is live there (§12.1 #3). | If reversed, **FR-EVM-002**, **NFR-MC-003**, **NFR-MIG-003**, and **NFR-MIG-004** lose their Ethereum scope and **FR-EVM-001**'s V3-retirement clause is removed — but Decision 1 ("one canonical contract set") is broken, so this TRD's premise would change. The cost the user is confirming acceptance of is Ethereum gas + Ethereum-specific deploy/audit care. |
| **OQ2** | Are the two separate `BridgeProtocol` enums unified into one? | **Yes — unify.** Two enums for the same concept is exactly the latent inconsistency the consolidation exists to remove. | If reversed, **FR-RAIL-006** is dropped; the latent inconsistency the consolidation exists to remove persists, and `FR-RAIL-009` (explicit routing) becomes harder to verify cleanly because routing logic spans two enums. |
| **OQ3** | Does the silent Allbridge↔CCTP fallback become explicit? | **Yes — make it explicit.** A silent fallback hides which rail moved value — the opposite of the atomicity-and-observability posture. | If reversed, **FR-RAIL-009**, **NFR-OBS-001**, and **NFR-OBS-002** change shape: a request that would silently fall back would no longer be required to visibly route or visibly fail. The §5.2 sequence diagram assumes the explicit version. |
| **OQ4** | Is the Solana deployment-status audit the plan's first task? | **Yes — resolve by inspection before the plan.** The program IDs and the fact both are wired into consumers are established; the live deployment status (clusters, the live mainnet program, on-chain version) is a genuine unknown research cannot close. | This is acknowledged, not reversed: **NFR-MIG-007** encodes it as a MUST. It is flagged as the one item that is a genuine unknown rather than a reasoned default — if the audit surfaces an unexpected deployment topology, the WS1 migration requirements (`NFR-MIG-001`, `NFR-MIG-002`) may need re-sequencing, but the requirements themselves stand. |

### 9.1 Requirements-coverage notes (honest flags)

Two transparency notes, neither a contradiction between the design spec and the SOW:

- **The physical-layout reorg (design spec §11.2 item 10 / Decision 6, SOW WS6) has no FR/NFR in §4–§5.** This is deliberate: the reorg is a structural code-tree move (`sw4p/contracts/` and `sw4p/programs/` as peers of the backend), not a behavioral property of the running engine — a TRD enumerates *what the system does and how well*, and a directory layout is neither. It is fully covered as SOW work package WP6.1 with its own M-acceptance, and is verifiable by inspection there. It is recorded here so the §11.2 coverage check (§7) is honest about why item 10 maps to "see §9 note" rather than to a requirement ID. If a reviewer wants the layout pinned as a requirement, the natural home is a single `INSP`-verified NFR; this TRD leaves it as SOW-owned per the design spec's framing of it as a layout decision.
- **The per-chain registry's cross-component nature.** The registry is built under SOW WS2 (WP2.3) because the EVM contract is its primary on-chain reader, but `FR-REG-002` / `FR-REG-003` require it to also serve the orchestration layer and the watcher. This matches SOW §8.3's recorded interpretation and is not a contradiction — the registry requirements simply span the EVM, rail, and orchestration concerns, and the traceability table (§7) reflects that by citing §7.2 plus §9.1.

No genuine gap or contradiction was found between the design spec and the SOW — they are internally consistent, and the SOW's §8.3 already records the same two interpretation points above as SOW-level packaging choices rather than design deviations.

---

## 10. References

- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-design.md` — the Frontier Engine Design Spec; the sole architectural source of truth and the source of every requirement's rationale (the §N references throughout this TRD).
- `docs/superpowers/specs/2026-05-14-sw4p-frontier-engine-sow.md` — the Frontier Engine Statement of Work; the work-breakdown lens, source of the workstream/work-package traceability (§7) and the milestone acceptance gates (§6).
- `docs/superpowers/specs/2026-05-13-sw4p-ecosystem-unified-design.md` — the companion ecosystem spec; house-style reference for this document.
- `Render-Network-OS/sw4p-pro` — the sw4p engine repo the requirements apply to (`programs/`, the EVM contracts, `sw4p-backend/src/`, `kora/`, `sdk/`).

---

*TRD author note:* this Technical Requirements Document is the requirements lens on the 2026-05-14 Frontier Engine Design Spec and its Statement of Work. It enumerates the discrete, testable requirements for **Approach A** — every MUST is Approach-A scope — with each requirement carrying an ID, a priority, a single checkable statement, a design-spec rationale, and a verification method. Approach B and C requirement areas are bounded in §8 and explicitly deferred. The four §13.1 open questions are carried in §9 as requirements-affecting decisions, each with the design spec's reasoned default and the requirements that reshape if it is reversed. The physical-layout reorg is intentionally SOW-owned rather than expressed as a requirement, and §9.1 says so plainly.
