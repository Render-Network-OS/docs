# Debug: Why Bot is Not Sending Data to Backend

## The Problem

Backend logs show: **No "post_published" events** (or only old ones)

This means the bot is NOT sending Twitter events to the backend.

---

## Bot Config Looks Correct

From `.env.github-secrets`:
```bash
✅ TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com
✅ TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820
✅ TW_INGEST_ENABLE=true
```

**BUT:** These env vars might not be loaded on the production bot server!

---

## Check on Bot Server (SSH Required)

### 1. Verify Env Vars Are Loaded

```bash
# Check if env vars are in .env.production
cat /opt/eliza/.env.production | grep TWITTER_BOT_MAIN_API_BASE

# Or check PM2 environment
pm2 env 0 | grep TWITTER_BOT_MAIN_API_BASE

# Or check process environment
cat /proc/$(pm2 pid eliza)/environ | tr '\0' '\n' | grep TWITTER_BOT_MAIN_API_BASE
```

**Expected:**
```
TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com
```

**If missing or wrong:**
→ The GitHub Actions deployment didn't inject this variable!

### 2. Check Bot Logs for Sending Attempts

```bash
# Look for successful sends
pm2 logs eliza | grep "emitted post_published"

# Look for failed sends
pm2 logs eliza | grep -E "(Failed to POST|Webhook.*error|TWITTER_BOT_MAIN_API_BASE)"

# Look for config errors
pm2 logs eliza | grep "not configured"
```

**What you might see:**

**✅ If Bot is Sending:**
```
TwitterIngestion emitted post_published event
  tweetId: 1991543620789547452
  handle: moestradamu5
  wallet: xxx
```

**❌ If Bot Can't Send (Missing Config):**
```
TWITTER_BOT_MAIN_API_BASE is not configured
Failed to POST post_published
```

**⚠️ If Bot is Trying But Failing:**
```
Webhook 5xx; retrying
Webhook network error; retrying
Failed to POST post_published status: 401
```

### 3. Check Last Deployment

```bash
# Check when bot was last deployed
pm2 describe eliza | grep "created at\|uptime"

# Check deployment workflow ran
# (Check GitHub Actions for 555-bot repo)
```

---

## Root Cause Analysis

### Scenario A: Env Var Not Deployed

**Problem:** `TWITTER_BOT_MAIN_API_BASE` is in `.env.github-secrets` but not in production

**Check:**
```bash
# On bot server
cat /opt/eliza/.env.production | grep TWITTER_BOT_MAIN_API_BASE
```

**Fix:** The deployment workflow needs to inject this variable

**File:** `.github/workflows/deploy.yaml`

Look for where env vars are set, ensure `TWITTER_BOT_MAIN_API_BASE` is included.

### Scenario B: Bot Not Finding Qualifying Tweets

**Problem:** Bot scans but nothing qualifies (unlikely - you showed logs with qualifying tweets)

**Check:**
```bash
pm2 logs eliza | grep "qualifies: true"
```

**If you see matches:** Tweets DO qualify, so sending should happen

### Scenario C: Wallet Resolution Blocking Send

**From the bot code** (`ingestion.ts` lines 228-259):
- Bot tries to resolve wallet for every qualifying tweet
- If wallet resolution fails, it still sends but with `wallet: null`

**This shouldn't block sending**, but check logs for:
```bash
pm2 logs eliza | grep -E "(resolveWallet|hyperlink|wallet resolution)"
```

### Scenario D: Bot Code Path Not Executing

**Check if TwitterIngestion is even running:**
```bash
pm2 logs eliza | grep "TwitterIngestion"
```

**Should see every 60 seconds:**
```
TwitterIngestion scan starting
TwitterIngestion scan completed
```

**If missing:** `TW_INGEST_ENABLE` might not be true in production

---

## The Most Likely Issue

### GitHub Actions Not Injecting `TWITTER_BOT_MAIN_API_BASE`

Let me check the deployment workflow:

**File:** `555-bot/.github/workflows/deploy.yaml`

**Look for:** `update_env_var` calls or env var injection

**The variable might be missing from the list of secrets to inject!**

---

## Quick Test You Can Do RIGHT NOW

### On Bot Server:

```bash
# 1. Check if variable exists
echo $TWITTER_BOT_MAIN_API_BASE

# 2. Check PM2 env
pm2 env 0 | grep TWITTER_BOT_MAIN_API_BASE

# 3. Check bot logs for the error message
pm2 logs eliza --lines 200 | grep "TWITTER_BOT_MAIN_API_BASE is not configured"
```

**If you see "not configured":**
→ That's the problem! Variable is missing from production.

**If variable is set correctly:**
→ Check for "Failed to POST" or network errors in logs

---

## Fix If Env Var is Missing

### Check Deployment Workflow

**File:** `555-bot/.github/workflows/deploy.yaml`

Ensure `TWITTER_BOT_MAIN_API_BASE` is in the deployment script's env var injection section.

### Manual Fix (Temporary)

SSH to bot server:
```bash
# Add to .env.production
echo "" >> /opt/eliza/.env.production
echo "TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com" >> /opt/eliza/.env.production

# Restart bot
pm2 restart eliza

# Watch logs
pm2 logs eliza --lines 0
```

---

## What to Check and Report Back

**Run these commands on the bot server:**

```bash
# 1. Check env var
cat /opt/eliza/.env.production | grep TWITTER_BOT_MAIN_API_BASE

# 2. Check logs for config error
pm2 logs eliza --lines 500 | grep -i "not configured"

# 3. Check logs for sending attempts
pm2 logs eliza --lines 500 | grep -i "post_published"

# 4. Check logs for webhook errors
pm2 logs eliza --lines 500 | grep -i "webhook"
```

**Tell me what each command returns!**

