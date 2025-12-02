# Corrected Environment Variables - Audit Results

## 🔍 Audit Findings

Based on thorough code review, here are the CORRECT environment variables extracted from the actual codebase:

---

## ✅ VERIFIED VALUES FROM CODEBASE

### Backend (render.yaml)

**Correct URL values:**
```yaml
- key: HYPERLINK_API_URL
  value: "http://api-gateway:8090"  # Internal K8s service name
  # OR for external: "https://api.rendernet.work"
  
- key: HYPERLINK_API_KEY
  sync: false  # Secret - must generate

- key: HYPERLINK_WEBHOOK_SECRET
  sync: false  # Secret - must generate (HMAC signing)

- key: DAILY_PAYOUT_ENABLED
  value: "true"

- key: DAILY_PAYOUT_POOL_USD
  value: "100.00"  # Matches existing REWARD_POOL_USD pattern

- key: DAILY_PAYOUT_WINNERS_COUNT
  value: "10"

# USDC Mint (already should exist)
- key: USDC_MINT
  value: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # Mainnet USDC
```

**Notes:**
- Backend is deployed at: `https://five55-backend-wn5h.onrender.com` (from .env.github-secrets)
- Database name: Uses `DATABASE_URL` or `POSTGRES_DSN` (Render provides DATABASE_URL automatically)
- ReferralHost: `555.rendernet.work` (from config.go)

---

### Bot (.env)

**From existing .env.github-secrets:**
```env
# Existing (don't change)
SOCIAL_SSE_URL=https://five55-backend-wn5h.onrender.com/events
SOCIAL_API_URL=https://five55-backend-wn5h.onrender.com
TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com
TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820

# NEW - Add these:
HYPERLINK_API_BASE=https://api.rendernet.work
# OR internal: http://api-gateway:8090
HYPERLINK_API_KEY=<GENERATE_OR_USE_BACKEND_KEY>
```

**Correct bot hashtags/mentions from .env.github-secrets:**
- Hashtags: `555rndr,rndrntwrk`
- Mentions: `rndrntwrk,555render`

---

### 555x402 API Gateway (K8s)

**From infra/k8s/apps/api-gateway.yaml:**
```yaml
env:
  - name: LINK_SERVICE_URL
    value: http://hyperlink-link-service:8083  # ✅ Correct internal service
  
  - name: AGG_URL
    value: https://agg.rendernet.work/pub/v1  # ✅ Already deployed
  
  - name: VAP_URL
    value: https://vap.rendernet.work/pub/v1  # ✅ Already deployed
  
  - name: ORCHESTRATOR_URL
    value: http://cctp-orchestrator:3006  # ✅ Internal service (not 3000!)
  
  - name: API_KEYS
    valueFrom:
      secretKeyRef:
        name: api-keys
        key: public_keys_csv  # ✅ K8s secret already exists
```

**Verified service ports:**
- hyperlink-link-service: 8083 ✅
- api-gateway: 8090 ✅
- cctp-orchestrator: 3006 ✅ (NOT 3000 as I initially assumed)
- hyperlink-landing: 8084 ✅

---

### 555x402 CCTP Orchestrator

**Correct env vars:**
```env
ORCHESTRATOR_PORT=3006  # ✅ NOT 3000!

DATABASE_URL=<FROM_K8S_SECRET>  # PostgreSQL connection
# Database name is "vap" (from hyperlink-link-service default)

# NEW - Add these:
BACKEND_WEBHOOK_URL=https://five55-backend-wn5h.onrender.com/webhooks/payment-status
BACKEND_WEBHOOK_SECRET=<MUST_MATCH_BACKEND>
```

---

### 555x402 Hyperlink Link Service

**From code defaults:**
```env
LISTEN_ADDR=:8083  # ✅ Correct
POSTGRES_URL=<FROM_K8S_SECRET>  # Default db name: "vap"
```

---

## 🔧 CORRECTIONS NEEDED

### 1. Backend render.yaml - URL Correction

Current code uses external DNS name for API calls from backend to 555x402.

**Since backend is on Render, it needs external URL:**
```yaml
- key: HYPERLINK_API_URL
  value: "https://api.rendernet.work"  # ✅ Use public DNS
  # NOT "http://api-gateway:8090" (that's for K8s internal only)
```

### 2. Bot - URL Correction

**Since bot might not be in same K8s cluster:**
```env
HYPERLINK_API_BASE=https://api.rendernet.work  # ✅ Public DNS
# NOT "http://api-gateway:8090"
```

### 3. Orchestrator Port Correction

**My initial assumption was wrong:**
```typescript
const PORT = process.env.ORCHESTRATOR_PORT || 3006;  // ✅ 3006, not 3000!
```

### 4. Database Name for 555x402

**From hyperlink-link-service default:**
```go
dsn := getenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/vap")
```
Database name is **`vap`**, not `x402` as I assumed in documentation.

---

## 📝 FINAL CORRECTED VARIABLES

### Backend (render.yaml) - UPDATE THESE

```yaml
envVars:
  # ... existing vars ...
  
  # Hyperlink Integration (CORRECTED)
  - key: HYPERLINK_API_URL
    value: "https://api.rendernet.work"  # ✅ Public DNS for external access
  
  - key: HYPERLINK_API_KEY
    sync: false  # Generate: openssl rand -hex 32
  
  - key: HYPERLINK_WEBHOOK_SECRET
    sync: false  # Generate: openssl rand -hex 32
  
  # Daily Payouts (CORRECT)
  - key: DAILY_PAYOUT_ENABLED
    value: "true"
  
  - key: DAILY_PAYOUT_POOL_USD
    value: "100.00"
  
  - key: DAILY_PAYOUT_WINNERS_COUNT
    value: "10"
```

