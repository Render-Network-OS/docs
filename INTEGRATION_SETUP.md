# 555 Ecosystem Integration Setup Guide

## Overview
This guide explains how to set up the complete integration between the Twitter bot, backend, and 555x402 payment infrastructure for automated USDC rewards.

## Architecture

```
Twitter Bot (Eliza) → Backend (Go) → 555x402 API Gateway → Payment Services
                          ↓
                       Frontend (Next.js) via SSE
```

## Prerequisites

1. **555x402 Services Running**:
   - `hyperlink-link-service` (port 8083)
   - `api-gateway` (port 8090)
   - `cctp-orchestrator` (port 3006)
   - PostgreSQL database for hyperlink data

2. **Backend Services**:
   - `555d` backend server (port 9000)
   - PostgreSQL database
   - BadgerDB (optional, for backup)

3. **Bot Service**:
   - Eliza bot running with Twitter client
   - Access to Twitter API

4. **Frontend**:
   - Next.js app deployed (555-mono/apps/web)

## Environment Configuration

### 1. 555x402 API Gateway (`555x402/services/api-gateway`)

Create `.env`:
```env
LISTEN_ADDR=:8090
LINK_SERVICE_URL=http://hyperlink-link-service:8083
ORCHESTRATOR_URL=http://cctp-orchestrator:3006
FEE_ENGINE_URL=http://fee-engine:3003
API_KEYS=bot_key_xyz,backend_key_abc
RATE_LIMIT_RATE=100
RATE_LIMIT_BURST=200
LOG_REQUESTS=true
```

### 2. 555x402 CCTP Orchestrator (`555x402/services/cctp-orchestrator`)

Create `.env`:
```env
ORCHESTRATOR_PORT=3006
DATABASE_URL=postgresql://user:pass@postgres:5432/x402
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet
WAAS_API_KEY=your_circle_waas_key
INTERNAL_SERVICE_TOKEN=internal_secret_token
BACKEND_WEBHOOK_URL=http://backend:9000/webhooks/payment-status
BACKEND_WEBHOOK_SECRET=webhook_secret_123
NODE_ENV=production
```

### 3. Backend (`backend`)

Create `.env` or update `render.yaml`:
```env
POSTGRES_DSN=postgresql://user:pass@postgres:5432/five55
DB_PATH=/app/data/badger
BIND_ADDR=0.0.0.0:9000
RPC_URL=https://api.mainnet-beta.solana.com

# Hyperlink Integration
HYPERLINK_API_URL=http://api-gateway:8090
HYPERLINK_API_KEY=backend_key_abc

# Daily Payouts
DAILY_PAYOUT_ENABLED=true
DAILY_PAYOUT_POOL_USD=100.00
DAILY_PAYOUT_WINNERS_COUNT=10

# Webhook secret (should match orchestrator)
HYPERLINK_WEBHOOK_SECRET=webhook_secret_123

# Twitter Bot Integration
TWITTER_BOT_HMAC_SECRET=your_hmac_secret
TWITTER_BOT_KEY=your_bot_key
```

### 4. Twitter Bot (`555-bot`)

Create `.env`:
```env
# Twitter API
TWITTER_USERNAME=your_bot_username
TWITTER_PASSWORD=your_password
TWITTER_EMAIL=your_email

# Backend Integration
TWITTER_BOT_MAIN_API_BASE=http://backend:9000
TWITTER_BOT_HMAC_SECRET=your_hmac_secret
TWITTER_BOT_KEY=your_bot_key

# Hyperlink Integration
HYPERLINK_API_BASE=http://api-gateway:8090
HYPERLINK_API_KEY=bot_key_xyz

# Social Events (for listening to SSE)
SOCIAL_SSE_URL=http://backend:9000/events
```

## Database Migrations

### 1. 555x402 Hyperlink Database

Run migration:
```bash
cd 555x402
psql -d x402 -f infra/db/migrations/004_payment_jobs.sql
```

### 2. Backend Database

Run migration:
```bash
cd backend
psql -d five55 -f sql/migrations/008_usdc_payments.sql
```

## Service Startup Order

1. **Start 555x402 Infrastructure**:
   ```bash
   cd 555x402
   # Start hyperlink-link-service
   cd services/hyperlink-link-service
   go run main.go &
   
   # Start cctp-orchestrator
   cd ../cctp-orchestrator
   npm install
   npm start &
   
   # Start api-gateway
   cd ../api-gateway
   go run main.go &
   ```

