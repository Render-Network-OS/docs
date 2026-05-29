# Cross-region GPU capture worker for alice-staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a `capture-service` GPU worker on a g5.2xlarge in us-east-2 that registers with the existing staging EKS cluster in eu-central-1 over VPC peering, so alice-staging can do end-to-end avatar broadcasts to twitch/kick/pumpfun/youtube while waiting on the eu-central-1 GPU vCPU quota.

**Architecture:** Inter-region VPC peering between a new us-east-2 VPC (10.100.0.0/16) and the existing staging VPC (10.80.0.0/16). Two new internal-scheme NLBs in front of `redis` and `control-plane` Services in staging. A bare g5.2xlarge in us-east-2 runs the unmodified `capture-service` container with env-vars pointing at the NLB DNS names over the peer connection.

**Tech Stack:** AWS (EC2, VPC, ECR, Secrets Manager, IAM, SSM), Kubernetes (kustomize, AWS Load Balancer Controller), Docker, systemd, BullMQ, Node.js (capture-service is JS).

**Spec:** `docs/superpowers/specs/2026-05-29-cross-region-gpu-capture-design.md`

---

## File Structure

**Files this plan creates or modifies:**

| Path | Action | Responsibility |
|---|---|---|
| `555stream/k8s/environments/staging/redis-peer-service.yaml` | Create | K8s Service exposing redis pods via internal NLB |
| `555stream/k8s/environments/staging/control-plane-peer-service.yaml` | Create | K8s Service exposing control-plane pods via internal NLB |
| `555stream/k8s/environments/staging/kustomization.yaml` | Modify | Add the two new Services to the staging resources list |
| `.local/stream-credentials.json` | Modify | Add `capture_worker_us_east_2` block with all worker env values |
| `.local/scripts/mint-capture-worker-token.sh` | Create | Reusable script for minting the worker's agent token (also used by the weekly rotation cron) |
| `.local/scripts/launch-capture-worker.sh` | Create | Wrapper around `aws ec2 run-instances` with the EC2 params, user-data |
| `.local/scripts/teardown-capture-worker.sh` | Create | Reverses everything in seven steps per spec §6.4 |

Each file has one clear responsibility. The two YAML files are pure additive K8s resources. The shell scripts in `.local/scripts/` are stored locally (already-gitignored `.local/` per session setup) since they reference one-off resource IDs that change per environment.

---

## Wave A: Pre-flight investigation (read-only)

### Task A1: Confirm capture-service Redis env contract

**Files:**
- Read: `555stream/services/capture-service/src/worker.js`

- [ ] **Step 1: Read worker.js for Redis connection setup**

Run:
```bash
cd '/Volumes/OWC Envoy Pro FX/desktop_dump/new/Work/555/555stream/services/capture-service'
grep -nE "REDIS_|BULLMQ_|new Redis\(|new Worker\(|new Queue\(|connection:" src/worker.js | head -30
```

Expected output should reveal:
- The env var name for the Redis connection (`REDIS_URL` or `REDIS_HOST/REDIS_PORT/REDIS_PASSWORD`)
- The BullMQ Worker connection options

- [ ] **Step 2: Confirm Redis URL format expected**

Record in a scratch file `/tmp/redis-env-contract.txt`:
```
REDIS env var name:    <from grep>
TLS support:           <does it use redis:// or rediss://, does it pass tls options?>
Auth format:           <password in URL, or separate env var?>
```

This determines the exact `REDIS_URL` string we set in §5.

- [ ] **Step 3: Commit the scratch file? No.**

No commit. This is pure investigation. Move on.

### Task A2: Confirm AWS Load Balancer Controller is installed in staging

**Files:**
- Read: staging EKS cluster

- [ ] **Step 1: Check for AWS LBC deployment in staging**

Run via deployer SSM:
```bash
sudo -u deploy bash -c 'export SSM_TARGET_INSTANCE_ID=i-0c96daf9e5920e6df && cd /home/deploy/555stream-aws-staging && KC=scripts/aws-migration/eks-private-kubectl.sh && $KC -n kube-system get deploy aws-load-balancer-controller -o jsonpath="{.metadata.name}{\" \"}{.spec.replicas}{\"/\"}{.status.readyReplicas}{\"\\n\"}"'
```

Expected: `aws-load-balancer-controller 2/2` (or similar replica count, both Ready)

- [ ] **Step 2: Verify it supports `loadBalancerClass: service.k8s.aws/nlb`**

Run:
```bash
$KC -n kube-system get deploy aws-load-balancer-controller -o jsonpath="{.spec.template.spec.containers[0].image}"
```

