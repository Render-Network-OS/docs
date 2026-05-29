# Cross-region GPU capture worker for alice-staging

**Status**: design, not yet implemented
**Owner**: alice-staging
**Date**: 2026-05-29
**Driver**: eu-central-1 has 0 vCPU quota for G/VT On-Demand instances; us-east-2 has 8. AWS support case `178003721900951` requesting 8 in eu-central-1 is OPEN but not expected to be approved soon. Staging needs to be able to broadcast Alice's VRM avatar through the full RTMP egress to twitch/kick/pumpfun/youtube while we wait.

## Summary

Run the `capture-service` GPU worker on a g5.2xlarge EC2 instance in **us-east-2**, connected to the existing **staging EKS cluster in eu-central-1** over **inter-region VPC peering** and **internal-scheme NLBs** in front of `redis` and `control-plane`. The capture-service container is unchanged. The whole bypass is purely additive on the cluster side and is removed in seven reversible steps when eu-central-1 GPU quota lands.

## Goals

1. Restore staging's ability to do an end-to-end avatar broadcast (alice-bot → control-plane → capture-gpu → media-engine → RTMP to all 4 platforms), without requiring eu-central-1 GPU quota.
2. No public exposure of staging's internal Redis or control-plane.
3. No changes to `capture-service` source. Same container image, same env-var contract.
4. Reversible: when eu-central-1 quota approves, scale the in-cluster `capture-service-gpu` Deployment to 1 and tear down the us-east-2 worker. No code rolls back.

## Non-goals

- Not a multi-agent canonical pattern. This is staging-scoped. The same shape could be lifted later, but the spec does not commit to that.
- Not optimizing for sub-100ms inter-region latency. Best-effort throughput across the Atlantic is acceptable for staging verification work.
- Not introducing IaC (Terraform / CDK) for the bypass. The lifecycle is short enough to script imperatively, with a teardown command list in §6.

## Architecture

```
┌────────── eu-central-1 (existing) ─────────────────────────────────────────┐
│                                                                             │
│  staging VPC  10.80.0.0/16                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  EKS  rndr-stream-staging                                           │  │
│  │  alice-bot, control-plane, media-engine, sfu, internal-rtmp, redis  │  │
│  └────────────┬──────────────────────┬──────────────────────────────────┘  │
│               │                      │                                       │
│       ┌───────▼────────┐     ┌───────▼───────┐                              │
│       │  internal NLB  │     │  internal NLB │   scheme=internal,           │
│       │ staging-redis- │     │ staging-cp-   │   reachable only from        │
│       │     peer       │     │     peer      │   cluster + peer VPC         │
│       └───────┬────────┘     └───────┬───────┘                              │
└───────────────┼──────────────────────┼───────────────────────────────────────┘
                │                      │
                └──────────┬───────────┘
                           │ VPC peering connection (eu↔us)
                           │ 10.80.0.0/16 ↔ 10.100.0.0/16
┌──────────────────────────┼───────────────────────────────────────────────────┐
│  us-east-2 (NEW)         │                                                   │
│  capture-gpu VPC  10.100.0.0/16                                              │
│  ┌────────────────────────┐                                                  │
│  │  g5.2xlarge (NVIDIA    │  capture-service (Docker, GPU)                   │
│  │  A10G, 24 GB VRAM)     │  - BullMQ subscriber on queue 'capture-gpu'      │
│  │                        │  - REDIS_URL points at internal NLB DNS          │
│  │                        │  - CONTROL_PLANE_URL points at internal NLB DNS  │
│  │                        │  - chromium loads /companion via the public      │
│  │                        │    Cloudflare ingress (staging-stream.rndr...)   │
│  └────────────────────────┘                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data flow on a Go Live

1. alice-bot triggers `STREAM555_GO_LIVE` (already wired).
2. control-plane enqueues a `capture-gpu` job in staging Redis (no change).
3. The us-east-2 worker, subscribed to that queue over the peer connection, picks it up.
4. Worker spins headless chromium, loads `/companion#token=<bypass JWT>` from `staging-stream.rndrntwrk.com` (public Cloudflare-fronted path, no peer needed).
5. VRM renders with the A10G GPU.
6. Worker pushes A/V frames back into staging's media path (SFU or internal-rtmp; capture-service's existing publish path) via the peer.
7. media-engine encodes and pushes RTMP to twitch / kick / pumpfun / youtube.

