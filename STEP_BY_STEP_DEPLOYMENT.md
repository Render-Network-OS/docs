# Step-by-Step Deployment Guide - Complete Variable Setup

## ✅ ALL CODE PUSHED SUCCESSFULLY

All repositories have been pushed:
- ✅ 555x402-hyperlink-link-service → `feat/short-domain-support`
- ✅ 555x402-api-gateway → `feat/meta-tx-relay-fix-from-main`
- ✅ 555x402-cctp-orchestrator → `main`
- ✅ backend → `main`
- ✅ 555-bot → `main`
- ✅ 555-mono → `main`

---

## 🔑 STANDARDIZED KEYS (GENERATED)

**Use these keys for all services:**

```bash
HYPERLINK_API_KEY=62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed
HYPERLINK_WEBHOOK_SECRET=ef84ab14b645deb1942473b5b9ae43c53946cfd77659cd5213ee9a3b4906c6a6
```

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### STEP 1: Update Backend Secrets (Render Dashboard)

**Time: 2 minutes**

1. Go to https://dashboard.render.com
2. Navigate to `five55-backend` service
3. Click "Environment" tab
4. Add new environment variables:

```
Name: HYPERLINK_API_KEY
Value: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed
☑ Mark as Secret

Name: HYPERLINK_WEBHOOK_SECRET
Value: ef84ab14b645deb1942473b5b9ae43c53946cfd77659cd5213ee9a3b4906c6a6
☑ Mark as Secret
```

5. Click "Save Changes"
6. Service will automatically redeploy (takes ~5 minutes)

**Verification:**
```bash
# After redeploy completes, check logs:
curl https://five55-backend-wn5h.onrender.com/healthz
# Should return 200 OK
```

---

### STEP 2: Update Bot Secrets (GitHub Actions)

**Time: 3 minutes**

**Method A: Using GitHub CLI (Recommended)**

```bash
# Install GitHub CLI if not installed
# brew install gh

# Login to GitHub
gh auth login

# Set secrets for the bot repository
gh secret set HYPERLINK_API_BASE \
  --body "https://api.rendernet.work" \
  --repo Render-Network-OS/555-bot

gh secret set HYPERLINK_API_KEY \
  --body "62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" \
  --repo Render-Network-OS/555-bot

# Verify secrets were set
gh secret list --repo Render-Network-OS/555-bot | grep HYPERLINK
```

**Method B: Using GitHub Web UI**

1. Go to https://github.com/Render-Network-OS/555-bot
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add first secret:
   - Name: `HYPERLINK_API_BASE`
   - Value: `https://api.rendernet.work`
   - Click "Add secret"
6. Add second secret:
   - Name: `HYPERLINK_API_KEY`
   - Value: `62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed`
   - Click "Add secret"

**Verification:**
- Go to "Settings" → "Secrets and variables" → "Actions"
- You should see:
  - ✅ HYPERLINK_API_BASE
  - ✅ HYPERLINK_API_KEY

---

### STEP 3: Update 555x402 API Gateway Secrets (Kubernetes)

**Time: 2 minutes**

**Get current API keys:**
```bash
kubectl get secret api-keys -n default -o jsonpath='{.data.public_keys_csv}' | base64 -d
# Save the output - it contains existing keys
```

**Update with new backend key:**
```bash
# Get existing keys and add the new backend key
EXISTING_KEYS=$(kubectl get secret api-keys -n default -o jsonpath='{.data.public_keys_csv}' | base64 -d)

# Create updated secret with new key appended
kubectl create secret generic api-keys \
  --from-literal=public_keys_csv="${EXISTING_KEYS},62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" \
  -n default \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart API gateway to pick up new secret
kubectl rollout restart deployment/api-gateway -n default
kubectl rollout status deployment/api-gateway -n default
```

**Verification:**
```bash
# Test with new key
curl https://api.rendernet.work/pub/v1/links/test \
  -H "X-API-Key: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed"

# Should return: 404 (not found) - means auth worked!
# Should NOT return: 401 (unauthorized)
```

---

### STEP 4: Update CCTP Orchestrator Config (Kubernetes)

**Time: 3 minutes**