Expected: an image tag at `v2.4.0` or later. (Earlier versions don't support `loadBalancerClass`.)

- [ ] **Step 3: If LBC missing or too old, escalate**

If the deployment is missing or pre-v2.4, STOP and surface to the user. The plan assumes a modern LBC. Installing it is out of scope.

- [ ] **Step 4: No commit, no file change. Move on.**

### Task A3: Confirm current Redis and control-plane pod label selectors

**Files:**
- Read: staging EKS cluster

- [ ] **Step 1: Confirm Redis pod labels match `app.kubernetes.io/name=redis`**

```bash
$KC -n staging get pods -l app.kubernetes.io/name=redis -o name
```

Expected: at least one pod (e.g., `pod/redis-xxxxx-yyyyy`).

- [ ] **Step 2: Confirm control-plane pod labels match `app=control-plane`**

```bash
$KC -n staging get pods -l app=control-plane -o name
```

Expected: at least one pod.

- [ ] **Step 3: If a selector returns zero pods, fix it inline**

Update the selector in the corresponding YAML (in Wave C) to match the actual labels. The actual label set is on the pod's `metadata.labels`. To list them:
```bash
$KC -n staging get pod <pod-name> -o jsonpath='{.metadata.labels}'
```

- [ ] **Step 4: Record the verified selectors**

Save to `/tmp/staging-selectors.txt`:
```
redis selector:         app.kubernetes.io/name=redis  (or corrected)
control-plane selector: app=control-plane              (or corrected)
```

No commit.

### Task A4: Capture the current Redis password source

**Files:**
- Read: AWS Secrets Manager

- [ ] **Step 1: Confirm `stream/staging/redis-auth-token` exists**

```bash
aws secretsmanager describe-secret --profile stream-admin --region eu-central-1 \
  --secret-id /stream/staging/redis-auth-token \
  --query '{Name:Name,ARN:ARN,LastChangedDate:LastChangedDate}' --output json
```

Expected: ARN returned, no error.

- [ ] **Step 2: Confirm the staging control-plane and Redis pod use this same password**

```bash
$KC -n staging get secret control-plane-secrets -o jsonpath="{.data}" \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); print('REDIS_URL key present:', 'REDIS_URL' in d, ' REDIS_PASSWORD key present:', 'REDIS_PASSWORD' in d)"
```

Expected: one of those is `True`. If `REDIS_URL` holds the auth, we'll source from there; otherwise we read `stream/staging/redis-auth-token`.

- [ ] **Step 3: Pull the password into an in-memory variable (do NOT echo)**

```bash
# Determine the right source first, then fetch silently
REDIS_PASSWORD_RAW="$(aws secretsmanager get-secret-value --profile stream-admin --region eu-central-1 \
  --secret-id /stream/staging/redis-auth-token --query SecretString --output text 2>/dev/null)"
# Inspect the shape (without echoing the password)
echo "shape: $(printf '%s' "$REDIS_PASSWORD_RAW" | python3 -c 'import sys,json; print(type(json.loads(sys.stdin.read())).__name__)' 2>/dev/null || echo plain-string)"
```

Expected: either `dict` (JSON object containing the password) or `plain-string`. Record the shape in `/tmp/redis-pwd-shape.txt`.

- [ ] **Step 4: No commit.**

---

## Wave B: AWS network in us-east-2

### Task B1: Create the new us-east-2 VPC

**Files:**
- AWS (us-east-2)

- [ ] **Step 1: Create the VPC**

```bash
VPC_ID=$(aws ec2 create-vpc --profile stream-admin --region us-east-2 \
  --cidr-block 10.100.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=capture-gpu-us-east-2},{Key=cross_region_for,Value=rndr-stream-staging},{Key=environment,Value=staging}]' \
  --query 'Vpc.VpcId' --output text)
echo "VPC_ID=$VPC_ID"
```

Expected: `VPC_ID=vpc-...`. Save the ID to `/tmp/cross-region-ids.env`.

- [ ] **Step 2: Verify the VPC is `available`**

```bash
aws ec2 describe-vpcs --profile stream-admin --region us-east-2 \
  --vpc-ids "$VPC_ID" --query 'Vpcs[0].State' --output text
```

Expected: `available`.

- [ ] **Step 3: Enable DNS hostnames and resolution**

```bash
aws ec2 modify-vpc-attribute --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" --enable-dns-hostnames
aws ec2 modify-vpc-attribute --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" --enable-dns-support
```

Expected: no error. Re-check:
```bash
aws ec2 describe-vpc-attribute --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" --attribute enableDnsHostnames --query 'EnableDnsHostnames.Value'
```
Expected: `true`.

- [ ] **Step 4: Append to `/tmp/cross-region-ids.env`**

```bash
echo "VPC_ID=$VPC_ID" >> /tmp/cross-region-ids.env
```

No git commit (these are environment IDs, captured locally; the script that creates them is Task H1).

### Task B2: Create subnet, IGW, route table

**Files:**
- AWS (us-east-2)

- [ ] **Step 1: Create subnet**

```bash
SUBNET_ID=$(aws ec2 create-subnet --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" --cidr-block 10.100.1.0/24 --availability-zone us-east-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=capture-gpu-public-2a}]' \
  --query 'Subnet.SubnetId' --output text)
echo "SUBNET_ID=$SUBNET_ID" >> /tmp/cross-region-ids.env
```

Expected: `subnet-...`.

- [ ] **Step 2: Enable auto-assign public IP on the subnet**

```bash
aws ec2 modify-subnet-attribute --profile stream-admin --region us-east-2 \
  --subnet-id "$SUBNET_ID" --map-public-ip-on-launch
```

- [ ] **Step 3: Create internet gateway and attach**

```bash
IGW_ID=$(aws ec2 create-internet-gateway --profile stream-admin --region us-east-2 \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=capture-gpu-igw}]' \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID"
echo "IGW_ID=$IGW_ID" >> /tmp/cross-region-ids.env
```

- [ ] **Step 4: Create route table and associate to subnet**

```bash
RT_ID=$(aws ec2 create-route-table --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=capture-gpu-rt}]' \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 associate-route-table --profile stream-admin --region us-east-2 \
  --route-table-id "$RT_ID" --subnet-id "$SUBNET_ID"
echo "RT_ID=$RT_ID" >> /tmp/cross-region-ids.env
```

- [ ] **Step 5: Add default route to IGW**

```bash
aws ec2 create-route --profile stream-admin --region us-east-2 \
  --route-table-id "$RT_ID" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID"
```

- [ ] **Step 6: Verify the route is `active`**

```bash
aws ec2 describe-route-tables --profile stream-admin --region us-east-2 \
  --route-table-ids "$RT_ID" --query 'RouteTables[0].Routes[?DestinationCidrBlock==`0.0.0.0/0`].State' --output text
```

Expected: `active`.

- [ ] **Step 7: No git commit.**

### Task B3: Create the inter-region VPC peering connection

**Files:**
- AWS (both regions)

- [ ] **Step 1: Look up the staging VPC ID in eu-central-1**

```bash
STAGING_VPC_ID=$(aws ec2 describe-vpcs --profile stream-admin --region eu-central-1 \
  --filters 'Name=tag:Name,Values=*staging*' --query 'Vpcs[?CidrBlock==`10.80.0.0/16`].VpcId' --output text)
echo "STAGING_VPC_ID=$STAGING_VPC_ID" >> /tmp/cross-region-ids.env
```

Expected: a single `vpc-...`. If multiple match, refine the filter.

- [ ] **Step 2: Create the peering request from us-east-2**

```bash
PCX_ID=$(aws ec2 create-vpc-peering-connection --profile stream-admin --region us-east-2 \
  --vpc-id "$VPC_ID" --peer-vpc-id "$STAGING_VPC_ID" --peer-region eu-central-1 \
  --tag-specifications 'ResourceType=vpc-peering-connection,Tags=[{Key=Name,Value=capture-gpu-to-staging}]' \
  --query 'VpcPeeringConnection.VpcPeeringConnectionId' --output text)
echo "PCX_ID=$PCX_ID" >> /tmp/cross-region-ids.env
```

Expected: `pcx-...`. Status will be `pending-acceptance`.

- [ ] **Step 3: Accept the peering in eu-central-1**

```bash
aws ec2 accept-vpc-peering-connection --profile stream-admin --region eu-central-1 \
  --vpc-peering-connection-id "$PCX_ID" \
  --query 'VpcPeeringConnection.Status.Code' --output text
```

Expected: `provisioning` (briefly), then `active`.

- [ ] **Step 4: Wait for peering active**

```bash
for i in 1 2 3 4 5 6 8 10 12; do
  ST=$(aws ec2 describe-vpc-peering-connections --profile stream-admin --region us-east-2 \
    --vpc-peering-connection-ids "$PCX_ID" --query 'VpcPeeringConnections[0].Status.Code' --output text)
  echo "peering poll $i: $ST"
  [ "$ST" = "active" ] && break
  sleep 5
done
```

Expected: `active` within ~30s.

- [ ] **Step 5: Enable DNS resolution across the peer (both directions)**

```bash
aws ec2 modify-vpc-peering-connection-options --profile stream-admin --region us-east-2 \
  --vpc-peering-connection-id "$PCX_ID" \
  --requester-peering-connection-options AllowDnsResolutionFromRemoteVpc=true
aws ec2 modify-vpc-peering-connection-options --profile stream-admin --region eu-central-1 \
  --vpc-peering-connection-id "$PCX_ID" \
  --accepter-peering-connection-options AllowDnsResolutionFromRemoteVpc=true
```

Expected: no error.

- [ ] **Step 6: No git commit.**

### Task B4: Add peer routes on both route tables

**Files:**
- AWS (both regions)

- [ ] **Step 1: Add `10.80.0.0/16 → pcx` on us-east-2 route table**

```bash
aws ec2 create-route --profile stream-admin --region us-east-2 \
  --route-table-id "$RT_ID" --destination-cidr-block 10.80.0.0/16 \
  --vpc-peering-connection-id "$PCX_ID"
```

- [ ] **Step 2: Find the staging route table(s)**

```bash
STAGING_RT_IDS=$(aws ec2 describe-route-tables --profile stream-admin --region eu-central-1 \
  --filters "Name=vpc-id,Values=$STAGING_VPC_ID" \
  --query 'RouteTables[].RouteTableId' --output text)
echo "STAGING_RT_IDS=$STAGING_RT_IDS"
```

Expected: one or more route table IDs.

- [ ] **Step 3: Add `10.100.0.0/16 → pcx` on each staging route table**

```bash
for rt in $STAGING_RT_IDS; do
  echo "patching $rt"
  aws ec2 create-route --profile stream-admin --region eu-central-1 \
    --route-table-id "$rt" --destination-cidr-block 10.100.0.0/16 \
    --vpc-peering-connection-id "$PCX_ID" 2>&1 || echo "(already present, ok)"
done
```

Expected: route added on each, or "already present" (acceptable).

- [ ] **Step 4: Verify routes are active on both sides**

```bash
aws ec2 describe-route-tables --profile stream-admin --region us-east-2 \
  --route-table-ids "$RT_ID" --query 'RouteTables[0].Routes[?DestinationCidrBlock==`10.80.0.0/16`].State' --output text
```

Expected: `active`.

- [ ] **Step 5: No git commit.**

### Task B5: Create the three security groups

**Files:**
- AWS (both regions)

- [ ] **Step 1: Create `staging-redis-peer-sg` in eu-central-1**

```bash
REDIS_PEER_SG=$(aws ec2 create-security-group --profile stream-admin --region eu-central-1 \
  --group-name staging-redis-peer-sg --vpc-id "$STAGING_VPC_ID" \
  --description "Allow capture-gpu-us-east-2 → staging redis NLB" \
  --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=staging-redis-peer-sg}]' \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --profile stream-admin --region eu-central-1 \
  --group-id "$REDIS_PEER_SG" --protocol tcp --port 6379 --cidr 10.100.0.0/16
echo "REDIS_PEER_SG=$REDIS_PEER_SG" >> /tmp/cross-region-ids.env
```

- [ ] **Step 2: Create `staging-cp-peer-sg` in eu-central-1**

```bash
CP_PEER_SG=$(aws ec2 create-security-group --profile stream-admin --region eu-central-1 \
  --group-name staging-cp-peer-sg --vpc-id "$STAGING_VPC_ID" \
  --description "Allow capture-gpu-us-east-2 → staging control-plane NLB" \
  --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=staging-cp-peer-sg}]' \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --profile stream-admin --region eu-central-1 \
  --group-id "$CP_PEER_SG" --protocol tcp --port 3000 --cidr 10.100.0.0/16
echo "CP_PEER_SG=$CP_PEER_SG" >> /tmp/cross-region-ids.env
```

- [ ] **Step 3: Create `capture-gpu-worker-sg` in us-east-2**

```bash
WORKER_SG=$(aws ec2 create-security-group --profile stream-admin --region us-east-2 \
  --group-name capture-gpu-worker-sg --vpc-id "$VPC_ID" \
  --description "capture-gpu worker EC2; egress to staging via peer + general egress" \
  --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=capture-gpu-worker-sg}]' \
  --query 'GroupId' --output text)
echo "WORKER_SG=$WORKER_SG" >> /tmp/cross-region-ids.env
```

The default egress (all-allow) on a new SG is fine. No ingress rules needed (SSM Session Manager handles shell-in via the SSM endpoint).

- [ ] **Step 4: Verify all three groups exist**

```bash
aws ec2 describe-security-groups --profile stream-admin --region eu-central-1 \
  --group-ids "$REDIS_PEER_SG" "$CP_PEER_SG" --query 'SecurityGroups[].GroupName' --output text
aws ec2 describe-security-groups --profile stream-admin --region us-east-2 \
  --group-ids "$WORKER_SG" --query 'SecurityGroups[].GroupName' --output text
```

Expected: three names printed.

- [ ] **Step 5: No git commit.**

---

## Wave C: K8s manifests for internal NLBs

### Task C1: Write the `redis-peer` Service YAML

**Files:**
- Create: `555stream/k8s/environments/staging/redis-peer-service.yaml`

- [ ] **Step 1: Write the file**

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
    # PLACEHOLDER: filled by Task C3 once the SG is created
    service.beta.kubernetes.io/aws-load-balancer-security-groups: __REDIS_PEER_SG__
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

- [ ] **Step 2: Verify the file parses as YAML**

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('555stream/k8s/environments/staging/redis-peer-service.yaml'))" && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Confirm the `app.kubernetes.io/name=redis` selector matches Task A3's verified label**

