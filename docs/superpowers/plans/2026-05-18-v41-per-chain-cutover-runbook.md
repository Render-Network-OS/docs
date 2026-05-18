# V4.1 Per-Chain Cutover Runbook

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to apply this runbook chain-by-chain. Steps use checkbox (`- [ ]`) syntax for tracking. Each chain requires its OWN explicit user authorization (per hard boundary 1 below). Do NOT execute multiple chains in a single invocation.

**Goal:** flip an INERT V4.1 mainnet contract to LIVE production traffic on a single named chain, with full reversibility, per-chain gating, and end-to-end observability.

**Architecture:** Approach-A's WP2.4 wave deployed 7 V4.1 contracts (`ZapAndBridgeV41` with `Sw4pV4Controls`) on mainnet chains ETH / BASE / ARB / OP / AVAX / MATIC / UNI, all INERT (no traffic, runtime registry untouched). Cutover means flipping the runtime registry, backend route selector, frontend ABI/address constants, and indexer source list from V4.0 (or no-V4) to the V4.1 address for ONE named chain at a time. The contracts already exist on chain; this runbook does NO deploys.

**Tech Stack:** Rust backend (`sw4p-backend`), Vite frontends (`sw4p-frontend`, `sw4p-storefront`, `sw4p-console`, `sw4p-landing`), 555x402 indexer (`555x402/services/agg-indexer`), Circle SCP for any deploy-shaped action (none expected here), `cast` (foundry) for EVM probes, hardhat for drift tests.

---

## Hard boundaries (do not violate)

1. **Per-chain explicit authorization**. Each chain's cutover requires a separate explicit user instruction naming the chain (e.g., "cut over BASE"). One authorization = one chain. No batch authorization.
2. **No chain order recommended**. BASE is "the likely first candidate" per user instruction, but this runbook does NOT recommend a specific order. Order is the user's call per chain.
3. **No deploys**. The V4.1 contracts exist. If a cutover surfaces a need to redeploy (e.g., a contract bug discovered post-deploy), STOP and treat that as a separate authorization gate. Do not silently redeploy.
4. **No Circle SCP calls** (no contract deploys in this runbook; no governance role changes either, since the Option-A SCA triple is constructor-final).
5. **No destructive git** (`reset --hard`, `push --force`, `branch -D`) without explicit instruction. Backend / frontend / indexer changes go via reviewable PRs.
6. **Review before every merge** (HARD user rule `feedback_review_before_merge`). Even one-line cutover PRs require an explicit review pass.
7. **No em dashes** in any user-facing artifact this runbook creates.
8. **No AI co-author trailers** on any commit this runbook creates.
9. **Authorship**: every commit `rndrntwrk <dev@rndrntwrk.com>`. Verify before pushing.
10. **No frontier engine code touched** (engine stays USDC-only per the WP2.4 closure record).

---

## Authorization model

| Action | Required authorization |
|---|---|
| Run Phase 1 (read-only pre-flight) | once per chain. Read-only; safe to run any time. |
| Begin Phase 2 (registry/service pointer cutover) | explicit user go citing the chain (e.g., "begin BASE cutover Phase 2") |
| Merge any cutover PR | explicit "merge" instruction per PR; review pass first |
| Begin Phase 3, 4, 5 | implicit on Phase 2 merge for the same chain; sequential, no separate authorization |
| Rollback any phase | safe to execute without further authorization if a stop condition fires |
| Mark cutover ACCEPTED for a chain | explicit user "accept BASE cutover" after Phase 5 sign-off |

---

## Reusable per-chain procedure

The procedure below applies to ONE chain at a time. Substitute the chain code (e.g., `BASE`), the V4.1 address (from `deployed_addresses_v41.json`), and the chain-specific constants in each step.

### Per-chain identifiers (look up before starting any phase)

| Field | Where to find |
|---|---|
| Chain code | one of `ETH`, `BASE`, `ARB`, `OP`, `AVAX`, `MATIC`, `UNI` |
| EIP-155 chain id | from `sw4p-backend/contracts/registry/mainnet.json` (or `deploy_targets_mainnet.json` for UNI) |
| V4.1 address | from `sw4p-backend/contracts/scripts/deployed_addresses_v41.json` |
| RPC URL | per chain (e.g., `https://mainnet.base.org` for BASE) |
| Block explorer | per chain (e.g., `https://basescan.org/`) |
| Universal Router | from registry entry |
| Permit2 | from registry entry |
| USDC | from registry entry |
| CCTP V2 TokenMessenger | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` (canonical, all chains) |
| CCTP V2 MessageTransmitter | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` (canonical, all chains) |

