# Protocol Endpoint Discovery (W0 Tasks 5.2 + 5.3 pre-flight)

**Date:** 2026-05-17T05:45:00Z
**Cycle:** sw4p devnet-frontier 2026-05-16
**Purpose:** Determine which (if any) public URL serves the real sw4p-backend HTTP API today, before executing the two real CCTP V2 baseline transfers planned for Tasks 5.2 (Base Sepolia to Solana Devnet) and 5.3 (Solana Devnet to Base Sepolia).
**Outcome:** **BLOCKED.** No public URL is currently serving the real sw4p-backend HTTP API. The only reachable API-shaped endpoint is a self-declared Cloudflare Workers mock (`sw4p-devnet-mock.gl4sspr1sm.workers.dev`), which the cycle's "ZERO MOCKS" constraint forbids. Tasks 5.2 and 5.3 cannot execute against a real endpoint without first restoring the deployed backend.

## Step 0 inputs

### 0.1 Configured URL hints in the sw4p worktree

`railway.toml` lines 100 and 107 (verbatim):

```
# | api.sw4p.io       | sw4p-backend      |
...
#   api.sw4p.io      -> sw4p-backend.up.railway.app
```

`sw4p-kit-devnet-frontier-2026-05-16/.env` (the only configured kit env):

```
SW4P_API_URL=https://staging.api.sw4p.io
SW4P_API_KEY=
SW4P_STAGING_URL=
SW4P_STAGING_KEY=
SW4P_MAINNET_URL=https://api.sw4p.io
SW4P_MAINNET_KEY=
```

`SW4P_API_KEY` is empty. `SW4P_STAGING_URL` is empty. `SW4P_MAINNET_KEY` is empty.

`sw4p-kit-devnet-frontier-2026-05-16/.env.example` defaults:

```
SW4P_API_URL=https://api.sw4p.io
SW4P_STAGING_URL=https://staging.api.sw4p.io
SW4P_MAINNET_URL=https://api.sw4p.io
```

SDK source defaults (`sw4p-kit/src/mcp/http.ts:195`, `sw4p-kit/src/mcp/bin.ts:10`, `sw4p-kit/src/cli/doctor.ts:191`):

```
const apiUrl = opts.apiUrl ?? process.env.SW4P_API_URL ?? "https://api.sw4p.io";
```

Root `.mcp.json` (verbatim, single sw4p server entry):

```json
{
  "mcpServers": {
    "sw4p": {
      "env": {
        "SW4P_API_URL": "https://sw4p-devnet-mock.gl4sspr1sm.workers.dev",
        "SW4P_API_KEY": "8ff5c3fbc1586ab423e94f83b998b599f48bf81518bd0e0504d608c8d0f825b1",
        ...
      }
    }
  }
}
```

So the deployment-shaped candidates to probe are: `api.sw4p.io` (declared production), `staging.api.sw4p.io` (declared staging, no DNS), `staging-api.sw4p.io` (the AWS EKS ingress host added in commit `b0e95fd` and `e12cd41`), `sw4p-backend.up.railway.app` (Railway public domain per railway.toml), `sw4p-watcher.up.railway.app` (Railway watcher), `app.sw4p.io` / `console.sw4p.io` / `555.sw4p.io` (Cloudflare-fronted but non-backend), and `sw4p-devnet-mock.gl4sspr1sm.workers.dev` (the only URL with a configured `SW4P_API_KEY`, but self-declared as a devnet mock).

### 0.2 sw4p-backend route surface (confirmed in source)

The endpoints the SDK plan's flow needs are wired in `sw4p-backend/src/lib.rs:456-477` and `sw4p-backend/src/lib.rs:827-830`:

```
.route("/sdk/v1/transfer", post(sdk_bridge::sdk_transfer_handler))
.route("/sdk/v1/estimate", post(sdk_bridge::sdk_estimate_handler))
.route("/sdk/v1/status/:intent_id", ...)
.route("/sdk/v1/solana/build-tx", ...)
.route("/sdk/v1/solana/gasless/validate", ...)
.route("/sdk/v1/solana/submit", ...)
.route("/sdk/v1/pairs", get(sdk_bridge::sdk_pairs_handler))
.route("/sdk/v1/limits", get(sdk_bridge::sdk_limits_handler))
.route("/health", ...)
.route("/health/detailed", get(health::health_detailed_handler))
```

So a real sw4p-backend will return a 200 (or 401 with structured error) for `/health`, `/sdk/v1/limits`, and `/sdk/v1/pairs`, and a 401 for `/sdk/v1/transfer` (POST) without an `X-API-Key`.

