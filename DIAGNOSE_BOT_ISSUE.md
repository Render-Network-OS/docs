# Diagnose Why Bot is Not Sending to Backend

## The Situation

- ✅ Bot scanning Twitter and finding tweets
- ✅ Backend endpoint exists (`/integrations/twitter/events`)
- ✅ Config files have correct env vars
- ✅ Deployment workflow includes the env var
- ❌ **Backend logs show NO data from bot**

---

## Run These Commands on Bot Server

**SSH to the bot server and run these 5 commands:**

### Command 1: Check if env var exists
```bash
cat /opt/eliza/.env.production | grep "TWITTER_BOT_MAIN_API_BASE"
```

**Expected:** `TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com`  
**If empty:** Variable is missing! (That's the problem)

---

### Command 2: Check logs for "not configured" error
```bash
pm2 logs eliza --lines 500 | grep -i "not configured" | tail -10
```

**If you see:**
```
TWITTER_BOT_MAIN_API_BASE is not configured
```
→ **This confirms env var is missing!**

---

### Command 3: Check logs for sending attempts
```bash
pm2 logs eliza --lines 500 | grep "emitted post_published"
```

**If you see entries:** Bot IS sending (backend might be rejecting)  
**If empty:** Bot is NOT calling the send function

---

### Command 4: Check logs for sending failures
```bash
pm2 logs eliza --lines 500 | grep -E "(Failed to POST|Webhook.*error|status: 401|status: 500)"
```

**If you see errors:** Bot is trying but failing (auth/network issue)  
**If empty:** Bot isn't even attempting to send

---

### Command 5: Check when bot was last deployed
```bash
ls -la /opt/eliza/.env.production | head -5
pm2 describe eliza | grep "uptime\|created"
```

**Check:** Is the bot using the latest deployment with env vars?

---

## The Likely Problem

### GitHub Secret Not Set

Even though `.env.github-secrets` has the variable, **GitHub Actions secrets** might not be configured!

**Check:**
1. Go to: https://github.com/Render-Network-OS/555-bot/settings/secrets/actions
2. Look for: `TWITTER_BOT_MAIN_API_BASE`
3. **If it's missing:** Add it with value `https://five55-backend-wn5h.onrender.com`

---

## The Fix (If Env Var is Missing)

### Option A: Manual Fix (Immediate)

```bash
# On bot server:
echo "TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com" >> /opt/eliza/.env.production
echo "TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820" >> /opt/eliza/.env.production

pm2 restart eliza

# Verify it loaded
pm2 logs eliza --lines 20 | grep "Twitter"

# Wait 60 seconds for next scan, then check
pm2 logs eliza | grep "emitted post_published"
```

### Option B: Fix GitHub Secret (Permanent)

1. Add `TWITTER_BOT_MAIN_API_BASE` to GitHub Actions secrets
2. Add `TWITTER_BOT_HMAC_SECRET` to GitHub Actions secrets  
3. Redeploy bot via GitHub Actions

---

## After Fix: Verify It Works

### 1. Watch bot logs in real-time:
```bash
pm2 logs eliza --lines 0
```

### 2. Post a test tweet:
```
Testing @555render integration! #555rndr
```

### 3. Within 60-90 seconds, you should see:
```
TwitterIngestion scan completed
TwitterIngestion evaluated tweet (qualifies: true)
TwitterIngestion emitted post_published event
  tweetId: xxx
  handle: your_handle
```

### 4. Check backend logs (Render):
```
POST /integrations/twitter/events 202
Processing Twitter event: post_published
Twitter handle: your_handle
Quest completed: social_post
Points awarded: 50
```

### 5. Check leaderboard updated:
```bash
curl -sk https://five55-backend-wn5h.onrender.com/leaderboard/global | \
  jq '.[] | select(.wallet=="YOUR_WALLET")'
```

---

## Quick Diagnostic Summary

**Run on bot server:**
```bash
echo "=== Bot Integration Diagnostic ===" && \
echo "" && \
echo "1. Env var check:" && \
grep TWITTER_BOT_MAIN_API_BASE /opt/eliza/.env.production && \
echo "" && \
echo "2. Recent sending:" && \
pm2 logs eliza --lines 200 | grep "emitted post_published" | tail -3 && \
echo "" && \
echo "3. Recent errors:" && \
pm2 logs eliza --lines 200 | grep -i "not configured\|failed to post" | tail -3 && \
echo "" && \
echo "=== End Diagnostic ==="
```

**This one command will tell you everything!**

---

## Expected Output After Fix

```
=== Bot Integration Diagnostic ===

1. Env var check:
TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com

2. Recent sending:
TwitterIngestion emitted post_published event tweetId="1991543620789547452" handle="moestradamu5"
TwitterIngestion emitted post_published event tweetId="1991542859523404047" handle="moestradamu5"  
TwitterIngestion emitted post_published event tweetId="1991541771252494819" handle="moestradamu5"

3. Recent errors:
(no errors)

=== End Diagnostic ===
```

**If you see this → Integration is working! ✅**

---

**Next:** Run the diagnostic commands and report back what you see!

