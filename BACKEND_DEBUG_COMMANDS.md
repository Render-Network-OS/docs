# Backend Debug Commands

## Run these commands to see what's actually happening:

### 1. Check Raw Response (No jq)
```bash
# See exactly what the backend returns
curl -s https://five55-backend-wn5h.onrender.com/social/latest
```

**If you see:**
- `{"events":[...]}` → Backend is working! ✅
- `{"error": "..."}` → Backend error message
- `<html>...` → Backend is down or returning error page ❌
- Empty/nothing → Endpoint doesn't exist

---

### 2. Check with Verbose Headers
```bash
curl -v https://five55-backend-wn5h.onrender.com/social/latest 2>&1 | grep -E "(HTTP|Content-Type)"
```

**Look for:**
- `HTTP/1.1 200 OK` → Success
- `Content-Type: application/json` → Correct format
- `HTTP/1.1 404` → Endpoint not found
- `HTTP/1.1 500` → Server error

---

### 3. Test Each Endpoint Individually

```bash
# Health
curl -w "\n[Status: %{http_code}]\n" https://five55-backend-wn5h.onrender.com/health

# Quests  
curl -s https://five55-backend-wn5h.onrender.com/quests | head -c 200
echo ""

# Leaderboard
curl -s https://five55-backend-wn5h.onrender.com/leaderboard | head -c 200
echo ""

# Social latest
curl -s https://five55-backend-wn5h.onrender.com/social/latest | head -c 200
echo ""
```

---

### 4. Check Backend Logs (Render Dashboard)

Go to: https://dashboard.render.com/

**Navigate to:**
- Services → five55-backend-wn5h → Logs

**Look for recent errors:**
- Database connection errors
- Route not found
- Panic/crash messages
- Port binding issues

---

### 5. Check if Backend is Even Running

```bash
# Test if backend responds at all
curl -s -o /dev/null -w "HTTP Code: %{http_code}\nTime: %{time_total}s\n" https://five55-backend-wn5h.onrender.com/
```

**Expected:**
- HTTP Code: 200, 204, or 404 (server responding)
- Time: < 2 seconds

**Bad:**
- HTTP Code: 000 (can't connect)
- Time: > 10 seconds (timing out)

---

## Common Issues

### Issue 1: Backend is Sleeping (Render Free Tier)
Render free tier spins down after inactivity.

**Fix:**
```bash
# Wake it up with any request
curl https://five55-backend-wn5h.onrender.com/health
# Wait 30-60 seconds for cold start
# Try again
curl https://five55-backend-wn5h.onrender.com/quests
```

### Issue 2: Routes Not Registered

Check `backend/internal/api/server.go` for route definitions:
```go
r.Get("/quests", s.handleGetQuests)
r.Get("/leaderboard", s.handleLeaderboard)  
r.Get("/social/latest", s.handleSocialLatest)
```

### Issue 3: Database Connection Failed

Backend logs would show:
```
Failed to connect to database
panic: ...
```

**Check:**
- Render environment has `DATABASE_URL` set
- Database is accessible
- Migrations have run

---

## Expected Healthy Responses

### /quests
```json
{
  "quests": [
    {
      "id": "...",
      "quest_type": "social",
      "action_type": "twitter_mention",
      "points": 555,
      "is_active": true
    }
  ]
}
```

### /leaderboard
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "twitter_handle": "username",
      "total_points": 12345
    }
  ]
}
```

### /social/latest
```json
{
  "events": [
    {
      "event_type": "twitter_mention",
      "twitter_handle": "username",
      "twitter_tweet_id": "...",
      "timestamp": "2025-11-20T..."
    }
  ]
}
```

---

## Quick Diagnostic

**Run this one command:**
```bash
curl -s https://five55-backend-wn5h.onrender.com/social/latest
```

**Then tell me what you see:**

**Option A:** `{"events":[...]}`
→ Backend is working! Issue might be jq syntax

**Option B:** `<html>...</html>` or `Cannot GET /social/latest`
→ Backend is down or route doesn't exist

**Option C:** `{"error":"..."}`
→ Backend is up but endpoint has error

**Option D:** Nothing (hangs/timeout)
→ Backend not responding at all

---

Let me know what you see and I'll help debug!