## Step 0.3 HTTP probes (executed 2026-05-17T05:39 to 05:42Z)

Each candidate was probed three ways: root `/`, `/health`, `/sdk/v1/limits`. All probes used `curl -sS -m 15` from this controller.

| URL | HTTP | Body snippet (first 200 bytes) | Interpretation |
|---|---|---|---|
| `https://api.sw4p.io/` | 404 | `{"status":"error","code":404,"message":"Application not found","request_id":"..."}` | Railway "Application not found" envelope. Cloudflare-fronted, but the origin Railway service is not serving (`api.sw4p.io` is not in the AWS EKS staging ingress rules per `probes/aws-landing.md`, and the Railway project that owns the `api.sw4p.io` -> `sw4p-backend.up.railway.app` mapping does not currently expose a 200). |
| `https://api.sw4p.io/health` | 404 | (same Railway envelope) | Real sw4p-backend would return 200 with health JSON. |
| `https://api.sw4p.io/sdk/v1/limits` | 404 | (same Railway envelope) | Real sw4p-backend would return 401 (missing X-API-Key) or 200. |
| `https://staging.api.sw4p.io/` | 000 (DNS) | `curl: (6) Could not resolve host: staging.api.sw4p.io` | The hostname declared in the kit `.env` (`SW4P_API_URL=https://staging.api.sw4p.io`) does not have a DNS record at all. |
| `https://staging-api.sw4p.io/` | 503 | `<html><body><center><h1>503 Service Temporarily Unavailable</h1></center><hr><center>nginx</center></body></html>` | nginx-ingress is reachable (this is the AWS EKS staging ingress confirmed in `probes/aws-landing.md`), but the upstream `sw4p-backend:3000` Service has no healthy endpoints. The pod is not currently running, or the Deployment has zero replicas, or readiness is failing. |
| `https://staging-api.sw4p.io/health` | 503 | (same nginx 503) | nginx never routes to the pod because there are no Ready endpoints. |
| `https://staging-api.sw4p.io/sdk/v1/limits` | 503 | (same nginx 503) | Same. |
| `https://staging-api.sw4p.io/sdk/v1/health` | 503 | (same nginx 503) | Same. |
| `https://sw4p-backend.up.railway.app/` | 404 | (Railway envelope) | Railway public domain advertised in `railway.toml` line 107 is not currently bound to a live Railway service. |
| `https://sw4p-backend.up.railway.app/health` | 404 | (Railway envelope) | Same. |
| `https://sw4p-backend.up.railway.app/sdk/v1/limits` | 404 | (Railway envelope) | Same. |
| `https://sw4p-watcher.up.railway.app/` | 404 | (Railway envelope) | Watcher Railway domain is also unbound. |
| `https://sw4p-watcher.up.railway.app/health` | 404 | (Railway envelope) | Same. |
| `https://app.sw4p.io/` | 404 | (Railway envelope) | Cloudflare-fronted production-style host, not in the staging ingress rules. |
| `https://console.sw4p.io/` | 404 | (Railway envelope) | Same. |
| `https://555.sw4p.io/` | 000 (DNS) | `curl: (6) Could not resolve host: 555.sw4p.io` | No DNS record. |
| `https://sw4p-devnet-mock.gl4sspr1sm.workers.dev/health` | 200 | `{"status":"ok","service":"sw4p-devnet-mock","mode":"devnet-mock"}` | Reachable, but the response body explicitly self-identifies as `service: sw4p-devnet-mock, mode: devnet-mock`. This is a Cloudflare Workers mock, not the real sw4p-backend. |
| `https://sw4p-devnet-mock.gl4sspr1sm.workers.dev/` | 401 | `{"error":"MISSING_API_KEY","message":"X-API-Key header is required"}` | Same mock; rejects requests without the configured mock key. |
| `https://sw4p-devnet-mock.gl4sspr1sm.workers.dev/sdk/v1/limits` | 401 | (same mock 401) | Same mock surface. |

## Step 0.4 Railway control-plane check

`mcp__railway__list_projects` (succeeds): the personal Railway workspace lists 10 projects, including `sw4p-staging-testnet` (`id: 057864df-cb05-4518-97e0-a63b28518b9d`) and `sw4p-tron-proof-testnet` (`id: 3900629c-e282-4040-835c-0d590b9e3521`).

`mcp__railway__list_services` against both project IDs (`057864df-cb05-4518-97e0-a63b28518b9d` and `3900629c-e282-4040-835c-0d590b9e3521`) returns:

```
MCP error -32603: Failed to get project: Unauthorized. Please run `railway login` again.
```

