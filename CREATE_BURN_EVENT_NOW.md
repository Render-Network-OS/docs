# Create Burn Event - Missing Step

## The Issue

- ❌ Backend returns: `{"event":null}` (no active burn event)
- ❌ No burn event quests showing
- ✅ Code is deployed
- ✅ Database tables exist
- ⚠️ **Burn event was never created!**

---

## What Needs to Happen

You need to **create and activate a burn event** using the provided scripts.

---

## Step 1: Create the Burn Event

**Script:** `backend/scripts/create-burn-event.sh`

This script will:
1. Insert the burn event record
2. Create 5 daily entries (NOISE, INFERNO, WILDFIRE, BLAZE, SUPERNOVA)
3. Set up USDC pools ($250, $500, $1000, $2000, $5000)
4. Configure daily token burn amounts

**Run from backend directory:**
```bash
cd /Users/mac/Desktop/Work/555/backend
./scripts/create-burn-event.sh
```

---

## Step 2: Create Event Quests

After creating the event, you need to create the daily quests for each day.

**From the BURN_EVENT_MASTER_PLAN.md**, each day should have ~8-10 quests covering:
- Social media engagement
- Game leagues  
- PvP battles
- Content creation
- Referrals
- Marathon participation

**Example quest creation:**
```bash
# Use the backend API to create quests
curl -X POST https://five55-backend-wn5h.onrender.com/quests \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Day 1: Tweet the Noise",
    "type": "social_post",
    "frequency": "daily",
    "rules": {
      "requires_mention": "555render",
      "requires_hashtags": ["555rndr", "BurnEventNOISE"]
    },
    "reward_points": 100,
    "reward_type": "usdc",
    "reward_usdc": 0.50,
    "event_id": 1,
    "event_day": 1,
    "category": "burn_event"
  }'
```

---

## Step 3: Activate the Event

**Script:** `backend/scripts/activate-burn-event.sh`

This changes event status from 'draft' to 'active'.

```bash
cd /Users/mac/Desktop/Work/555/backend
./scripts/activate-burn-event.sh <event_id>
```

---

## Quick Setup Commands

```bash
# 1. Create the event
cd /Users/mac/Desktop/Work/555/backend
./scripts/create-burn-event.sh

# 2. Note the event ID returned (e.g., ID: 1)

# 3. Create quests for the event (need to build quest creation tool)
# OR manually insert via SQL/API

# 4. Activate the event
./scripts/activate-burn-event.sh 1

# 5. Verify it's active
curl -sk https://five55-backend-wn5h.onrender.com/events/burn/active | jq '.'

# Should now return:
# {
#   "event": { "id": 1, "name": "BURN EVENT", "status": "active", ... },
#   "days": [ ... 5 days ... ],
#   "currentDay": 1
# }
```

---

## Why Quests Aren't Showing

Regular quests show up in `/quests` endpoint.

**But burn event quests** should:
1. Have `event_id` field set to the active event
2. Have `event_day` field set (1-5)
3. Have `category: "burn_event"`
4. Be retrieved via `/events/burn/{id}/quests` endpoint

**Check backend route:**
```go
r.HandleFunc("/events/burn/{id}/quests", s.handleGetEventQuests).Methods("GET")
```

Let me find that handler...

