# Bot IS Sending But Backend Not Receiving

## Discovery ✅

**Bot logs show:**
```
TwitterIngestion emitted post_published event
  tweetId: 1991578394732163343
  handle: gmonitordeals
  wallet: null
```

**This means:**
- ✅ Bot IS scanning Twitter
- ✅ Bot IS finding qualifying tweets
- ✅ Bot IS calling postCanonicalEvent() successfully
- ✅ Events happening RECENTLY (within last few minutes!)

**But backend logs show:** No "post_published" entries

---

## This Means One of These:

1. **Events sent to wrong URL** (bot pointing to wrong backend)
2. **Backend rejecting silently** (auth failing, no error logged)
3. **Network issue** (events not reaching backend)

---

## Check for Errors in Bot Logs

### Run these commands on bot server:

```bash
# 1. Check for POST failures
pm2 logs eliza --lines 500 | grep -i "failed to post"

# 2. Check for webhook errors
pm2 logs eliza --lines 500 | grep -i "webhook.*error\|webhook.*5xx"

# 3. Check for auth errors (401, 403)
pm2 logs eliza --lines 500 | grep -E "status.*40[13]"

# 4. Check for timeout/network errors
pm2 logs eliza --lines 500 | grep -i "timeout\|econnrefused\|network error"

# 5. Check what URL bot is actually POSTing to
pm2 logs eliza --lines 500 | grep -i "twitter_bot_main_api_base\|endpoint"
```

---

## Most Likely Issue: HMAC Auth Failing

The backend requires HMAC signature OR bot key. Check if these match:

### On Bot Server:
```bash
# Check bot's secrets
cat /opt/eliza/agent/.env | grep TWITTER_BOT_HMAC_SECRET
# or
pm2 env 0 | grep TWITTER_BOT_HMAC_SECRET
```

### On Backend (Render Dashboard):
Go to Environment tab and check:
```
TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820
```

**They must match exactly!**

---

## Test Backend Auth Manually

```bash
# Generate proper auth and test
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BODY='{"platform":"twitter","type":"post_published","tweet_id":"test123","handle":"testuser","text":"test","idempotency_key":"test:123"}'

# Calculate HMAC (simplified - just test without signature first)
curl -X POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$BODY"
```

**Expected:**
- `signature invalid` or `unauthorized` → Auth is being checked
- `bad request` → Payload format issue
- `202 Accepted` → Success!

---

## Quick Fix to Try

Since bot is sending but backend isn't receiving, there might be an auth mismatch.

### Check Backend Has HMAC Secret:

**Render Dashboard → Backend Service → Environment**

Look for:
```
TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820
```

**If it's missing or different:**
→ Add/fix it and redeploy backend

---

## Commands to Run Now

```bash
# On bot server:

# 1. Find where .env actually is
find /opt/eliza -name ".env*" -type f

# 2. Check bot's loaded config
pm2 env 0 | grep "TWITTER_BOT"

# 3. Look for sending errors in last 100 lines
pm2 logs eliza --lines 100 --nostream | grep -A2 -B2 "post_published"
```

**Run these and show me the output!**