If A3 found a different label, replace `app.kubernetes.io/name: redis` with the verified one inline.

- [ ] **Step 4: Commit**

```bash
git add 555stream/k8s/environments/staging/redis-peer-service.yaml
git commit -m "k8s(staging): add redis-peer internal NLB Service

Additive Service exposing redis via internal-scheme NLB so the
us-east-2 cross-region capture-gpu worker can subscribe to the
BullMQ queue over VPC peering. Does not touch the existing
ClusterIP redis Service."
```

### Task C2: Write the `control-plane-peer` Service YAML

**Files:**
- Create: `555stream/k8s/environments/staging/control-plane-peer-service.yaml`

- [ ] **Step 1: Write the file**

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
    service.beta.kubernetes.io/aws-load-balancer-security-groups: __CP_PEER_SG__
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

- [ ] **Step 2: Verify YAML parses**

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('555stream/k8s/environments/staging/control-plane-peer-service.yaml'))" && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Confirm `app=control-plane` selector matches Task A3's verified label**

If A3 found a different label, replace inline.

- [ ] **Step 4: Commit**

```bash
git add 555stream/k8s/environments/staging/control-plane-peer-service.yaml
git commit -m "k8s(staging): add control-plane-peer internal NLB Service

Additive Service exposing control-plane via internal-scheme NLB
so the us-east-2 cross-region capture-gpu worker can fetch
assets/manifests over VPC peering. Does not touch the existing
ClusterIP control-plane Service."
```

