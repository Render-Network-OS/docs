# Hyperlink Configuration Fix Checklist

**Status:** Ready for implementation  
**See:** `HYPERLINK_CONFIG_AUDIT.md` and `HYPERLINK_CONFIG_SUMMARY.md` for details

---

## Issues Found

1. ❌ Bot uses `http://api.555hyper.link` (undocumented domain)
2. ❌ Backend uses `HYPERLINK_API_URL` instead of `HYPERLINK_API_BASE`
3. ⚠️ Bot `.env.example` doesn't match GitHub Secrets configuration

---

## Fix Implementation Steps

### Step 1: Update Bot Code Default ⚠️ HIGH PRIORITY

**File:** `555-bot/packages/client-twitter/src/integrations/hyperlink.ts`

**Lines to change:** 55, 97

```typescript
// Find and replace (2 occurrences):
const apiBase = getEnv(runtime, "HYPERLINK_API_BASE") || "http://api.555hyper.link";

// Replace with:
const apiBase = getEnv(runtime, "HYPERLINK_API_BASE") || "https://api.rendernet.work/pub/v1";
```

**Why:** Prevents 404 errors when `HYPERLINK_API_BASE` is not set.

---

### Step 2: Update Bot Example Config

**File:** `555-bot/.env.example`

**Line to change:** 147

```bash
# Find:
HYPERLINK_API_BASE=http://api.555hyper.link

# Replace with:
HYPERLINK_API_BASE=https://api.rendernet.work/pub/v1
```

**Why:** Documentation should match production configuration.

---

### Step 3: Rename Backend Env Var

**File:** `backend/render.yaml`

**Lines to change:** 61

```yaml
# Find:
      - key: HYPERLINK_API_URL
        sync: false

# Replace with:
      - key: HYPERLINK_API_BASE
        sync: false
```

**File:** `backend/internal/api/server.go`

**Lines to change:** 57-59

```go
// Find:
if apiURL := os.Getenv("HYPERLINK_API_URL"); apiURL != "" {
    apiKey := os.Getenv("HYPERLINK_API_KEY")
    s.hyperlinkClient = hyperlink.NewClient(apiURL, apiKey)

// Replace with:
if apiBase := os.Getenv("HYPERLINK_API_BASE"); apiBase != "" {
    apiKey := os.Getenv("HYPERLINK_API_KEY")
    s.hyperlinkClient = hyperlink.NewClient(apiBase, apiKey)
```

**Why:** Standardize env var naming across all components.

---

### Step 4: Update Render Environment Variable

**Location:** Render Dashboard → Backend Service → Environment

**Action:**
1. Delete `HYPERLINK_API_URL` (if it exists)
2. Add/Update `HYPERLINK_API_BASE` = `https://api.rendernet.work/pub/v1`
3. Verify `HYPERLINK_API_KEY` is set correctly

**Why:** Apply the renamed environment variable.

---

## Testing Checklist

### Pre-Deployment Tests (Local)

- [ ] Bot builds successfully after code changes
- [ ] Backend builds successfully after code changes
- [ ] No linter errors introduced

### Post-Deployment Tests (Production)

#### Bot Testing
- [ ] Bot starts without errors
- [ ] Check logs for: ✅ No `HYPERLINK_API_KEY not configured` warnings
- [ ] Check logs for: ✅ No 401 errors from Hyperlink API
- [ ] Test hyperlink code resolution (post tweet with code, watch logs)
- [ ] Test Twitter handle resolution (post tweet mentioning user, watch logs)

#### Backend Testing
- [ ] Backend starts without errors
- [ ] Check logs for: ✅ `Hyperlink client initialized` message
- [ ] Check logs for: ✅ Successful API calls to Hyperlink
- [ ] Test quest payment submission
- [ ] Verify webhook endpoint receives callbacks

#### Integration Testing
- [ ] End-to-end: Tweet with hyperlink → Bot processes → Wallet resolved
- [ ] End-to-end: Quest completion → Payment triggered → USDC sent
- [ ] Check `usdc_payments` table for new records

---

## Rollback Plan

If issues occur after deployment:

### Bot Rollback
```bash
# SSH to bot server
cd /opt/eliza
nano packages/client-twitter/src/integrations/hyperlink.ts

# Revert to:
const apiBase = getEnv(runtime, "HYPERLINK_API_BASE") || "http://api.555hyper.link";

# Restart
pm2 restart eliza
```

### Backend Rollback
**Render Dashboard:**
1. Rename `HYPERLINK_API_BASE` back to `HYPERLINK_API_URL`
2. Revert code changes via Git
3. Redeploy previous commit

---

## Expected Behavior After Fix

### Bot
```
✅ Uses https://api.rendernet.work/pub/v1
✅ Resolves hyperlink codes correctly
✅ No 401/404 errors in logs
```

### Backend
```
✅ Uses HYPERLINK_API_BASE env var
✅ Initializes Hyperlink client on startup
✅ Processes quest payments successfully
```

---

## Deployment Order

**Recommended:**
1. ✅ Deploy bot changes first (code + env already correct in GitHub Secrets)
2. ✅ Deploy backend changes (code + Render env var)
3. ✅ Monitor logs for 24 hours
4. ✅ Verify end-to-end payment flow

**Why this order:** Bot changes are less risky (already using correct URL in production via GitHub Secrets).

---

## Who to Notify

- [ ] Bot operator (SSH access needed to restart bot manually)
- [ ] Backend team (Render env var update)
- [ ] QA/Testing (integration testing needed)

---

## Success Criteria

✅ Bot processes tweets with hyperlinks without errors  
✅ Backend sends USDC payments via Hyperlink API  
✅ No configuration-related errors in logs for 24 hours  
✅ All environment variables aligned with 555x402 canonical config

---

## Files Changed Summary

### Bot Repository (`555-bot`)
- `packages/client-twitter/src/integrations/hyperlink.ts` (2 lines)
- `.env.example` (1 line)

### Backend Repository (`backend`)
- `render.yaml` (1 line)
- `internal/api/server.go` (3 lines)

### Documentation (This Repository)
- ✅ `HYPERLINK_CONFIG_AUDIT.md` (created)
- ✅ `HYPERLINK_CONFIG_SUMMARY.md` (created)
- ✅ `HYPERLINK_FIX_CHECKLIST.md` (this file)

---

## Commit Messages

### Bot Commit
```
fix: Align Hyperlink API base URL with 555x402 canonical config

- Update default fallback to https://api.rendernet.work/pub/v1
- Update .env.example to match production configuration
- Fixes 401 errors when HYPERLINK_API_BASE not explicitly set

See: HYPERLINK_CONFIG_AUDIT.md
```

### Backend Commit
```
refactor: Rename HYPERLINK_API_URL to HYPERLINK_API_BASE

- Standardize env var naming with 555x402 SDK conventions
- Update render.yaml and server.go
- No functional changes, naming consistency only

See: HYPERLINK_CONFIG_AUDIT.md
```

---

**Created:** 2025-11-20  
**Status:** Ready for implementation  
**Risk Level:** LOW (backwards-compatible if deployed carefully)