So even with the Railway MCP available, the per-project read scope is unauthorized for the controller's current token. The Railway dashboard would need to be opened by the user to retrieve the current deploy state of `sw4p-backend` in `sw4p-staging-testnet`. The CLI surface accessible from here cannot confirm whether the sw4p-backend service is deployed, paused, or scaled to zero.

## Step 0.5 AWS EKS state (inferred from prior probe)

Per `probes/aws-landing.md` (Step 3), this controller cannot directly read the `rndr-stream-staging` EKS cluster: the EKS API endpoint is private-only, and `kubectl --request-timeout=5s get ns` times out from here. The deploy rail's documented workaround is `deploy/aws/scripts/eks-private-kubectl.sh`, which requires an AWS-resident bastion. Without bastion access from this controller, the live state of the `sw4p-backend` Deployment in namespace `sw4p-staging` cannot be verified directly.

What we can infer from the 503 on `staging-api.sw4p.io`:

- The ingress rule for `staging-api.sw4p.io -> sw4p-backend:3000` IS present in `deploy/aws/k8s/environments/aws-staging/ingress.yaml`.
- nginx-ingress is serving the ingress, so the Ingress resource is provisioned and the cert is valid (or nginx would have served a TLS-level error, not a 503).
- The upstream Service `sw4p-backend:3000` has zero Ready Endpoints, which is what causes nginx to return 503. Either the Deployment is scaled to zero, the pod is in CrashLoopBackOff, the pod is failing readiness probes, or the Service selector does not match any Pod labels.

This matches the Live Dependency Matrix v1 note: `staging-api.sw4p.io returns 503: the backend service is not healthy or not currently routed; downstream W0 / W1 work should verify the backend pod rollout.`

## Step 0.6 Mock endpoint is forbidden by cycle constraints

The cycle's hard constraints for Tasks 5.2 + 5.3 read:

```
ZERO MOCKS: real tx hashes, real explorer URLs, real protocol endpoint.
Do NOT execute transfers against any endpoint that isn't a real sw4p-backend
(no fake / staging-mock / placeholder backends).
```

`sw4p-devnet-mock.gl4sspr1sm.workers.dev` self-identifies as `mode: devnet-mock` in its `/health` response. Even though it is reachable and answers SDK-shaped paths with an API key, executing the baseline transfers against it would violate the explicit no-mocks rule and would not produce real CCTP V2 burn-mint tx hashes on Base Sepolia or Solana Devnet. The Workers code would simply fabricate intent IDs and report fake settled states.

## Decision

Tasks 5.2 (Base Sepolia to Solana Devnet baseline) and 5.3 (Solana Devnet to Base Sepolia baseline) are **BLOCKED** until the real deployed sw4p-backend is serving on at least one public URL.

Unblock criteria (any one of these is sufficient to retry):

1. The AWS EKS `sw4p-backend` Deployment in namespace `sw4p-staging` is scaled to at least 1 Ready replica, `staging-api.sw4p.io/health` returns 200, and `SW4P_STAGING_KEY` is provisioned and provided to the controller.
2. The Railway `sw4p-backend` service in project `sw4p-staging-testnet` is redeployed, `sw4p-backend.up.railway.app/health` (or `api.sw4p.io/health` once the Cloudflare origin is repointed at the Railway domain) returns 200, and a working `SW4P_API_KEY` is provided.
3. A different real sw4p-backend deployment URL is provided directly, with a working API key, and is verified to respond with the sw4p-backend `health.rs` JSON shape (not the mock's `service: sw4p-devnet-mock` envelope) at `/health`.

What is NOT a sufficient unblock: the `sw4p-devnet-mock.gl4sspr1sm.workers.dev` URL, regardless of what API key is configured for it. It is a Workers mock by self-declaration; using it would violate the cycle's zero-mocks rule and produce fabricated evidence rather than real CCTP V2 round-trip tx hashes.

## Recommended next session action

Before retrying Tasks 5.2 + 5.3, run the AWS EKS deploy-staging script (`deploy/aws/scripts/deploy-staging.sh`) from a Render bastion that has cluster reach to `rndr-stream-staging`, confirm the `sw4p-backend` Deployment reports `1/1 Ready`, then re-probe `staging-api.sw4p.io/health` from anywhere on the public internet to confirm 200, and provision a real `SW4P_API_KEY` against that deployment before authorizing the $2 testnet round-trip. The kit `.env`'s empty `SW4P_API_KEY` is itself a separate blocker that must be filled at the same time.

## No commit-time data fabrication

This document does not record any intent IDs, source tx hashes, destination tx hashes, or explorer URLs, because no real protocol-mediated transfer was executed. Tasks 5.2 + 5.3 will be re-attempted in a future session against the unblocked endpoint.