### Task C3: Patch the SG annotation values into the YAMLs

**Files:**
- Modify: `555stream/k8s/environments/staging/redis-peer-service.yaml`
- Modify: `555stream/k8s/environments/staging/control-plane-peer-service.yaml`

- [ ] **Step 1: Substitute the SG IDs from Task B5**

```bash
source /tmp/cross-region-ids.env
sed -i.bak "s|__REDIS_PEER_SG__|$REDIS_PEER_SG|g" 555stream/k8s/environments/staging/redis-peer-service.yaml
sed -i.bak "s|__CP_PEER_SG__|$CP_PEER_SG|g" 555stream/k8s/environments/staging/control-plane-peer-service.yaml
rm -f 555stream/k8s/environments/staging/redis-peer-service.yaml.bak
rm -f 555stream/k8s/environments/staging/control-plane-peer-service.yaml.bak
```

- [ ] **Step 2: Verify the placeholders are gone**

```bash
grep -E "__(REDIS_PEER_SG|CP_PEER_SG)__" 555stream/k8s/environments/staging/*-peer-service.yaml || echo "no placeholders left"
```

Expected: `no placeholders left`.

- [ ] **Step 3: Commit**

```bash
git add 555stream/k8s/environments/staging/redis-peer-service.yaml \
        555stream/k8s/environments/staging/control-plane-peer-service.yaml
git commit -m "k8s(staging): bind peer SGs into NLB Service annotations

Wire concrete staging-redis-peer-sg and staging-cp-peer-sg group IDs
into the load-balancer-security-groups annotations on both peer
Services."
```

### Task C4: Add the two Services to staging kustomization

**Files:**
- Modify: `555stream/k8s/environments/staging/kustomization.yaml`

- [ ] **Step 1: Read the current kustomization**

```bash
cat 555stream/k8s/environments/staging/kustomization.yaml
```

Note: format and existing `resources:` entries.

- [ ] **Step 2: Add the two new files to `resources:`**

If the file has a `resources:` list, append:
```yaml
- redis-peer-service.yaml
- control-plane-peer-service.yaml
```

(Preserve existing order; add at the end of the list.)

- [ ] **Step 3: Verify the kustomization is valid**

```bash
cd 555stream/k8s/environments/staging
kubectl kustomize . > /tmp/staging-kustomize-rendered.yaml && grep -E "^kind:|^  name:" /tmp/staging-kustomize-rendered.yaml | head -40
```

Expected: lists include `Service redis-peer` and `Service control-plane-peer`.

- [ ] **Step 4: Commit**

```bash
git add 555stream/k8s/environments/staging/kustomization.yaml
git commit -m "k8s(staging): include peer NLB Services in kustomization"
```

### Task C5: Apply the new Services

**Files:**
- staging EKS cluster

- [ ] **Step 1: Apply via kubectl on the deployer**

```bash
$KC -n staging apply -f 555stream/k8s/environments/staging/redis-peer-service.yaml
$KC -n staging apply -f 555stream/k8s/environments/staging/control-plane-peer-service.yaml
```

Expected: `service/redis-peer created` and `service/control-plane-peer created`.

- [ ] **Step 2: Wait for the NLBs to provision (up to 4 min)**

```bash
for svc in redis-peer control-plane-peer; do
  for i in $(seq 1 24); do
    LB=$($KC -n staging get svc $svc -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
    echo "$svc poll $i: ${LB:-pending}"
    [ -n "$LB" ] && break
    sleep 10
  done
done
```

Expected: both Services eventually show a hostname like `staging-redis-peer-XXXXX.elb.eu-central-1.amazonaws.com`.

- [ ] **Step 3: Capture both hostnames**

```bash
REDIS_NLB_DNS=$($KC -n staging get svc redis-peer -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
CP_NLB_DNS=$($KC -n staging get svc control-plane-peer -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "REDIS_NLB_DNS=$REDIS_NLB_DNS" >> /tmp/cross-region-ids.env
echo "CP_NLB_DNS=$CP_NLB_DNS" >> /tmp/cross-region-ids.env
```

- [ ] **Step 4: Verify each NLB target group has at least one healthy target**

```bash
for svc in redis-peer control-plane-peer; do
  echo "--- $svc endpoints ---"
  $KC -n staging get endpoints $svc -o jsonpath='{.subsets[*].addresses[*].ip}'
  echo
done
```

Expected: at least one IP per Service (the pod IP).

- [ ] **Step 5: No additional git commit (already committed in C4).**

---

## Wave D: Smoke-test peer connectivity from a temp pod

### Task D1: Test cross-region resolution and reachability from a temp pod in staging

**Files:**
- Ephemeral pod in staging EKS

- [ ] **Step 1: Run a one-shot debug pod**

```bash
$KC -n staging run nettest --image=nicolaka/netshoot --rm -it --restart=Never -- \
  bash -c "dig +short $REDIS_NLB_DNS && nc -zv $REDIS_NLB_DNS 6379 && nc -zv $CP_NLB_DNS 3000"
```

Expected: DNS returns a 10.80.x.x IP; both `nc` calls report `succeeded`.

- [ ] **Step 2: If any step fails, debug before proceeding to Wave E**

Common causes:
- Selector mismatch (Task A3 / C1-C2): the NLB has no healthy targets.
- SG misconfig (Task B5): ingress not allowed from cluster CIDR (NLB to pod traffic).
- DNS not yet propagated: wait 30s and re-run.

- [ ] **Step 3: No commit.**

### Task D2: Test peer reachability from an existing us-east-2 host (optional)

**Files:**
- AWS us-east-2

We don't have a host in the new VPC yet, but we can use the GPU launch in Wave F to verify peer reachability. The Wave G verification covers this. No standalone task needed.

- [ ] **Step 1: Acknowledge that D2 verification is folded into Wave G**

No action this task.

---

## Wave E: Worker secrets and IAM

### Task E1: Mint the capture-worker agent token

**Files:**
- Create: `.local/scripts/mint-capture-worker-token.sh`
- staging control-plane pod (read JWT_SECRET, write token to local file)

- [ ] **Step 1: Write the mint script**

