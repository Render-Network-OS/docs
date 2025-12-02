# 555 Ecosystem Integration - Quick Reference

## 🚀 Quick Start

### Start All Services (Local)

```bash
# Terminal 1: 555x402 services
cd 555x402
docker-compose up -d postgres redis
cd services/hyperlink-link-service && go run main.go &
cd ../cctp-orchestrator && npm start &
cd ../api-gateway && go run main.go &

# Terminal 2: Backend
cd backend
export HYPERLINK_API_URL=http://localhost:8090
export HYPERLINK_API_KEY=backend_key_abc
export DAILY_PAYOUT_ENABLED=true
go run cmd/555d/main.go

# Terminal 3: Bot
cd 555-bot
export HYPERLINK_API_BASE=http://localhost:8090
export HYPERLINK_API_KEY=bot_key_xyz
pnpm start

# Terminal 4: Frontend
cd 555-mono/apps/web
npm run dev
```

---

## 🔑 Key Endpoints

### 555x402 API Gateway (Port 8090)
```bash
# Lookup wallet by hyperlink code
GET /pub/v1/links/{code}
Header: X-API-Key: bot_key_xyz

# Lookup wallet by Twitter handle
GET /pub/v1/links/by-creator/{handle}
Header: X-API-Key: bot_key_xyz

# Trigger batch payment
POST /pub/v1/payments/batch
Header: X-API-Key: backend_key_abc
Body: {
  "payments": [{
    "wallet": "HW8jt...",
    "amount": 5000000,
    "chainType": "solana",
    "metadata": {}
  }],
  "reason": "quest_completion"
}

# Check payment status
GET /pub/v1/payments/status/{jobId}
Header: X-API-Key: backend_key_abc
```

### Backend (Port 9000)
```bash
# Twitter events (from bot)
POST /integrations/twitter/events
Headers: X-Bot-Key, X-Signature, X-Timestamp

# Payment webhooks (from orchestrator)
POST /webhooks/payment-status
Headers: X-Signature, X-Timestamp

# User payment history
GET /api/me/payments?limit=10
Requires: Authentication cookie

# SSE stream
GET /events
```

---

## 📊 Database Quick Queries

### Check Recent USDC Payments
```sql
-- Backend database
SELECT 
  wallet, 
  amount_usdc, 
  chain_type, 
  reason, 
  status, 
  tx_hash,
  created_at
FROM usdc_payments
ORDER BY created_at DESC
LIMIT 20;
```

### Check Quest Rewards
```sql
SELECT 
  q.title,
  q.reward_type,
  q.reward_usdc,
  qa.wallet,
  qa.points,
  qa.awarded_at
FROM quest_awards qa
JOIN quest_definitions q ON qa.quest_id = q.id
WHERE q.reward_type = 'usdc'
ORDER BY qa.awarded_at DESC
LIMIT 10;
```

### Check Payment Jobs
```sql
-- 555x402 database
SELECT 
  id,
  status,
  reason,
  jsonb_array_length(payments) as payment_count,
  jsonb_array_length(tx_hashes) as tx_count,
  created_at,
  completed_at
FROM payment_jobs
ORDER BY created_at DESC
LIMIT 20;
```

### Check Hyperlink Mappings
```sql
-- 555x402 database
SELECT 
  creator_id,
  wallet,
  chain_type,
  created_at
FROM hyperlink_links
WHERE creator_id LIKE '%test%'
ORDER BY created_at DESC;
```

---

## 🐛 Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Bot can't resolve wallet | Empty wallet in events | Check hyperlink exists in database, verify API key |
| Payment stuck in pending | Status never updates | Check orchestrator logs, verify webhook URL |
| Duplicate payments | Same quest paid twice | Check idempotency logic, review database constraints |
| Daily payout not running | No payout at midnight | Check scheduler logs, verify DAILY_PAYOUT_ENABLED=true |
| SSE not updating | Frontend doesn't refresh | Check SSE connection, verify backend broadcasts |
| Webhook not received | Payment status not updating | Check webhook URL reachable, verify signature |

---

## 🔧 Configuration Matrix

| Service | Port | Database | Auth Method | Rate Limit |
|---------|------|----------|-------------|------------|
| hyperlink-link-service | 8083 | x402 | None (internal) | None |
| cctp-orchestrator | 3006 | x402 | Internal token | None |
| api-gateway | 8090 | None | X-API-Key | 100/min |
| backend | 9000 | five55 + badger | Session cookie | None |
| bot | N/A | None | Bot key | None |
| frontend | 3000 | None | Session | None |

---

## 📈 Quest Examples

### Social Engagement Quest (USDC)
```json
{
  "title": "Post with #555games and get 5 USDC",
  "type": "social_post",
  "frequency": "once",
  "rules": {
    "hashtags": ["555games"],
    "min_likes": 0
  },
  "reward_type": "usdc",
  "reward_usdc": 5.00,
  "active_from": "2025-11-19T00:00:00Z",
  "active_to": "2025-12-31T23:59:59Z"
}
```

