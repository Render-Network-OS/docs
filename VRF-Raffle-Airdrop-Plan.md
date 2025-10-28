## VRF + Solana Program Plan for 555 Raffle and Airdrop

### 1) Current Use Case and Gaps

- **Randomness today**: Off-chain derivation from pinned start slot + blockhash + round ID using HKDF with rejection sampling.
- **Entries today**: Ingested from pump.fun chats off-chain. Eligibility (≥ 5,555 $555) checked off-chain by querying SPL token accounts. Entries stored in Badger; active round managed by auto-scheduler.
- **Draw today**: Numbers derived off-chain; results broadcast via SSE; payouts not finalized on-chain.

Gaps this plan addresses:
- Move randomness to on-chain, verifiable VRF.
- Anchor the off-chain entry set on-chain via a Merkle root commitment prior to VRF.
- On-chain claim flow that enforces eligibility "still holds 5,555" at claim time and pays from program vaults.
- Airdrop campaigns with VRF-selected winners and on-chain claim mechanics.

---

### 2) Goals

- **Trust-minimized randomness**: Use Switchboard or Chainlink VRF to remove off-chain randomness trust.
- **Commit-then-VRF**: Entries (raffle) or eligibility set (airdrop) committed on-chain before requesting VRF.
- **On-chain settlement**: Deterministic, auditable claim instructions with token-holding verification at claim time.
- **Scalable UX**: Keep current chat-based UX; add program commitments and on-chain reads/claims.

---

### 3) Providers & Abstraction

- **Preferred**: Switchboard VRF (mature on Solana). Alternate: Chainlink VRF (Solana).
- Abstract request/fulfill behind a program-level interface so provider can be swapped via config.

---

### 4) On-chain Architecture (Anchor)

Program accounts (PDAs):

- `GlobalConfig` PDA
  - admin/authority
  - vrf_provider config (Switchboard/Chainlink), queue/subscription/permission keys
  - default token mint for eligibility (e.g., $555)
  - default min tokens (e.g., 5,555)

- `RaffleRound` PDA
  - `round_id`, lifecycle `status`: Pending → Committed → VRFRequested → Finalized
  - `start_time`, `end_time`
  - `entries_merkle_root: [32]u8`, `entries_count: u32`, optional `entries_data_cid: String`
  - `vrf_request_id`, `vrf_result: [32]u8`
  - `winning_numbers: [u8; 5]` (derived on-chain from `vrf_result`)
  - `prize_pool_sol_vault` and/or `prize_pool_spl_vault`
  - overrides: `token_mint_for_eligibility`, `min_tokens_required`

- `AirdropCampaign` PDA
  - `campaign_id`, lifecycle `status`
  - `eligible_merkle_root`, `eligible_count`, optional `eligible_data_cid`
  - selection: `winners_k: u32` (if sample K), `selection_mode`
  - `vrf_request_id`, `vrf_result`
  - optional `selected_indices_root` (if we commit a winners set)
  - payout: `airdrop_mint` (or SOL), `per_claim_amount`, or tiered rules

- `Claim` PDA (per user, per round/campaign)
  - `user`, `round_or_campaign_id`, `claimed: bool`, `payout_amount`

- `Vault` PDAs
  - SOL vault (program-owned PDA)
  - SPL vault (ATA owned by program PDA)

---

### 5) Instructions (Anchor)

Admin:
- `initialize_config(authority, vrf_params)` → set global config.
- `set_defaults(token_mint, min_tokens)` → default eligibility rules.

Raffle:
- `create_round(round_id, start_time, end_time, overrides?)` → create `RaffleRound` PDA.
- `fund_round_vaults(lamports? spl_amount?)` → deposit prize funds.
- `commit_entries(round, entries_merkle_root, entries_count, data_cid?)` → lock the entry set.
- `request_vrf(round)` → request randomness, transitions to `VRFRequested`.
- `fulfill_vrf(round, vrf_result)` (callback by VRF provider) → store result, derive `winning_numbers` using on-chain rejection sampling.
- `finalize_round(round)` → marks finalized (optionally anchor `winners_root` and band counts, see payouts).
- `claim_prize(round, user, numbers, merkle_proof)` → verifies leaf membership, band, token threshold; pays from vault; records `Claim`.

