# W1 PR + Commit Inventory

W1 produced two streams of commits: evidence + plan commits at the parent root (this `555` checkout, local-only since the parent has no remote), and code-bearing commits in the sw4p worktree at `.worktrees/sw4p-devnet-frontier-2026-05-16` (branch `staging/devnet-frontier-2026-05-16`).

## Parent root (`555`)

W1 plan + per-phase evidence + W0 follow-up (SCA wallets), in commit order on `docs/wave-g-sw4p-earn-corpus`:

```
967d8ffa docs(superpowers): sw4p devnet-frontier W1 canonical EVM implementation plan
3afcf1f1 docs(superpowers): W1 plan, fix Phase D heading em dash
547ba64b evidence(W1.a): V4.1 safety-control coverage inventory + unit-test verification
1b27286f evidence(W1.a): Tier 1 V4.1 deploy constructor preconditions per chain
b55623ba evidence(W1.b): Permit2 sourcing plus per-chain verification
d6be7f7c evidence(W1.preflight): wallet funding probe blocked on missing key configuration
d3a94f6d evidence(W0): Circle Wallets provisioned for sw4p-devnet-frontier cycle
176a4b94 evidence(W1.c): Tier 1 V4.1 SCP deploys blocked by EOA wallet zero balance
41d5c8cf evidence(W0): SCA Circle Wallets provisioned for Gas Station sponsorship
47628ad0 evidence(W1.c): Tier 1 V4.1 deploys via Circle SCP SCA + Gas Station sponsored
77138350 evidence(W1.d): Tier 1 V4.1 acceptance via Circle SCP (pause + timelock + revert + CCTP RT)
9be6b358 evidence(W1.f): real mainnet-fork compat evidence for AVAX plus Polygon
306b5df5 evidence(W1.e): Tier 2 real CCTP-only proof via Circle SCP on Fuji and Amoy
```

Note: the W1.e evidence commit `306b5df5` landed from a sibling agent during W1 closeout (Phase G); the file is committed and present on the same `docs/wave-g-sw4p-earn-corpus` branch this aggregate is authored on.

Note the W0-tagged commits `d3a94f6d` (`evidence(W0): Circle Wallets`) and `41d5c8cf` (`evidence(W0): SCA Circle Wallets`) are W0 addenda landed during W1 because the Phase C deferred-attempt (`176a4b94`) revealed that EOA wallets cannot be Gas-Station sponsored. SCA wallet provisioning is therefore tracked under W0 (live-deps) even though it was discovered mid-W1.

## sw4p worktree (`Render-Network-OS/sw4p-pro`, branch `staging/devnet-frontier-2026-05-16`)

Commits ahead of `origin/master`:

```
a062f780 feat(contracts): per-chain Permit2 registry sourced from Uniswap/permit2 canonical addresses
0dc8ee42 feat(contracts): W1 tier1, tier2, tier3-mainnet-fork registry files resolving Base Sepolia router drift
fef2ad7f feat(contracts): deploy_testnet.cjs reads tier1.json for Sepolia plus Base Sepolia
bdd1bfe2 test(contracts): Tier 3 mainnet-fork compat tests for Avalanche plus Polygon mainnets
7fb34ef4 feat(contracts): record V4.1 Tier 1 SCP-deployed addresses (Sepolia + Base Sepolia)
```

PRs filed against `Render-Network-OS/sw4p-pro`: none yet; the W1 wave keeps the work on the dated staging branch pending the cycle-level review at W8 (mainnet runbook + audit prep). The branch carries five code-bearing commits, none of which depend on sw4p-backend HTTP availability (W0.d blocker is still open but does not gate Phase A through F).

## sw4p-kit worktree (`Render-Network-OS/sw4p-kit`, branch `staging/devnet-frontier-2026-05-16`)

```
(no commits ahead of origin/main)
```

W1 produced no sw4p-kit changes (kit work resumes in W4).

## Grouping by W1 phase