### Phase 1: Final fork/testnet evidence pre-flight (read-only)

**Files (read only):**
- Read: `sw4p-backend/contracts/scripts/deployed_addresses_v41.json`
- Read: `sw4p-backend/contracts/scripts/mainnet_v41_deploys.json`
- Read: `docs/superpowers/audits/2026-05-17-wp2.4-unified-testnet-evidence.md`
- Read: `docs/superpowers/audits/2026-05-18-wp2.4-closure-handover-corrigendum.md`
- Run: `sw4p-backend/contracts/test/cctp_v2_address_drift.test.cjs`

- [ ] **Step 1.1: Look up the chain's V4.1 address**

Run:
```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
python3 -c "import json; r=json.load(open('contracts/scripts/deployed_addresses_v41.json')); print(r['<CHAIN_CODE>'])"
```

Expected: a single EVM address matching the canonical table in the corrigendum (e.g., for BASE: `0x18d436410b4edd0c7ffd4ed2aafe31140628eb45`). If the address differs from the corrigendum, STOP (stop condition 6).

- [ ] **Step 1.2: Run the 13-assertion sanity matrix via cast**

Run (substituting `<V41_ADDR>` and `<RPC>`):
```
export V41=<V41_ADDR>
export RPC=<RPC>
cast call $V41 'paused()(bool)' --rpc-url $RPC
cast call $V41 'globalDailyLimit()(uint256)' --rpc-url $RPC
cast call $V41 'MAX_PLATFORM_FEE_BPS()(uint16)' --rpc-url $RPC
cast call $V41 'AUTO_UNPAUSE_SECONDS()(uint256)' --rpc-url $RPC
cast call $V41 'TIMELOCK_DELAY()(uint256)' --rpc-url $RPC
cast call $V41 'feeTreasury()(address)' --rpc-url $RPC
cast call $V41 'universalRouter()(address)' --rpc-url $RPC
cast call $V41 'permit2()(address)' --rpc-url $RPC
cast call $V41 'tokenMessenger()(address)' --rpc-url $RPC
cast call $V41 'messageTransmitter()(address)' --rpc-url $RPC
```

Expected (all chains):
- `paused()` returns `false`
- `globalDailyLimit()` returns `10000000000000` (10M USDC at 6 dp)
- `MAX_PLATFORM_FEE_BPS()` returns `1000` (10%)
- `AUTO_UNPAUSE_SECONDS()` returns `604800` (7 days)
- `TIMELOCK_DELAY()` returns `86400` (1 day)
- `feeTreasury()` returns `0x2b75e7b86620683b601fb0c5830dffa7b996e412`
- `tokenMessenger()` returns `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d`
- `messageTransmitter()` returns `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64`
- `universalRouter()` and `permit2()` return the chain-specific addresses from the registry

If ANY assertion fails, STOP (the contract is either miswired or not the canonical address; stop condition 6).

- [ ] **Step 1.3: Probe role membership**

Run:
```
# admin role hash = keccak256("DEFAULT_ADMIN_ROLE") which is 0x00...00; pauser = keccak256("PAUSER_ROLE")
# Use the contract's hasRole(bytes32, address):
cast call $V41 'hasRole(bytes32,address)(bool)' \
  $(cast keccak "DEFAULT_ADMIN_ROLE") \
  0xe2f98e50d27df894703812d8c447985bd12f7ea6 \
  --rpc-url $RPC

cast call $V41 'hasRole(bytes32,address)(bool)' \
  $(cast keccak "PAUSER_ROLE") \
  0x9bac1ac094eae927505a626d0ab5727af1c63156 \
  --rpc-url $RPC
```

Expected: both return `true`. If either is `false`, STOP (governance triple mismatch).

- [ ] **Step 1.4: Run drift tests locally**

Run:
```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/contracts"
export PATH=/opt/homebrew/bin:$PATH
npx hardhat compile
npx hardhat test test/cctp_v2_address_drift.test.cjs test/deploy_script_drift.test.cjs
```

