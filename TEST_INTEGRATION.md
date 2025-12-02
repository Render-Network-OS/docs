# Integration Testing Guide

## Test Sequence

### Step 1: Verify 555x402 Services

**Test hyperlink-link-service:**
```bash
# Health check
curl http://localhost:8083/metrics

# Create test link
curl -X POST http://localhost:8083/links \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "alice_test",
    "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
    "chainType": "solana",
    "model": "engagement",
    "splits": {"creator": 10000},
    "metadata": {"active": "true", "test": "true"}
  }'

# Get link by code (use code from response above)
curl http://localhost:8083/links/YOUR_CODE_HERE

# Get link by creator
curl http://localhost:8083/links/by-creator/alice_test
```

**Test cctp-orchestrator:**
```bash
# Health check
curl http://localhost:3006/health

# Check stats
curl http://localhost:3006/stats

# Test batch payment endpoint (testnet mode)
curl -X POST http://localhost:3006/api/payments/batch \
  -H "Content-Type: application/json" \
  -d '{
    "payments": [{
      "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
      "amount": 5000000,
      "chainType": "solana",
      "metadata": {"test": true}
    }],
    "reason": "test"
  }'

# Check job status (use jobId from response)
curl http://localhost:3006/api/payments/status/YOUR_JOB_ID
```

**Test api-gateway:**
```bash
# Test link lookup through gateway
curl http://localhost:8090/pub/v1/links/by-creator/alice_test \
  -H "X-API-Key: bot_key_xyz"

# Test payment batch through gateway
curl -X POST http://localhost:8090/pub/v1/payments/batch \
  -H "X-API-Key: backend_key_abc" \
  -H "Content-Type: application/json" \
  -d '{
    "payments": [{
      "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
      "amount": 1000000,
      "chainType": "solana",
      "metadata": {"test": true}
    }],
    "reason": "test_integration"
  }'
```

### Step 2: Verify Backend Integration

**Test hyperlink client:**
```bash
# Make a test Twitter event with hyperlink code
curl -X POST http://localhost:9000/integrations/twitter/events \
  -H "X-Bot-Key: your_bot_key" \
  -H "X-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "X-Signature: test" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "type": "post_published",
    "tweet_id": "test_123",
    "url": "https://x.com/alice_test/status/123",
    "handle": "alice_test",
    "text": "Playing #555games! rendernet.work/p/YOUR_CODE",
    "metrics": {
      "likes": 10,
      "replies": 2,
      "reposts": 3,
      "quotes": 1,
      "bookmarks": 5,
      "views": 100
    },
    "idempotency_key": "test_integration_$(date +%s)"
  }'
```

Expected: Backend should resolve wallet from hyperlink code

**Test USDC quest:**
```bash
# Create USDC quest (requires admin token)
curl -X POST http://localhost:9000/quests \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test USDC Quest",
    "type": "social_post",
    "frequency": "once",
    "rules": {"hashtags": ["555test"]},
    "reward_type": "usdc",
    "reward_usdc": 5.00,
    "active_from": "2025-01-01T00:00:00Z",
    "active_to": "2026-12-31T23:59:59Z"
  }'

# Send matching event
curl -X POST http://localhost:9000/integrations/twitter/events \
  -H "X-Bot-Key: your_bot_key" \
  -H "X-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -H "X-Signature: test" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "type": "post_published",
    "tweet_id": "test_quest_$(date +%s)",
    "url": "https://x.com/alice_test/status/456",
    "handle": "alice_test",
    "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
    "chain_type": "solana",
    "text": "Testing #555test quest",
    "hashtags": ["555test"],
    "metrics": {"likes": 1},
    "idempotency_key": "test_quest_$(date +%s)"
  }'
```

Expected: Backend triggers USDC payment, records in database

**Check payment status:**
```sql
-- Connect to backend database
psql -d five55

-- Check usdc_payments table
SELECT id, wallet, amount_usdc, chain_type, reason, status, hyperlink_job_id, created_at
FROM usdc_payments
ORDER BY created_at DESC
LIMIT 10;
```

### Step 3: Test Bot Integration

**Prerequisites:**
- Bot must be running
- Bot must have access to Twitter API
- Test Twitter account must exist

**Test hyperlink resolution:**

1. Add hyperlink to test account bio: "rendernet.work/p/YOUR_CODE"
2. Post tweet mentioning bot: "Hey @yourbot check out my game!"
3. Bot should:
   - Detect mention
   - Fetch user profile
   - Extract hyperlink from bio
   - Resolve wallet
   - Send event to backend with wallet

**Check bot logs:**
```bash
# Look for hyperlink resolution logs
grep -i "hyperlink\|resolved wallet" /path/to/bot.log

# Check for API calls
grep -i "HYPERLINK_API_BASE" /path/to/bot.log
```

### Step 4: Test Daily Payouts

**Manual trigger (for testing):**

