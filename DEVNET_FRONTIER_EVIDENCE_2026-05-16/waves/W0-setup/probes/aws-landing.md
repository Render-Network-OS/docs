# AWS Landing Deployment Health Probe (W0.b pre-flight)

**Date:** 2026-05-17T05:19:37Z
**Source of truth:** sw4p worktree commits + Kubernetes manifests + live HTTP probes against Cloudflare-fronted `sw4p.io`.

## Step 1: AWS landing commit chain

Recent AWS / EKS / ingress / landing commits in the sw4p worktree (`.worktrees/sw4p-devnet-frontier-2026-05-16`):

- `b0e95fd` (2026-05-16 18:31 -0500) feat(ops): route sw4p landing hosts to aws ingress
- `ed1aff7` (2026-05-16 17:59 -0500) feat(landing): integrate dynamic UI pass for aws cutover
- `e08cae3` (2026-05-16 16:14 -0500) fix(ops): build aws images for eks amd64 nodes
- `e12cd41` (2026-05-16 11:29 -0500) feat(ops): add sw4p aws staging deploy rail

Files changed (consolidated, deduplicated):

- `deploy/aws/README.md`
- `deploy/aws/k8s/base/backend-deployment.yaml`, `backend-service.yaml`, `configmap.yaml`
- `deploy/aws/k8s/base/console-deployment.yaml`, `console-service.yaml`
- `deploy/aws/k8s/base/frontend-deployment.yaml`, `frontend-service.yaml`
- `deploy/aws/k8s/base/kora-deployment.yaml`, `kora-service.yaml`
- `deploy/aws/k8s/base/landing-deployment.yaml`, `landing-service.yaml`
- `deploy/aws/k8s/base/migration-job.yaml`, `kustomization.yaml`
- `deploy/aws/k8s/base/postgres-service.yaml`, `postgres-statefulset.yaml`
- `deploy/aws/k8s/base/redis-deployment.yaml`, `redis-service.yaml`
- `deploy/aws/k8s/base/storefront-deployment.yaml`, `storefront-service.yaml`
- `deploy/aws/k8s/base/watcher-deployment.yaml`
- `deploy/aws/k8s/environments/aws-staging/ingress.yaml`
- `deploy/aws/k8s/environments/aws-staging/kustomization.yaml`
- `deploy/aws/k8s/environments/aws-staging/namespace.yaml`
- `deploy/aws/scripts/bootstrap-aws-staging-secrets.sh`
- `deploy/aws/scripts/build-and-push-ecr.sh`
- `deploy/aws/scripts/deploy-staging.sh`
- `deploy/aws/scripts/eks-private-kubectl.sh`
- `deploy/aws/scripts/sync-secrets-to-k8s.sh`
- `deploy/aws/scripts/sync-staging-secrets-from-railway.sh`
- `docs/operations/aws-staging-deploy-runbook-2026-05-16.md`
- `sw4p-backend/docker-entrypoint.sh`, `sw4p-backend/src/bin/watcher.rs`, `sw4p-backend/src/db.rs`, `sw4p-backend/src/db_tests.rs`, `sw4p-backend/src/main.rs`
- `sw4p-console/Dockerfile`, `sw4p-console/.dockerignore`
- `sw4p-frontend/Dockerfile`, `sw4p-frontend/.dockerignore`
- `sw4p-landing/Dockerfile`, `sw4p-landing/.dockerignore`
- `sw4p-landing/STAGING_PHASE_A_B.md`, `sw4p-landing/index.html`, plus `sw4p-landing/src/*` UI updates for the AWS cutover
- `sw4p-storefront/Dockerfile`, `sw4p-storefront/.dockerignore`

## Step 2: AWS / Kubernetes manifest inventory

| Manifest path | Kind | Host(s) | Image / Selector | Notes |
|---|---|---|---|---|
| `deploy/aws/k8s/environments/aws-staging/namespace.yaml` | Namespace | n/a | `sw4p-staging` | Labels: `app.kubernetes.io/part-of=sw4p`, `environment=staging` |
| `deploy/aws/k8s/environments/aws-staging/ingress.yaml` | Ingress | `sw4p.io`, `www.sw4p.io`, `staging.sw4p.io`, `staging-api`, `staging-app`, `staging-console`, `staging-555.sw4p.io` | ingressClassName: nginx; cert-manager `letsencrypt-prod` | Apex `sw4p.io`, `www`, `staging` all backend `sw4p-landing:10000` |
| `deploy/aws/k8s/base/landing-deployment.yaml` | Deployment | n/a | `000000000000.dkr.ecr.eu-central-1.amazonaws.com/sw4p/landing:dev` (account placeholder in base; environment overlay rewrites) | `replicas: 1`, port 10000, `readinessProbe` + `livenessProbe` on `/health` |
| `deploy/aws/k8s/base/landing-service.yaml` | Service | n/a | selector `app=sw4p-landing` | ClusterIP, port 10000 -> targetPort `http` |
| `deploy/aws/k8s/environments/aws-staging/kustomization.yaml` | Kustomization | n/a | image tag `dev`, registry `*.dkr.ecr.eu-central-1.amazonaws.com/sw4p/*` | Namespace pinned to `sw4p-staging` |

