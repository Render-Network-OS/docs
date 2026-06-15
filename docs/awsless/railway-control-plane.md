# Railway Control-Plane Rail

This is the first AWSless origin target. It proves the 555stream HTTP/API
origin independently from RunPod and Cloudflare routing.

## Source

- Railway service root: `555stream`
- Railway config: `555stream/railway.json`
- Railway Dockerfile: `555stream/Dockerfile.railway-control-plane`
- Env contract: `docs/awsless/env/railway-control-plane.env.example`

## Required Railway Services

- `control-plane` from this repo service.
- Postgres database attached as `DATABASE_URL`.
- Redis-compatible service attached as `REDIS_URL`.

## Deploy Notes

1. Create or select the existing Railway project/environment.
2. Point the service root to `555stream`.
3. Use `railway.json` so Railway builds with `Dockerfile.railway-control-plane`.
4. Set env vars from `docs/awsless/env/railway-control-plane.env.example`.
5. Keep `STREAM_DISABLE_OUTPUTS=true` for the first deploy.
6. Do not enable real destination pushes until Go Live dry-run evidence is clean.

## Evidence Gate

Capture all of the following under `555stream/evidence/awsless/<date>/`:

- Railway deployment ID and URL.
- `/healthz` HTTP 200 from the Railway URL.
- `/healthz` HTTP 200 from the Cloudflare-fronted URL once routed.
- Control-plane log lines showing successful Postgres and Redis connectivity.
- Redacted env summary showing required variable names are present.

## Known Follow-Up

The control-plane `start.sh` runs Prisma migrations and seed on boot. That is
acceptable for the first Railway rail, but promotion should decide whether
migrations remain boot-time or move to a separate one-shot Railway job.

