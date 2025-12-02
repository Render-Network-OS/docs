#!/bin/bash
#
# create-burn-event-api.sh
# Creates a burn event using the API endpoint
#

API_BASE="${API_BASE:-https://five55-backend-wn5h.onrender.com}"

# Create event with 5 days
curl -X POST "${API_BASE}/events/burn" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "555 Burn Event",
    "description": "5-day token burn event with daily challenges and meta leaderboards. 260 USDC total prize pool.",
    "start_date": "2025-01-15T00:00:00Z",
    "end_date": "2025-01-20T00:00:00Z",
    "daily_burn_amount": 1111111,
    "days": [
      {
        "day_number": 1,
        "theme": "NOISE",
        "burn_amount": 1111111,
        "usdc_pool": 10.0
      },
      {
        "day_number": 2,
        "theme": "INFERNO",
        "burn_amount": 1111111,
        "usdc_pool": 10.0
      },
      {
        "day_number": 3,
        "theme": "WILDFIRE",
        "burn_amount": 1111111,
        "usdc_pool": 10.0
      },
      {
        "day_number": 4,
        "theme": "BLAZE",
        "burn_amount": 1111111,
        "usdc_pool": 10.0
      },
      {
        "day_number": 5,
        "theme": "SUPERNOVA",
        "burn_amount": 1111111,
        "usdc_pool": 10.0
      }
    ]
  }' | jq '.'

echo ""
echo "✅ Event created! Save the event_id from above."
echo "Next: Run ./activate-burn-event-api.sh <event_id>"

