# Cloudflare AWSless Routing

Cloudflare fronts the Railway control-plane and owns media truth. Do not route
real destination output until the dry-run and Alice worker probes pass.

## Inputs

- Railway control-plane URL.
- RunPod Alice worker URL.
- Existing Cloudflare zone for `rndrntwrk.com`.
- Cloudflare Stream Live Input and webhook secret.
- TURN/RealtimeKit credentials.

## Recommended First Routes

| route | upstream | purpose |
| --- | --- | --- |
| `https://stream.rndrntwrk.com/*` | Railway control-plane | 555stream UI/API origin |
| `https://stream.rndrntwrk.com/api/*` | `api-router` Worker, then Railway origin | auth/rate-limit edge path |
| `https://alice.rndrntwrk.com/*` | RunPod Alice worker, or Cloudflare Tunnel to it | companion/operator Alice surface |
| Stream playback domain | Cloudflare Stream | truthful live playback |

## API Router AWSless Environment

Use the existing Worker at:

```text
555stream/workers/api-router
```

The `awsless` Wrangler environment is intentionally separate from the current
default route config. It must point at the Railway origin and must not use the
legacy origin IP override:

```toml
[env.awsless.vars]
ORIGIN_URL = "https://<railway-control-plane>.up.railway.app"
ORIGIN_RESOLVE_OVERRIDE = ""
ALLOWED_ORIGINS = "https://stream.rndrntwrk.com,https://alice.rndrntwrk.com"
```

Fill the AWSless KV/D1 binding IDs in
`555stream/workers/api-router/wrangler.toml`, then set secrets with Wrangler or
the Cloudflare dashboard:

```bash
cd 555stream/workers/api-router
wrangler secret put JWT_SECRET --env awsless
wrangler secret put CLOUDFLARE_TURN_ID --env awsless
wrangler secret put CLOUDFLARE_TURN_KEY --env awsless
wrangler deploy --env awsless
```

Do not deploy the `awsless` environment with placeholder binding IDs.

## Smoke Order

1. Prove Railway `/healthz` directly.
2. Prove Cloudflare-fronted `/healthz`.
3. Prove RunPod Alice `/companion/` directly.
4. Prove Cloudflare-fronted Alice route.
5. Prove Cloudflare Stream Live Input webhook connected/disconnected events.
6. Only then enable one real destination output.

## Probe

```bash
export CONTROL_PLANE_URL="https://<railway-control-plane>"
export CLOUDFLARE_URL="https://stream.rndrntwrk.com"
export ALICE_WORKER_URL="https://<runpod-endpoint-or-alice-domain>"
export ALICE_API_TOKEN="<redacted-if-required>"

/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
  scripts/awsless/probe-awsless-alice.mjs
```

The probe writes:

```text
555stream/evidence/awsless/<date>/awsless-alice-probe.json
```
