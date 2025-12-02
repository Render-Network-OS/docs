# Integration Verification Guide
## Bot → Backend → Quests → Leaderboard

**Purpose:** Verify complete data flow from Twitter bot to backend, quest completion, and leaderboard updates

---

## Quick Health Check Commands

### 1. Check Bot Status
```bash
# SSH to bot server
ssh your-bot-server

# Check bot is running
pm2 status

# Check recent bot activity (last 100 lines)
pm2 logs eliza --lines 100 --nostream

# Look for:
# ✅ "SSE: connected" - Backend connection active
# ✅ "TwitterIngestion scan completed" - Bot scanning tweets
# ✅ Tweet processing messages
# ❌ Any errors or 401/500 responses
```

### 2. Check Backend Status
```bash
# Check backend logs (Render dashboard or logs)
# Look for:
# ✅ "Listening on :8080" - Server running
# ✅ "SSE client connected" - Bot connected to SSE
# ✅ Twitter event processing
# ✅ Quest award messages
# ❌ Database errors or API failures
```

---

## Part 1: Bot → Backend Data Flow

### A. Check SSE Connection

**Bot Side:**
```bash
# In bot logs, search for SSE:
pm2 logs eliza | grep -i "sse"

# Should see:
✅ "SSE: connecting to social events"
✅ "SSE: connected"
✅ "SSE: fetching latest for catch-up"

# If you see:
❌ "SSE: error; will retry in 5s" - Connection failing
❌ "SSE: ignoring non-target event" - Events not being processed
```

**Backend Side:**
```bash
# Check for SSE client connections
curl https://five55-backend-wn5h.onrender.com/events

# Should hang (that's good - it's streaming)
# Press Ctrl+C after a few seconds

# Check backend logs for:
✅ "SSE client connected" 
✅ "Broadcasting event: social" messages
```

### B. Check Tweet Ingestion

**Bot Side:**
```bash
# Watch bot scanning tweets
pm2 logs eliza --lines 50 | grep -E "(scan|tweet|ingestion)"

# Should see every ~60 seconds:
✅ "TwitterIngestion scan starting"
✅ "TwitterIngestion scan completed"
✅ "TwitterIngestion evaluated tweet" (for qualifying tweets)
✅ Mentions of hashtags: #555rndr, #555community, etc.
```

**Test Tweet Processing:**
1. Post a test tweet with `#555rndr` or `@555render`
2. Wait up to 60 seconds (bot scan interval)
3. Check bot logs for:
```
TwitterIngestion evaluated tweet
  id: <tweet-id>
  handle: <your-handle>
  qualifies: true
```

### C. Check Backend Receives Tweets

**Backend API:**
```bash
# Check latest social events
curl https://five55-backend-wn5h.onrender.com/social/latest

# Should return JSON with recent tweets:
{
  "events": [
    {
      "event_type": "twitter_mention",
      "twitter_handle": "username",
      "twitter_tweet_id": "...",
      "content": "...",
      "timestamp": "..."
    }
  ]
}
```

**Backend Logs:**
```bash
# Look for Twitter event processing:
✅ "Processing Twitter event: mention"
✅ "Twitter handle: username"
✅ "Wallet resolved: <address>"
```

---

## Part 2: Quest Completion

### A. Check Active Quests

**API Call:**
```bash
# Get all active quests
curl https://five55-backend-wn5h.onrender.com/quests | jq '.'

# Should return list of quests with:
{
  "quests": [
    {
      "id": "...",
      "quest_type": "social",
      "action_type": "twitter_mention",
      "points": 555,
      "is_active": true,
      "title": "Mention @555render"
    },
    ...
  ]
}
```

**Check Quest Types:**
```bash
# Look for these quest types:
- social (Twitter actions)
- game_score (Game leaderboards)
- daily_checkin
- referral
```

### B. Check User Quest Progress

**API Call:**
```bash
# Check specific user's progress
curl "https://five55-backend-wn5h.onrender.com/quests/progress?wallet=<wallet-address>" | jq '.'

# Should show:
{
  "quests": [
    {
      "quest_id": "...",
      "completed": true,
      "completed_at": "2025-11-20T...",
      "points_awarded": 555
    }
  ],
  "total_points": 1110
}
```

### C. Test Quest Completion Flow

**Manual Test:**
1. **Post qualifying tweet:**
   ```
   Testing @555render integration! #555rndr
   ```

2. **Wait 60-90 seconds** (bot scan + processing)

3. **Check bot logs:**
   ```bash
   pm2 logs eliza | tail -50 | grep -i "username"
   ```
   Look for: Tweet processed, wallet resolved

4. **Check backend for quest award:**
   ```bash
   curl "https://five55-backend-wn5h.onrender.com/social/latest" | jq '.events[0]'
   ```