```bash
mkdir -p .local/scripts
cat > .local/scripts/mint-capture-worker-token.sh <<'BASH'
#!/bin/bash
# Mints a capture-worker agent token via the staging control-plane pod.
# Token stays out of process arguments. Returns just the JWT to stdout.
set -euo pipefail
export AWS_PROFILE=stream-admin
export SSM_TARGET_INSTANCE_ID=i-0c96daf9e5920e6df

INPOD_SCRIPT='/tmp/mint-capture-worker.sh'

cat > /tmp/_local-inpod-mint.sh <<'INNER'
#!/bin/sh
set -e
ATPATH=$(find /app -name agentToken.js -not -path '*/node_modules/*' -not -path '*/__tests__/*' 2>/dev/null | head -1)
AAPATH=$(find /app -name agentActor.js -not -path '*/node_modules/*' -not -path '*/__tests__/*' 2>/dev/null | head -1)
node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
import { generateAgentToken, SCOPES } from '$ATPATH';
import { resolveOrCreateAgentActor } from '$AAPATH';
const p = new PrismaClient();
try {
  const u = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
  if (!u) { process.stderr.write('NO-ADMIN-USER\n'); process.exit(2); }
  const agentId = 'capture-worker-us-east-2-1';
  const actorCtx = await resolveOrCreateAgentActor(agentId, u.id, 'wallet_signature', 'agent.wallet.staging-bypass');
  const t = generateAgentToken({
    agentId,
    userId: u.id,
    scopes: [
      SCOPES.SESSIONS_READ,
      SCOPES.STATE_WRITE,
      SCOPES.STUDIO_READ, SCOPES.STUDIO_WRITE,
      SCOPES.MEDIA_WRITE,
      SCOPES.SOURCES_WRITE,
    ],
    sessionIds: ['*'],
    expiresIn: '7d',
    actorId: actorCtx.actorId,
    actorType: actorCtx.actorType,
    authMethod: actorCtx.authMethod,
    policyId: actorCtx.policyId,
    sessionKind: actorCtx.sessionKind,
    subjectUserId: actorCtx.subjectUserId,
    tier: 'owner',
    effectiveTier: 'owner',
  });
  process.stdout.write(t);
} finally {
  await p.\$disconnect();
}
"
INNER
chmod +x /tmp/_local-inpod-mint.sh
B64=$(base64 -i /tmp/_local-inpod-mint.sh)

CMD=$(aws ssm send-command --region eu-central-1 --instance-ids "$SSM_TARGET_INSTANCE_ID" --document-name AWS-RunShellScript \
  --comment 'mint capture-worker token' \
  --parameters "commands=[\"echo '$B64' | base64 -d > $INPOD_SCRIPT && chmod +x $INPOD_SCRIPT && chown deploy:deploy $INPOD_SCRIPT && sudo -u deploy bash -c 'export SSM_TARGET_INSTANCE_ID=$SSM_TARGET_INSTANCE_ID && cd /home/deploy/555stream-aws-staging && KC=scripts/aws-migration/eks-private-kubectl.sh && CPOD=\$(\$KC -n staging get pod -l app=control-plane -o jsonpath={.items[0].metadata.name}) && \$KC -n staging cp $INPOD_SCRIPT staging/\$CPOD:/tmp/m.sh && \$KC -n staging exec \$CPOD -- sh -c \"chmod +x /tmp/m.sh && /tmp/m.sh\"'\"]" \
  --query 'Command.CommandId' --output text)
for i in 1 2 3 4 5 6 8 10 12; do
  S=$(aws ssm get-command-invocation --region eu-central-1 --command-id "$CMD" --instance-id "$SSM_TARGET_INSTANCE_ID" --query 'Status' --output text 2>/dev/null)
  case "$S" in Success|Failed|Cancelled|TimedOut) break;; esac
  sleep 5
done
aws ssm get-command-invocation --region eu-central-1 --command-id "$CMD" --instance-id "$SSM_TARGET_INSTANCE_ID" --query 'StandardOutputContent' --output text | tr -d '\n'
BASH
chmod 755 .local/scripts/mint-capture-worker-token.sh
```

- [ ] **Step 2: Run the mint script, capture the token to memory**

```bash
TOK=$(./.local/scripts/mint-capture-worker-token.sh 2>/dev/null)
echo "TOK_LEN=${#TOK}"
```

Expected: `TOK_LEN` reports a value between 800 and 1500.

- [ ] **Step 3: Verify the token has the expected claims by decoding (no creds exposed)**

```bash
printf '%s' "$TOK" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null \
  | python3 -c 'import sys,json; c=json.loads(sys.stdin.read()); print({k:c.get(k) for k in ("agentId","userId","tier","scopes","actorId","actorType")})'
```

Expected output (values for actor IDs may differ):
```
{'agentId': 'capture-worker-us-east-2-1', 'userId': '0fbb...58b', 'tier': 'owner', 'scopes': ['sessions:read','state:write','studio:read','studio:write','media:write','sources:write'], 'actorId': '...', 'actorType': 'agent'}
```

- [ ] **Step 4: Commit the script**

```bash
git add .local/scripts/mint-capture-worker-token.sh
# .local/ is gitignored — this commit will be empty for the local file.
# Optional: move script under a non-gitignored path if you want it versioned.
```

