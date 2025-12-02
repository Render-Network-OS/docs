# Set Up Burn Event - Complete Guide

## The Problem

- Backend has burn event code ✅
- Database has burn event tables ✅
- Frontend has burn event UI ✅
- **But NO burn event exists in database** ❌

Result: `/events/burn/active` returns `{"event":null}`

---

## Solution: Create & Activate the Event

### Step 1: Get Database Connection String

```bash
# From Render Dashboard → Backend Service → Environment
# Copy the DATABASE_URL value
# Format: postgresql://user:pass@host:port/dbname
```

### Step 2: Create the Burn Event

```bash
# Run from your local machine (or wherever you have psql)
cd /Users/mac/Desktop/Work/555/backend

# Set your database URL
export DATABASE_URL="postgresql://..."

# Run creation script
./scripts/create-burn-event.sh
```

**This creates:**
- 1 burn event record (status='upcoming')
- 5 daily records with themes:
  - Day 1: NOISE ($1,000 USDC)
  - Day 2: INFERNO ($1,250 USDC)
  - Day 3: WILDFIRE ($1,500 USDC)
  - Day 4: BLAZE ($1,750 USDC)
  - Day 5: SUPERNOVA ($2,500 USDC)

**Returns:** Event ID (e.g., 1)

---

### Step 3: Create Event Quests

You need to create quests that are linked to the burn event.

**Option A: Via API (Recommended)**

Create a script that POSTs quests to `/quests` endpoint:

```bash
#!/bin/bash
# Create burn event quests

EVENT_ID=1  # From step 2
BACKEND="https://five55-backend-wn5h.onrender.com"
ADMIN_TOKEN="your-admin-token"

# Day 1: NOISE Quests
curl -X POST "$BACKEND/quests" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tweet the Noise",
    "type": "social_post",
    "frequency": "once",
    "rules": {
      "requires_mention": "555render",
      "requires_hashtags": ["555rndr", "BurnEventNOISE"],
      "min_likes": 1
    },
    "reward_points": 100,
    "reward_type": "usdc",
    "reward_usdc": 1.00,
    "event_id": '$EVENT_ID',
    "event_day": 1,
    "category": "burn_event",
    "active_from": "2025-11-25T00:00:00Z",
    "active_to": "2025-11-25T23:59:59Z"
  }'

# Add more quests for each day...
```

**Option B: Via SQL (Faster for bulk)**

```sql
-- Connect to database
psql $DATABASE_URL

-- Insert Day 1 quests
INSERT INTO quest_definitions (
  title, type, frequency, rules_json, reward_points, 
  reward_type, reward_usdc, event_id, event_day, category,
  active_from, active_to, created_at, updated_at
) VALUES
(
  'Tweet the Noise',
  'social_post',
  'once',
  '{"requires_mention":"555render","requires_hashtags":["555rndr","BurnEventNOISE"],"min_likes":1}'::jsonb,
  100,
  'usdc',
  1.00,
  1,  -- event_id
  1,  -- event_day
  'burn_event',
  '2025-11-25 00:00:00',
  '2025-11-25 23:59:59',
  NOW(),
  NOW()
);

-- Repeat for all quests from BURN_EVENT_MASTER_PLAN.md
```

---

### Step 4: Activate the Event

```bash
# Change status from 'upcoming' to 'active'
./scripts/activate-burn-event.sh $DATABASE_URL 1
```

**Or manually:**
```sql
UPDATE burn_events 
SET status = 'active', updated_at = NOW()
WHERE id = 1;
```

---

### Step 5: Verify It Works

```bash
# Check active event
curl -sk https://five55-backend-wn5h.onrender.com/events/burn/active | jq '.'

# Should return:
{
  "event": {
    "id": 1,
    "name": "555 Burn Event",
    "status": "active",
    ...
  },
  "days": [...5 days...],
  "currentDay": 1
}

# Check event quests
curl -sk https://five55-backend-wn5h.onrender.com/events/burn/1/quests | jq '.'

# Should return array of quests for current day
```

---

## Why It's Not in Regular `/quests`

Burn event quests are **separate** from regular quests:

**Regular quests:** `/quests` (all non-event quests)
**Burn event quests:** `/events/burn/{id}/quests` (filtered by event)

The frontend `BurnEventDialog` should:
1. Call `/events/burn/active` to get event
2. Call `/events/burn/{id}/quests?day={currentDay}` to get quests
3. Display quests in the burn event modal

---

## Quick Start Commands

```bash
# 1. Get DATABASE_URL from Render
export DATABASE_URL="postgresql://..."

# 2. Create event
cd /Users/mac/Desktop/Work/555/backend
./scripts/create-burn-event.sh

# 3. Get event ID from output (e.g., 1)

# 4. Create Day 1 quests (manually for now)
# See quest JSON examples above

# 5. Activate event
./scripts/activate-burn-event.sh $DATABASE_URL 1

# 6. Verify
curl https://five55-backend-wn5h.onrender.com/events/burn/active | jq '.'
```

---

## Need Quest Creation Script?

The `BURN_EVENT_MASTER_PLAN.md` has ~40 quests defined (8 per day × 5 days).

I can create a script that:
1. Reads quest definitions from the plan
2. POSTs them to `/quests` endpoint
3. Links them to the burn event

**Want me to create that script?**

