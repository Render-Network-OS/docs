# sw4p USDT / Tron Stablecoin Parity External Team Handoff

**Status:** Handoff index - ready for external review and planning.
**Date:** 2026-05-18.
**Owner:** sw4p Frontier Engine corpus.
**Audience:** External product, protocol, backend, frontend, kit, security, and operations teams.

---

## 1. Read This First

This handoff is for an external team with no prior sw4p context. The goal is to deliver honest USDT parity across EVM, Solana, and Tron without weakening the existing USDC/CCTP architecture or creating fake live routes.

The pack contains four binding artifacts:

1. `2026-05-18-sw4p-usdt-tron-parity-prd.md`
2. `2026-05-18-sw4p-usdt-tron-parity-crd.md`
3. `2026-05-18-sw4p-usdt-tron-parity-trd.md`
4. `2026-05-18-sw4p-usdt-tron-parity-sow.md`

Read in that order.

## 2. One-Sentence Architecture

USDC remains on Circle CCTP V2. USDT and Tron use Allbridge Core only where provider state, sw4p code support, quote support, liquidity, signing, proof, runtime policy, frontend state, kit state, and operations state all pass.

## 3. Non-Negotiables

- BTC/Omni USDT is out of scope.
- Provider metadata alone does not make a route live.
- No fake Allbridge testnet acceptance.
- No mainnet canary without explicit named authorization.
- No silent USDT to USDC conversion.
- No silent Base USDT to Base USDC fallback.
- No Tron relayer custody for production users by default.
- No route appears live unless frontend, backend, kit, provider registry, proof ledger, and operations agree.
- sw4p contract deployments remain Circle SCP only unless explicitly overridden for a named deployment.

## 4. First Development Scope

Start with SOW M0 through M2 only:

1. inventory existing branches and code,
2. build provider registry and route-state service,
3. implement route policy filters,
4. implement asset-first rail selector,
5. integrate quote/raw transaction builder design,
6. implement raw transaction validation requirements,
7. prove unsupported routes fail closed.

Do not start frontend route enablement before route truth exists.

## 5. First PR Expectations

The first implementation PR should include:

- Allbridge provider snapshot fetcher or pinned snapshot interface,
- normalized route matrix,
- route-state schema,
- policy filters for BTC/Omni, Base USDT, Tron USDC, and Unichain runtime exposure,
- asset-first rail selector guards,
- structured route-state API response,
- tests proving false-live routes cannot pass,
- documentation of current provider snapshot and TTL behavior.

## 6. First Canary Candidate

If mainnet proof is later authorized, the first candidate is Polygon USDT to Tron USDT.

No transfer may run until the authorization object names:

- source chain,
- destination chain,
- asset,
- amount,
- source wallet,
- destination wallet,
- fee cap,
- slippage or pool-impact cap,
- approval cap,
- expiry,
- approver,
- evidence destination.

## 7. Development Review Checklist

Every PR must state:

- which route states changed,
- which provider data source was used,
- whether any route can become live,
- how stale registry state fails closed,
- how raw transactions are validated,
- how approval caps are enforced,
- how frontend/backend/kit consistency is preserved,
- how the proof ledger is affected,
- what tests were run.

## 8. External Research Questions

External reviewers should answer:

1. Is Allbridge Core the right USDT/Tron provider for V1?
2. Is TronLink the right default production signing surface?
3. Are raw transaction validation controls sufficient?
4. Are approval cap defaults strict enough?
5. Is provider metadata plus gated deferral acceptable when no non-production corridor exists?
6. Should any route besides Polygon USDT to Tron USDT be considered a better first canary?
7. What Allbridge provider-status or incident APIs should be integrated before launch?
8. What TRON confirmation policy should sw4p use before marking source leg confirmed?
9. What audit should precede live route exposure?

## 9. Completion Signal

This handoff is complete when the external team can build M0 through M2 without asking for prior chat context. It is not a launch approval, deploy approval, or canary approval.