**Create ConfigMap for webhook URL:**
```bash
kubectl create configmap cctp-orchestrator-webhook \
  --from-literal=BACKEND_WEBHOOK_URL="https://five55-backend-wn5h.onrender.com/webhooks/payment-status" \
  -n default \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Create Secret for webhook secret:**
```bash
kubectl create secret generic cctp-orchestrator-webhook-secret \
  --from-literal=BACKEND_WEBHOOK_SECRET="ef84ab14b645deb1942473b5b9ae43c53946cfd77659cd5213ee9a3b4906c6a6" \
  -n default \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Update orchestrator deployment:**
```bash
# Edit the deployment
kubectl edit deployment cctp-orchestrator -n default

# Add these environment variables under spec.template.spec.containers[0].env:
```

```yaml
- name: BACKEND_WEBHOOK_URL
  valueFrom:
    configMapKeyRef:
      name: cctp-orchestrator-webhook
      key: BACKEND_WEBHOOK_URL
- name: BACKEND_WEBHOOK_SECRET
  valueFrom:
    secretKeyRef:
      name: cctp-orchestrator-webhook-secret
      key: BACKEND_WEBHOOK_SECRET
```

**Or use kubectl patch:**
```bash
kubectl patch deployment cctp-orchestrator -n default --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/env/-",
    "value": {
      "name": "BACKEND_WEBHOOK_URL",
      "valueFrom": {
        "configMapKeyRef": {
          "name": "cctp-orchestrator-webhook",
          "key": "BACKEND_WEBHOOK_URL"
        }
      }
    }
  },
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/env/-",
    "value": {
      "name": "BACKEND_WEBHOOK_SECRET",
      "valueFrom": {
        "secretKeyRef": {
          "name": "cctp-orchestrator-webhook-secret",
          "key": "BACKEND_WEBHOOK_SECRET"
        }
      }
    }
  }
]'
```

**Restart orchestrator:**
```bash
kubectl rollout restart deployment/cctp-orchestrator -n default
kubectl rollout status deployment/cctp-orchestrator -n default
```

**Verification:**
```bash
kubectl logs deployment/cctp-orchestrator -n default | grep -i webhook
# Should show: "Backend webhook URL configured" or similar
```

---

### STEP 5: Run Database Migrations

**Time: 2 minutes**

**555x402 Database (vap):**
```bash
# Get postgres credentials from K8s secret
POSTGRES_URL=$(kubectl get secret postgres -n default -o jsonpath='{.data.dsn}' | base64 -d)

# Run migration
psql "$POSTGRES_URL" << 'EOF'
CREATE TABLE IF NOT EXISTS payment_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'queued',
  reason TEXT NOT NULL,
  payments JSONB NOT NULL,
  tx_hashes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_jobs_status ON payment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_created ON payment_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_reason ON payment_jobs(reason);

-- Verify
SELECT tablename FROM pg_tables WHERE tablename = 'payment_jobs';
EOF
```

**Backend Database:**
```bash
# Render automatically runs migrations on deploy, but you can verify:
# The migration file is already in the repo: backend/sql/migrations/008_usdc_payments.sql

# To manually run (if needed):
# Get DATABASE_URL from Render dashboard
DATABASE_URL="<from_render_dashboard>"

psql "$DATABASE_URL" -f backend/sql/migrations/008_usdc_payments.sql
```

---

### STEP 6: Verify All Services

**Time: 5 minutes**

**A. Backend Health:**
```bash
curl https://five55-backend-wn5h.onrender.com/healthz
# Expected: 200 OK

# Check if hyperlink client initialized (check logs in Render dashboard)
# Look for: "hyperlink client initialized" or similar
```

**B. 555x402 Services Health:**
```bash
# API Gateway
curl https://api.rendernet.work/pub/v1/links/test \
  -H "X-API-Key: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed"
# Expected: 404 (not found) - auth works!

# Orchestrator  
kubectl port-forward svc/cctp-orchestrator 3006:3006 -n default &
curl http://localhost:3006/health
# Expected: {"status":"healthy",...}
```

**C. Bot:**
```bash
# Check bot logs (wherever it's deployed)
# Look for: "HYPERLINK_API_BASE configured" or "hyperlink module loaded"
```

**D. SSE Connection:**
```bash
# Test SSE stream
curl -N https://five55-backend-wn5h.onrender.com/events
# Should establish connection and wait for events
```

---

### STEP 7: Create Test Hyperlink

**Time: 2 minutes**

