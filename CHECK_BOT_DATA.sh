#!/bin/bash
# Check if bot is sending data to backend

echo "=== Checking Backend for Bot Activity ==="
echo ""

echo "✅ STEP 1: Verify endpoint exists"
echo "Testing /integrations/twitter/events..."
RESPONSE=$(curl -skX POST https://five55-backend-wn5h.onrender.com/integrations/twitter/events \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' 2>&1)
echo "Response: $RESPONSE"
if [[ "$RESPONSE" == *"signature invalid"* ]] || [[ "$RESPONSE" == *"unauthorized"* ]]; then
  echo "✅ Endpoint exists and requires auth (this is good!)"
elif [[ "$RESPONSE" == *"404"* ]] || [[ "$RESPONSE" == *"Cannot POST"* ]]; then
  echo "❌ Endpoint not found - route not registered"
else
  echo "⚠️  Unexpected response"
fi
echo ""

echo "✅ STEP 2: Watch SSE for bot events"
echo "Connecting to SSE stream for 10 seconds..."
echo "(Look for 'social.events' or 'points.updates.social' messages)"
timeout 10 curl -skN https://five55-backend-wn5h.onrender.com/events 2>&1 | grep -E "(event:|data:)" | head -20
echo ""
echo "(If you see events, bot is connected!)"
echo ""

echo "✅ STEP 3: Check backend health"
curl -sk https://five55-backend-wn5h.onrender.com/healthz | jq '.'
echo ""

echo "=== Next Steps ==="
echo ""
echo "To check if bot is ACTUALLY sending data:"
echo "1. Go to Render Dashboard: https://dashboard.render.com/"
echo "2. Select: five55-backend-wn5h"
echo "3. Click: 'Logs' tab"
echo "4. Search for: 'post_published' or 'twitter'"
echo ""
echo "You should see log entries like:"
echo "  'Processing Twitter event: post_published'"
echo "  'Twitter handle: username'"
echo "  'Quest completed: social_post'"
echo ""
echo "If you DON'T see these logs:"
echo "→ Bot is not sending events (check bot logs)"
echo ""
echo "If you DO see these logs:"
echo "→ Integration is working! ✅"
echo ""

