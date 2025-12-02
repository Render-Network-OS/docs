# Check If Bot is Sending Data to Backend

## Backend Logging to Look For

When the backend receives Twitter events from the bot, it logs:

**Location:** Render Dashboard → 555-backend → Logs

**Look for these log lines:**

### 1. Successful Tweet Receipt
```
"Resolved wallet from referral code" referral_code=xxx wallet=xxx
"Resolved wallet from hyperlink via Twitter handle" handle=xxx wallet=xxx chain=xxx
```

### 2. Event Processing
```
"Processing Twitter event: post_published"
"Twitter handle: username"
"Tweet ID: 123456789"
```

### 3. Quest Completion
```
"Quest completed: social_post"
"Points awarded: 555"
"Broadcasting event: quest_completed"
```

### 4. Errors (if any)
```
"unauthorized" - Bot auth failing
"signature invalid" - HMAC mismatch
"social event log failed" - Database error
```

---

## Direct Backend Checks (No SSH Needed)

### Check 1: Test the Twitter Events Endpoint

```bash
# Try to POST to it (will fail auth, but proves endpoint exists)
curl -X POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

**Expected responses:**
- `unauthorized` (401) - ✅ Endpoint exists, needs auth
- `signature invalid` (401) - ✅ Endpoint exists, auth configured
- `404` or `Cannot POST` - ❌ Endpoint doesn't exist (route not registered)

### Check 2: Query Backend for Recent Social Activity

The backend stores events in `social_event_logs` table. Check via database or logs.

**Check Render Logs for:**
```
# Filter logs for "twitter" or "social"
# Look for POST requests to /integrations/twitter/events
# Look for "RecordSocialEvent" or "social_event_log" messages
```

### Check 3: See if SSE is Broadcasting Bot Events

```bash
# Connect to SSE and watch for events
curl -N https://five55-backend-wn5h.onrender.com/events

# If bot is sending data, you should see:
event: social.events
data: {"tweet_id":"...","handle":"...","wallet":"..."}

event: points.updates.social  
data: {"wallet":"...","points":555}

event: quest_completed
data: {"quest_id":"...","wallet":"..."}
```

### Check 4: Verify Bot Has Correct Config

The bot needs these env vars to send to backend:

```bash
TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com
TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820
TWITTER_BOT_KEY=(optional)
```

**Check on bot server:**
```bash
pm2 env 0 | grep TWITTER_BOT_MAIN_API_BASE
# or
cat /opt/eliza/.env.production | grep TWITTER_BOT_MAIN_API_BASE
```

---

## Diagnostic SQL Queries (If You Have DB Access)

```sql
-- Check if social_event_logs table exists and has recent data
SELECT 
  source,
  event_type,
  created_at,
  signature_ok
FROM social_event_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check social_posts table for bot-submitted tweets
SELECT 
  handle,
  post_id,
  wallet,
  created_at
FROM social_posts
ORDER BY created_at DESC
LIMIT 10;

-- Check quest_awards for social quest completions
SELECT 
  wallet,
  quest_id,
  points,
  evidence,
  created_at
FROM quest_awards
WHERE evidence LIKE 'twitter%' OR evidence LIKE 'social%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## The Simplest Test

### Run this command to test the endpoint:

```bash
curl -X POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "Content-Type: application/json" \
  -H "X-Timestamp: 2025-11-20T12:00:00Z" \
  -H "X-Signature: dummy" \
  -d '{
    "platform": "twitter",
    "type": "post_published",
    "tweet_id": "test123",
    "handle": "testuser",
    "text": "Test tweet #555rndr",
    "idempotency_key": "test:12345"
  }'
```

**Possible responses:**
- `unauthorized` → Endpoint working, needs valid auth ✅
- `signature invalid` → Endpoint working, HMAC configured ✅
- `bad request` → Endpoint working, payload format issue ⚠️
- `404` → Endpoint not registered ❌

---

## What to Check RIGHT NOW

### On Your Machine (No SSH):

1. **Test the endpoint exists:**
   ```bash
   curl -X POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events
   ```

2. **Watch SSE for 30 seconds:**
   ```bash
   timeout 30 curl -N https://five55-backend-wn5h.onrender.com/events
   ```

3. **Check Render logs:**
   - Go to Render dashboard
   - View backend service logs
   - Search for: "twitter", "post_published", "RecordSocialEvent"

### On Bot Server (SSH):

1. **Check bot is sending events:**
   ```bash
   pm2 logs eliza | grep -E "(emitted post_published|Failed to POST)" | tail -20
   ```

2. **Check bot's backend URL config:**
   ```bash
   pm2 env 0 | grep TWITTER_BOT_MAIN_API_BASE
   ```

3. **Watch bot logs live:**
   ```bash
   pm2 logs eliza --lines 0
   # Then post a test tweet and watch
   ```

---

**Do these checks and tell me what you find!**