Airdrop:
- `create_campaign(campaign_id, airdrop_asset, per_claim_amount, winners_k?, selection_mode)`.
- `fund_campaign_vaults()`.
- `commit_eligible_set(campaign, eligible_merkle_root, eligible_count, data_cid?)`.
- `request_vrf(campaign)`.
- `fulfill_vrf(campaign, vrf_result)` → deterministically sample K indices using rejection sampling (no bias).
- `claim_airdrop(campaign, user, merkle_proof, index?)` → verifies eligibility and (if sampled) winner status; checks token threshold if configured; pays from vault; records `Claim`.

---

### 6) Deterministic Randomness (On-chain)

Raffle numbers:
- Use `vrf_result` as seed and derive `[5]u8` within 5..55 using rejection sampling to avoid modulo bias.
- Include `round_id` as HKDF `info` to domain-separate across rounds.

Airdrop selection:
- With N eligible and need K winners:
  - Use HKDF-Expand on `vrf_result || campaign_id` to generate 16-bit or 64-bit samples.
  - Map into `[0..N-1]` via rejection sampling; deduplicate until K unique indices.
  - Either store `selected_indices_root` (Merkle) or recompute deterministically at claim-time to check membership.

---

### 7) Off-chain Components (Keep UX)

- Chat aggregator continues to parse entries from up to N streams; constructs leaves:

```text
leaf = hash(user_pubkey || numbers[5] || stream_id || round_id || optional salt)
```

- Before `end_time`, submit `commit_entries(round, root, count, cid)`.
- After commit, call `request_vrf(round)`; wait for `fulfill_vrf` event.
- For airdrop, commit `eligible_merkle_root` similarly and request VRF.
- Serve user-specific merkle proofs (via API or IPFS/Arweave) for claims.

---

### 8) Eligibility: "Still Holds 5,555" On-chain

During `claim_*`:
- Program reads the user’s SPL token balance for `token_mint_for_eligibility` (default from config) and verifies `≥ min_tokens_required`.
- This enforces current requirement at claim time across both raffle and airdrop.

---

### 9) Security & Fairness

- **Commit-then-VRF**: Program enforces state order; cannot request VRF before entries/eligibility root is committed.
- **Root immutability**: Once committed, roots cannot change; store optional `data_cid` for public audit.
- **Bias resistance**: Rejection sampling for numbers and index selection.
- **Idempotency**: `fulfill_vrf` and `finalize_round` idempotent to support retries.

---

### 10) Payout Models

Raffle bands (example):
- 5 hits: share of grand pot.
- 4 hits: 70% of side pot, split equally across 4-hit winners.
- 3 hits: 30% of side pot, split equally across 3-hit winners.

To avoid on-chain counting over large sets, two practical patterns:
1. **Winners Root Commitment** (recommended):
   - After numbers known, backend computes winners and per-band counts; commits `winners_root` on-chain in `finalize_round`.
   - `claim_prize` verifies winner leaf membership (band + user + numbers) and pays a fixed, deterministic band share.

2. **Progressive Accounting** (simpler but variable):
   - Track claimed totals per band; compute per-claim share dynamically with caps; risk of last-claimer inequity.

Airdrop:
- Fixed per-claim amount (SOL or SPL). If selection is K winners, claims only succeed for selected indices/users.

---

### 11) VRF Wiring

Switchboard:
- Configure queue/oracle, VRF account, and permissions in `GlobalConfig`.
- `request_vrf` performs CPI to Switchboard with callback to program’s `fulfill_vrf`.

Chainlink:
- Create/fund subscription; `request_vrf` references a callback to `fulfill_vrf`.

Abstraction:
- `GlobalConfig` stores `vrf_provider` and provider-specific keys; instruction routes accordingly.

---

### 12) Data Formats

Merkle leaves (Keccak or SHA-256, choose and document):

- Raffle entry leaf:
```text
hash(user_pubkey || numbers[5] || stream_id || round_id || salt?)
```

- Raffle winner leaf (if committing winners):
```text
hash(user_pubkey || numbers[5] || band || round_id)
```

- Airdrop eligible leaf:
```text
hash(user_pubkey || campaign_id)
```

- Airdrop winner leaf (optional if committing winners explicitly):
```text
hash(user_pubkey || campaign_id)
```

