# Hyperlink Configuration - ACTUAL Fix Required

## Bottom Line (Tested with curl)

```bash
✅ CORRECT:  http://api.555hyper.link/pub/v1
❌ BROKEN:   https://api.rendernet.work    (DNS doesn't exist!)
```

---

## What's Actually Broken

### GitHub Secrets (Bot)
```bash
# Currently set to (WRONG):
HYPERLINK_API_BASE=https://api.rendernet.work

# Should be:
HYPERLINK_API_BASE=http://api.555hyper.link/pub/v1
```

**Why bot still works:** Code has fallback to `api.555hyper.link` which is correct!

---

## The Fix

### Step 1: Update Bot GitHub Secret

```bash
# Go to: https://github.com/your-org/555-bot/settings/secrets/actions
# Edit: HYPERLINK_API_BASE
# Change from: https://api.rendernet.work
# Change to:   http://api.555hyper.link/pub/v1
```

### Step 2: Check Backend Render Config

```bash
# Go to: Render Dashboard → 555 Backend → Environment
# Find: HYPERLINK_API_URL or HYPERLINK_API_BASE
# Ensure it's: http://api.555hyper.link/pub/v1
# NOT: api.rendernet.work
```

---

## Bot Code is Actually CORRECT

The bot `.env.example` and code fallback both use `api.555hyper.link` which is the **real, working API**.

**NO CODE CHANGES NEEDED** - just fix the GitHub Secret!

---

## DNS Test Proof

```bash
$ dig api.555hyper.link +short
157.230.67.19  ✅

$ dig api.rendernet.work +short
(empty - doesn't exist)  ❌

$ curl http://api.555hyper.link/pub/v1/links/test
unauthorized  ✅ (401 = API alive)

$ curl https://api.rendernet.work/pub/v1/links/test
Could not resolve host  ❌
```

---

## Why the Confusion

555x402 documentation (README, OpenAPI spec, etc.) all reference `api.rendernet.work` but:
- That DNS was never set up
- The actual service runs on `api.555hyper.link`
- Documentation is aspirational/outdated

---

## Correct Configuration

```bash
# Use everywhere:
HYPERLINK_API_BASE=http://api.555hyper.link/pub/v1
HYPERLINK_API_KEY=62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed
```

---

## Testing After Fix

```bash
# Should work:
curl -H "X-API-Key: YOUR_KEY" \
  http://api.555hyper.link/pub/v1/links/test

# Should return 401 or 404 (not connection error)
```

---

**TL;DR:** Update GitHub Secret, verify Render config, you're done!

