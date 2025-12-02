# Quick Verification Commands - Run These Now

## Option 1: From Your Local Machine

```bash
# Test 1: Check backend is alive
curl https://five55-backend-wn5h.onrender.com/health
# Expected: 200 OK or 204 No Content

# Test 2: Get active quests
curl https://five55-backend-wn5h.onrender.com/quests | jq '.quests | length'
# Expected: Number of active quests (should be > 0)

# Test 3: Check leaderboard
curl https://five55-backend-wn5h.onrender.com/leaderboard | jq '.leaderboard[:5]'
# Expected: Top 5 users with scores

# Test 4: Get recent Twitter events  
curl https://five55-backend-wn5h.onrender.com/social/latest | jq '.events[:3]'
# Expected: Recent Twitter mentions/interactions

# Test 5: Test SSE connection (will stream, press Ctrl+C after seeing data)
curl -N https://five55-backend-wn5h.onrender.com/events
# Expected: Stream of "event: " and "data: " lines

# Test 6: Verify Hyperlink API (we just fixed this!)
curl -H "X-API-Key: test" http://api.555hyper.link/pub/v1/links/test
# Expected: "unauthorized" (401 = API is alive)
```

---

## Option 2: From Bot Server (SSH)

```bash
# SSH to bot server
ssh your-bot-server

# Check bot status
pm2 status
# Look for: "eliza" with status "online"

# Check bot logs (real-time)
pm2 logs eliza --lines 50

# Look for these SUCCESS indicators:
# ✅ "SSE: connected"
# ✅ "TwitterIngestion scan completed"
# ✅ "Started 555 as <uuid>"
# ✅ No 401 errors from Hyperlink API

# Check for PROBLEMS:
# ❌ "SSE: error; will retry in 5s"
# ❌ "Could not resolve host"
# ❌ "Hyperlink API error: 401"
# ❌ Any stack traces or crashes
```

---

## Option 3: Test Complete Flow (Manual)

### Step 1: Post a Test Tweet
```
Go to Twitter and post:
"Testing @555render bot integration! #555rndr"
```

### Step 2: Wait 60-90 Seconds
(Bot scans every 60 seconds)

### Step 3: Check Bot Picked It Up
```bash
# SSH to bot server
pm2 logs eliza | grep -i "your_twitter_handle"

# Should see:
# TwitterIngestion evaluated tweet
#   id: <tweet-id>
#   handle: your_twitter_handle
#   qualifies: true
```

### Step 4: Check Backend Received It
```bash
# From your machine
curl https://five55-backend-wn5h.onrender.com/social/latest | jq '.events[0]'

# Should show your tweet:
# {
#   "event_type": "twitter_mention",
#   "twitter_handle": "your_twitter_handle",
#   "content": "Testing @555render...",
#   "timestamp": "2025-11-20T..."
# }
```

### Step 5: Check Points Awarded
```bash
# Get your position on leaderboard
curl https://five55-backend-wn5h.onrender.com/leaderboard | \
  jq '.leaderboard[] | select(.twitter_handle=="your_twitter_handle")'

# Should show:
# {
#   "rank": <number>,
#   "twitter_handle": "your_twitter_handle",
#   "total_points": <points>,
#   "quest_count": <completed quests>
# }
```

---

## Option 4: Check Logs via Render Dashboard

1. **Go to:** https://dashboard.render.com/
2. **Select:** 555-backend service
3. **Click:** "Logs" tab
4. **Look for:**
   - ✅ "Listening on :8080" (server started)
   - ✅ "SSE client connected" (bot connected)
   - ✅ "Processing Twitter event" (events being processed)
   - ✅ "Quest completed" (quests being awarded)
   - ❌ Any errors or stack traces

---

## What You Should See If Everything Works

### Bot Logs (pm2 logs eliza)
```
✅ Twitter client started
✅ TwitterIngestion initialized  
✅ SSE: connected
✅ TwitterIngestion scan starting
✅ TwitterIngestion scan completed (queryCount=23, candidateCount=5)
✅ TwitterIngestion evaluated tweet (qualifies=true)
✅ QuestSync updated Twitter monitoring
```

### Backend Logs (Render dashboard)
```
✅ Server started, listening on :8080
✅ SSE client connected
✅ Processing Twitter event: mention
✅ Twitter handle: username
✅ Quest completed: twitter_mention
✅ Points awarded: 555
✅ Broadcasting event: quest_completed
```

### API Responses
```bash
# Quests API
$ curl .../quests
{"quests":[...11 quests...], "updated_at":"..."}

# Leaderboard API  
$ curl .../leaderboard
{"leaderboard":[...users with scores...]}

# Social Events API
$ curl .../social/latest
{"events":[...recent tweets...]}
```

---

## Troubleshooting Quick Reference

### Problem: Bot not scanning Twitter
```bash
# Check config
pm2 logs eliza | grep TW_INGEST_ENABLE
# Should be: true

# Restart if needed
pm2 restart eliza
```

### Problem: SSE not connected
```bash
# Check SSE URL
pm2 logs eliza | grep SOCIAL_SSE_URL
# Should be: https://five55-backend-wn5h.onrender.com/events

# Check connection attempts
pm2 logs eliza | grep "SSE:"
# Should see: "SSE: connected" not "SSE: error"
```

### Problem: No points for tweets
```bash
# Check quest is active
curl .../quests | jq '.quests[] | select(.action_type=="twitter_mention")'

# Check tweet qualifies
# Must have: @555render OR @rndrntwrk OR #555rndr OR #rndrntwrk
```

### Problem: Hyperlink API errors
```bash
# Test endpoint (we just fixed this!)
curl http://api.555hyper.link/pub/v1/links/test
# Should get: "unauthorized" (401)
# NOT: "Could not resolve host"

# Check bot config
pm2 logs eliza | grep HYPERLINK_API
# Should see: http://api.555hyper.link/pub/v1
```

---

## Critical Endpoints Summary

| Service | URL | Test |
|---------|-----|------|
| **Backend API** | https://five55-backend-wn5h.onrender.com | `curl .../health` |
| **Quests** | .../quests | Returns active quest list |
| **Leaderboard** | .../leaderboard | Returns ranked users |
| **Social Events** | .../social/latest | Returns recent tweets |
| **SSE Stream** | .../events | Streams real-time updates |
| **Hyperlink API** | http://api.555hyper.link/pub/v1 | Returns 401 (alive) |

---

## Next Steps

1. **Run the commands above** to check current status
2. **Post a test tweet** and follow "Option 3" flow
3. **Check bot logs** for tweet processing
4. **Verify backend** received the tweet
5. **Confirm points** were awarded on leaderboard

If any step fails, check the troubleshooting section!

---

## One-Liner Health Check
```bash
echo "Quests:" && curl -s https://five55-backend-wn5h.onrender.com/quests | jq '.quests | length' && \
echo "Leaderboard:" && curl -s https://five55-backend-wn5h.onrender.com/leaderboard | jq '.leaderboard | length' && \
echo "Events:" && curl -s https://five55-backend-wn5h.onrender.com/social/latest | jq '.events | length' && \
echo "Hyperlink:" && curl -s -o /dev/null -w '%{http_code}\n' http://api.555hyper.link/pub/v1/links/test
```

**Expected output:**
```
Quests: 11
Leaderboard: 150
Events: 25
Hyperlink: 401
```

---

**Ready to test?** Start with the one-liner health check, then post a test tweet!