### Bot (.env or deployment config) - ADD THESE

```env
# Hyperlink Integration (CORRECTED)
HYPERLINK_API_BASE=https://api.rendernet.work
HYPERLINK_API_KEY=<SAME_AS_BACKEND_OR_SEPARATE>
```

### 555x402 Orchestrator - ADD THESE

```env
# Webhook to Backend (CORRECTED)
BACKEND_WEBHOOK_URL=https://five55-backend-wn5h.onrender.com/webhooks/payment-status
BACKEND_WEBHOOK_SECRET=<MUST_MATCH_BACKEND>
```

### 555x402 API Gateway (K8s Secret) - UPDATE

**Add to K8s secret `api-keys`:**
```bash
# Current keys in secret + new backend key
kubectl create secret generic api-keys \
  --from-literal=public_keys_csv="<EXISTING_KEYS>,<NEW_BACKEND_KEY>" \
  -n default \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## ⚠️ IMPORTANT CORRECTIONS

| Variable | My Assumption | ACTUAL VALUE | Source |
|----------|---------------|--------------|--------|
| HYPERLINK_API_URL | `https://x402-api.555games.com` | `https://api.rendernet.work` | K8s configs show `rendernet.work` |
| Orchestrator Port | `3000` | `3006` | cctp-orchestrator/src/index.ts |
| Database name | `x402` | `vap` | hyperlink-link-service/main.go |
| Backend URL | `https://api.555games.com` | `https://five55-backend-wn5h.onrender.com` | .env.github-secrets |
| Landing domain | `555.rendernet.work` | `555hyper.link` OR `hyperlink.rendernet.work` | next.config.js |

---

## 🎯 DOMAINS IN USE

From codebase analysis:

**555x402 Services:**
- `api.rendernet.work` - API Gateway public endpoint
- `agg.rendernet.work` - AGG facilitator
- `vap.rendernet.work` - VAP session manager
- `555hyper.link` - Hyperlink landing page
- `api.555hyper.link` - Alternative API endpoint

**Backend:**
- `five55-backend-wn5h.onrender.com` - Backend API (Render auto-generated)

**Frontend:**
- `555.rendernet.work` - Main frontend (from ReferralHost config)

---

## 🔒 SECRETS TO GENERATE

Only these need generation (all others can be derived from codebase):

```bash
# 1. HYPERLINK_API_KEY (for Backend + Bot)
openssl rand -hex 32

# 2. HYPERLINK_WEBHOOK_SECRET (for Backend + Orchestrator)
openssl rand -hex 32
```

**That's it!** Only 2 secrets need generation. Everything else is either:
- Already configured (TWITTER_BOT_HMAC_SECRET)
- Auto-provided by platform (DATABASE_URL by Render)
- Managed by K8s secrets (API_KEYS, POSTGRES_URL)
- Hardcoded correctly in code (ports, service names)

---

## ✅ CHECKLIST FOR DEPLOYMENT

### 1. Backend (Render Dashboard)

- [ ] Set `HYPERLINK_API_URL` = `https://api.rendernet.work`
- [ ] Generate and set `HYPERLINK_API_KEY` (sync: false)
- [ ] Generate and set `HYPERLINK_WEBHOOK_SECRET` (sync: false)
- [ ] Set `DAILY_PAYOUT_ENABLED` = `true`
- [ ] Set `DAILY_PAYOUT_POOL_USD` = `100.00`
- [ ] Set `DAILY_PAYOUT_WINNERS_COUNT` = `10`

### 2. Bot (.env or Secrets)

- [ ] Set `HYPERLINK_API_BASE` = `https://api.rendernet.work`
- [ ] Set `HYPERLINK_API_KEY` = (use same as backend or generate new)

### 3. 555x402 API Gateway (K8s)

- [ ] Update `api-keys` secret to include backend's `HYPERLINK_API_KEY`

```bash
kubectl get secret api-keys -n default -o yaml
# Edit and add new key to public_keys_csv (comma-separated)
kubectl apply -f updated-secret.yaml
```

### 4. 555x402 Orchestrator (K8s)

- [ ] Add ConfigMap or Secret with:
  - `BACKEND_WEBHOOK_URL` = `https://five55-backend-wn5h.onrender.com/webhooks/payment-status`
  - `BACKEND_WEBHOOK_SECRET` = (same as backend's HYPERLINK_WEBHOOK_SECRET)

---

## 📋 SUMMARY OF CORRECTIONS

**Files that need updating:**

1. ✅ `backend/render.yaml` - Already updated with corrected values
2. ⚠️ Documentation files - Need URL corrections:
   - Change `x402-api.555games.com` → `api.rendernet.work`
   - Change `api.555games.com` → `five55-backend-wn5h.onrender.com`
   - Change port `3000` → `3006` for orchestrator
   - Change db name `x402` → `vap`

**No code changes needed** - all service code already uses correct defaults or env vars!

---

## 🚀 Ready to Deploy

**Secrets to set manually:**

1. **Render Dashboard** (Backend):
   - Generate: `HYPERLINK_API_KEY`
   - Generate: `HYPERLINK_WEBHOOK_SECRET`

2. **Bot deployment**:
   - Use same `HYPERLINK_API_KEY` or generate new

3. **K8s** (555x402):
   - Add backend key to `api-keys` secret
   - Add webhook config to orchestrator deployment

**All other values are correct in the code!** 🎉