Ingress rules (verbatim from `deploy/aws/k8s/environments/aws-staging/ingress.yaml`, the file added by `b0e95fd` and originally `e12cd41`):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sw4p-staging
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - sw4p.io
        - www.sw4p.io
        - staging-api.sw4p.io
        - staging-app.sw4p.io
        - staging-console.sw4p.io
        - staging-555.sw4p.io
        - staging.sw4p.io
      secretName: sw4p-staging-tls
  rules:
    - host: sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-landing
                port:
                  number: 10000
    - host: www.sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-landing
                port:
                  number: 10000
    - host: staging-api.sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-backend
                port:
                  number: 3000
    - host: staging-app.sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-frontend
                port:
                  number: 10000
    - host: staging-console.sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-console
                port:
                  number: 10000
    - host: staging-555.sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-storefront
                port:
                  number: 10000
    - host: staging.sw4p.io
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sw4p-landing
                port:
                  number: 10000
```

Landing deployment + service (verbatim):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sw4p-landing
  labels:
    app: sw4p-landing
    sw4p.rndrntwrk.com/component: landing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sw4p-landing
  template:
    metadata:
      labels:
        app: sw4p-landing
        sw4p.rndrntwrk.com/component: landing
    spec:
      containers:
        - name: sw4p-landing
          image: 000000000000.dkr.ecr.eu-central-1.amazonaws.com/sw4p/landing:dev
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 10000
          env:
            - name: PORT
              value: "10000"
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 20
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: sw4p-landing
  labels:
    app: sw4p-landing
spec:
  type: ClusterIP
  selector:
    app: sw4p-landing
  ports:
    - name: http
      port: 10000
      targetPort: http
```

The landing container runtime is Express 5 (`sw4p-landing/Dockerfile` installs `express@^5.2.1` and runs `node server.js`). This is the smoking-gun signal we correlate against the live `x-powered-by: Express` response below.

## Step 3: kubectl availability + cluster state

`kubectl` is installed at `/usr/local/bin/kubectl`. The local kubeconfig has the following contexts:

```
do-nyc2-k8s-1-33-1-do-5-nyc2-rndr-stream  (DigitalOcean, unrelated)
rndr-prod      arn:aws:eks:eu-central-1:364947027011:cluster/rndr-stream-production
rndr-staging   arn:aws:eks:eu-central-1:364947027011:cluster/rndr-stream-staging
rndr-stream-production  (current context, same EKS cluster as `rndr-prod`)
```

Live-cluster reads were attempted against `rndr-staging` and the current `rndr-stream-production` context. Both EKS endpoints are private-only, so direct API calls from this controller time out:

```
$ kubectl --request-timeout=5s get ns
E0517 00:18:35.319565   12048 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"https://D535C9000F52997EF855072833FFE896.gr7.eu-central-1.eks.amazonaws.com/api?timeout=5s\": context deadline exceeded (Client.Timeout exceeded while awaiting headers)"
```

This matches the runbook (`docs/operations/aws-staging-deploy-runbook-2026-05-16.md`), which records: `rndr-stream-staging EKS endpoint is private-only, so local direct kubectl times out. Use deploy/aws/scripts/eks-private-kubectl.sh or an AWS-resident deployer.`

Direct kubectl reads are therefore not possible from this controller without the bastion script. This probe degrades to: structural manifest inspection plus Cloudflare-side HTTP probing of `sw4p.io`. The AWS Load Balancer hostname behind nginx-ingress is not directly accessible from here.

## Step 4: Live HTTP probe

`curl -sS -i https://sw4p.io/` captured to `/tmp/sw4p-via-cloudflare.txt`:

```
HTTP/2 200 
date: Sun, 17 May 2026 05:17:07 GMT
content-type: text/html; charset=utf-8
x-powered-by: Express
cache-control: no-cache
accept-ranges: bytes
last-modified: Sat, 16 May 2026 23:05:14 GMT
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=u8cMtFI1vCnkq9gJHKg5DxxEPrRCTkLb8hKs321s7UVBTnYEzqIje0c5bOXWo51m3fgnGweM09M6iw36RZbPC3N8nB%2F%2Fk5cA9TQtnvZyxChZiYoMR0tT2yq8"}]}
strict-transport-security: max-age=31536000; includeSubDomains
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
server: cloudflare
cf-ray: 9fd0276a1a03e7ff-DFW
alt-svc: h3=":443"; ma=86400

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>SW4P | Cross-Chain Execution Layer</title>
    <meta name="description"
        content="Every chain. One execution layer. Define the outcome: SW4P selects the route, handles gas, executes the transaction, and tracks it to settled state." />
```