## Components

### Network (§2 of the brainstorm)

- **New VPC `capture-gpu-us-east-2`** with CIDR `10.100.0.0/16`. Avoids overlap with staging `10.80.0.0/16`, prod `10.90.0.0/16`, and the us-east-2 default VPC `172.31.0.0/16`.
- **Single subnet** `10.100.1.0/24` in `us-east-2a`. One AZ is sufficient for a single worker; adding more is trivial later.
- **Inter-region VPC peering connection** between the new us-east-2 VPC (requester) and the eu-central-1 staging VPC (accepter). DNS resolution enabled in both directions.
- **Route table additions**: each side gets a route to the peer CIDR via `pcx-...`. The us-east-2 route table also gets `0.0.0.0/0 → IGW` (for ECR pull and Cloudflare-fronted `staging-stream.rndrntwrk.com`).
- **Security groups**:
  - `staging-redis-peer-sg` on the Redis internal NLB: ingress `10.100.0.0/16:6379`.
  - `staging-cp-peer-sg` on the CP internal NLB: ingress `10.100.0.0/16:3000`.
  - `capture-gpu-worker-sg` on the EC2: egress to `10.80.0.0/16:{6379,3000}` and `0.0.0.0/0:{443,80}`; ingress none (SSM Session Manager handles shell-in).

### K8s manifests added to staging (§3)

Two additive `Service` objects in `k8s/environments/staging/`. The existing ClusterIP Services are not touched.

`redis-peer-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-peer
  namespace: staging
  labels:
    app: redis
    purpose: cross-region-peer
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internal
    service.beta.kubernetes.io/aws-load-balancer-name: staging-redis-peer
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-security-groups: <staging-redis-peer-sg>
spec:
  type: LoadBalancer
  loadBalancerClass: service.k8s.aws/nlb
  selector:
    app.kubernetes.io/name: redis
  ports:
    - name: redis
      port: 6379
      targetPort: 6379
      protocol: TCP
```

`control-plane-peer-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: control-plane-peer
  namespace: staging
  labels:
    app: control-plane
    purpose: cross-region-peer
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internal
    service.beta.kubernetes.io/aws-load-balancer-name: staging-cp-peer
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-security-groups: <staging-cp-peer-sg>
spec:
  type: LoadBalancer
  loadBalancerClass: service.k8s.aws/nlb
  selector:
    app: control-plane
  ports:
    - name: http
      port: 3000
      targetPort: 3000
      protocol: TCP
```

Add both to `k8s/environments/staging/kustomization.yaml`'s `resources:` list.

Before applying: verify both selectors against current pod labels with `kubectl -n staging get pods -l <selector>`. If labels have drifted, fix the selector in the new Services rather than relabeling pods.

### EC2 worker (§4)

| Parameter | Value |
|---|---|
| AMI | `ami-0db2e3f991c246d37` (Deep Learning Base OSS NVIDIA AMI 2026-05-26, Amazon Linux 2023) |
| Instance type | `g5.2xlarge` (NVIDIA A10G, 24 GB VRAM, 8 vCPU) |
| Subnet | the new us-east-2 `10.100.1.0/24` |
| Security group | `capture-gpu-worker-sg` |
| IAM instance profile | `rndr-stream-staging-deployer` (already SSM-capable + ECR pull) |
| SSH key | none; shell-in via SSM Session Manager only |
| Root EBS | 300 GB (AMI default; chromium temp + model loads need headroom) |
| Tags | `Name=capture-gpu-worker-staging`, `purpose=capture-gpu-worker`, `environment=staging`, `cross_region_for=rndr-stream-staging` |

user-data on first boot:

```bash
#!/bin/bash
set -euxo pipefail

ECR_REGISTRY=364947027011.dkr.ecr.eu-central-1.amazonaws.com
IMAGE_TAG=sha-a2db779
IMAGE="${ECR_REGISTRY}/stream/capture-service:${IMAGE_TAG}"

# Cross-region ECR pull
aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker pull "$IMAGE"

# Pull worker secrets from AWS Secrets Manager
SECRET_ARN="arn:aws:secretsmanager:eu-central-1:364947027011:secret:alice-bot/staging/capture-worker-env-*"
aws secretsmanager get-secret-value --region eu-central-1 \
  --secret-id "$SECRET_ARN" --query SecretString --output text \
  > /etc/capture-worker.env
chmod 600 /etc/capture-worker.env

cat >/etc/systemd/system/capture-worker.service <<EOF
[Unit]
Description=alice-staging capture-gpu worker
After=docker.service
Requires=docker.service

[Service]
Restart=always
RestartSec=10
ExecStartPre=-/usr/bin/docker rm -f capture-worker
ExecStart=/usr/bin/docker run --rm --name capture-worker \\
  --gpus all \\
  --env-file /etc/capture-worker.env \\
  --shm-size=2g \\
  --log-driver=journald \\
  ${IMAGE}
ExecStop=/usr/bin/docker stop capture-worker

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now capture-worker
```

### Secrets (§5)

**Source the Redis password from the existing `stream/staging/redis-auth-token` Secrets Manager entry**. Do not create a second copy.

**Mint a dedicated `capture-worker` agent token** in-pod via `generateAgentToken` against the control-plane's JWT_SECRET. Identity: `agentId='capture-worker-us-east-2-1'`. Actor: `resolveOrCreateAgentActor` with `authMethod='wallet_signature'`, `tier='owner'`. Scopes narrowed to:

- `SESSIONS_READ`
- `STATE_WRITE`
- `STUDIO_READ`, `STUDIO_WRITE`
- `MEDIA_WRITE`
- `SOURCES_WRITE`

No `STREAM_START`, `PLATFORMS_WRITE`, or `SESSIONS_CREATE`. The worker only services jobs created by alice's GO_LIVE.

7-day TTL. Rotated weekly by a cron on the existing staging deployer host that re-mints and re-applies the AWS Secrets Manager entry.

**AWS Secrets Manager entry**: `alice-bot/staging/capture-worker-env` in `eu-central-1`, JSON shape:

```json
{
  "BULLMQ_QUEUE_NAME": "capture-gpu",
  "REDIS_URL": "rediss://:<pwd from stream/staging/redis-auth-token>@staging-redis-peer-<id>.elb.eu-central-1.amazonaws.com:6379",
  "CONTROL_PLANE_URL": "http://staging-cp-peer-<id>.elb.eu-central-1.amazonaws.com:3000",
  "CONTROL_PLANE_PUBLIC_URL": "https://staging-stream.rndrntwrk.com",
  "CONTROL_PLANE_ASSET_BASE_URL": "https://staging-stream.rndrntwrk.com",
  "STREAM555_AGENT_TOKEN": "<JWT minted by §5.2>",
  "CONCURRENCY": "1",
  "DISPLAY": ":99",
  "LOG_LEVEL": "info",
  "NODE_ENV": "staging",
  "WORKER_ID": "us-east-2-gpu-1"
}
```

Mirror also written to `.local/stream-credentials.json` under a new `capture_worker_us_east_2` key (gitignored, chmod 600), same pattern used for stream destination credentials.

**IAM patch** on `rndr-stream-staging-deployer` instance profile (inline policy `ReadCaptureWorkerSecret`): allow `secretsmanager:GetSecretValue` and `secretsmanager:DescribeSecret` on `arn:aws:secretsmanager:eu-central-1:364947027011:secret:alice-bot/staging/capture-worker-env-*`.

## Verification (§6.1)

Bottom-up checklist:

1. Peer reachability: DNS resolves NLBs to 10.80.x.x from worker; `nc -zv` succeeds on both NLBs in <50ms.
2. Redis auth: `redis-cli -u $REDIS_URL ping` returns `PONG`.
3. Control-plane health: `curl -fsS $CONTROL_PLANE_URL/api/agent/v1/health` returns `{"status":"ok"}`.
4. Token auth: `curl -fsS -H "Authorization: Bearer $STREAM555_AGENT_TOKEN" $CONTROL_PLANE_URL/api/agent/v1/sessions` returns HTTP 200.
5. GPU visible in container: `docker exec capture-worker nvidia-smi` shows A10G.
6. BullMQ subscription: inside CP pod, `redis-cli -u <internal> XINFO GROUPS bull:capture-gpu` lists the worker's consumer.
7. End-to-end: trigger `STREAM555_GO_LIVE` from alice-bot; observe Alice's VRM render visible on twitch + kick + pump.fun + youtube within 30 s.

