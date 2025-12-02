# Final Deployment Checklist - Corrected & Verified

## ✅ ALL COMMITS COMPLETE

Final commits with corrected environment variables:
- Backend: `dbe177b` + correction commit
- Bot: `2d30fb0c` + correction commit
- 555x402 services: All updated in repos/ folder

---

## 🔐 EXACT SECRETS TO CONFIGURE

### Only 2 Secrets Need Generation:

```bash
# Generate these once:
HYPERLINK_API_KEY=$(openssl rand -hex 32)
HYPERLINK_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Save them securely!
echo "HYPERLINK_API_KEY=$HYPERLINK_API_KEY"
echo "HYPERLINK_WEBHOOK_SECRET=$HYPERLINK_WEBHOOK_SECRET"
```

---

## 📋 WHERE TO ADD SECRETS

### 1. Render Dashboard (Backend) - 2 secrets

Login to Render → five55-backend → Environment

**Add these:**
```
HYPERLINK_API_KEY = <paste generated key>
HYPERLINK_WEBHOOK_SECRET = <paste generated secret>
```

Make sure to mark both as "sensitive" (they're already `sync: false` in render.yaml)

### 2. Bot Environment - 1 secret

**If bot is deployed on Render:**
- Add `HYPERLINK_API_KEY` = <paste generated key or use backend's key>

**If bot is self-hosted:**
- Edit `555-bot/.env`:
```env
HYPERLINK_API_BASE=https://api.rendernet.work  # Has default fallback
HYPERLINK_API_KEY=<paste_generated_key>
```

### 3. 555x402 API Gateway (K8s) - Update existing secret

```bash
# Get current secret
kubectl get secret api-keys -n default -o jsonpath='{.data.public_keys_csv}' | base64 -d

# Add your new backend key to the comma-separated list
# Example: existing_key1,existing_key2,<YOUR_NEW_BACKEND_KEY>

kubectl create secret generic api-keys \
  --from-literal=public_keys_csv="existing_keys,<YOUR_BACKEND_KEY>" \
  -n default \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart gateway to pick up new secret
kubectl rollout restart deployment/api-gateway -n default
```

### 4. 555x402 Orchestrator (K8s) - Add ConfigMap/Secret

**Create orchestrator configmap:**
```bash
kubectl create configmap cctp-orchestrator-config \
  --from-literal=BACKEND_WEBHOOK_URL="https://five55-backend-wn5h.onrender.com/webhooks/payment-status" \
  -n default

# Add webhook secret
kubectl create secret generic cctp-orchestrator-secrets \
  --from-literal=BACKEND_WEBHOOK_SECRET="<YOUR_WEBHOOK_SECRET>" \
  -n default
```

**Update deployment to use it:**
```yaml
# Edit: kubectl edit deployment cctp-orchestrator -n default
env:
  - name: BACKEND_WEBHOOK_URL
    valueFrom:
      configMapKeyRef:
        name: cctp-orchestrator-config
        key: BACKEND_WEBHOOK_URL
  - name: BACKEND_WEBHOOK_SECRET
    valueFrom:
      secretKeyRef:
        name: cctp-orchestrator-secrets
        key: BACKEND_WEBHOOK_SECRET
```

---

## ✅ VERIFIED CORRECT VALUES

All these are CORRECT and extracted from actual codebase:

**URLs:**
- Backend: `https://five55-backend-wn5h.onrender.com` ✅
- 555x402 API: `https://api.rendernet.work` ✅
- Orchestrator port: `3006` ✅ (NOT 3000)
- Link service port: `8083` ✅
- API gateway port: `8090` ✅

**Database:**
- Backend: Uses `POSTGRES_DSN` or `DATABASE_URL` (Render auto-provides)
- 555x402: Database name is `vap` (from hyperlink-link-service)

**Domains:**
- Main frontend: `555.rendernet.work`
- Hyperlink landing: `555hyper.link`
- API: `api.rendernet.work`
- AGG: `agg.rendernet.work`
- VAP: `vap.rendernet.work`

---

## 🚀 DEPLOYMENT COMMANDS

### Push All Commits

```bash
cd /Users/mac/Desktop/Work/555

# 555x402 services (in repos/ folder)
cd 555x402/repos/555x402-hyperlink-link-service
git push origin HEAD

cd ../555x402-api-gateway
git push origin HEAD

cd ../555x402-cctp-orchestrator
git push origin main

# Backend
cd /Users/mac/Desktop/Work/555/backend
git push origin main

# Bot
cd ../555-bot
git push origin main

# Frontend
cd ../555-mono
git push origin main
```

### Run Database Migrations

```bash
# 555x402 database (vap)
psql -h <postgres_host> -U <user> -d vap << 'EOF'
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
EOF

# Backend database (five55)
psql -h <postgres_host> -U <user> -d five55 -f backend/sql/migrations/008_usdc_payments.sql
```

---

## 🎯 POST-DEPLOYMENT VERIFICATION

### 1. Test API Gateway is reachable

```bash
curl https://api.rendernet.work/pub/v1/links/test \
  -H "X-API-Key: YOUR_KEY"

# Should return: 404 not found (endpoint works, link doesn't exist)
# Should NOT return: 401 unauthorized (would mean key is wrong)
```

### 2. Test Backend can reach 555x402

```bash
# From backend container/server:
curl http://api-gateway:8090/pub/v1/links/test \
  -H "X-API-Key: YOUR_BACKEND_KEY"

# Or test external URL:
curl https://api.rendernet.work/pub/v1/links/test \
  -H "X-API-Key: YOUR_BACKEND_KEY"
```

### 3. Test Webhook Endpoint

```bash
curl -X POST https://five55-backend-wn5h.onrender.com/webhooks/payment-status \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return: 401 unauthorized (endpoint exists, signature required)
# Should NOT return: 404 not found
```

### 4. Create Test Hyperlink

```bash
curl -X POST https://api.rendernet.work/pub/v1/links \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "test_user",
    "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
    "chainType": "solana",
    "model": "engagement",
    "splits": {"creator": 10000},
    "metadata": {"test": "true"}
  }'

# Get link by creator
curl https://api.rendernet.work/pub/v1/links/by-creator/test_user \
  -H "X-API-Key: YOUR_KEY"
```

---

## 📊 SERVICE ENDPOINTS SUMMARY

| Service | Internal | External | Port |
|---------|----------|----------|------|
| Backend | N/A | `https://five55-backend-wn5h.onrender.com` | 9000 |
| API Gateway | `api-gateway:8090` | `https://api.rendernet.work` | 8090 |
| Hyperlink Service | `hyperlink-link-service:8083` | Internal only | 8083 |
| CCTP Orchestrator | `cctp-orchestrator:3006` | Internal only | 3006 |
| Hyperlink Landing | `hyperlink-landing:8084` | `https://555hyper.link` | 8084 |

---

## 🎉 READY FOR PRODUCTION

**Everything is now correct and verified:**
- ✅ URLs match actual deployed services
- ✅ Ports match actual service configurations
- ✅ Database names match actual schemas
- ✅ All code builds successfully
- ✅ render.yaml updated correctly
- ✅ Only 2 secrets need manual configuration
- ✅ Fallbacks in place for missing config

**Minimal Configuration Required:**
1. Generate 2 secrets (takes 30 seconds)
2. Add secrets to Render dashboard (takes 2 minutes)
3. Add bot HYPERLINK_API_KEY (takes 1 minute)
4. Update K8s api-keys secret (takes 2 minutes)
5. Add orchestrator webhook config (takes 2 minutes)

**Total setup time: ~10 minutes** 🚀

