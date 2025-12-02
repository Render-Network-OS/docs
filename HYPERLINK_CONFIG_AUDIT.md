# Hyperlink Configuration Audit & Alignment

**Date:** 2025-11-20  
**Purpose:** Comprehensive audit of Hyperlink API configuration across 555x402, backend, and bot repositories to ensure consistency and correct integration.

---

## Executive Summary

**Finding:** The bot and backend configurations are **PARTIALLY MISALIGNED** with the canonical 555x402 Hyperlink service configuration.

### Critical Issues:
1. **Domain Mismatch**: Bot uses `http://api.555hyper.link` (undocumented) vs canonical `https://api.rendernet.work`
2. **Inconsistent Env Var Naming**: Backend uses `HYPERLINK_API_URL` instead of `HYPERLINK_API_BASE`
3. **Missing Documentation**: Origin of `api.555hyper.link` domain is unclear

---

## Part 1: 555x402 Canonical Configuration

### Official API Base URL
**Source:** Multiple authoritative 555x402 documents

```
https://api.rendernet.work/pub/v1
```

**Evidence:**
- `555x402-hyperlink/README.md:47` - SDK example code
- `555x402-docs/docs/api/public.md:3` - API documentation
- `555x402/api/openapi/openapi.yaml:6` - OpenAPI spec server URL
- `555x402/scripts/mainnet.env:127-132` - Production environment variables
- `555x402-hyperlink-landing/render.yaml:16` - Deployment config

### Authentication Model
**Header:** `X-API-Key`  
**Env Var:** `HYPERLINK_API_KEY`

**Source:**
- `555x402-hyperlink/README.md:46` - SDK constructor parameter
- `555x402-docs/docs/api/public.md:5` - Auth documentation
- `555x402/api/openapi/openapi.yaml:377-380` - Security scheme definition

### API Gateway Architecture
The 555x402 system uses a centralized API Gateway that:
- Listens on port 8090 internally
- Proxies requests to `hyperlink-link-service:8083`
- Enforces rate limiting and API key authentication
- Exposes public routes under `/pub/v1/` prefix

**Source:** `555x402-api-gateway/main.go`

---

## Part 2: Deployment Configuration

### Kubernetes Deployment
**Location:** `555x402/infra/k8s/apps/`

**API Gateway** (`api-gateway.yaml`):
```yaml
env:
  - name: LINK_SERVICE_URL
    value: http://hyperlink-link-service:8083
  - name: API_KEYS
    valueFrom:
      secretKeyRef:
        name: api-keys
        key: public_keys_csv
```

**Hyperlink Link Service** (`hyperlink.yaml`):
```yaml
env:
  - name: POSTGRES_URL
    valueFrom:
      secretKeyRef:
        name: postgres
        key: dsn
ports:
  - containerPort: 8083
```

### Render Deployment
**Location:** `555x402-hyperlink-landing/render.yaml`

```yaml
envVars:
  - key: LINK_SERVICE_URL
    value: https://api.rendernet.work/pub/v1
```

### Mainnet Configuration
**Location:** `555x402/scripts/mainnet.env`

```bash
export NEXT_PUBLIC_API_URL="https://api.rendernet.work"
export LINK_SERVICE_URL="http://hyperlink-link-service:8083"
export API_KEYS="dev-key,cb84edfce61e3d65cc8e793dbeac4182"
```

**Domain Mapping:**
- **External/Public:** `https://api.rendernet.work` → API Gateway
- **Internal K8s:** `http://hyperlink-link-service:8083` → Link Service

---

## Part 3: Bot Configuration Analysis

### Current Bot Configuration

**File:** `555-bot/.env.example`
```env
HYPERLINK_API_BASE=http://api.555hyper.link
HYPERLINK_API_KEY=62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed
```

**File:** `555-bot/.env.github-secrets`
```env
HYPERLINK_API_BASE=https://api.rendernet.work
HYPERLINK_API_KEY=62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed
```

**Code:** `555-bot/packages/client-twitter/src/integrations/hyperlink.ts`
```typescript
const apiBase = getEnv(runtime, "HYPERLINK_API_BASE") || "http://api.555hyper.link";
const apiKey = getEnv(runtime, "HYPERLINK_API_KEY");
// ...
headers: { "X-API-Key": apiKey }
```

### Bot Analysis
✅ **Correct:**
- Uses `HYPERLINK_API_KEY` env var name (matches 555x402 SDK)
- Uses `X-API-Key` header (matches 555x402 API)
- Has fallback for missing env vars

❌ **Issues:**
1. **Domain Mismatch:** Default fallback `http://api.555hyper.link` is NOT documented in 555x402
2. **Inconsistency:** `.env.example` differs from `.env.github-secrets`
3. **Protocol:** Uses `http://` instead of `https://`

---

## Part 4: Backend Configuration Analysis

### Current Backend Configuration

**File:** `backend/render.yaml`
```yaml
- key: HYPERLINK_API_URL
  sync: false
- key: HYPERLINK_API_KEY
  sync: false
```