## Observability (§6.2)

- Worker logs: `journald` redirected to CloudWatch log group `/alice-staging/capture-worker-us-east-2`, 14-day retention.
- Worker metrics: capture-service already exposes Prometheus on `:9100/metrics`. CloudWatch agent scrapes and pushes to namespace `alice-staging/capture-worker` (cpu, mem, frame rate, job latency, queue depth).
- Control-plane side: existing CP `[CaptureWorker]` log lines; nothing new added.
- Alarm: CloudWatch on `aws/ec2/StatusCheckFailed` and on a log filter for "ERROR" rate >10/min, SNS to alice-staging email.

## Failure modes (§6.3)

| Failure | Symptom | Auto-recovery |
|---|---|---|
| Worker process crash | `capture-worker.service` restarts within 10 s | yes (systemd) |
| EC2 instance failure | No automatic replacement (single bare EC2, no ASG) | no, ops attention required |
| Peer connection breaks | Worker cannot reach Redis; BullMQ reconnects; jobs stall | yes (BullMQ) |
| Cross-region latency spike | Job pickup latency rises; preview lag | self-resolves; alarm fires if persistent |
| Agent token expires | Worker fetches return 401 | weekly rotation cron prevents; if missed, ops re-runs §5.2 |
| eu-central-1 quota approves | Not a failure | scale `capture-service-gpu` in-cluster to 1; tear down per §6.4 |

## Rollback / teardown (§6.4)

Seven reversible steps:

```bash
# 1. Stop the worker
aws ec2 terminate-instances --region us-east-2 --instance-ids <i-...>

# 2. Delete the internal-NLB Services (NLBs auto-destruct)
kubectl -n staging delete service redis-peer control-plane-peer

# 3. Delete the VPC peering
aws ec2 delete-vpc-peering-connection --region us-east-2 \
  --vpc-peering-connection-id <pcx-...>

# 4. Delete us-east-2 VPC + dependents (subnet, IGW, route table, SGs)
# (use a small script or aws cli loop)

# 5. Delete IAM inline policy + Secrets Manager entry + local file key
aws iam delete-role-policy --role-name rndr-stream-staging-deployer \
  --policy-name ReadCaptureWorkerSecret
aws secretsmanager delete-secret --region eu-central-1 \
  --secret-id alice-bot/staging/capture-worker-env \
  --force-delete-without-recovery

# 6. Revoke the agent token (CP-side JTI revoke, or let it expire)

# 7. Remove the kustomization entries
git rm k8s/environments/staging/{redis-peer-service,control-plane-peer-service}.yaml
# update kustomization.yaml, commit, push
```

After these seven steps the staging cluster and AWS account are byte-identical to today's state. No latent resources, no lingering cost.

## Cost estimate

| Component | $/hr | Notes |
|---|---|---|
| g5.2xlarge | 1.21 | only when scaled up |
| 2× internal NLBs | 0.045 | idle (~$32/mo) |
| Inter-region data transfer | 0.02/GB | ~1-2 GB/hr per live stream |
| EBS root (300 GB gp3) | ~$30/mo | stays even when EC2 stopped |
| Peering connection | 0 | free |

Bounded idle cost: ~$60-65/mo while waiting for eu-central-1 quota. Active broadcast cost: ~$1.30/hr.

## Open questions

None blocking. Two minor implementation choices to confirm before applying:

- Whether to use a single-AZ subnet or three-AZ for the new us-east-2 VPC. Spec picks single-AZ (one worker, simpler).
- Whether to add the CloudWatch agent setup as part of user-data (in scope) or defer to a later observability pass (out of scope for this bypass).

## Out of scope

- Multi-region production architecture. This is a single-staging bypass.
- IaC for the bypass. Imperative scripts during the lifetime of the bypass; teardown is the IaC.
- Capacity tuning above one worker. If staging needs multiple concurrent captures, lift the design after.
- Changes to alice-bot, control-plane, capture-service, media-engine source. Strictly env wiring and infra.
