# sw4p-backend Reachability Diagnosis

**Date:** 2026-05-17
**Mode:** READ-ONLY (no deploys, builds, restarts, or mutations executed)
**Author:** diagnosis sub-agent (cycle: devnet-frontier 2026-05-16)
**Inputs:** W0 Phase 5 deferral, W1 next-wave-handoff Open Item 1, deploy rail source under `sw4p/deploy/aws/`, fresh HTTP probes 2026-05-17.

## Section 1: Current state (probes, codes, SSL, last-known SHA)

Live probes from this controller (2026-05-17, `curl -sI --max-time 10`):

| URL | DNS resolution | HTTP | SSL verify | Origin behavior |
|---|---|---|---|---|
| `https://api.sw4p.io/` | Cloudflare (`104.26.10.41`, `172.67.69.69`, `104.26.11.41`) | 404 | 0 (ok) | Cloudflare edge served a 404 (no live origin bound). Body matches Railway "Application not found" envelope per earlier `protocol-endpoint-discovery.md`. |
| `https://api.sw4p.io/health` | (same) | 404 | 0 (ok) | Same. |
| `https://api.sw4p.io/v1/health` | (same) | 404 | 0 (ok) | Same. |
| `https://api.sw4p.io/healthz` | (same) | 404 | 0 (ok) | Same. |
| `https://api.sw4p.io/readyz` | (same) | 404 | 0 (ok) | Same. |
| `https://api.sw4p.io/sdk/v1/estimate` | (same) | 404 | 0 (ok) | Same. |
| `https://staging-api.sw4p.io/` | EU-central-1 ALB (`af3a86b3ecd504a12a434b7a50949315-c9861852210dfa52.elb.eu-central-1.amazonaws.com`, `3.64.20.83`, `18.157.246.24`, `52.28.229.69`) | 503 | 0 (ok) | nginx-ingress responds with `503 Service Temporarily Unavailable`, body `<html><body><center><h1>503 Service Temporarily Unavailable</h1></center><hr><center>nginx</center></body></html>`, `strict-transport-security: max-age=31536000; includeSubDomains`, `content-length: 190`. HTTP/2 served. |
| `https://staging-api.sw4p.io/health` | (same) | 503 | 0 (ok) | Same nginx 503 envelope. |
| `https://staging.api.sw4p.io/` | NXDOMAIN (no DNS) | 000 | n/a | Host declared in `sw4p-kit-devnet-frontier-2026-05-16/.env` does not exist. |

**Canonical conclusion (probe-confirmed, matches `protocol-endpoint-discovery.md`):**

- Production hostname `api.sw4p.io`: Cloudflare-fronted, but no live origin. Cloudflare returns the upstream's "Application not found" envelope (the Railway service that previously back-stopped this hostname per `sw4p/railway.toml` lines 100, 107 is no longer bound). Per HARD user rule "AWS-only deploys", the `railway.toml` references are stale.
- Staging hostname `staging-api.sw4p.io`: AWS EKS ingress is reachable on the EU-central-1 ALB. TLS chain valid (`ssl_verify_result=0`). Ingress + nginx-ingress controller + cert-manager TLS are all healthy. The 503 means the upstream Kubernetes Service `sw4p-backend:3000` has zero Ready endpoints (Deployment scaled to zero, pod CrashLoopBackOff, readiness probe failing, or selector mismatch).
- All Railway-bound hostnames (`sw4p-backend.up.railway.app`, `sw4p-watcher.up.railway.app`) NXDOMAIN or 404 per `protocol-endpoint-discovery.md`. Aligns with the AWS-only-deploys constraint: Railway resources are stale leftovers.

