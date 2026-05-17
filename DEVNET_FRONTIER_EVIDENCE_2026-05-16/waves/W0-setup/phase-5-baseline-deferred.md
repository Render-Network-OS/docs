# W0 Phase 5 Summary: Baseline Deferred (Tasks 5.1, 5.2, 5.3)

**Date:** 2026-05-17T01:30:00Z
**Decision:** Phase 5 closes WITHOUT executing the planned $2 baseline CCTP V2 round-trip. The decision is BLOCKED, not skipped: the planned action cannot be executed against a real sw4p-backend because no real sw4p-backend is currently reachable.

## Authorization status

User authorized the baseline round-trip ($1 × 2 USDC, Base Sepolia <-> Solana Devnet) at the Task 5.1 gate. The authorization was not consumed because the implementer's pre-flight protocol-endpoint discovery (Task 5.2 Step 0) returned no reachable real backend. The plan's escalation trigger ("If Step 0 finds no reachable sw4p-backend endpoint: BLOCKED") was applied.

## Discovery evidence

`probes/protocol-endpoint-discovery.md` (commit `d3146d72`) documents every probed URL with HTTP status:

- `api.sw4p.io` -> Railway "Application not found" envelope (HTTP 404; Cloudflare reaches Railway; no Railway service bound to that hostname).
- `staging-api.sw4p.io` -> nginx 503 (AWS EKS ingress up, cert valid, `sw4p-backend:3000` Service has zero Ready endpoints; pod not running, scaled to zero, or readiness failing).
- `sw4p-backend.up.railway.app`, `sw4p-watcher.up.railway.app` -> NXDOMAIN / unreachable.
- `app.sw4p.io`, `console.sw4p.io`, `555.sw4p.io` -> Cloudflare 404 (not in staging ingress per `aws-landing.md`).
- `sw4p-devnet-mock.gl4sspr1sm.workers.dev` -> reachable, self-declared `mode: devnet-mock`. Forbidden by ZERO-MOCKS for acceptance evidence.

## Adjacent findings

- Railway MCP succeeds for `mcp__railway__list_projects` (sees `sw4p-staging-testnet`, id `057864df-cb05-4518-97e0-a63b28518b9d`) but `list_services` returns `Unauthorized. Please run railway login again`. Token does not have per-project read scope from this controller.
- `SW4P_API_KEY` in `sw4p-kit-devnet-frontier-2026-05-16/.env` is empty; this is an independent blocker even once the backend is restored.
- Root `.mcp.json` wires the sw4p MCP to the Cloudflare Workers mock by default. Once the real backend is live, that `SW4P_API_URL` should be updated.

## Cycle impact

This blocker is **not local to W0.d**. The same backend health is required by:

- W1 (Canonical EVM): Tier 1 testnet deploys validated via real CCTP round-trips through the protocol.
- W3 (3-phase atomicity): real restart-mid-state recovery test requires the watcher loop running.
- W4 (Kit completion): `sw4p.balance` and `sw4p.send` test suites must hit the real testnet protocol per ZERO-MOCKS.
- W5 (Distribution): `npx @sw4p/kit init` clean-machine test depends on a real backend.
- W6 (Intent contracts): solver auction and intent submission flows require the backend.
- W7 (Intent UX): kit intent-first send measured against the real backend.
- W8 (Final phases / audit prep): aggregate evidence requires real protocol traces.

**Without backend restoration, W1 through W8 cannot proceed with ZERO-MOCKS acceptance.**

## Unblock criteria (to resume Phase 5 and W1+)

Choose any one (all three preferred):

1. **Restore sw4p-backend on AWS EKS staging:**
   - Re-run `deploy/aws/scripts/deploy-staging.sh` (or equivalent) from a Render-resident operator.
   - Verify `staging-api.sw4p.io` returns HTTP 200 from `/health` or `/sdk/v1/limits` (with API key).
   - Bastion access via `deploy/aws/scripts/eks-private-kubectl.sh` is the path for verification.

2. **Restore sw4p-backend on Railway:**
   - Re-bind `api.sw4p.io` (or `staging-api.sw4p.io`) to a live `sw4p-backend` Railway service.
   - Run `railway login` locally OR provision a Railway MCP token with per-project read+deploy scope so this controller can verify state.

3. **Provision SW4P_API_KEY against the restored backend:**
   - Mint an API key via `console.sw4p.io` (if console is live) OR via the backend's `sdk_auth.rs` admin path.
   - Populate `sw4p-kit-devnet-frontier-2026-05-16/.env` with `SW4P_API_KEY=<minted-key>`.

## Action on resumption

Once unblocked, re-run Tasks 5.2 + 5.3 (the implementer's plan steps are preserved and re-executable). Authorization from the original Task 5.1 gate carries forward unless the user revokes it.

## Decision status

**Deferred (BLOCKED on backend health).** Resumes after one of the unblock criteria above is met.