2. **Start Backend**:
   ```bash
   cd backend
   go run cmd/555d/main.go
   ```

3. **Start Bot**:
   ```bash
   cd 555-bot
   pnpm install
   pnpm build
   pnpm start
   ```

4. **Start Frontend**:
   ```bash
   cd 555-mono/apps/web
   npm run dev
   ```

## Testing the Integration

### 1. Test Hyperlink Resolution

Create a test link:
```bash
curl -X POST http://localhost:8090/pub/v1/links \
  -H "X-API-Key: bot_key_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "testuser",
    "wallet": "HW8jtVSXXyvt8AbbJ2knx2jjNeSSrLbpA1QkzLGZ5iWq",
    "chainType": "solana",
    "model": "engagement",
    "splits": {"creator": 10000},
    "metadata": {"active": "true"}
  }'
```

Response:
```json
{
  "code": "abc123def",
  "url": "https://555.rendernet.work/p/abc123def",
  "chainType": "solana"
}
```

Test lookup by creator:
```bash
curl -X GET http://localhost:8090/pub/v1/links/by-creator/testuser \
  -H "X-API-Key: bot_key_xyz"
```

### 2. Test Bot → Backend Flow

1. Post a tweet with #555games and include hyperlink: "Play now! rendernet.work/p/abc123def"
2. Bot should detect tweet, extract hyperlink code
3. Bot resolves wallet via API
4. Bot sends event to backend with wallet + chain_type
5. Check backend logs for wallet resolution

### 3. Test Quest USDC Reward

Create a USDC quest:
```bash
curl -X POST http://localhost:9000/quests \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Post with #555games and get 5 USDC",
    "type": "social_post",
    "frequency": "once",
    "rules": {"hashtags": ["555games"]},
    "reward_type": "usdc",
    "reward_usdc": 5.00,
    "active_from": "2025-11-19T00:00:00Z",
    "active_to": "2025-12-31T23:59:59Z"
  }'
```

Post matching tweet and verify:
- Backend triggers payment
- Check `usdc_payments` table
- Check orchestrator logs
- Verify SSE event `quests.usdc_reward`

### 4. Test Daily Payouts

1. Accumulate points by playing games
2. Wait for midnight CST (or manually trigger)
3. Check backend logs for payout processing
4. Verify payments in `usdc_payments` table
5. Check SSE event `rewards.daily_payout`

## Monitoring

### Key Metrics

1. **Bot**:
   - Hyperlink resolution success rate
   - Tweets processed per minute
   - API error rate

2. **Backend**:
   - Quest USDC payments triggered
   - Daily payouts success rate
   - SSE connections active

3. **555x402**:
   - Payment job queue depth
   - Transaction success rate
   - Gas tanker balances

### Logs to Monitor

```bash
# Backend logs
tail -f /app/logs/backend.log | grep -i "hyperlink\|usdc\|payment"

# Orchestrator logs
tail -f /app/logs/orchestrator.log | grep -i "payment\|batch\|tx"

# Bot logs
tail -f /app/logs/bot.log | grep -i "hyperlink\|wallet"
```

## Troubleshooting

### Bot Can't Resolve Wallets
- Check `HYPERLINK_API_BASE` is set correctly
- Verify API key is valid
- Test API endpoint manually with curl
- Check API gateway is running

### Payments Not Triggering
- Verify `HYPERLINK_API_URL` in backend is correct
- Check hyperlink client initialization in logs
- Verify orchestrator is running
- Check database connection

### Daily Payouts Not Running
- Verify `DAILY_PAYOUT_ENABLED=true`
- Check scheduler startup in logs
- Verify midnight CST timing
- Check BadgerDB has points data

### Webhooks Not Received
- Verify `BACKEND_WEBHOOK_URL` in orchestrator
- Check webhook secret matches
- Test webhook endpoint manually
- Check firewall/network rules

## Production Checklist

- [ ] All services running with proper environment variables
- [ ] Database migrations applied
- [ ] API keys generated and secured
- [ ] Webhook secrets configured
- [ ] Monitoring dashboards set up
- [ ] Alert rules configured
- [ ] Gas tanker wallets funded
- [ ] Treasury wallet configured in WaaS
- [ ] Backup and disaster recovery tested
- [ ] Load testing completed
- [ ] Security audit performed

## Support

For issues or questions:
- Check logs first
- Review this guide
- Test each component in isolation
- Verify network connectivity between services