1. Accumulate test points:
```bash
# Add points for test wallets
# (Use your game scoring system or direct database insert)

# In backend database:
INSERT INTO global_points (wallet, points, period, key, game_id, mode, created_at, updated_at)
VALUES 
  ('wallet1', 1000, 'day', '2025-11-19', 'all', 'real', NOW(), NOW()),
  ('wallet2', 800, 'day', '2025-11-19', 'all', 'real', NOW(), NOW()),
  ('wallet3', 600, 'day', '2025-11-19', 'all', 'real', NOW(), NOW());
```

2. Manually trigger payout (or wait for midnight CST):
```bash
# Option A: Restart backend at midnight CST to trigger immediately

# Option B: Use custom trigger endpoint (if you add one):
curl -X POST http://localhost:9000/admin/trigger-daily-payout \
  -H "Authorization: Bearer your_admin_token"
```

3. Verify payout:
```sql
SELECT * FROM usdc_payments WHERE reason = 'daily_winner' ORDER BY created_at DESC;
```

4. Check orchestrator:
```bash
curl http://localhost:3006/api/payments/status/JOB_ID
```

### Step 5: Test SSE Events

**Connect to SSE stream:**
```bash
# Terminal 1: Listen to events
curl -N http://localhost:9000/events
```

**Trigger events:**
```bash
# Terminal 2: Send Twitter event
curl -X POST http://localhost:9000/integrations/twitter/events \
  -H "X-Bot-Key: your_bot_key" \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitter","type":"post_published","tweet_id":"test_sse",...}'
```

Expected events in Terminal 1:
- `social.events` - Tweet posted
- `points.updates.social` - Points awarded
- `quests.updates` - Quest progress (if matched)
- `quests.usdc_reward` - USDC payment triggered (if quest matched)
- `payment.confirmed` - Payment confirmed (after settlement)

### Step 6: Test Frontend

1. Open http://localhost:3000
2. Connect wallet
3. Check leaderboard updates (should refresh via SSE)
4. Navigate to payment history (if UI added to dashboard)
5. Verify payments display correctly

## Expected Behavior

### Normal Flow (Points Quest)
1. User posts tweet with #555games
2. Bot detects → sends event to backend
3. Backend scores tweet → awards points
4. SSE updates frontend leaderboard
5. User sees points increase in real-time

### USDC Quest Flow
1. User posts tweet matching quest rules
2. Bot detects → sends event with wallet (from hyperlink)
3. Backend matches quest rules
4. Backend triggers USDC payment via 555x402
5. 555x402 orchestrator processes payment
6. Payment settles on-chain (Solana/Base/Polygon)
7. Webhook notifies backend
8. SSE updates frontend with payment confirmation
9. User sees USDC in wallet

### Daily Payout Flow
1. Midnight CST triggers scheduler
2. Backend computes top 10 players
3. Backend allocates $100 pool pro-rata
4. Backend triggers batch payment
5. 555x402 processes multi-chain payments
6. Payments settle on respective chains
7. SSE broadcasts winner list
8. Frontend displays payout notifications

## Validation Checklist

- [ ] Hyperlink service resolves codes correctly
- [ ] Hyperlink service resolves Twitter handles correctly
- [ ] API gateway proxies requests correctly
- [ ] Bot detects hyperlinks in tweets
- [ ] Bot detects hyperlinks in bios
- [ ] Bot sends chain_type in events
- [ ] Backend resolves wallets via hyperlink
- [ ] USDC quests trigger payments
- [ ] Points quests award points (no payment)
- [ ] Daily payouts trigger at midnight
- [ ] Multi-chain payments work (Solana, Base, Polygon)
- [ ] Payment status webhooks received
- [ ] SSE events broadcast correctly
- [ ] Frontend displays payments
- [ ] Idempotency prevents duplicate payments
- [ ] Error handling works correctly

## Common Issues

### Issue: Bot can't connect to API gateway
**Solution**: Check network connectivity, verify API_KEYS match

### Issue: Backend can't trigger payments
**Solution**: Verify hyperlink client initialized, check logs for errors

### Issue: Payments stuck in "pending"
**Solution**: Check orchestrator logs, verify WaaS is configured, check gas tanker balances

### Issue: Duplicate payments
**Solution**: Verify idempotency logic, check database constraints

### Issue: SSE not updating
**Solution**: Check SSE hub is running, verify client connection, check firewall

## Performance Benchmarks

Expected performance:
- Bot → Backend latency: <500ms
- Backend → 555x402 API latency: <200ms
- Solana payment confirmation: <30 seconds
- EVM payment confirmation: <2 minutes
- SSE broadcast latency: <100ms
- Daily payout processing: <5 minutes for 100 winners

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Test with real (small) USDC amounts on testnet
3. Monitor for 1 week
4. Deploy to production with limited pool ($10/day)
5. Gradually scale up to target pool ($100+/day)
6. Launch public quest campaigns

