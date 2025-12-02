#!/bin/bash
# 555 Integration Health Check

echo "=== 555 Integration Health Check ==="
echo ""

echo "1. Backend Health:"
curl -s -w "\nStatus: %{http_code}\n" https://five55-backend-wn5h.onrender.com/health || echo "❌ Backend unreachable"

echo ""
echo "2. Active Quests:"
QUEST_COUNT=$(curl -s https://five55-backend-wn5h.onrender.com/quests 2>/dev/null | jq '.quests | length' 2>/dev/null)
if [ -n "$QUEST_COUNT" ]; then
  echo "✅ $QUEST_COUNT active quests"
else
  echo "❌ Could not fetch quests"
fi

echo ""
echo "3. Leaderboard Size:"
LB_COUNT=$(curl -s https://five55-backend-wn5h.onrender.com/leaderboard 2>/dev/null | jq '.leaderboard | length' 2>/dev/null)
if [ -n "$LB_COUNT" ]; then
  echo "✅ $LB_COUNT users on leaderboard"
else
  echo "❌ Could not fetch leaderboard"
fi

echo ""
echo "4. Recent Twitter Events:"
EVENT_COUNT=$(curl -s https://five55-backend-wn5h.onrender.com/social/latest 2>/dev/null | jq '.events | length' 2>/dev/null)
if [ -n "$EVENT_COUNT" ]; then
  echo "✅ $EVENT_COUNT recent events"
else
  echo "❌ Could not fetch events"
fi

echo ""
echo "5. SSE Connection Test:"
timeout 3 curl -N -s https://five55-backend-wn5h.onrender.com/events 2>&1 | head -1
echo "(Connection test - timeout is normal)"

echo ""
echo "6. Hyperlink API:"
curl -s -w "Status: %{http_code}\n" -o /dev/null http://api.555hyper.link/pub/v1/links/test && echo "✅ Hyperlink API accessible" || echo "❌ Hyperlink API down"

echo ""
echo "=== Health Check Complete ==="