### High Engagement Quest (USDC)
```json
{
  "title": "Get 100 likes and earn 10 USDC",
  "type": "social_post",
  "frequency": "once",
  "rules": {
    "hashtags": ["555games"],
    "min_likes": 100
  },
  "reward_type": "usdc",
  "reward_usdc": 10.00,
  "caps": {
    "per_wallet_total_points": 1
  }
}
```

### Daily Participation Quest (Points + USDC)
```json
{
  "title": "Daily post bonus",
  "type": "social_post",
  "frequency": "daily",
  "rules": {
    "hashtags": ["555games"]
  },
  "reward_type": "usdc",
  "reward_usdc": 1.00,
  "reward_points": 100
}
```

---

## 🔐 Security Checklist

**Before Production:**
- [ ] Generate new API keys (64+ character random strings)
- [ ] Generate new HMAC secrets (64+ character random strings)
- [ ] Generate new webhook secret (64+ character random string)
- [ ] Enable HTTPS for all public endpoints
- [ ] Configure firewall to block direct access to internal services
- [ ] Set up VPC/network segmentation
- [ ] Enable database encryption at rest
- [ ] Enable audit logging
- [ ] Configure backup retention (30 days minimum)
- [ ] Set up monitoring alerts
- [ ] Review and approve smart contract interactions
- [ ] Perform load testing
- [ ] Perform penetration testing
- [ ] Review CCTP transaction flow end-to-end

---

## 📱 Quick Test Commands

### Test Wallet Resolution
```bash
# Create test link
curl -X POST http://localhost:8090/pub/v1/links \
  -H "X-API-Key: test_key" \
  -H "Content-Type: application/json" \
  -d '{"creatorId":"alice","wallet":"HW8jt...","chainType":"solana","model":"test","splits":{},"metadata":{}}'

# Lookup by handle
curl http://localhost:8090/pub/v1/links/by-creator/alice \
  -H "X-API-Key: test_key"
```

### Test USDC Payment
```bash
# Trigger payment
curl -X POST http://localhost:8090/pub/v1/payments/batch \
  -H "X-API-Key: backend_key" \
  -H "Content-Type: application/json" \
  -d '{
    "payments": [{"wallet":"HW8jt...","amount":5000000,"chainType":"solana"}],
    "reason":"test"
  }'

# Check status
curl http://localhost:8090/pub/v1/payments/status/JOB_ID \
  -H "X-API-Key: backend_key"
```

### Test Bot Integration
```bash
# Send test event
curl -X POST http://localhost:9000/integrations/twitter/events \
  -H "X-Bot-Key: test_bot_key" \
  -H "Content-Type: application/json" \
  -d '{
    "platform":"twitter",
    "type":"post_published",
    "tweet_id":"test123",
    "handle":"alice",
    "text":"Playing #555games! rendernet.work/p/abc123",
    "hashtags":["555games"],
    "metrics":{"likes":10}
  }'
```

---

## 📞 Support Contacts

- **Technical Issues**: Check logs first, then backend/internal/api/*
- **Payment Issues**: Check orchestrator logs at services/cctp-orchestrator/
- **Bot Issues**: Check bot logs at 555-bot/packages/client-twitter/
- **Database Issues**: Check migrations at sql/migrations/ or infra/db/migrations/

---

## 🎯 Launch Checklist

**Pre-Launch:**
- [ ] All services deployed and healthy
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] API keys generated and distributed
- [ ] Monitoring dashboards set up
- [ ] Alert rules configured
- [ ] Backup procedures tested
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Integration tests passed

**Launch Day:**
- [ ] Set daily pool to $10 initially
- [ ] Monitor logs continuously for first 4 hours
- [ ] Verify first payments go through successfully
- [ ] Check SSE events broadcasting
- [ ] Verify frontend updates in real-time
- [ ] Monitor gas tanker balances
- [ ] Check error rates
- [ ] Verify idempotency working

**Post-Launch (First Week):**
- [ ] Monitor daily payout execution
- [ ] Track payment success rates
- [ ] Review user feedback
- [ ] Optimize gas/fees if needed
- [ ] Scale services if needed
- [ ] Document any issues
- [ ] Gradually increase pool ($10 → $25 → $50 → $100)

**Success Criteria:**
- No duplicate payments ✅
- >99% payment success rate ✅
- <2 minute average payment time ✅
- No security incidents ✅
- Positive user feedback ✅

---

## 📝 Quick Links

- [Complete Implementation Summary](./INTEGRATION_COMPLETE.md)
- [Setup Guide](./INTEGRATION_SETUP.md)
- [Testing Guide](./TEST_INTEGRATION.md)
- [Deployment Guide](./DEPLOYMENT_INTEGRATION.md)
- [Original Plan](./555.plan.md)

