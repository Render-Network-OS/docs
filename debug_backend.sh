#!/bin/bash
# Debug backend responses

echo "=== Testing Backend Endpoints ==="
echo ""

echo "1. Health endpoint (raw):"
curl -s -w "\nHTTP Status: %{http_code}\n" https://five55-backend-wn5h.onrender.com/health
echo ""

echo "2. Quests endpoint (raw):"
QUESTS_RAW=$(curl -s https://five55-backend-wn5h.onrender.com/quests)
echo "$QUESTS_RAW"
echo ""
echo "Length: ${#QUESTS_RAW} bytes"
echo ""

echo "3. Social/latest endpoint (raw):"
SOCIAL_RAW=$(curl -s https://five55-backend-wn5h.onrender.com/social/latest)
echo "$SOCIAL_RAW"
echo ""
echo "Length: ${#SOCIAL_RAW} bytes"
echo ""

echo "4. Leaderboard endpoint (raw):"
LB_RAW=$(curl -s https://five55-backend-wn5h.onrender.com/leaderboard)
echo "$LB_RAW"
echo ""
echo "Length: ${#LB_RAW} bytes"
echo ""

echo "5. Try to parse with jq:"
echo "$SOCIAL_RAW" | jq '.' 2>&1 || echo "JSON parse failed"
echo ""

echo "=== Check if backend is returning HTML instead of JSON ==="
echo "$SOCIAL_RAW" | head -c 100
echo ""