| Phase | Parent commits | sw4p commits | Files touched |
|---|---|---|---|
| Plan | `967d8ffa`, `3afcf1f1` | n/a | `docs/superpowers/plans/2026-05-17-sw4p-devnet-frontier-w1-canonical-evm.md` |
| Pre-flight | `d6be7f7c` | n/a | `DEVNET_FRONTIER_EVIDENCE_2026-05-16/waves/W1-canonical-evm/preflight-funding.md` |
| Phase A (controls + constructor preconditions) | `547ba64b`, `1b27286f` | n/a (inspection + tests only, no source change) | `phase-a-control-coverage.md` |
| Phase B (Permit2 sourcing + registry consolidation) | `b55623ba` | `a062f780`, `0dc8ee42`, `fef2ad7f` | `phase-b-permit2-sourcing.md`, `sw4p-backend/contracts/registry/{permit2,tier1,tier2,tier3-mainnet-fork}.json`, `sw4p-backend/contracts/scripts/deploy_testnet.cjs` |
| Wallet provisioning (W0 addenda) | `d3a94f6d`, `41d5c8cf` | n/a | `waves/W0-setup/circle-wallet-setup.md`, `waves/W0-setup/circle-wallet-sca-addendum.md` |
| Phase C (Tier 1 SCP deploys) | `176a4b94` (deferred attempt), `47628ad0` | `7fb34ef4` (`deployed_addresses.json` for Sepolia + Base Sepolia) | `phase-c-tier1-scp-deploys.md`, `sw4p-backend/contracts/scripts/deployed_addresses.json` |
| Phase D (Tier 1 acceptance via SCP contractExecution) | `77138350` | n/a (acceptance is read-only against live contracts) | `phase-d-tier1-acceptance.md` |
| Phase E (Tier 2 CCTP-only on Fuji + Amoy) | `306b5df5` (sibling-agent commit during W1 Phase G closeout) | n/a (acceptance is direct SCP calls to canonical Circle contracts; no V4.1 deploy on these chains) | `phase-e-tier2-cctp-only.md` |
| Phase F (Tier 3 mainnet-fork compat) | `9be6b358` | `bdd1bfe2` (hardhat.config.cjs fork networks + new test/fork suites) | `phase-f-mainnet-fork-compat.md`, `sw4p-backend/contracts/registry/tier3-mainnet-fork.json`, `sw4p-backend/contracts/hardhat.config.cjs`, `sw4p-backend/contracts/test/fork/{avalanche,polygon}-mainnet-compat.test.cjs` |

## Review iterations

- Phase C: one review iteration. Attempt 1 (`176a4b94`) used EOA Circle Wallets and blocked on Circle `code: 177025 insufficient balance` because EOA wallets cannot be Gas-Station sponsored. SCA wallet provisioning (`41d5c8cf`) added six SCA wallets sharing counterfactual address `0x7ddba97f140f936a53669aa1ba73f04dd25557d4`; re-run (`47628ad0` + sw4p `7fb34ef4`) deployed both Tier 1 chains to CONFIRMED state with SCA native balance staying at `0x0` end-to-end.
- Phase D: no review iterations; first-pass SCP `contractExecution` runs produced clean evidence for three of four gates. The fourth gate's deferral was discovered up front in the pre-flight state read (SCA USDC = 0 on both chains), not after a failed attempt.
- Phase E: no review iterations; the structural-readiness probe + USDC approve + ABI-reachability gates all passed first-attempt on both Fuji and Amoy. The on-chain burn deferral was discovered the same way as Phase D's CCTP RT deferral (SCA USDC = 0), and the Phase E evidence is explicit that the simulator revert is the positive wiring proof.

## Reviewer notes

W1 produced 12 evidence + plan commits at parent root, one sibling-agent Phase E evidence commit landed during closeout, and 5 code-bearing commits in the sw4p worktree, none of which touched sw4p-backend HTTP/API surface (W0.d backend blocker remains open but does not gate Phase A through F because every state-changing call was routed through Circle SCP, not through sw4p-backend). The deferred items (D.4 Tier 1 CCTP RT and E.C Tier 2 burn + Iris attestation + receive) both unblock on a single Circle USDC faucet claim to the shared SCA address on four chains (Sepolia, Base Sepolia, Fuji, Amoy) and can complete in a follow-up Phase D' / E' session without re-doing any code work.