5. **Check user points increased:**
   ```bash
   curl "https://five55-backend-wn5h.onrender.com/leaderboard" | jq '.leaderboard[] | select(.twitter_handle=="your_handle")'
   ```

---

## Part 3: Leaderboard Updates

### A. Check Leaderboard API

**Get Full Leaderboard:**
```bash
curl https://five55-backend-wn5h.onrender.com/leaderboard | jq '.'

# Should return:
{
  "leaderboard": [
    {
      "rank": 1,
      "wallet": "...",
      "twitter_handle": "username",
      "total_points": 12345,
      "level": 5,
      "quest_count": 23,
      "badges": ["early_adopter", "social_butterfly"]
    }
  ],
  "updated_at": "2025-11-20T..."
}
```

**Check Your Position:**
```bash
curl "https://five55-backend-wn5h.onrender.com/leaderboard?wallet=<your-wallet>" | jq '.'
```

### B. Real-Time Leaderboard Updates

**Watch SSE Events:**
```bash
# Connect to SSE stream and watch for leaderboard updates
curl -N https://five55-backend-wn5h.onrender.com/events

# You should see events like:
event: social
data: {"event_type":"twitter_mention",...}

event: quest_completed
data: {"wallet":"...","quest_id":"...","points":555}

event: leaderboard_update
data: {"wallet":"...","new_rank":42,"total_points":12345}
```

### C. Frontend Verification

**Open Frontend:**
```
https://555.game (or your frontend URL)
```

**Check:**
1. ✅ Leaderboard displays
2. ✅ Your username appears
3. ✅ Points update after quest completion
4. ✅ Rank changes reflect immediately
5. ✅ Quest progress bars update

---

## Part 4: Game Integration

### A. Check Game Score Submission

**Test Game Score:**
```bash
# Submit test game score (requires auth token)
curl -X POST https://five55-backend-wn5h.onrender.com/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <wallet-signature>" \
  -d '{
    "game": "eatmydust",
    "score": 1000,
    "metadata": {"level": 5}
  }'

# Should return:
{
  "success": true,
  "points_awarded": 100,
  "leaderboard_rank": 42
}
```

**Check Game Leaderboard:**
```bash
curl "https://five55-backend-wn5h.onrender.com/game/leaderboard?game=eatmydust" | jq '.'
```

### B. Check USDC Quest Rewards

**Look for USDC-eligible quests:**
```bash
curl https://five55-backend-wn5h.onrender.com/quests | jq '.quests[] | select(.reward_type=="usdc")'

# Should show:
{
  "quest_type": "social",
  "reward_type": "usdc",
  "reward_usdc": 5.00,
  "title": "Daily Top Engagement"
}
```

**Check payment status:**
```bash
curl "https://five55-backend-wn5h.onrender.com/payments/history?wallet=<wallet>" | jq '.'
```

---

## Part 5: Database Verification

### A. Direct Database Queries (if you have access)

**Check recent Twitter events:**
```sql
SELECT 
  event_type, 
  twitter_handle, 
  twitter_tweet_id, 
  created_at 
FROM twitter_events 
ORDER BY created_at DESC 
LIMIT 10;
```

**Check quest completions:**
```sql
SELECT 
  u.twitter_handle,
  q.title as quest_title,
  qc.completed_at,
  qc.points_awarded
FROM quest_completions qc
JOIN users u ON qc.user_id = u.id
JOIN quests q ON qc.quest_id = q.id
ORDER BY qc.completed_at DESC
LIMIT 10;
```

**Check leaderboard data:**
```sql
SELECT 
  twitter_handle,
  total_points,
  level,
  quest_count,
  badges
FROM users
ORDER BY total_points DESC
LIMIT 20;
```

**Check USDC payments:**
```sql
SELECT 
  wallet,
  amount_usdc,
  chain_type,
  status,
  created_at
FROM usdc_payments
ORDER BY created_at DESC
LIMIT 10;
```

---

## Part 6: End-to-End Test

### Complete Flow Test

**Step 1: Setup**
```bash
# Terminal 1: Watch bot logs
pm2 logs eliza --lines 0

# Terminal 2: Watch backend SSE stream
curl -N https://five55-backend-wn5h.onrender.com/events

# Terminal 3: Monitor your leaderboard position
watch -n 5 'curl -s "https://five55-backend-wn5h.onrender.com/leaderboard?wallet=YOUR_WALLET" | jq ".rank, .total_points"'
```

**Step 2: Execute Action**
```
Post a tweet:
"Testing the @555render integration! Let's see those quest points roll in 🎮 #555rndr #555community"
```

**Step 3: Verify Flow (within 90 seconds)**