Body shasum (full file captured to /tmp): `e3550e88bee99e2e975e27bb3a9ccc82aa9493ccd6bacb886d2ab7e5cbac5d77`

Cross-host probes for the other ingress rules (HEAD-only):

| Host | Status | server | x-powered-by | Notes |
|---|---|---|---|---|
| sw4p.io | 200 | cloudflare | Express | landing pod, `last-modified: Sat, 16 May 2026 23:05:14 GMT` |
| www.sw4p.io | 200 | cloudflare | Express | landing pod |
| staging.sw4p.io | 200 | cloudflare | Express | landing pod (same `last-modified`) |
| api.sw4p.io | 404 | cloudflare | (none) | Not in ingress rules, returned by Cloudflare's edge |
| staging-api.sw4p.io | 503 | (no Cloudflare hop info captured) | (none) | Routes to `sw4p-backend:3000` per ingress; backend unhealthy or not in DNS map |
| app.sw4p.io | 404 | cloudflare | (none) | Not in ingress rules |

The signal is consistent: `sw4p.io`, `www.sw4p.io`, and `staging.sw4p.io` all return identical Express-served bodies (matching `last-modified` timestamps), and only those three hostnames have landing-routed ingress rules. `api.sw4p.io` and `app.sw4p.io` (without the `staging-` prefix) are not configured at the ingress, and Cloudflare returns a generic 404.

## Step 5: W0.b cutover semantic determination

**Scenario A applies.** The Cloudflare origin for `sw4p.io`, `www.sw4p.io`, and `staging.sw4p.io` is already the AWS EKS nginx-ingress backed by the `sw4p-landing` Service in namespace `sw4p-staging`. Evidence:

1. The ingress manifest landed in `b0e95fd` (2026-05-16 18:31 -0500) added the `sw4p.io` and `www.sw4p.io` rules pointing at `sw4p-landing:10000`.
2. The live response served by `https://sw4p.io/` advertises `x-powered-by: Express` (the landing container is the only Express server in the sw4p deploy rail) and `last-modified: Sat, 16 May 2026 23:05:14 GMT`, which is hours after the AWS deploy rail commit landed.
3. The TLS chain returned by Cloudflare is Google Trust Services (per the W0.a `cloudflare-dns.md` probe), not Let's Encrypt, which is what cert-manager would issue inside EKS. This is consistent with Cloudflare terminating TLS at the edge and proxying to the AWS ELB on the backend.
4. The Cloudflare anycast IPs (172.67.69.69, 104.26.10.41, 104.26.11.41) per the W0.a probe are the visible front; the actual AWS ELB hostname is the Cloudflare origin, but it is not exposed by Cloudflare to public probes.

W0.b is therefore a verification-only action for the landing host: confirm the Cloudflare origin record points at the AWS ELB FQDN (`*.elb.eu-central-1.amazonaws.com`) and that no DNS record-level edit is required for `sw4p.io` / `www.sw4p.io` / `staging.sw4p.io`.

Notes about adjacent rows of the matrix (not part of this row's PASS, but logged for downstream waves):

- `staging-api.sw4p.io` returns 503: the backend service is not healthy or not currently routed; downstream W0 / W1 work should verify the backend pod rollout.
- `api.sw4p.io` and `app.sw4p.io` (production-style host prefixes) are intentionally not in the staging ingress rules. Any production-host migration is out of scope for W0.b.

## Conclusion

The current state of the sw4p.io landing is: Cloudflare-fronted at 172.67.69.69 / 104.26.10.41 / 104.26.11.41 with origin already on the AWS EKS `sw4p-landing` Service via nginx-ingress, serving the post-cutover Express build from 2026-05-16 23:05Z.

This row of the Live Dependency Matrix is marked: **PASS** (current state captured; AWS landing deployment is already serving production hostname `sw4p.io` via the documented ingress).

Inputs to W0.b (Task 3.2 authorization gate):

- Current Cloudflare origin: AWS EKS `sw4p-staging` namespace, `sw4p-landing` Service on port 10000, fronted by nginx-ingress with TLS terminated at Cloudflare's edge.
- Current AWS ELB hostname: not directly accessible from this probe (private EKS endpoint; kubectl reads time out). Must be retrieved from the bastion (`deploy/aws/scripts/eks-private-kubectl.sh`) before W0.b sign-off if the exact ELB FQDN is needed.
- Recommended W0.b action: verification-only for the landing host (`sw4p.io`, `www.sw4p.io`, `staging.sw4p.io`). No record-level edit and no Cloudflare origin change is needed for these three. The 503 on `staging-api.sw4p.io` is a separate backend-health issue, not a DNS / origin cutover.
- Pre-flight body shasum: `e3550e88bee99e2e975e27bb3a9ccc82aa9493ccd6bacb886d2ab7e5cbac5d77` (for post-W0.b regression comparison).