**Code:** `backend/internal/api/server.go`
```go
if apiURL := os.Getenv("HYPERLINK_API_URL"); apiURL != "" {
    apiKey := os.Getenv("HYPERLINK_API_KEY")
    s.hyperlinkClient = hyperlink.NewClient(apiURL, apiKey)
}
```

**Code:** `backend/internal/hyperlink/client.go`
```go
func (c *Client) GetWalletByCode(code string) (*WalletInfo, error) {
    url := fmt.Sprintf("%s/pub/v1/links/%s", c.baseURL, code)
    req.Header.Set("X-API-Key", c.apiKey)
    // ...
}
```

### Backend Analysis
✅ **Correct:**
- Uses `HYPERLINK_API_KEY` env var name (matches 555x402 SDK)
- Uses `X-API-Key` header (matches 555x402 API)
- Correctly appends `/pub/v1/links/{code}` path

❌ **Issues:**
1. **Inconsistent Env Var Name:** Uses `HYPERLINK_API_URL` instead of `HYPERLINK_API_BASE`
2. **Naming Mismatch:** Backend and bot use different env var names for the base URL

---

## Part 5: Domain Investigation

### The Mystery of `api.555hyper.link`

**Search Results:**
- ❌ NOT found in `555x402/api/openapi/openapi.yaml`
- ❌ NOT found in `555x402-docs/docs/api/public.md`
- ❌ NOT found in `555x402-hyperlink/README.md`
- ❌ NOT found in `555x402/scripts/mainnet.env`
- ❌ NOT found in `555x402/infra/k8s/` manifests
- ✅ Found in `555x402/SYSTEM_AUDIT_AND_ROADMAP.md:24` as: `http://api.555hyper.link`

**Conclusion:** `api.555hyper.link` appears to be an **alternative/legacy domain** that is NOT the primary/canonical endpoint. The documentation consistently references `api.rendernet.work` as the production API base.

### Canonical Production Domain
```
https://api.rendernet.work
```

**Evidence strength:** 10+ references across SDK, docs, deployment configs

---

## Part 6: Reconciliation & Recommendations

### Decision Matrix

| Component | Current Config | Canonical Config | Action Required |
|-----------|---------------|------------------|-----------------|
| **555x402 SDK** | `https://api.rendernet.work/pub/v1` | ✅ Canonical | None |
| **Bot Base URL** | `http://api.555hyper.link` | ❌ Mismatch | **UPDATE** |
| **Bot Env Var** | `HYPERLINK_API_BASE` | ✅ Matches SDK | Keep |
| **Backend Base URL** | Via `HYPERLINK_API_URL` | ❌ Wrong var name | **UPDATE** |
| **Backend Env Var** | `HYPERLINK_API_URL` | ❌ Should be `_BASE` | **RENAME** |
| **Auth Header** | `X-API-Key` everywhere | ✅ Consistent | None |
| **API Key Env** | `HYPERLINK_API_KEY` everywhere | ✅ Consistent | None |

### Standardized Configuration

#### For All Components (Bot, Backend, Frontend)

**Base URL:**
```
https://api.rendernet.work/pub/v1
```

**Environment Variables:**
```bash
HYPERLINK_API_BASE=https://api.rendernet.work/pub/v1
HYPERLINK_API_KEY=<your-api-key-here>
```

**API Key Location:**
- Stored in 555x402 Kubernetes secret: `api-keys.public_keys_csv`
- Format: CSV of allowed keys
- Example key: `62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed`

---

## Part 7: Required Changes

### Change 1: Bot Configuration

**Files to Update:**
1. `555-bot/.env.example`
2. `555-bot/packages/client-twitter/src/integrations/hyperlink.ts`

**Changes:**
```diff
# .env.example
-HYPERLINK_API_BASE=http://api.555hyper.link
+HYPERLINK_API_BASE=https://api.rendernet.work/pub/v1
```

```diff
// hyperlink.ts
-const apiBase = getEnv(runtime, "HYPERLINK_API_BASE") || "http://api.555hyper.link";
+const apiBase = getEnv(runtime, "HYPERLINK_API_BASE") || "https://api.rendernet.work/pub/v1";
```

**Priority:** HIGH (prevents 404/connection errors)

### Change 2: Backend Environment Variable Naming

**Files to Update:**
1. `backend/render.yaml`
2. `backend/internal/api/server.go`

**Changes:**
```diff
# render.yaml
-      - key: HYPERLINK_API_URL
+      - key: HYPERLINK_API_BASE
```

```diff
// server.go
-if apiURL := os.Getenv("HYPERLINK_API_URL"); apiURL != "" {
-    apiKey := os.Getenv("HYPERLINK_API_KEY")
-    s.hyperlinkClient = hyperlink.NewClient(apiURL, apiKey)
+if apiBase := os.Getenv("HYPERLINK_API_BASE"); apiBase != "" {
+    apiKey := os.Getenv("HYPERLINK_API_KEY")
+    s.hyperlinkClient = hyperlink.NewClient(apiBase, apiKey)
```