1. **Bot logs (Terminal 1):**
   ```
   ✅ TwitterIngestion evaluated tweet
   ✅ id: <your-tweet-id>
   ✅ qualifies: true
   ✅ Sending to backend
   ```

2. **SSE stream (Terminal 2):**
   ```
   ✅ event: social
   ✅ data: {"event_type":"twitter_mention","twitter_handle":"your_handle",...}
   ✅ event: quest_completed
   ✅ data: {"quest_id":"...","points":555}
   ```

3. **Leaderboard (Terminal 3):**
   ```
   ✅ Points increased by 555 (or quest value)
   ✅ Rank updated (if applicable)
   ```

4. **Frontend:**
   - Refresh https://555.game
   - ✅ See your points updated
   - ✅ Quest marked as completed
   - ✅ Leaderboard position updated

---

## Common Issues & Debugging

### Issue: Bot Not Scanning Tweets

**Check:**
```bash
# Verify bot config
pm2 logs eliza | grep -i "TW_INGEST_ENABLE"

# Should show: TW_INGEST_ENABLE=true
# If false, update and restart bot
```

### Issue: SSE Not Connected

**Check:**
```bash
# Bot logs
pm2 logs eliza | grep "SSE:"

# If seeing errors:
# - Check SOCIAL_SSE_URL env var
# - Verify backend /events endpoint is accessible
# - Check firewall/network connectivity
```

### Issue: Quests Not Completing

**Check:**
1. Quest is active: `curl .../quests | jq '.quests[] | select(.is_active==true)'`
2. User meets requirements: Check wallet balance, token holdings
3. Backend logs for quest processing errors
4. Database for quest_completions entries

### Issue: Leaderboard Not Updating

**Check:**
1. User record exists: `curl ".../leaderboard?wallet=..."`
2. Points are being awarded: Check quest_completions table
3. SSE broadcasting leaderboard events
4. Frontend is subscribed to SSE updates

### Issue: USDC Payments Not Triggering

**Check:**
1. User has minimum tokens: `MIN_TOKENS_FOR_USDC` config
2. Quest has `reward_type="usdc"` and `reward_usdc > 0`
3. Hyperlink API is accessible (we just fixed this!)
4. Backend logs for payment submission attempts
5. `usdc_payments` table for payment records

---

## Monitoring Dashboard URLs

**Bot:**
- PM2 Web: `pm2 web` (if enabled)
- Logs: `pm2 logs eliza`

**Backend:**
- Render Dashboard: https://dashboard.render.com/
- Logs: Render dashboard → Service → Logs
- Metrics: Render dashboard → Service → Metrics

**Database:**
- Admin panel: (if you have pgAdmin or similar)
- Direct queries via `psql` connection

**Frontend:**
- Production: https://555.game (or your domain)
- Real-time updates via SSE connection

---

## Success Criteria Checklist

After verifying all above:

- [ ] Bot scans Twitter every 60 seconds
- [ ] Bot sends qualifying tweets to backend via SSE
- [ ] Backend receives and processes Twitter events
- [ ] Quests are marked as completed
- [ ] Points are awarded correctly
- [ ] Leaderboard updates in real-time
- [ ] Frontend shows updated data
- [ ] Game scores submit successfully
- [ ] USDC quests trigger payments
- [ ] Hyperlink wallet resolution works
- [ ] No errors in bot or backend logs
- [ ] SSE connection stays stable

---

## Quick Diagnostic Script

```bash
#!/bin/bash
# Save as check_integration.sh

echo "=== 555 Integration Health Check ==="
echo ""

echo "1. Bot Status:"
pm2 list | grep eliza || echo "❌ Bot not running"

echo ""
echo "2. Backend Health:"
curl -s https://five55-backend-wn5h.onrender.com/health && echo "✅" || echo "❌"

echo ""
echo "3. Active Quests:"
curl -s https://five55-backend-wn5h.onrender.com/quests | jq '.quests | length'

echo ""
echo "4. Leaderboard Size:"
curl -s https://five55-backend-wn5h.onrender.com/leaderboard | jq '.leaderboard | length'

echo ""
echo "5. Recent Twitter Events:"
curl -s https://five55-backend-wn5h.onrender.com/social/latest | jq '.events | length'

echo ""
echo "6. SSE Connection Test:"
timeout 3 curl -N https://five55-backend-wn5h.onrender.com/events && echo "✅ Connected" || echo "⚠️ Timeout (normal)"

echo ""
echo "=== Health Check Complete ==="
```

Run: `chmod +x check_integration.sh && ./check_integration.sh`

---

**Last Updated:** 2025-11-20  
**Status:** Complete verification guide  
**Next:** Run through checklist to verify integration