(If `.local/` is gitignored, skip the git commit for this script. The script lives outside version control on purpose; it's an operator-side tool. Save a copy elsewhere if you want history.)

### Task E2: Save token + NLB DNS into local credentials file

**Files:**
- Modify: `.local/stream-credentials.json`

- [ ] **Step 1: Pull the Redis password silently**

```bash
REDIS_PASSWORD=$(aws secretsmanager get-secret-value --profile stream-admin --region eu-central-1 \
  --secret-id /stream/staging/redis-auth-token --query SecretString --output text \
  | python3 -c 'import sys,json
v=sys.stdin.read()
try:
  d=json.loads(v)
  print(d.get("password") or d.get("REDIS_PASSWORD") or d.get("auth-token") or list(d.values())[0])
except Exception:
  print(v.strip())' )
echo "REDIS_PASSWORD_LEN=${#REDIS_PASSWORD}"
```

Expected: `REDIS_PASSWORD_LEN > 0`.

- [ ] **Step 2: Update `.local/stream-credentials.json`**

```bash
source /tmp/cross-region-ids.env
python3 - <<PY
import json, urllib.parse, os
p = '.local/stream-credentials.json'
d = json.load(open(p))
redis_dns = os.environ['REDIS_NLB_DNS']
cp_dns = os.environ['CP_NLB_DNS']
redis_pwd = os.environ['REDIS_PASSWORD']
redis_url = f"rediss://:{urllib.parse.quote(redis_pwd, safe='')}@{redis_dns}:6379"
cp_url = f"http://{cp_dns}:3000"
d['capture_worker_us_east_2'] = {
  'env': {
    'BULLMQ_QUEUE_NAME': 'capture-gpu',
    'REDIS_URL': redis_url,
    'CONTROL_PLANE_URL': cp_url,
    'CONTROL_PLANE_PUBLIC_URL': 'https://staging-stream.rndrntwrk.com',
    'CONTROL_PLANE_ASSET_BASE_URL': 'https://staging-stream.rndrntwrk.com',
    'STREAM555_AGENT_TOKEN': os.environ['TOK'],
    'CONCURRENCY': '1',
    'DISPLAY': ':99',
    'LOG_LEVEL': 'info',
    'NODE_ENV': 'staging',
    'WORKER_ID': 'us-east-2-gpu-1',
  },
  'rotation_cron': 'weekly on the staging deployer; re-mints token + updates AWS Secrets Manager + restarts capture-worker.service',
  'created_at': '2026-05-29T00:00Z',
}
json.dump(d, open(p, 'w'), indent=2)
print('local file updated')
PY
```

Expected: `local file updated`.

- [ ] **Step 3: No git commit (`.local/` is gitignored).**

### Task E3: Create the AWS Secrets Manager entry

**Files:**
- AWS Secrets Manager (eu-central-1)

- [ ] **Step 1: Create the secret**

```bash
SECRET_BODY=$(python3 -c "
import json
d = json.load(open('.local/stream-credentials.json'))
print(json.dumps(d['capture_worker_us_east_2']['env']))
")
SECRET_ARN=$(aws secretsmanager create-secret --profile stream-admin --region eu-central-1 \
  --name alice-bot/staging/capture-worker-env \
  --description 'capture-worker env (cross-region us-east-2). rotated weekly.' \
  --secret-string "$SECRET_BODY" \
  --query 'ARN' --output text)
echo "SECRET_ARN=$SECRET_ARN" >> /tmp/cross-region-ids.env
```

Expected: `SECRET_ARN=arn:aws:secretsmanager:eu-central-1:364947027011:secret:alice-bot/staging/capture-worker-env-XXXXX`.

If the secret already exists from a prior attempt:
```bash
SECRET_ARN=$(aws secretsmanager put-secret-value --profile stream-admin --region eu-central-1 \
  --secret-id alice-bot/staging/capture-worker-env --secret-string "$SECRET_BODY" \
  --query 'ARN' --output text)
```

- [ ] **Step 2: Verify the secret is readable**

```bash
aws secretsmanager get-secret-value --profile stream-admin --region eu-central-1 \
  --secret-id alice-bot/staging/capture-worker-env --query 'SecretString' --output text \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("keys:", sorted(d.keys()))'
```

Expected: `keys: ['BULLMQ_QUEUE_NAME', 'CONCURRENCY', 'CONTROL_PLANE_ASSET_BASE_URL', 'CONTROL_PLANE_PUBLIC_URL', 'CONTROL_PLANE_URL', 'DISPLAY', 'LOG_LEVEL', 'NODE_ENV', 'REDIS_URL', 'STREAM555_AGENT_TOKEN', 'WORKER_ID']`.

- [ ] **Step 3: No git commit.**

### Task E4: Add the read-secret IAM policy to the deployer role

**Files:**
- AWS IAM (global)

- [ ] **Step 1: Find the role behind the instance profile**

```bash
ROLE_NAME=$(aws iam get-instance-profile --profile stream-admin \
  --instance-profile-name rndr-stream-staging-deployer \
  --query 'InstanceProfile.Roles[0].RoleName' --output text)
echo "ROLE_NAME=$ROLE_NAME"
```

Expected: a role name (probably `rndr-stream-staging-deployer`).

- [ ] **Step 2: Attach an inline policy granting access to just this one secret**

```bash
aws iam put-role-policy --profile stream-admin --role-name "$ROLE_NAME" \
  --policy-name ReadCaptureWorkerSecret \
  --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "ReadCaptureWorkerSecret",
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
    "Resource": "$SECRET_ARN"
  }]
}
JSON
)"
```

- [ ] **Step 3: Verify the inline policy is attached**

```bash
aws iam get-role-policy --profile stream-admin --role-name "$ROLE_NAME" \
  --policy-name ReadCaptureWorkerSecret --query 'PolicyDocument.Statement[0].Resource' --output text
```

Expected: the secret ARN we just stored.

- [ ] **Step 4: No git commit.**

---

## Wave F: Launch the worker

### Task F1: Write the launch script

**Files:**
- Create: `.local/scripts/launch-capture-worker.sh`

- [ ] **Step 1: Write the script**

```bash
cat > .local/scripts/launch-capture-worker.sh <<'BASH'
#!/bin/bash
# Launches the cross-region capture-gpu worker EC2 in us-east-2.
# Prints the InstanceId on success.
set -euo pipefail
source /tmp/cross-region-ids.env

REGION=us-east-2
AMI=ami-0db2e3f991c246d37
INSTANCE_TYPE=g5.2xlarge

USER_DATA=$(cat <<'UD'
#!/bin/bash
set -euxo pipefail
ECR_REGISTRY=364947027011.dkr.ecr.eu-central-1.amazonaws.com
IMAGE_TAG=sha-a2db779
IMAGE="${ECR_REGISTRY}/stream/capture-service:${IMAGE_TAG}"

aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker pull "$IMAGE"

SECRET_ID="alice-bot/staging/capture-worker-env"
aws secretsmanager get-secret-value --region eu-central-1 \
  --secret-id "$SECRET_ID" --query SecretString --output text \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("\n".join(f"{k}={v}" for k,v in d.items()))' \
  > /etc/capture-worker.env
chmod 600 /etc/capture-worker.env
chown root:root /etc/capture-worker.env

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
UD
)

INSTANCE_ID=$(aws ec2 run-instances --profile stream-admin --region "$REGION" \
  --image-id "$AMI" \
  --instance-type "$INSTANCE_TYPE" \
  --subnet-id "$SUBNET_ID" \
  --security-group-ids "$WORKER_SG" \
  --iam-instance-profile 'Arn=arn:aws:iam::364947027011:instance-profile/rndr-stream-staging-deployer' \
  --user-data "$USER_DATA" \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":300,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=capture-gpu-worker-staging},{Key=purpose,Value=capture-gpu-worker},{Key=environment,Value=staging},{Key=cross_region_for,Value=rndr-stream-staging}]' \
  --query 'Instances[0].InstanceId' --output text)
echo "$INSTANCE_ID"
BASH
chmod +x .local/scripts/launch-capture-worker.sh
```

- [ ] **Step 2: No commit (`.local/` gitignored).**

### Task F2: Launch the worker

**Files:**
- AWS us-east-2

- [ ] **Step 1: Launch**

```bash
WORKER_INSTANCE_ID=$(./.local/scripts/launch-capture-worker.sh)
echo "WORKER_INSTANCE_ID=$WORKER_INSTANCE_ID" >> /tmp/cross-region-ids.env
```

Expected: `i-...`.

- [ ] **Step 2: Wait until Running**

```bash
for i in $(seq 1 30); do
  ST=$(aws ec2 describe-instances --profile stream-admin --region us-east-2 \
    --instance-ids "$WORKER_INSTANCE_ID" --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null)
  echo "ec2 poll $i: $ST"
  [ "$ST" = "running" ] && break
  sleep 10
done
```

Expected: `running` within ~2 min.

- [ ] **Step 3: Wait for SSM Agent Online**

```bash
sleep 60
for i in 1 2 3 4 5 6 7 8 10; do
  PS=$(aws ssm describe-instance-information --profile stream-admin --region us-east-2 \
    --filters "Key=InstanceIds,Values=$WORKER_INSTANCE_ID" --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null)
  echo "ssm poll $i: $PS"
  [ "$PS" = "Online" ] && break
  sleep 15
done
```

Expected: `Online` within ~3 min.

- [ ] **Step 4: Confirm user-data completed**

```bash
CMD=$(aws ssm send-command --profile stream-admin --region us-east-2 \
  --instance-ids "$WORKER_INSTANCE_ID" --document-name AWS-RunShellScript \
  --comment 'verify boot' \
  --parameters 'commands=["tail -40 /var/log/cloud-init-output.log; echo; systemctl status capture-worker --no-pager | head -20"]' \
  --query Command.CommandId --output text)
for i in 1 2 3 4 5 6 8 10; do
  S=$(aws ssm get-command-invocation --profile stream-admin --region us-east-2 --command-id "$CMD" --instance-id "$WORKER_INSTANCE_ID" --query Status --output text 2>/dev/null)
  case "$S" in Success|Failed|Cancelled|TimedOut) break;; esac
  sleep 4
done
aws ssm get-command-invocation --profile stream-admin --region us-east-2 --command-id "$CMD" --instance-id "$WORKER_INSTANCE_ID" --query StandardOutputContent --output text | head -60
```

Expected: cloud-init log ends with no errors; `capture-worker.service` shows `active (running)`.

- [ ] **Step 5: No git commit.**

---

## Wave G: Bottom-up verification (spec §6.1)

### Task G1: Steps 1-6 of spec §6.1 verification

**Files:**
- Worker EC2 via SSM

- [ ] **Step 1: Run all six verifications in one SSM command**

```bash
CMD=$(aws ssm send-command --profile stream-admin --region us-east-2 \
  --instance-ids "$WORKER_INSTANCE_ID" --document-name AWS-RunShellScript \
  --comment 'verify §6.1 steps 1-6' \
  --parameters 'commands=["set -e","source /etc/capture-worker.env","echo === DNS ===","getent ahosts \"$(echo $REDIS_URL | sed -E '"'"'s|.*@([^:]+):.*|\\1|'"'"')\" | head -1","echo === Redis ===","docker run --rm --network host redis:7-alpine redis-cli -u \"$REDIS_URL\" ping","echo === CP health ===","curl -fsS \"$CONTROL_PLANE_URL/api/agent/v1/health\"","echo === Token auth ===","curl -fsS -o /dev/null -w \"%{http_code}\\n\" -H \"Authorization: Bearer $STREAM555_AGENT_TOKEN\" \"$CONTROL_PLANE_URL/api/agent/v1/sessions\"","echo === GPU in container ===","docker exec capture-worker nvidia-smi --query-gpu=name,driver_version --format=csv | head -2","echo === BullMQ subscription ===","docker exec capture-worker sh -c '"'"'redis-cli -u $REDIS_URL XINFO GROUPS bull:capture-gpu 2>/dev/null || redis-cli -u $REDIS_URL HKEYS bull:capture-gpu:meta 2>/dev/null | head -5'"'"'"]' \
  --query Command.CommandId --output text)
for i in 1 2 3 4 5 6 8 10 12; do
  S=$(aws ssm get-command-invocation --profile stream-admin --region us-east-2 --command-id "$CMD" --instance-id "$WORKER_INSTANCE_ID" --query Status --output text 2>/dev/null)
  case "$S" in Success|Failed|Cancelled|TimedOut) break;; esac
  sleep 4
done
aws ssm get-command-invocation --profile stream-admin --region us-east-2 --command-id "$CMD" --instance-id "$WORKER_INSTANCE_ID" --query StandardOutputContent --output text | head -80
```

Expected output should include:
- DNS line resolves to 10.80.x.x
- Redis: `PONG`
- CP health: `{"status":"ok",...}` (or similar)
- Token auth: `200`
- GPU: `NVIDIA A10G, 595.71.05`
- BullMQ: at least one entry for the worker consumer

- [ ] **Step 2: If any check fails, debug**

Use the failure table in spec §6.3 to localize the layer (network / auth / app).

- [ ] **Step 3: No git commit.**

---

## Wave H: End-to-end Go Live test (spec §6.1 step 7)

### Task H1: Trigger Go Live and observe avatar broadcast on all 4 platforms

**Files:**
- staging EKS (alice-bot pod via existing scripts)

- [ ] **Step 1: Re-mint or reuse the alice-staging bypass token**

If still valid (mint was ~6h TTL), reuse. Otherwise, re-run the apply-alice-bypass-and-golive flow from the prior session (the script is at `/home/deploy/apply-alice-bypass-and-golive.sh` on the deployer; it both mints and triggers GO_LIVE).

```bash
sudo -u deploy /home/deploy/apply-alice-bypass-and-golive.sh 2>&1 | head -200
```

- [ ] **Step 2: Watch capture-worker logs while the Go Live runs**

In a parallel terminal:
```bash
CMD=$(aws ssm send-command --profile stream-admin --region us-east-2 \
  --instance-ids "$WORKER_INSTANCE_ID" --document-name AWS-RunShellScript \
  --parameters 'commands=["docker logs capture-worker --tail=50 --follow & sleep 60; kill %1"]' \
  --query Command.CommandId --output text)
sleep 70
aws ssm get-command-invocation --profile stream-admin --region us-east-2 --command-id "$CMD" --instance-id "$WORKER_INSTANCE_ID" --query StandardOutputContent --output text | head -80
```

Expected: log lines showing job pickup, chromium startup, frame capture, RTMP push.

- [ ] **Step 3: Observe each platform's live page**

Open in a browser, each of:
- twitch.tv/<channel>
- kick.com/<channel>
- pump.fun/live/<id>
- youtube.com/live/<id>

(Channel/ID identifiers are in `.local/stream-credentials.json` under `destinations.*`.)

Expected: Alice's VRM avatar visible on all four within 30s of GO_LIVE completing.

- [ ] **Step 4: If any platform doesn't go live, follow spec §6.3 failure table**

- [ ] **Step 5: No git commit.**

---

## Wave I: Teardown script (committed for reuse)

### Task I1: Write the teardown script

**Files:**
- Create: `.local/scripts/teardown-capture-worker.sh`

- [ ] **Step 1: Write the file**

```bash
cat > .local/scripts/teardown-capture-worker.sh <<'BASH'
#!/bin/bash
# Reverses the cross-region capture-gpu worker setup in 7 steps (spec §6.4).
# Idempotent: safe to re-run if a step partially completed.
set -uo pipefail
[ -f /tmp/cross-region-ids.env ] && source /tmp/cross-region-ids.env

if [ -n "${WORKER_INSTANCE_ID:-}" ]; then
  echo "1. Terminate worker EC2"
  aws ec2 terminate-instances --profile stream-admin --region us-east-2 \
    --instance-ids "$WORKER_INSTANCE_ID" --query 'TerminatingInstances[].[InstanceId,CurrentState.Name]' --output table 2>&1 || true
fi

echo "2. Delete NLB Services (NLBs auto-destruct)"
sudo -u deploy bash -c 'export SSM_TARGET_INSTANCE_ID=i-0c96daf9e5920e6df && cd /home/deploy/555stream-aws-staging && KC=scripts/aws-migration/eks-private-kubectl.sh && $KC -n staging delete service redis-peer control-plane-peer --ignore-not-found' || true

if [ -n "${PCX_ID:-}" ]; then
  echo "3. Delete VPC peering"
  aws ec2 delete-vpc-peering-connection --profile stream-admin --region us-east-2 \
    --vpc-peering-connection-id "$PCX_ID" || true
fi

echo "4. Delete us-east-2 VPC + dependents"
for SG in "${WORKER_SG:-}"; do
  [ -n "$SG" ] && aws ec2 delete-security-group --profile stream-admin --region us-east-2 --group-id "$SG" 2>/dev/null || true
done
[ -n "${SUBNET_ID:-}" ] && aws ec2 delete-subnet --profile stream-admin --region us-east-2 --subnet-id "$SUBNET_ID" 2>/dev/null || true
[ -n "${IGW_ID:-}" ] && [ -n "${VPC_ID:-}" ] && {
  aws ec2 detach-internet-gateway --profile stream-admin --region us-east-2 --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" 2>/dev/null || true
  aws ec2 delete-internet-gateway --profile stream-admin --region us-east-2 --internet-gateway-id "$IGW_ID" 2>/dev/null || true
}
[ -n "${RT_ID:-}" ] && aws ec2 delete-route-table --profile stream-admin --region us-east-2 --route-table-id "$RT_ID" 2>/dev/null || true
[ -n "${VPC_ID:-}" ] && aws ec2 delete-vpc --profile stream-admin --region us-east-2 --vpc-id "$VPC_ID" 2>/dev/null || true

for SG in "${REDIS_PEER_SG:-}" "${CP_PEER_SG:-}"; do
  [ -n "$SG" ] && aws ec2 delete-security-group --profile stream-admin --region eu-central-1 --group-id "$SG" 2>/dev/null || true
done

echo "5. Delete inline IAM policy + Secrets Manager entry"
ROLE_NAME=$(aws iam get-instance-profile --profile stream-admin --instance-profile-name rndr-stream-staging-deployer --query 'InstanceProfile.Roles[0].RoleName' --output text 2>/dev/null || echo "")
[ -n "$ROLE_NAME" ] && aws iam delete-role-policy --profile stream-admin --role-name "$ROLE_NAME" --policy-name ReadCaptureWorkerSecret 2>/dev/null || true
aws secretsmanager delete-secret --profile stream-admin --region eu-central-1 --secret-id alice-bot/staging/capture-worker-env --force-delete-without-recovery 2>/dev/null || true

echo "6. Revoke agent token: skipping (lets it expire naturally in 7d)"

echo "7. Remove kustomization entries (manual git step):"
echo "   git rm 555stream/k8s/environments/staging/redis-peer-service.yaml"
echo "   git rm 555stream/k8s/environments/staging/control-plane-peer-service.yaml"
echo "   edit 555stream/k8s/environments/staging/kustomization.yaml to remove the two entries"
echo "   commit + push"
echo "Done."
BASH
chmod +x .local/scripts/teardown-capture-worker.sh
```

- [ ] **Step 2: Verify script syntax**

```bash
bash -n .local/scripts/teardown-capture-worker.sh && echo OK
```

Expected: `OK`.

- [ ] **Step 3: No commit (`.local/` gitignored).**

---

## Wave J: Document and hand off

### Task J1: Update spec's "Open questions" with the actual decisions taken during implementation

**Files:**
- Modify: `docs/superpowers/specs/2026-05-29-cross-region-gpu-capture-design.md`

- [ ] **Step 1: Replace the "Open questions" section**

Edit the spec to record the decisions taken:
```markdown
## Open questions

(resolved during 2026-05-29 implementation)

- **AZ count**: single AZ (`us-east-2a`). One worker, no HA need.
- **CloudWatch agent**: deferred (out of scope for the bypass; logs available via SSM/journalctl on demand).
- **Image tag mutability**: pinned to a specific SHA in user-data; re-launch the worker on capture-service redeploys.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-29-cross-region-gpu-capture-design.md
git commit -m "docs(specs): close open questions on cross-region GPU capture spec"
```

### Task J2: Record final state to local credentials file for future runs

**Files:**
- Modify: `.local/stream-credentials.json`

- [ ] **Step 1: Append all the resource IDs**

```bash
source /tmp/cross-region-ids.env
python3 - <<PY
import json, os
p = '.local/stream-credentials.json'
d = json.load(open(p))
d.setdefault('capture_worker_us_east_2', {})['resources'] = {
  'VPC_ID':              os.environ['VPC_ID'],
  'SUBNET_ID':           os.environ['SUBNET_ID'],
  'IGW_ID':              os.environ['IGW_ID'],
  'RT_ID':               os.environ['RT_ID'],
  'PCX_ID':              os.environ['PCX_ID'],
  'STAGING_VPC_ID':      os.environ['STAGING_VPC_ID'],
  'REDIS_PEER_SG':       os.environ['REDIS_PEER_SG'],
  'CP_PEER_SG':          os.environ['CP_PEER_SG'],
  'WORKER_SG':           os.environ['WORKER_SG'],
  'REDIS_NLB_DNS':       os.environ['REDIS_NLB_DNS'],
  'CP_NLB_DNS':          os.environ['CP_NLB_DNS'],
  'WORKER_INSTANCE_ID':  os.environ['WORKER_INSTANCE_ID'],
  'SECRET_ARN':          os.environ['SECRET_ARN'],
}
json.dump(d, open(p, 'w'), indent=2)
print('local file updated')
PY
```

- [ ] **Step 2: No commit (`.local/` gitignored).**

---

## Plan complete

The full implementation is broken into ten waves (A-J), about 25 bite-sized tasks. Each task that touches a git-tracked file has an explicit commit step; tasks that touch only AWS or `.local/` files don't commit.