---

### 13) Constraints & Compute Budget

- `commit_entries` / `commit_eligible_set`: O(1) writes.
- `fulfill_vrf`: store result; derive 5 numbers and/or K indices; minimal compute.
- `claim_*`: Merkle verification O(log N), a few syscalls for SPL balance; fits typical limits.

---

### 14) Migration Plan

Phase 1 (Hybrid):
- Anchor program skeleton, PDAs, config; raffle round state machine.
- Wire VRF provider; devnet end-to-end for `commit → request → fulfill → finalize`.
- Frontend reads on-chain winning numbers; current SSE/UX remains.

Phase 2 (Payouts):
- Winners root commitment; `claim_prize` with fixed band payouts from vault.
- Backend provides proof bundles via API/IPFS.

Phase 3 (Airdrop):
- Campaign PDAs, eligible commit, VRF selection, claim; devnet e2e.

Phase 4 (Multi-stream):
- Stream-specific eligibility in `RaffleRound` or separate `StreamConfig` PDA; enforce per-claim.

---

### 15) Testing Strategy

- Anchor unit tests with deterministic RNG injection (bypass VRF).
- Property tests for rejection sampling (uniformity, uniqueness, range).
- Devnet e2e with VRF: full raffle and airdrop flows.
- Fuzz merkle proofs and claim paths for invariants (no double-claim, band correctness, vault safety).

---

### 16) Operations

- **Funding**: Admin flows to top-up SOL/SPL vaults; enforce min balances.
- **Observability**: Anchor events on transitions; optional mirror to SSE.
- **Recovery**: Allow re-request of VRF if fulfillment stalls; instructions idempotent.

---

### 17) API Additions (Backend)

- Raffle (on-chain):
  - `POST /onchain/rounds` (create)
  - `POST /onchain/rounds/{id}/commit` (entries root)
  - `POST /onchain/rounds/{id}/request-vrf`
  - `GET  /onchain/rounds/{id}` (chain state)
  - `GET  /onchain/rounds/{id}/proof/{wallet}` (merkle proof bundle)

- Airdrop (on-chain):
  - Similar endpoints: create/commit/request-vrf/state/proof

---

### 18) Timeline (Rough)

- Week 1: Anchor scaffolding, PDAs, config; raffle SM; unit tests with mock RNG.
- Week 2: Switchboard wiring; request/fulfill; derive numbers; devnet e2e.
- Week 3: Winners root + claim payouts; FE claim UI; proof bundler service.
- Week 4: Airdrop campaign: eligible commit, VRF selection, claim; tests + devnet.
- Week 5: Hardening, docs, metrics; optional Chainlink adapter.

---

### 19) Risks & Mitigations

- Off-chain aggregator trust → Merkle commit + publish dataset CID for audit.
- Vault depletion → Enforce per-round/campaign caps; reject when insufficient funds.
- VRF downtime → Allow admin re-request; never accept manual randomness.
- Token threshold at claim → Document clearly; aligns with "still holds" policy.

---

### 20) Appendix: Derivation Notes (On-chain)

Raffle numbers (rejection sampling outline):

```rust
// Pseudocode inside Anchor program
let seed = vrf_result; // [32]u8
let mut hkdf = Hkdf::new(Some(info(round_id)), &seed);
let mut out = [0u8; 10];
let mut chosen = BTreeSet::new();
while chosen.len() < 5 {
    hkdf.expand(&mut out)?; // take 2 bytes per sample
    let val = u16::from_be_bytes([out[0], out[1]]) as u32;
    let limit = (65535 / 51) * 51; // highest multiple of 51
    if val >= limit { continue; }
    let n = (val % 51) + 5; // 5..55
    chosen.insert(n as u8);
}
// sort chosen ascending
```

Sampling K winners from N (rejection + de-dup):

```rust
let mut selected = BTreeSet::new();
while selected.len() < k {
    hkdf.expand(&mut out)?; // 8+ bytes, e.g., u64 sample
    let val = u64::from_be_bytes(out[0..8].try_into().unwrap());
    let limit = (u64::MAX / (n as u64)) * (n as u64);
    if val >= limit { continue; }
    let idx = (val % (n as u64)) as u32;
    selected.insert(idx);
}
```














