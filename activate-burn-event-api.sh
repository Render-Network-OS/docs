#!/bin/bash
#
# activate-burn-event-api.sh <event_id>
# Activates a burn event using the API endpoint
#

if [ -z "$1" ]; then
  echo "Usage: $0 <event_id>"
  exit 1
fi

EVENT_ID=$1
API_BASE="${API_BASE:-https://five55-backend-wn5h.onrender.com}"

echo "Activating burn event ID: $EVENT_ID"
echo ""

curl -X POST "${API_BASE}/events/burn/${EVENT_ID}/activate" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Event activated!"
echo "Check at: ${API_BASE}/events/burn/active"