Expected: all assertions pass. If any fail, STOP (post-#239/#247 master should always pass these).

- [ ] **Step 1.5: Run mainnet-fork integration test for the chain**

Run (for BASE example):
```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/contracts"
HARDHAT_FORK_CHAIN_ID=8453 FORK_ONLY_CHAIN=BASE REQUIRE_FORK_CHAINS=BASE \
  npx hardhat test test/ZapAndBridgeV41.fork.test.cjs
```

Expected: 6/6 pass for the named chain. (Chain id reference: ETH 1, BASE 8453, ARB 42161, OP 10, MATIC 137, AVAX 43114, UNI 130.)

- [ ] **Step 1.6: Confirm testnet evidence covers the chain's testnet sibling**

Open `docs/superpowers/audits/2026-05-17-wp2.4-unified-testnet-evidence.md` (or the merged PR #234 evidence file `sw4p-backend/contracts/scripts/testnet_v41_deploys.json`) and confirm the chain's testnet sibling has a green entry. Sibling mapping:
- ETH mainnet 1 -> ETH Sepolia 11155111 (covered by #234)
- BASE mainnet 8453 -> BASE Sepolia 84532 (covered by #234)
- ARB mainnet 42161 -> ARB Sepolia 421614 (covered by #234)
- UNI mainnet 130 -> Unichain Sepolia 1301 (covered by #234)
- OP / MATIC / AVAX mainnets: testnet siblings BLOCKED at Uniswap v4 UR (covered by #233's blocked-testnet evidence + mainnet fork-sim coverage). Cutover for OP/MATIC/AVAX therefore relies on mainnet-fork evidence ONLY; flag this explicitly in the cutover authorization request.

If the chain is OP, MATIC, or AVAX: testnet evidence is structurally unavailable; raise this with the user explicitly before proceeding to Phase 2.

- [ ] **Step 1.7: Phase 1 sign-off**

All sub-steps green AND testnet evidence acknowledged (or waived for OP/MATIC/AVAX). Document the sign-off in the per-chain instance section at the bottom of this runbook (see "Per-chain instance tracker"). Update the chain's row in the tracker with: pre-flight passed, V4.1 sanity matrix all 13 green, mainnet fork test 6/6 pass, testnet sibling status.

STOP HERE. Request explicit user authorization to begin Phase 2 for this chain.

### Phase 2: Registry and service pointer cutover

**Files:**
- Modify: `sw4p/sw4p-backend/contracts/registry/mainnet.json` (the runtime registry, embedded into Rust backend via `include_str!`)
- Modify (only if UNI is being cut over): `sw4p/sw4p-backend/src/chain_registry.rs::normalize_chain_code` (add UNI arm if not already present)
- Modify: `sw4p/sw4p-backend/src/evm_swap.rs` if any hardcoded V4.0 address exists for the chain (verify before editing)
- Test: `sw4p/sw4p-backend/src/chain_registry.rs` tests (`cargo test --lib chain_registry`)
- Test: drift tests in `sw4p/sw4p-backend/contracts/test/`

- [ ] **Step 2.1: Create a cutover branch in sw4p-pro**

Run (in the sw4p-backend submodule's parent repo, sw4p-pro):
```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
git checkout -b chore/v41-cutover-<chain-code-lowercase>
```

Example for BASE: `chore/v41-cutover-base`. If a branch with that name already exists locally or on origin, STOP and resolve naming.

- [ ] **Step 2.2: Update the runtime registry entry**

Open `sw4p-backend/contracts/registry/mainnet.json`. Find the entry for the chain (matches the chain code). Add (or update) the field that points at the V4.1 contract address.

Schema:
```json
{
  "chain": "BASE",
  "chain_id": 8453,
  "cctp_domain": 6,
  "usdc": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "universal_router": "0x6fF5693b99212Da76ad316178A184AB56D299b43",
  "permit2": "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  "rail": "cctp_v2",
  "zap_and_bridge_v41": "0x18d436410b4edd0c7ffd4ed2aafe31140628eb45"
}
```

For each chain, set `zap_and_bridge_v41` to its address from `deployed_addresses_v41.json`. The exact field name in the registry depends on whether the schema already supports this; if not, see Step 2.3.

- [ ] **Step 2.3: Verify the registry schema supports v41 pointer**

Run:
```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
grep -n "zap_and_bridge\|v41" src/chain_registry.rs | head -10
```

Expected:
- If `chain_registry.rs` has an accessor for the V4.1 field (e.g., `pub fn zap_and_bridge_v41_for_mainnet(...)`), you can just set the value in the JSON.
- If no such accessor exists, you need to add it in this PR. Code template:

```rust
pub fn zap_and_bridge_v41_for_mainnet(chain: &str) -> Option<String> {
    let entry = mainnet_entry(chain)?;
    entry.get("zap_and_bridge_v41").and_then(|v| v.as_str()).map(String::from)
}
```

Add the accessor adjacent to existing accessors in `chain_registry.rs`. Add a unit test in `chain_registry.rs` tests block that asserts the function returns the expected address for the cutover chain.

- [ ] **Step 2.4: Update `evm_swap.rs` to route through V4.1 if it uses a V4.0 hardcode**

Run:
```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
grep -n "ZapAndBridge\|v4\|V4\|0x" src/evm_swap.rs | head -30
```

Inspect the output for hardcoded V4.0 addresses. If `evm_swap.rs::execute_native_zap_and_bridge_v4` resolves the contract address dynamically from the registry, no edit needed. If it has a hardcoded fallback, replace it with a call to `chain_registry::zap_and_bridge_v41_for_mainnet(chain)`.

- [ ] **Step 2.5: Run the unit tests**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
cargo test --lib chain_registry
```

Expected: all pre-existing tests plus the new accessor test pass. If failure, fix before moving on.

NOTE: use `--lib`. Bare `cargo test chain_registry` treats the name as a binary spec and runs zero tests (WP2.4 risk register #5).

- [ ] **Step 2.6: Run drift tests**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend/contracts"
export PATH=/opt/homebrew/bin:$PATH
npx hardhat compile
npx hardhat test test/cctp_v2_address_drift.test.cjs test/deploy_script_drift.test.cjs
```

Expected: all pass.

- [ ] **Step 2.7: Commit the registry + accessor changes**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
git add contracts/registry/mainnet.json src/chain_registry.rs
git status --short
git commit -m "feat(registry): wire <CHAIN_CODE> to V4.1 (cutover phase 2)

Updates runtime registry entry for <CHAIN_CODE> to set zap_and_bridge_v41
to the canonical V4.1 address <V41_ADDR>. Adds chain_registry::
zap_and_bridge_v41_for_mainnet accessor with unit test. Drift tests
unchanged and passing.

This is part of the per-chain V4.1 cutover runbook. The cut is contained
to this single chain. Other chains remain on V4.0 routing until
their cutover PRs land."
```

- [ ] **Step 2.8: Verify commit cleanliness**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
git log -1 --pretty="%h %an <%ae>%n%B" | head -20
git log -1 --pretty="%B" | grep -i "co-authored-by" && echo "FAIL: co-author trailer present" || echo "OK: no co-author"
```

Expected: author `rndrntwrk <dev@rndrntwrk.com>`, no co-author trailer.

- [ ] **Step 2.9: Push the branch and open a PR**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
git push -u origin chore/v41-cutover-<chain-code-lowercase>
gh pr create --repo Render-Network-OS/sw4p-pro \
  --base master \
  --head chore/v41-cutover-<chain-code-lowercase> \
  --title "feat(registry): wire <CHAIN_CODE> to V4.1 (cutover phase 2)" \
  --body "<see body template below>"
```

PR body template (paste, fill in chain-specific values):
```
## Summary

Phase 2 of the V4.1 per-chain cutover runbook applied to <CHAIN_CODE>.

- Updates `sw4p-backend/contracts/registry/mainnet.json` <CHAIN_CODE> entry
  to set `zap_and_bridge_v41 = <V41_ADDR>`.
- Adds `chain_registry::zap_and_bridge_v41_for_mainnet` accessor (or extends
  existing accessor) with unit test for <CHAIN_CODE>.
- Drift tests unchanged; cctp_v2_address_drift + deploy_script_drift pass.
- Backend builds clean; `cargo test --lib chain_registry` green.

## Cutover scope

ONLY <CHAIN_CODE> is wired in this PR. The other 6 chains remain on V4.0
routing. This PR is part of a per-chain cutover sequence; subsequent PRs
land per-chain when authorized.

## Phase 1 pre-flight evidence

- 13-assertion sanity matrix on <CHAIN_CODE>: all green (see runbook
  step 1.2 verbatim output, attached or quoted here).
- Mainnet fork test for <CHAIN_CODE>: 6/6 pass.
- Testnet sibling status: [covered by #234 / waived per #233 mainnet fork sim].

## Authorization

This cutover is authorized by the user instruction "<verbatim instruction
text from the user, e.g., 'cut over BASE'>" dated <YYYY-MM-DD>.

## Test plan

- [x] cargo test --lib chain_registry
- [x] npx hardhat compile && npx hardhat test test/cctp_v2_address_drift.test.cjs test/deploy_script_drift.test.cjs
- [ ] explicit human review and merge (per feedback_review_before_merge)
- [ ] Phase 3, 4, 5 of the cutover runbook applied after this merge
```

- [ ] **Step 2.10: Request human review on the PR**

Wait for explicit review pass. Do NOT auto-merge. Per HARD rule `feedback_review_before_merge`: every cutover PR gets a real review, even a one-line registry update.

- [ ] **Step 2.11: Merge PR after review approval**

```
gh pr merge <PR_NUMBER> --repo Render-Network-OS/sw4p-pro --merge
```

Preserve commit history (`--merge`, not `--squash`) so the cutover audit trail stays granular.

- [ ] **Step 2.12: Pull the merge into the local sw4p submodule and rebuild backend**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
git checkout master && git pull
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p"
git add sw4p-backend
git commit -m "chore(sw4p): bump corpus submodule (V4.1 <CHAIN_CODE> cutover phase 2 landed)"
```

(The 555 monorepo holds the sw4p submodule pointer; bump it post-merge so other consumers see the new registry.)

### Phase 3: Frontend config cutover

**Files:**
- Modify: `sw4p/sw4p-frontend/abis/ZapAndBridge.ts` (add V4.1 ABI variant if it differs from V4.0; verify against contract source first)
- Modify: a frontend address-constants file. Likely candidates: search `sw4p/sw4p-frontend` and `sw4p/sw4p-storefront` for the V4.0 address constants pattern. Run `rg -l 'ZapAndBridge|zap_and_bridge' sw4p/sw4p-frontend sw4p/sw4p-storefront` to locate.
- Modify: `sw4p/sw4p-storefront/src/components/SwapCard.tsx` if it has hardcoded V4.0 addresses (per the earlier probe, it references ZapAndBridge logic)

- [ ] **Step 3.1: Locate frontend address constants**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555"
rg -n 'ZapAndBridge\b|0x[a-fA-F0-9]{40}' sw4p/sw4p-frontend sw4p/sw4p-storefront --type ts --type tsx 2>/dev/null | head -40
```

Identify the file (or set of files) that holds the chain-keyed address constant for V4.0. Likely one of: `lib/contracts.ts`, `config/addresses.ts`, or inline in `abis/ZapAndBridge.ts`. Document the path.

- [ ] **Step 3.2: Add V4.1 entry behind a feature flag**

The cutover must NOT break the other 6 chains. Either:
- (a) keep V4.0 constants as-is, add a parallel V4.1 constants map, and switch based on a per-chain feature flag (e.g., `useV41Routing(chain)` reads from env or config)
- (b) replace V4.0 with V4.1 ONLY for this chain in the address map; leave other chains pointing at V4.0

Pattern (b) is simpler if the address map is chain-keyed. Pattern (a) is required if the frontend has any chain-agnostic code path.

Edit the address-constants file:
```typescript
// Before (V4.0 routing for BASE):
//   8453: "0x<v4-base-address>",
// After:
  8453: "0x18d436410b4edd0c7ffd4ed2aafe31140628eb45", // V4.1 cutover landed 2026-MM-DD per cutover-runbook
```

- [ ] **Step 3.3: Run the frontend type-check and build**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npm run typecheck  # or yarn typecheck, depending on the project
npm run build
```

Expected: clean build. If the ABI signature differs between V4.0 and V4.1 in a way the frontend depends on, fix the call sites before continuing.

- [ ] **Step 3.4: Run the frontend dev server and smoke-test the chain in a browser**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
npm run dev
```

Open the dev server, switch the wallet to the cutover chain, attempt to view the swap UI (no actual swap yet; just verify the UI doesn't error). Confirm the contract address shown on hover or in the contract-info panel matches the V4.1 address.

This is a manual UI verification step. Capture a screenshot or terminal log of the contract address read confirming V4.1.

- [ ] **Step 3.5: Repeat for sw4p-storefront**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-storefront"
# locate analogous address constants and edit
# typecheck, build, dev-smoke-test
```

- [ ] **Step 3.6: Skip sw4p-console and sw4p-landing unless they reference the V4 contract**

```
rg -l 'ZapAndBridge\|zap_and_bridge' sw4p/sw4p-console sw4p/sw4p-landing
```

If no matches, skip. If matches exist, apply the same pattern.

- [ ] **Step 3.7: Commit frontend changes**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-frontend"
git checkout -b chore/v41-cutover-<chain-code-lowercase>
git add <modified files>
git commit -m "feat(frontend): wire <CHAIN_CODE> to V4.1 (cutover phase 3)

Updates frontend address map for <CHAIN_CODE> to point at the canonical
V4.1 address <V41_ADDR>. Other chains unchanged. Typecheck and build
clean. Dev smoke test passed.

Phase 2 (backend registry) was merged in sw4p-pro PR #<N>.
Phase 3 lands here; Phase 4 (indexer) and Phase 5 (post-cutover flow)
follow."
```

Repeat for sw4p-storefront. Each frontend repo gets its own PR.

- [ ] **Step 3.8: Push and open PRs**

```
git push -u origin chore/v41-cutover-<chain-code-lowercase>
gh pr create --repo Render-Network-OS/sw4p-frontend --base master --head chore/v41-cutover-<chain-code-lowercase> --title "feat(frontend): wire <CHAIN_CODE> to V4.1 (cutover phase 3)" --body "<body template, similar to Phase 2 PR body, cross-reference sw4p-pro PR>"
```

- [ ] **Step 3.9: Review and merge each frontend PR**

Per HARD rule: explicit review before merge.

### Phase 4: Indexer reindex

**Files:**
- Modify: `555x402/services/agg-indexer/<config-file>` to add V4.1 contract address per chain
- Possibly: `555x402/repos/555x402-agg-indexer` if that's the canonical source
- Run: indexer backfill against the V4.1 contract's deploy block (look up from `mainnet_v41_deploys.json`)

NOTE: 555x402 may have a different review process than sw4p-pro. Verify the indexer's home repo and contribution flow before opening a PR. If 555x402 has no separate review process, treat it like sw4p-pro.

- [ ] **Step 4.1: Locate the indexer's chain-keyed source list**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555x402/services/agg-indexer"
rg -n '0x[a-fA-F0-9]{40}|chain_id|ZapAndBridge' --type ts --type yaml --type json 2>/dev/null | head -30
```

Find the file that lists watched contract addresses per chain. Document its path.

- [ ] **Step 4.2: Add the V4.1 address to the watched list**

Edit the source-list file. Add the V4.1 address for the chain. Keep the V4.0 address in the list (do NOT remove it). The indexer must continue reading V4.0 events for historical traffic until ALL chains are cut over.

- [ ] **Step 4.3: Look up the V4.1 deploy block for the chain**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
python3 -c "
import json
r = json.load(open('contracts/scripts/mainnet_v41_deploys.json'))
print(r.get('<CHAIN_CODE>', {}).get('deploy_block', 'NOT_RECORDED'))
"
```

If `NOT_RECORDED`, look up the deploy block from the chain's block explorer using the V4.1 address. Add it to `mainnet_v41_deploys.json` and commit that addition separately (small evidence update PR).

- [ ] **Step 4.4: Configure the indexer to backfill from the V4.1 deploy block**

Edit the indexer's backfill config or invoke a backfill command. The exact command depends on the indexer's runner (e.g., `cargo run --bin backfill -- --chain <CHAIN_CODE> --from-block <BLOCK> --contract <V41_ADDR>`).

- [ ] **Step 4.5: Verify backfill completed and matches on-chain state**

Run the indexer's verification query (likely a SQL query against the indexer's database) that counts V4.1 events per chain. Compare with an on-chain probe via `cast` (e.g., `cast logs --from-block <BLOCK> --address $V41 --rpc-url $RPC | wc -l`).

Expected: counts match within the expected tolerance.

- [ ] **Step 4.6: Commit indexer config changes**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555x402/services/agg-indexer"
git checkout -b chore/v41-cutover-<chain-code-lowercase>
git add <indexer config files>
git commit -m "feat(indexer): add V4.1 <CHAIN_CODE> source (cutover phase 4)"
git push -u origin chore/v41-cutover-<chain-code-lowercase>
gh pr create --base master --head chore/v41-cutover-<chain-code-lowercase> --title "feat(indexer): add V4.1 <CHAIN_CODE> source (cutover phase 4)" --body "<body>"
```

- [ ] **Step 4.7: Review and merge**

Per HARD review-before-merge rule.

### Phase 5: One real post-cutover flow (live validation)

**Files (no files modified; this phase is a real end-to-end test trade):**
- Reads: backend logs, indexer DB, frontend UI, on-chain state

- [ ] **Step 5.1: Pick a small-value test trade**

Choose a small USDC amount (e.g., 1 USDC) and a non-production wallet. The test trade exercises Phase 2 (backend route), Phase 3 (frontend UI), and Phase 4 (indexer event) in one motion.

- [ ] **Step 5.2: Execute the test trade through the frontend**

Open the production frontend (or staging if available). Connect the test wallet on the cutover chain. Initiate a USDC swap or bridge transaction. Confirm in the wallet. Wait for transaction inclusion.

- [ ] **Step 5.3: Verify on-chain event emission**

```
# Find the transaction in the block explorer for the cutover chain.
# Confirm: tx target == V4.1 address, status == success, events emitted include the V4.1's
# routing event signature.
cast tx <TX_HASH> --rpc-url $RPC | head -20
cast receipt <TX_HASH> --rpc-url $RPC | head -30
```

Expected: tx targets the V4.1 contract; success; the expected event topic.

- [ ] **Step 5.4: Verify backend log contains the route via V4.1**

Pull backend logs (production observability dashboard or `kubectl logs -l app=sw4p-backend` if running on EKS) for the timestamp of the test trade. Look for a log line referencing `execute_native_zap_and_bridge_v4` and the V4.1 address.

If the backend log shows V4.0 routing, the registry change did NOT propagate. STOP and investigate (likely cause: backend pod hasn't been restarted after the rebuild; trigger a deploy).

- [ ] **Step 5.5: Verify indexer recorded the event**

Query the indexer's database for events from the V4.1 address at the test trade's block. Confirm one event recorded with the matching `tx_hash`.

- [ ] **Step 5.6: Verify frontend showed the V4.1 routing**

Open the browser dev tools network tab for the test trade. Confirm the request payload references the V4.1 address (or a backend route that proxies to V4.1). The user-visible result of the swap should show success.

- [ ] **Step 5.7: Phase 5 sign-off**

If all 5 sub-steps green: cutover for the chain is ACCEPTED. Update the per-chain instance tracker with: phase 5 timestamp, test trade tx hash, indexer event count, sign-off note.

If any sub-step fails: trigger rollback (see "Rollback procedure" below) AND keep V4.0 routing live for users while you investigate.

---

## Rollback procedure (any phase failure or post-cutover issue)

Rollback is reversible. Do not panic. Execute in reverse order: Phase 4 -> Phase 3 -> Phase 2.

- [ ] **Rollback Step R.1: Revert Phase 2 backend PR**

```
cd "/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/sw4p/sw4p-backend"
git checkout master && git pull
git revert <PHASE_2_MERGE_COMMIT_SHA>
git push origin HEAD:revert-v41-cutover-<chain-code-lowercase>
gh pr create --base master --head revert-v41-cutover-<chain-code-lowercase> --title "revert: V4.1 <CHAIN_CODE> cutover phase 2" --body "Rollback per cutover runbook; see linked Phase 5 incident for cause."
```

Review and merge fast (still requires HARD review-before-merge, but reviewers should treat rollback PRs as high priority).

- [ ] **Rollback Step R.2: Revert Phase 3 frontend PRs**

Same pattern for sw4p-frontend and sw4p-storefront.

- [ ] **Rollback Step R.3: Leave Phase 4 indexer config as-is**

The indexer continues watching both V4.0 and V4.1 even on rollback. There is no harm in watching both; the V4.1 contract is INERT again after rollback so no new events accumulate. Indexer cleanup is a follow-up after the chain's permanent disposition is decided.

- [ ] **Rollback Step R.4: Verify rollback via a second test trade**

Repeat Phase 5 steps 5.1 through 5.6 to confirm the chain is back on V4.0 routing. The test trade should now target the V4.0 address.

- [ ] **Rollback Step R.5: Document the rollback**

Write a brief post-mortem to `docs/superpowers/audits/YYYY-MM-DD-v41-<chain>-cutover-rollback.md`. Cite: phase that failed, root cause if known, what was tried, when rollback completed.

---

## Per-chain instance tracker

Update this section as cutovers progress. One row per chain.

| Chain | Pre-flight | Phase 2 PR | Phase 3 PRs | Phase 4 PR | Phase 5 test tx | Status | Date accepted |
|---|---|---|---|---|---|---|---|
| ETH | not started | | | | | INERT | |
| BASE | not started | | | | | INERT | |
| ARB | not started | | | | | INERT | |
| OP | not started | | | | | INERT (testnet evidence waived) | |
| AVAX | not started | | | | | INERT (testnet evidence waived) | |
| MATIC | not started | | | | | INERT (testnet evidence waived) | |
| UNI | not started | | | | | INERT (and not in runtime registry; cutover requires registry-add first) | |

---

## Acceptance criteria (per chain)

A chain's cutover is ACCEPTED when ALL hold:

1. Phase 1 pre-flight: 13-assertion sanity matrix green, drift tests green, mainnet fork test green, testnet sibling green or waived.
2. Phase 2 PR merged on sw4p-pro master; the sw4p submodule pointer in the 555 monorepo updated.
3. Phase 3 PRs merged on sw4p-frontend and sw4p-storefront (and any others that reference the V4 contract).
4. Phase 4 PR merged in the indexer repo; backfill complete; event counts match on-chain probes.
5. Phase 5 live test trade succeeded with V4.1 routing observed on all four surfaces (on-chain, backend log, indexer DB, frontend UI).
6. No stop condition was triggered during the cutover.
7. The chain's row in the per-chain instance tracker is updated to status `LIVE on V4.1` with `Date accepted` filled in.

---

## Common stop conditions

If any of these triggers during a cutover, STOP IMMEDIATELY:

1. The chain's V4.1 address from `deployed_addresses_v41.json` does NOT match the corrigendum's canonical address table.
2. The 13-assertion sanity matrix fails on any assertion.
3. Drift tests fail.
4. Mainnet fork test fails for the chain.
5. Any commit in the cutover diff has a `Co-Authored-By` trailer or AI attribution.
6. Any secret appears in the cutover diff.
7. The Phase 2 cutover PR touches more than one chain's registry entry.
8. The Phase 5 live test trade routes via V4.0 (registry change did not propagate).
9. The cutover PR was merged without explicit review approval (violates HARD review-before-merge).
10. The cutover authorization is unclear or missing (no explicit user instruction naming the chain).
11. Any Solana / sw4p-pro Phase H artifact is touched by this runbook (cutover is V4.1-only; Phase H is a separate concern).
12. Any sw4p-pro file outside `contracts/registry/`, `src/chain_registry.rs`, `src/evm_swap.rs`, or `contracts/scripts/mainnet_v41_deploys.json` is touched by Phase 2.

---

## Glossary

- **Cutover**: flipping a chain's routing from V4.0 to V4.1. One chain at a time.
- **INERT**: V4.1 contract is deployed but no production traffic routes to it; runtime registry, backend, frontend, indexer all point at V4.0 (or no V4).
- **LIVE**: V4.1 contract is now the routing target for production traffic on the chain. Runtime registry, backend, frontend, indexer all point at V4.1.
- **Phase 1-5**: pre-flight, registry, frontend, indexer, live validation. Apply in order per chain.
- **Per-chain instance tracker**: the table above; the source of truth for cutover state.
- **Rollback**: reversing a cutover via PR revert + indexer left-as-is. Reversible without data loss.
- **Approach-A Option-A SCA triple**: the constructor-final governance (admin `0xe2f9...`, pauser `0x9bac...`, treasury `0x2b75...`) baked into every V4.1 contract.

---

## References

- WP2.4 closure handover: `docs/superpowers/audits/2026-05-18-wp2.4-closure-handover.md` (commit `3dc34649`)
- WP2.4 closure corrigendum: `docs/superpowers/audits/2026-05-18-wp2.4-closure-handover-corrigendum.md` (commit `402a5834`)
- Canonical V4.1 mainnet addresses: in the corrigendum's "Post-#247 master state, reverified" section.
- Approach-A V4.1 governance: same corrigendum, governance section.
- WP2.4 unified testnet evidence: `docs/superpowers/audits/2026-05-17-wp2.4-unified-testnet-evidence.md`
- WP2.4 CCTP V2 P0 amendment: `docs/superpowers/audits/2026-05-17-wp2.4-cctp-v2-p0-amendment.md`
- sw4p-pro PR #234 (testnet evidence): https://github.com/Render-Network-OS/sw4p-pro/pull/234
- sw4p-pro PR #239 (CCTP V2 P0 fix): https://github.com/Render-Network-OS/sw4p-pro/pull/239
- sw4p-pro PR #247 (mainnet V4.1 wave): https://github.com/Render-Network-OS/sw4p-pro/pull/247
- sw4p-pro PR #221 (legacy Base poison, do-not-route `0xaafa1e3d...`): https://github.com/Render-Network-OS/sw4p-pro/pull/221
- Phase H spec (separate from this runbook): `docs/superpowers/specs/2026-05-18-phase-h-555-token-mobility-design.md`

---

## Authorization model recap

- This runbook, on approval, becomes the procedure that every chain's cutover follows.
- No chain may be cut over without an explicit user instruction naming the chain.
- Phase 1 (read-only pre-flight) may be run by an agent at any time to refresh state, but Phase 2 onward requires explicit authorization per chain.
- Acceptance per chain (the row in the tracker reading `LIVE on V4.1`) requires an explicit user "accept <chain> cutover" instruction after all five phases sign-off.
- Phase H (555 mobility) work is OUT OF SCOPE for this runbook. The V4.1 cutover is independent of Phase H sub-phases H.1 / H.2 / H.3.
