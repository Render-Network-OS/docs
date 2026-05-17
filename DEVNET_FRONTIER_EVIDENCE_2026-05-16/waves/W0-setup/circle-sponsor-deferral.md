# W0.c Circle Gas Station Deferral

**Determination date:** 2026-05-17T05:32:03Z
**Determination evidence:** `probes/circle-gas-sponsor.md` (commit `2dd5b45577e2d383702d315aefcb166f5b44c684`)
**Determination outcome:** Circle Gas Station fit NOT CONFIRMED for sw4p's Solana CCTP V2 signer flow.

## Reason for deferral

Circle Gas Station sponsorship semantics scope the sponsored payer to Circle Programmable Wallets (user-controlled-wallet or developer-controlled-wallet). sw4p currently signs Solana CCTP V2 burns with a raw `Keypair` loaded from `SOLANA_RELAYER_PRIVATE_KEY`. Migrating sw4p's Solana relayer custody to Circle Wallets is structural and out of W0 scope. Therefore, Circle cannot be the effective fee payer for sw4p's exact production CCTP V2 path without that prior custody change.

## Consequence per spec Section W8.f

- **Kora remains** the Solana fee-payer for sw4p's gasless Solana CCTP V2 flow.
- **Kora retirement candidacy is DEFERRED.** No Kora sunset PR is drafted in W8.f for this cycle.
- The Live Dependency Matrix row "Circle Solana gas sponsor" reflects this outcome (see Task 4.5 update).
- The Frontier Engine doctrine of "universal gas abstraction" remains unaffected: sw4p continues to abstract Solana gas via Kora (and EVM gas via Circle WaaS), with the same caller-visible UX.

## What would unblock Kora retirement in a future cycle

Any of these three structural conditions would change the determination:

1. **Circle releases Gas Station support for arbitrary external Solana fee-payers** (not just Circle Wallet flows). This is the cleanest path. It would let sw4p keep its current raw-Keypair signer and substitute Circle as fee payer without a custody migration.
2. **Circle releases a "Gas Station policy attachable to any signer" or equivalent generalization** documented as supporting non-Wallet signers. The `gas-station-policies` Circle sub-page returned HTTP 500 at probe time; revisit when it is reachable to confirm semantics.
3. **sw4p migrates Solana relayer custody to Circle Wallets** (developer-controlled-wallet model). This is the largest change because it would alter sw4p's existing operational model for Solana custody and may have key-management implications. Not blocked, but not in W0 scope and not justified by the marginal benefit of replacing Kora alone.

## sw4p-side state today

sw4p already has a `SolanaGasSponsorProvider::Circle` enum variant in `sw4p-backend/src/sdk_solana.rs` (per `probes/circle-gas-sponsor.md` Step 3) that resolves a pubkey from `CIRCLE_SOLANA_FEE_PAYER_PUBKEY` and `WAAS_WALLET_*` env vars. This is preparatory scaffolding for a future Circle-Wallet-based sponsorship path, NOT an active production path today. It does not change the W0.c determination because the wallet on the other end of those env vars must still be a Circle Wallet, which is the exact migration this deferral defers.

## Action items for downstream waves

- **W4 (Kit completion):** the kit's gas-abstraction docs / SDK should describe the universal-gas-abstraction UX without naming Kora or Circle specifically (already done per Track D corpus alignment).
- **W8 (Final phases):** W8.f records this deferral and the unblock criteria. No Kora sunset PR.

## Decision: status

**Deferred.** Re-evaluate in a future cycle when any of the three unblock conditions above are met.