```bash
# Create a test link for testing
curl -X POST https://api.rendernet.work/pub/v1/links \
  -H "X-API-Key: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "test_integration_user",
    "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
    "chainType": "solana",
    "model": "engagement",
    "splits": {"creator": 10000},
    "metadata": {"test": "true", "deployment": "integration"}
  }'

# Save the returned code
# Test lookup by creator
curl https://api.rendernet.work/pub/v1/links/by-creator/test_integration_user \
  -H "X-API-Key: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed"

# Expected: Returns wallet info with chainType
```

---

### STEP 8: Test End-to-End Flow

**Time: 5 minutes**

**A. Test Bot → Backend (Manual Event)**
```bash
# Send test Twitter event to backend
curl -X POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "X-Bot-Key: YOUR_EXISTING_BOT_KEY" \
  -H "X-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "type": "post_published",
    "tweet_id": "test_integration_123",
    "handle": "test_integration_user",
    "url": "https://x.com/test_integration_user/status/123",
    "text": "Testing #555games integration! rendernet.work/p/test",
    "hashtags": ["555games"],
    "metrics": {"likes": 10, "replies": 2, "reposts": 3, "quotes": 1, "bookmarks": 5, "views": 100}
  }'

# Expected: 202 Accepted
# Check backend logs for wallet resolution
```

**B. Create USDC Quest (Admin)**
```bash
# Get admin token from Render env vars
ADMIN_TOKEN="<from_render_dashboard>"

curl -X POST https://five55-backend-wn5h.onrender.com/quests \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Integration Test USDC Quest",
    "type": "social_post",
    "frequency": "once",
    "rules": {"hashtags": ["555test"]},
    "reward_type": "usdc",
    "reward_usdc": 1.00,
    "active_from": "2025-01-01T00:00:00Z",
    "active_to": "2026-12-31T23:59:59Z"
  }'
```

**C. Test Payment Trigger**
```bash
# Send event that matches quest
curl -X POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "X-Bot-Key: YOUR_BOT_KEY" \
  -H "X-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "type": "post_published",
    "tweet_id": "quest_test_'$(date +%s)'",
    "handle": "test_integration_user",
    "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
    "chain_type": "solana",
    "text": "Quest test #555test",
    "hashtags": ["555test"],
    "metrics": {"likes": 1}
  }'

# Expected: 202 Accepted
# Check backend logs for: "Quest USDC payment triggered"
# Check orchestrator logs for: "Processing payment batch"
```

**D. Verify Payment in Database**
```bash
# Connect to backend database
# From Render dashboard, get DATABASE_URL and run:
psql "$DATABASE_URL" -c "SELECT id, wallet, amount_usdc, status, hyperlink_job_id, created_at FROM usdc_payments ORDER BY created_at DESC LIMIT 5;"
```

---

### STEP 9: Monitor SSE Events

**Time: Ongoing**

**Open SSE stream in one terminal:**
```bash
curl -N https://five55-backend-wn5h.onrender.com/events
```

**Trigger events in another terminal:**
- Post matching tweet (via bot or manual event)
- Watch for events:
  - `social.events` - Tweet processed
  - `points.updates.social` - Points awarded
  - `quests.usdc_reward` - USDC payment triggered
  - `payment.confirmed` - Payment confirmed on-chain

---

## 🎯 COMPLETE CHECKLIST

### Pre-Deployment ✅
- [x] All code pushed to repositories
- [x] Standardized keys generated
- [x] render.yaml updated with correct URLs
- [x] Bot code has default URL fallback
- [x] All services build successfully

### Secrets Configuration
- [ ] Backend secrets added to Render (STEP 1)
- [ ] Bot secrets added via GitHub CLI (STEP 2)
- [ ] API Gateway keys updated in K8s (STEP 3)
- [ ] Orchestrator webhook config added (STEP 4)

### Database Setup
- [ ] 555x402 migration run (STEP 5)
- [ ] Backend migration run (STEP 5)

### Testing
- [ ] Backend health check passes (STEP 6A)
- [ ] API Gateway auth works (STEP 6B)
- [ ] Test hyperlink created (STEP 7)
- [ ] End-to-end flow tested (STEP 8)
- [ ] SSE events verified (STEP 9)

---

## 🔧 GITHUB CLI COMMANDS - ALL SECRETS

**For Bot Repository:**

```bash
# Set all bot secrets in one go
gh secret set HYPERLINK_API_BASE \
  --body "https://api.rendernet.work" \
  --repo Render-Network-OS/555-bot

gh secret set HYPERLINK_API_KEY \
  --body "62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" \
  --repo Render-Network-OS/555-bot

# Verify
gh secret list --repo Render-Network-OS/555-bot

# Expected output:
# HYPERLINK_API_BASE      Updated <timestamp>
# HYPERLINK_API_KEY       Updated <timestamp>
# ... (other existing secrets)
```