**Last-known-deploy SHA:** Not directly discoverable from outside (the deployed image tag pattern is `sha-<short-git-sha>` per `build-and-push-ecr.sh:10` `TAG="${TAG:-sha-$(git rev-parse --short HEAD)}"`, and the staging overlay's image entries pin `newTag: dev` in `sw4p/deploy/aws/k8s/environments/aws-staging/kustomization.yaml:20-35` as a placeholder; the runtime overlay rewrites this to the build-time SHA via `deploy-staging.sh:105`). Without bastion access to read `kubectl -n sw4p-staging get deploy sw4p-backend -o jsonpath='{.spec.template.spec.containers[0].image}'`, the live deployed SHA cannot be confirmed from this controller. Most-recent backend-shaped commits on `sw4p`: `77837ef chore(backend): upgrade sqlx to 0.8`, `fcdade2 fix: harden sw4p staging proof paths`, `31639eb fix: unblock local sw4p testnet startup`. Most-recent deploy-rail commits on `sw4p`: `b0e95fd feat(ops): route sw4p landing hosts to aws ingress`, `e08cae3 fix(ops): build aws images for eks amd64 nodes`, `e12cd41 feat(ops): add sw4p aws staging deploy rail`. The deploy rail itself was added in `e12cd41`, so the AWS deploy is recent.

## Section 2: Deploy pipeline map (CodeBuild to ECR to EKS)

This is an **EKS + local-docker + ECR push** rail. There is no CodeBuild project on the sw4p side; image build is done by `deploy/aws/scripts/build-and-push-ecr.sh` from a developer workstation or Render-resident operator. (Contrast with parent-repo deploy rails that use AWS CodeBuild; sw4p is local-build-push.)

**Source paths:**

- Deploy script (orchestrator): `sw4p/deploy/aws/scripts/deploy-staging.sh`
- Image build + push: `sw4p/deploy/aws/scripts/build-and-push-ecr.sh`
- Private EKS kubectl shim: `sw4p/deploy/aws/scripts/eks-private-kubectl.sh`
- Secrets sync (AWS Secrets Manager to k8s): `sw4p/deploy/aws/scripts/sync-secrets-to-k8s.sh`
- Bootstrap AWS staging Secrets Manager objects: `sw4p/deploy/aws/scripts/bootstrap-aws-staging-secrets.sh`
- Kustomize base: `sw4p/deploy/aws/k8s/base/` (`backend-deployment.yaml`, `backend-service.yaml`, `migration-job.yaml`, `watcher-deployment.yaml`, plus frontend, console, storefront, landing, kora, postgres, redis)
- Kustomize staging overlay: `sw4p/deploy/aws/k8s/environments/aws-staging/` (`kustomization.yaml`, `ingress.yaml`, `namespace.yaml`)
- Service Dockerfile: `sw4p/sw4p-backend/Dockerfile` (multi-stage Rust nightly build to debian:bookworm-slim runtime, `EXPOSE 3000`, entrypoint `docker-entrypoint.sh`).

**Resource names (verbatim from source):**

| Resource | Value | Source path |
|---|---|---|
| AWS region | `eu-central-1` | `deploy-staging.sh:8` |
| AWS profile | `stream-admin` | `deploy-staging.sh:7` |
| EKS cluster name | `rndr-stream-staging` | `deploy-staging.sh:9` |
| k8s namespace | `sw4p-staging` | `deploy-staging.sh:10` |
| ECR registry pattern | `${account_id}.dkr.ecr.eu-central-1.amazonaws.com` | `deploy-staging.sh:97`, `build-and-push-ecr.sh:96` |
| ECR repo (backend) | `sw4p/backend` | `build-and-push-ecr.sh:85` |
| ECR repo (watcher) | (same image; `watcher` is a second binary built into the same `sw4p/backend` image, see `backend-deployment.yaml:27` + `watcher-deployment.yaml:22`) | `Dockerfile:32` (`cargo build --release --bin sw4p-backend --bin watcher`) |
| ECR image tag pattern | `sha-<git-short-sha>` | `build-and-push-ecr.sh:10` |
| ECR image-tag-mutability | `IMMUTABLE` | `build-and-push-ecr.sh:110` (so retry pushes for the same SHA are rejected by ECR; this is relevant to the failure hypothesis below) |
| Deployment | `sw4p-backend` (replicas: 1) | `backend-deployment.yaml:4,9` |
| Service | `sw4p-backend` (ClusterIP, port 3000, targetPort http) | `backend-service.yaml:4-15` |
| Container port | `3000` (named `http`) | `backend-deployment.yaml:30-31` |
| Readiness probe | `GET /health` on `http` port, `initialDelaySeconds: 10`, `periodSeconds: 10`, `timeoutSeconds: 5`, `failureThreshold: 6` | `backend-deployment.yaml:44-51` |
| Liveness probe | `GET /health` on `http` port, `initialDelaySeconds: 30`, `periodSeconds: 20`, `timeoutSeconds: 5`, `failureThreshold: 3` | `backend-deployment.yaml:52-59` |
| Env source (configmap) | `sw4p-config` | `backend-deployment.yaml:34` |
| Env source (secret) | `sw4p-backend-secrets` (synced from AWS Secrets Manager `/sw4p/staging/backend`) | `backend-deployment.yaml:36`, `sync-secrets-to-k8s.sh:16,85` |
| Migration job | `sw4p-migrate` (deleted + recreated each deploy) | `deploy-staging.sh:129,136`, `migration-job.yaml` |
| Ingress | `sw4p-staging`, ingressClassName `nginx`, host `staging-api.sw4p.io` to `sw4p-backend:3000`, cert-manager ClusterIssuer `letsencrypt-prod`, TLS secret `sw4p-staging-tls` | `environments/aws-staging/ingress.yaml:4-46` |
| Rollout deployments waited on | `sw4p-backend`, `sw4p-watcher`, `sw4p-frontend`, `sw4p-console`, `sw4p-storefront`, `sw4p-landing` (600s timeout each) | `deploy-staging.sh:137-139` |
| Private-EKS guard | `deploy-staging.sh` refuses to apply without `--private-eks` unless `ALLOW_PUBLIC_KUBE_CONTEXT=true` is set | `deploy-staging.sh:87-90` |

**End-to-end flow:** operator runs `deploy/aws/scripts/deploy-staging.sh --private-eks` from a Render bastion that can reach the `rndr-stream-staging` EKS private API. That script: (1) renders the kustomize overlay with the runtime registry + image tag, (2) runs `build-and-push-ecr.sh` to `docker build --platform linux/amd64` the backend Dockerfile and push to `${account_id}.dkr.ecr.eu-central-1.amazonaws.com/sw4p/backend:sha-<short>`, (3) syncs AWS Secrets Manager `/sw4p/staging/backend` JSON into `sw4p-backend-secrets`, (4) deletes the existing `sw4p-migrate` Job and applies the kustomize-rendered manifests via the private-EKS kubectl shim, (5) waits on `sw4p-migrate` job completion and then on each deployment rollout (`sw4p-backend`, `sw4p-watcher`, etc.).

## Section 3: Root cause hypothesis for the build-push failure (`b030s2us6` style)

The prior session's failure ID `b030s2us6` exit-1 is not present in the on-disk evidence under `DEVNET_FRONTIER_EVIDENCE_2026-05-16/` (grep returns no match). It is the tool-call ID of a controller-side background build-push task, not a CodeBuild build ID (there is no CodeBuild project in this rail). Per W1 `next-wave-handoff.md` Open Item 1: "Build-push retry needed (Docker Desktop / BuildKit cache flow)."

**Root cause hypothesis (most-likely-first), each tied to evidence in source:**

1. **Local Docker / BuildKit failure on a controller without Docker Desktop reach.** `build-and-push-ecr.sh:51-53` hard-requires the `docker` binary and `build-and-push-ecr.sh:155` invokes `docker build --platform linux/amd64`. If the build-push task ran from a controller without a running Docker daemon (or one with BuildKit's cache directory blocked, which is the most common cause of exit 1 in this exact rail per the W1 handoff note "Docker Desktop / BuildKit cache flow"), `docker build` exits non-zero and the script exits 1 before reaching ECR push.
2. **`require_clean_default_tag` refused a dirty worktree.** `build-and-push-ecr.sh:55-63` and `deploy-staging.sh:71-79` refuse to use the default `sha-$(git rev-parse --short HEAD)` tag if `git status --porcelain` reports any modification, exiting 1. The current `git status` on this worktree shows ~70+ modified files (see initial harness state), so any default-tag invocation would exit 1 immediately on this line. An explicit `--tag` flag bypasses this.
3. **ECR IMMUTABLE tag collision.** `build-and-push-ecr.sh:110` creates repositories with `--image-tag-mutability IMMUTABLE`. If a previous attempt already pushed the same `sha-<short>` tag and an operator retries from the same commit, `image_tag_exists` (`build-and-push-ecr.sh:129-135`) prints "skipping existing immutable tag" and `continue`s; this is *not* exit 1 by itself. But if the prior partial run created the tag manifest without all layers, the retry's docker push would fail with a layer-conflict error.
4. **AWS Secrets Manager `/sw4p/staging/backend` missing or empty.** `sync-secrets-to-k8s.sh:58-65,85` exits 1 if the *required* `/sw4p/${ENVIRONMENT}/backend` AWS secret is missing. If the prior session reached the secret-sync phase before the build-push retry, this exits 1 *before* any kubectl apply, leaving the prior-deployed pod (if any) untouched and the Service with no new endpoints. This does not match the "build push" framing in the W1 handoff but is the next-most-likely exit-1 surface.
5. **`--private-eks` guard tripped from a non-bastion controller.** `deploy-staging.sh:87-90` exits 1 if `--private-eks` is not passed and `ALLOW_PUBLIC_KUBE_CONTEXT` is not `true`. From this controller (which `probes/aws-landing.md` confirmed cannot reach the private EKS API), running `deploy-staging.sh` without `--private-eks` and without a bastion-side kubectl context exits 1 here.

**Most-supported hypothesis:** (1) + (2). The W1 handoff explicitly calls out "Docker Desktop / BuildKit cache flow" as the retry surface, and the current worktree dirty state would also refuse the default tag. The operator unblocking path needs (a) a workstation with a working Docker BuildKit, OR a Render bastion with `docker buildx` reach, AND (b) an explicit `--tag` argument to bypass the clean-worktree guard, OR a fresh clean checkout. Independent of hypothesis 1+2, hypothesis 4 (AWS Secrets Manager `/sw4p/staging/backend`) must also be verified, because if that secret has drifted or been deleted, the deploy will exit 1 in the secrets-sync phase regardless of whether the image build succeeds.

The 503 itself is downstream of build-push failure: without a fresh image push + successful rollout, the existing `sw4p-backend` Deployment is either at `replicas: 0`, in CrashLoopBackOff on a stale image, or absent (per `protocol-endpoint-discovery.md` Section 0.5: "the upstream Service `sw4p-backend:3000` has zero Ready Endpoints, which is what causes nginx to return 503").

## Section 4: Unblock plan (exact commands, NAMES only)

All commands below are read-only or operator-only. **None were executed by this diagnosis.** The operator MUST run these from a Render-resident bastion with reach to the private `rndr-stream-staging` EKS API, with `AWS_PROFILE=stream-admin` configured for the SSO-bound account that owns the ECR repos and the EKS cluster.

### 4.1 Pre-flight (verify build-push will not exit 1 again)

```
# 4.1.a Confirm AWS profile + account reach
aws --profile stream-admin --region eu-central-1 sts get-caller-identity

# 4.1.b Confirm the required Secrets Manager object exists (do NOT print value)
aws --profile stream-admin --region eu-central-1 secretsmanager describe-secret \
  --secret-id /sw4p/staging/backend

# 4.1.c Confirm the ECR repo exists and list recent tags
aws --profile stream-admin --region eu-central-1 ecr describe-repositories \
  --repository-names sw4p/backend
aws --profile stream-admin --region eu-central-1 ecr describe-images \
  --repository-name sw4p/backend \
  --query 'reverse(sort_by(imageDetails,&imagePushedAt))[:5].[imageTags[0],imagePushedAt]' \
  --output table

# 4.1.d Confirm Docker buildx is live on the bastion (must return non-empty)
docker buildx ls
docker buildx inspect --bootstrap default
```

### 4.2 Build + push fresh image to ECR

```
# 4.2.a Authenticate Docker to ECR (read-only login mint; no image pushed)
aws --profile stream-admin --region eu-central-1 ecr get-login-password \
  | docker login --username AWS --password-stdin \
    <ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com

# 4.2.b Build + push with an EXPLICIT tag (bypasses clean-worktree guard)
TAG="sha-$(git -C sw4p rev-parse --short HEAD)-$(date +%Y%m%d%H%M)" \
SERVICES=backend \
PLATFORM=linux/amd64 \
AWS_PROFILE=stream-admin \
AWS_REGION=eu-central-1 \
  sw4p/deploy/aws/scripts/build-and-push-ecr.sh --tag "$TAG"
```

### 4.3 Sync secrets + apply manifests + roll deployment

```
# 4.3.a Use the private-EKS kubectl shim from the bastion
export KUBECTL=sw4p/deploy/aws/scripts/eks-private-kubectl.sh

# 4.3.b Pre-verify the current Deployment + Service state (read-only)
$KUBECTL -n sw4p-staging get deployment sw4p-backend -o wide
$KUBECTL -n sw4p-staging get pods -l app=sw4p-backend -o wide
$KUBECTL -n sw4p-staging get endpoints sw4p-backend
$KUBECTL -n sw4p-staging describe deployment sw4p-backend | sed -n '1,80p'
$KUBECTL -n sw4p-staging logs deployment/sw4p-backend --tail=120 || true

# 4.3.c Full deploy (sync secrets, kubectl apply, wait for rollout)
TAG="<same TAG used in 4.2.b>" \
AWS_PROFILE=stream-admin \
AWS_REGION=eu-central-1 \
EKS_CLUSTER_NAME=rndr-stream-staging \
NAMESPACE=sw4p-staging \
  sw4p/deploy/aws/scripts/deploy-staging.sh --private-eks --skip-build --tag "<same TAG>"

# 4.3.d If only the rollout needs a restart (image already pushed, secrets fresh)
$KUBECTL -n sw4p-staging rollout restart deployment/sw4p-backend
$KUBECTL -n sw4p-staging rollout status deployment/sw4p-backend --timeout=600s
```

### 4.4 Post-deploy verification

```
# 4.4.a Probe the EKS ingress from public internet
curl -sS -o /dev/null -w "%{http_code}\n" https://staging-api.sw4p.io/health
curl -sS https://staging-api.sw4p.io/health
# Expect 200 + a backend health.rs JSON shape (not the nginx 503 envelope)

# 4.4.b Confirm the SDK route surface answers
curl -sS -o /dev/null -w "%{http_code}\n" https://staging-api.sw4p.io/sdk/v1/limits
# Expect 401 (missing X-API-Key) OR 200, NOT 503
```

### 4.5 Required env-var / secret NAMES (no values)

The `sw4p-backend-secrets` k8s Secret is hydrated from the AWS Secrets Manager object `/sw4p/staging/backend` (`sync-secrets-to-k8s.sh:85`). Each JSON key in that Secrets Manager object becomes an env var on the backend pod (`backend-deployment.yaml:35-36` mounts it via `envFrom: secretRef`). The canonical list of keys lives in:

- `sw4p/deploy/aws/scripts/bootstrap-aws-staging-secrets.sh` (the bootstrap script for the AWS Secrets Manager object; read this for the canonical key list)
- Parent-repo `SECRETS_CONFIGURATION.md` (referenced from cycle docs)
- `sw4p/sw4p-backend/contracts/.env.example` (subset, contract-deploy-time only)

The configmap-side names (non-secret) come from `sw4p/deploy/aws/k8s/base/configmap.yaml` (mounted via `envFrom: configMapRef` for `sw4p-config`). Plus two hard-coded env vars on the backend pod itself (`backend-deployment.yaml:37-43`): `PORT=3000`, `WATCHER_ENABLED=false`, `SW4P_SERVICE_ROLE=backend`. The watcher pod sets `WATCHER_ENABLED=true` and `SW4P_SERVICE_ROLE=watcher` instead (see `watcher-deployment.yaml`).

This diagnosis does NOT enumerate raw secret values, per the cycle's "no raw secrets" rule.

## Section 5: ZERO-MOCKS impact (waves unblocked)

The W0 Phase 5 deferral (`waves/W0-setup/phase-5-baseline-deferred.md`) and the W1 next-wave-handoff (`waves/W1-canonical-evm/next-wave-handoff.md` Open Item 1) both identify backend health as a **cycle-level** blocker, not local to W0. Restoring `staging-api.sw4p.io/health` to HTTP 200 unblocks (per `phase-5-baseline-deferred.md` "Cycle impact" section):

- **W0.d Phase 5 baseline.** Tasks 5.2 (Base Sepolia to Solana Devnet $1 USDC) and 5.3 (Solana Devnet to Base Sepolia $1 USDC) round-trip baseline. Authorization from the original Task 5.1 gate is preserved and carries forward.
- **W1 acceptance gates that hit `/sdk/v1/transfer` polling.** Per `docs/superpowers/plans/2026-05-17-sw4p-devnet-frontier-w1-canonical-evm.md:15`, "W1 acceptance gates that depend on `/sdk/v1/transfer` polling assume this is satisfied; if not, those gates remain BLOCKED."
- **W2 rail-consolidation observability + sdk-bridge endpoints.** Per `next-wave-handoff.md` Open Item 1.
- **W3 (3-phase atomicity).** Real restart-mid-state recovery test requires the watcher loop running against the deployed backend.
- **W4 (Kit completion).** `sw4p.balance` and `sw4p.send` test suites must hit the real testnet protocol via the deployed `api.sw4p.io` / `staging-api.sw4p.io` per the ZERO-MOCKS clause in `docs/superpowers/specs/2026-05-16-sw4p-devnet-frontier-execution-design.md:267` ("**W4.c:** Real-protocol test suite ... NOT mocked SDK").
- **W5 (Distribution).** `npx @sw4p/kit init` clean-machine test depends on a real backend.
- **W6 (Intent contracts).** Solver auction and intent submission flows require the backend.
- **W7 (Intent UX).** Kit intent-first send measured against the real backend.
- **W8 (Final phases / audit prep).** Aggregate evidence requires real protocol traces.

In short: **W1 through W8 cannot proceed with ZERO-MOCKS acceptance** until `staging-api.sw4p.io/health` returns 200 from a real `sw4p-backend` pod (not the `sw4p-devnet-mock` Cloudflare Worker, which the cycle's ZERO-MOCKS rule explicitly forbids per `phase-5-baseline-deferred.md` "Step 0.6" and `protocol-endpoint-discovery.md`).

## Appendix: separately required follow-up (orchestrator owns)

Even after the EKS pod returns to Ready and `staging-api.sw4p.io/health` is 200, the `SW4P_API_KEY` in `sw4p-kit-devnet-frontier-2026-05-16/.env` is empty per `protocol-endpoint-discovery.md` Step 0.1. That key must be minted against the restored backend (via `console.sw4p.io` if the console is live, OR via the backend's `sdk_auth.rs` admin path) before the SDK can authenticate. This is independent of pod restoration but blocks the same acceptance gates.

---

**No mutations performed by this diagnosis. No git add / git commit. Orchestrator commits after all agents return.**
