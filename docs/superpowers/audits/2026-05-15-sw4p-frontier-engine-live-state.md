# sw4p Frontier Engine Live-State Audit

**Date:** 2026-05-15
**Scope:** Approach A WS0 gates.
**Inputs:** design spec, SOW, TRD, local filesystem, public RPC checks, official Circle/Solana/Uniswap/EIP sources.

## Gate Summary

| Gate | Status | Evidence |
|---|---|---|
| Solana deployment-status audit | Complete | See "Solana Deployment Status". Public RPC checks found no mainnet account for either declared Solana program ID; devnet has two native-program references and no Anchor account. |
| EVM live-path audit | Open | Filled by Task 0.3. |
| P-Token activation-status check | Open | Filled by Task 0.4. |
| EVM safety-control scoping | Open | Filled by Task 0.5. |

## Decisions Produced

| Decision | Value | Reason |
|---|---|---|
| Can WS1 migration sequence start? | Yes, with explicit target reconciliation | The audit resolved the live-state unknown: consumers must migrate off the Anchor ID and the hard-coded devnet native ID, and WS1 must treat mainnet Solana promotion as a deploy/promotion step rather than assuming the declared native ID is already live on mainnet. |
| Can ZapNative be deleted? | Open | Requires EVM live-path audit. |
| Can P-Token batch be required on target mainnet? | Open | Requires target-cluster activation check. |
| What EVM safety controls must V4-derived canonical contract carry? | Open | Requires V4 safety-control scope. |

## Solana Deployment Status

Commands run on 2026-05-15:

```bash
rg -n '555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG|555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3|HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf|SW4P_NATIVE_PROGRAM_ID|SW4P_PROGRAM_ID' sw4p -g '!target' -g '!node_modules' -g '!artifacts'
solana program show 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG --url https://api.mainnet-beta.solana.com
solana program show 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3 --url https://api.mainnet-beta.solana.com
solana program show 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG --url https://api.devnet.solana.com
solana program show 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3 --url https://api.devnet.solana.com
solana program show HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf --url https://api.devnet.solana.com
```

| Program label | Program ID | Mainnet status | Devnet status | Consumers | Migration consequence |
|---|---|---|---|---|---|
| Native canonical candidate | `555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG` | Public mainnet-beta RPC returned `Unable to find the account 555nber4ezpjLqiAiY5GnjkGEbWWcgShUcFLtUPf39PG`. | Exists. ProgramData `6f6sWdyJ8zaiERTaZtnTDTizrBaKe6dWj75C8Sahh556`; authority `555o4r175YQ3tqkNwk8vEN3hAP9rF2QQPRBSXfyvq94g`; last deployed slot `462251543`; data length `166832`; balance `1.1623548 SOL`. | Declared by `sw4p/programs/sw4p-native/src/lib.rs`; configured in `sw4p/render.yaml`; allowed by `sw4p/kora/kora.toml` and `sw4p/sw4p-backend/kora.toml`; used as the mainnet Solana registry value in `sw4p/sw4p-backend/src/networks.rs`; env-overridable through `SW4P_NATIVE_PROGRAM_ID` in backend scripts and `cctp_burn.rs`. | Treat as canonical source identifier but not as an already-live mainnet deployment. WS1 can start after code consumers are made registry/env-driven; WS9 must include the mainnet Solana promotion. |
| Anchor legacy | `555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3` | Public mainnet-beta RPC returned `Unable to find the account 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3`. | Public devnet RPC returned `Unable to find the account 555FYVu5wEbRmKPg6g8zhPUhMXZCc9y2Z2hbQkz5wMj3`. | Declared by `sw4p/programs/sw4p/src/lib.rs` and `sw4p/programs/sw4p/Anchor.toml`; hard-coded into `sw4p/sw4p-frontend/services/koraBridge.ts` for PDAs and transaction instruction `programId`; allowed by Kora configs; hard-coded in `sw4p/sw4p-backend/src/watcher/mod.rs` for rent reclaim; used by frontend/backend scripts and tests. | Anchor consumer references are real even though public RPC did not find a live account. WS1 must migrate `koraBridge.ts`, watcher rent reclaim, Kora allowlists, and scripts/tests off this ID before the Anchor program can be retired. |
| Devnet native reference | `HYw45arPggjxZkQiSj8hKLraEe4bVx8YuzGiEcxb7bVf` | Not expected on mainnet. | Exists. ProgramData `8JsajWxVjQtrv6X6gFZpPJpRRKTEE5MPcuciUYPmk4px`; authority `555Tm1cfV52SrBQmnxXiHMUMrpci8miW3CkLP1Qbmtd7`; last deployed slot `452264710`; data length `169832`; balance `1.1832348 SOL`. | Hard-coded in `sw4p/sw4p-frontend/services/koraBridge.ts` as `SW4P_NATIVE_PROGRAM_ID`, but that constant is not used by the current transaction builder; used as testnet Solana registry value in `sw4p/sw4p-backend/src/networks.rs`, defaults in backend scripts, and native bridge docs/tests. | Keep as devnet/testnet evidence only. WS1 should remove frontend hard-coding and select the canonical Solana program through registry/env configuration. |

**Solana audit decision:** WS1 migration sequencing can start because the unknown is resolved. The migration must not assume a live mainnet Solana program exists today; it must consolidate consumers onto the canonical native program path, remove Anchor consumer references, and leave mainnet program deployment/promotion as an explicit WS9 gate.