**For 555x402 Repositories (if they use GitHub Actions):**

Most 555x402 services don't need secrets in GitHub - they get config from K8s at runtime.

---

## 📋 QUICK COPY-PASTE COMMANDS

### All GitHub Secrets (Bot):
```bash
# Run these sequentially:
gh secret set HYPERLINK_API_BASE --body "https://api.rendernet.work" --repo Render-Network-OS/555-bot
gh secret set HYPERLINK_API_KEY --body "62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" --repo Render-Network-OS/555-bot
gh secret list --repo Render-Network-OS/555-bot | grep HYPERLINK
```

### All Kubernetes Secrets:
```bash
# API Gateway keys
EXISTING=$(kubectl get secret api-keys -n default -o jsonpath='{.data.public_keys_csv}' | base64 -d)
kubectl create secret generic api-keys --from-literal=public_keys_csv="${EXISTING},62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" -n default --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/api-gateway -n default

# Orchestrator webhook
kubectl create configmap cctp-orchestrator-webhook --from-literal=BACKEND_WEBHOOK_URL="https://five55-backend-wn5h.onrender.com/webhooks/payment-status" -n default --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic cctp-orchestrator-webhook-secret --from-literal=BACKEND_WEBHOOK_SECRET="ef84ab14b645deb1942473b5b9ae43c53946cfd77659cd5213ee9a3b4906c6a6" -n default --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/cctp-orchestrator -n default
```

---

## ⚡ FASTEST PATH TO PRODUCTION

**Total time: ~15 minutes**

```bash
# 1. Set Render secrets (2 min - use dashboard)
# - HYPERLINK_API_KEY
# - HYPERLINK_WEBHOOK_SECRET

# 2. Set GitHub secrets (1 min - use gh CLI)
gh secret set HYPERLINK_API_BASE --body "https://api.rendernet.work" --repo Render-Network-OS/555-bot
gh secret set HYPERLINK_API_KEY --body "62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" --repo Render-Network-OS/555-bot

# 3. Update K8s secrets (5 min)
# Run all kubectl commands above

# 4. Run migrations (3 min)
# Run psql commands above

# 5. Test (4 min)
# Create test link, send test event, verify response
```

---

## 🎉 SUCCESS CRITERIA

After completing all steps, you should see:

✅ Backend logs: "hyperlink client initialized"
✅ Bot logs: "Resolved wallet from hyperlink"
✅ API Gateway: Returns 200/404 (not 401) with correct key
✅ Orchestrator logs: "Payment batch processed"
✅ SSE events: Broadcasting payment notifications
✅ Database: `usdc_payments` table has test records
✅ No 401 errors in any service logs

---

## 🆘 TROUBLESHOOTING

### If Backend Can't Connect to 555x402:
```bash
# Test from backend container
curl https://api.rendernet.work/pub/v1/links/test -H "X-API-Key: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed"
# If 401: Key not in API Gateway's whitelist
# If timeout: DNS or network issue
# If 404: Working correctly!
```

### If Bot Can't Connect:
```bash
# Verify GitHub secret was set
gh secret list --repo Render-Network-OS/555-bot | grep HYPERLINK

# Check bot deployment logs for:
# - HYPERLINK_API_BASE value
# - HYPERLINK_API_KEY present (should be masked)
```

### If Payments Not Triggering:
```bash
# Check backend logs for errors
# Check if quest was created successfully
curl https://five55-backend-wn5h.onrender.com/quests | jq
```

---

## 📞 DEPLOYMENT SUPPORT

**Logs to monitor:**
- Backend: Render dashboard → Logs
- Bot: GitHub Actions → Workflow runs → Logs
- 555x402: `kubectl logs -f deployment/NAME -n default`

**Health endpoints:**
- Backend: https://five55-backend-wn5h.onrender.com/healthz
- Orchestrator: http://localhost:3006/health (via port-forward)
- API Gateway: Test with curl

---

## ✅ DEPLOYMENT COMPLETE

Once all steps are done:
1. All secrets configured ✅
2. All services deployed ✅
3. Databases migrated ✅
4. Integration tested ✅

**You're ready to earn USDC rewards! 🎊**