**Priority:** MEDIUM (consistency, no functional break)

### Change 3: Documentation

**File to Create:** `HYPERLINK_INTEGRATION.md`

**Content:** Document the canonical configuration, auth model, and integration points for future reference.

---

## Part 8: Secrets Management

### API Key Ownership
**Owner:** 555x402 infrastructure  
**Storage:** Kubernetes secret `api-keys` in namespace `default`  
**Format:** CSV list in key `public_keys_csv`

### How to Supply Key to Bot/Backend

#### For Backend (Render):
1. Go to Render dashboard → 555 Backend service → Environment
2. Set `HYPERLINK_API_BASE=https://api.rendernet.work/pub/v1`
3. Set `HYPERLINK_API_KEY=<key-from-555x402-k8s-secret>`

#### For Bot (GitHub Actions):
1. Repository Settings → Secrets → Actions
2. Update `HYPERLINK_API_BASE` to `https://api.rendernet.work/pub/v1`
3. Verify `HYPERLINK_API_KEY` matches 555x402 issued key

#### Key Rotation:
When rotating the API key:
1. Update in 555x402 K8s secret: `kubectl edit secret api-keys -n default`
2. Update in bot GitHub Actions secrets
3. Update in backend Render environment
4. Restart bot and backend services

---

## Part 9: Testing Checklist

After applying changes, verify:

### Bot Testing
- [ ] Bot starts without `HYPERLINK_API_KEY not configured` warnings
- [ ] Hyperlink codes are resolved correctly (check logs for `resolveWalletFromHyperlink`)
- [ ] Twitter handles are resolved via `by-creator` endpoint
- [ ] No 401/404 errors in logs related to Hyperlink API

### Backend Testing
- [ ] Backend initializes Hyperlink client on startup
- [ ] Wallet resolution works for quest rewards
- [ ] Payment batch submissions succeed
- [ ] Webhook endpoint receives callbacks from 555x402

### Integration Testing
- [ ] End-to-end flow: Tweet with hyperlink → Bot detects → Backend processes → Payment triggered
- [ ] Check `usdc_payments` table for successful payment records
- [ ] Verify payment status updates via webhook

---

## Part 10: Answer to Original Question

### "Is it possible that the hyperlink repo isn't setup with the same thing?"

**Answer:** YES - There is a configuration mismatch.

### Where the Bot Configuration Came From:

1. **The `api.555hyper.link` domain** appears in `555x402/SYSTEM_AUDIT_AND_ROADMAP.md` as an alternative endpoint
2. **This is NOT the canonical production domain** - it's either:
   - A development/staging URL
   - A legacy URL from earlier implementation
   - A shorthand domain that CNAMEs to the main API

3. **The canonical 555x402 configuration** uses:
   ```
   https://api.rendernet.work/pub/v1
   ```

4. **The bot was likely configured** using either:
   - Early development documentation that referenced `api.555hyper.link`
   - A shortcut URL that was convenient during testing
   - Manual configuration without checking the official SDK docs

### Necessary Corrections:

1. ✅ **Bot GitHub Secrets are CORRECT:** Already using `https://api.rendernet.work`
2. ❌ **Bot `.env.example` is WRONG:** Still shows `http://api.555hyper.link`
3. ❌ **Bot Code Fallback is WRONG:** Hard-coded `http://api.555hyper.link`
4. ❌ **Backend Env Var Name is WRONG:** Uses `HYPERLINK_API_URL` instead of `HYPERLINK_API_BASE`

---

## Summary Table

| Configuration Item | 555x402 Canonical | Bot Current | Backend Current | Status |
|-------------------|-------------------|-------------|-----------------|---------|
| **API Base URL** | `https://api.rendernet.work/pub/v1` | Mixed (secrets=✅, code=❌) | Not specified | ❌ Misaligned |
| **Base URL Env Var** | `HYPERLINK_API_BASE` | ✅ Correct | ❌ Uses `_URL` | ⚠️ Inconsistent |
| **API Key Env Var** | `HYPERLINK_API_KEY` | ✅ Correct | ✅ Correct | ✅ Aligned |
| **Auth Header** | `X-API-Key` | ✅ Correct | ✅ Correct | ✅ Aligned |
| **Path Format** | `/pub/v1/links/{code}` | ✅ Correct | ✅ Correct | ✅ Aligned |

---

## Next Steps

1. **Update bot `.env.example` and code fallback** to use `https://api.rendernet.work/pub/v1`
2. **Rename backend env var** from `HYPERLINK_API_URL` to `HYPERLINK_API_BASE`
3. **Commit and deploy** both changes
4. **Verify** bot logs show successful Hyperlink API calls
5. **Document** this canonical configuration in integration docs

---

**Audit Completed By:** AI Assistant  
**Review Status:** Ready for implementation  
**Risk Level:** LOW (changes are backwards-compatible if done carefully)

