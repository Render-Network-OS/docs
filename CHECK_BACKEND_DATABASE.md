# Check Backend Database for Bot Activity

## Summary

✅ **Endpoint Verified:** `/integrations/twitter/events` exists and requires auth (working!)  
✅ **Backend Health:** Server is healthy, database connected  
✅ **SSE Stream:** Active (bot can connect)

**Now we need to check if bot is ACTUALLY sending data...**

---

## Method 1: Check Render Logs (EASIEST)

### Go to Render Dashboard:
1. Navigate to: https://dashboard.render.com/
2. Click on: `five55-backend-wn5h` service
3. Click: **Logs** tab
4. Search for keywords: `twitter`, `post_published`, or `signature`

### What to Look For:

**✅ If Bot IS Sending:**
```
POST /integrations/twitter/events
Processing Twitter event: post_published
Twitter handle: moestradamu5
Tweet ID: 1991543620789547452
Resolved wallet from hyperlink via Twitter handle
Quest completed: social_post
Points awarded: 50
Broadcasting event: social.events
```

**❌ If Bot is NOT Sending:**
```
(No entries with "twitter/events" or "post_published")
(or only old entries from hours/days ago)
```

**⚠️ If Bot is Trying but Failing:**
```
POST /integrations/twitter/events 401 Unauthorized
signature invalid
HMAC verification failed
```

---

## Method 2: Database Queries (If You Have Access)

### Query 1: Recent Twitter Events Received
```sql
SELECT 
  source,
  event_type,
  signature_ok,
  received_at
FROM social_event_logs
WHERE source = 'twitter-bot'
ORDER BY received_at DESC
LIMIT 20;
```

**Expected:**
- Rows with recent timestamps → Bot IS sending ✅
- Empty or old timestamps → Bot NOT sending ❌

### Query 2: Twitter Posts Tracked
```sql
SELECT 
  handle,
  post_id,
  wallet,
  url,
  created_at
FROM social_posts
WHERE platform = 'twitter'
ORDER BY created_at DESC
LIMIT 20;
```

**Expected:**
- Recent posts from users like `moestradamu5` → Data flowing ✅
- Empty or stale data → No new posts ❌

### Query 3: Social Quest Completions
```sql
SELECT 
  wallet,
  quest_id,
  evidence,
  points,
  awarded_at
FROM quest_awards
WHERE evidence LIKE 'twitter%'
ORDER BY awarded_at DESC
LIMIT 20;
```

**Expected:**
- Recent awards → Quests being completed ✅
- No recent awards → Quests not triggering ❌

### Query 4: Social Points on Leaderboard
```sql
SELECT 
  wallet,
  points,
  mode
FROM leaderboard_points
WHERE game_id = 'social' 
  AND mode = 'social'
  AND period = 'day'
ORDER BY points DESC
LIMIT 10;
```

**Expected:**
- Users with points > 0 → Social system working ✅
- All zeros or empty → Not tracking social ❌

---

## Method 3: Real-Time Monitoring

### Watch SSE Stream for Bot Events

```bash
# This will show LIVE events as they happen
curl -N https://five55-backend-wn5h.onrender.com/events

# When bot sends a tweet, you should see:
event: social.events
data: {"tweet_id":"...","handle":"...","wallet":"..."}

event: points.updates.social
data: {"wallet":"...","points":50}
```

**To test:**
1. Open terminal with SSE stream running
2. Post a qualifying tweet on Twitter
3. Wait 60-90 seconds (bot scan interval)
4. Watch for event to appear in stream

---

## Method 4: Backend Admin Endpoints (If Available)

Some backends expose admin endpoints to check recent activity:

```bash
# Check if these exist:
curl -sk https://five55-backend-wn5h.onrender.com/admin/recent-events
curl -sk https://five55-backend-wn5h.onrender.com/debug/social
curl -sk https://five55-backend-wn5h.onrender.com/api/internal/stats
```

---

## Database Tables to Check

The backend stores bot data in these tables:

1. **`social_event_logs`** - Raw event log (every POST from bot)
   - Columns: `source`, `event_type`, `idempotency_key`, `received_at`
   - Check: Recent rows from source='twitter-bot'

2. **`social_posts`** - Processed Twitter posts
   - Columns: `platform`, `post_id`, `handle`, `wallet`, `created_at`
   - Check: Recent tweets with wallet mappings

3. **`social_engagements`** - Engagement metrics snapshots
   - Columns: `post_id`, `likes`, `replies`, `views`, `snapshot_at`
   - Check: Metric updates for tracked tweets

4. **`quest_awards`** - Completed social quests
   - Columns: `wallet`, `quest_id`, `evidence`, `points`, `awarded_at`
   - Check: Awards with evidence like 'twitter:post_id'

5. **`leaderboard_points`** - Accumulated points
   - Columns: `wallet`, `game_id`, `mode`, `points`, `period`, `key`
   - Check: game_id='social', mode='social' with points > 0

---

## The Key Question

**Is the bot sending events to `/integrations/twitter/events`?**

### How to Confirm (Pick ONE):

**Option A: Render Logs** (Easiest - No DB access needed)
- Go to dashboard and search logs for "post_published"

**Option B: Database Query** (If you have psql access)
```sql
SELECT COUNT(*), MAX(received_at) 
FROM social_event_logs 
WHERE source = 'twitter-bot';
```

**Option C: Bot Server Logs** (SSH to bot)
```bash
pm2 logs eliza | grep "emitted post_published"
```

**Option D: SSE Monitoring** (Real-time)
```bash
curl -N https://five55-backend-wn5h.onrender.com/events
# Post a tweet and wait for event
```

---

## Quick Answer Script

Run this to get a quick yes/no answer:

```bash
# Test endpoint + check SSE for 5 seconds
echo "Backend endpoint:" && \
curl -skX POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "Content-Type: application/json" -d '{}' && \
echo "" && echo "" && \
echo "SSE stream (5sec sample):" && \
timeout 5 curl -skN https://five55-backend-wn5h.onrender.com/events | head -10
```

---

**Bottom Line:** Check Render logs for `post_published` - that's the smoking gun!

