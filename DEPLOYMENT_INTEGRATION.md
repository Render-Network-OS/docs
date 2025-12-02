# 555 Ecosystem Deployment Guide

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (555-mono/apps/web)                       │
│                  Next.js on Vercel/Render                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
                   ↓
┌──────────────────────────────────────────────────────────────┐
│                      Backend (Go)                             │
│                    Port: 9000                                 │
│  • Points scoring • Quest matching • Daily payouts           │
│  • SSE broadcasting • Hyperlink client                       │
└──────┬───────────────────────────────┬───────────────────────┘
       │                               │
       │ HTTP                          │ Webhook
       ↓                               ↓
┌──────────────────────┐      ┌───────────────────────────────┐
│   Twitter Bot        │      │    555x402 API Gateway        │
│   (Eliza/Node.js)    │      │    Port: 8090                 │
│ • Monitors Twitter   │◄─────┤  • Rate limiting              │
│ • Extracts hyperlinks│      │  • Proxies to services        │
│ • Sends events       │      └──┬──────────┬─────────────┬───┘
└──────────────────────┘         │          │             │
                                 ↓          ↓             ↓
                        ┌────────────┐ ┌─────────────┐ ┌─────────────┐
                        │ Hyperlink  │ │    CCTP     │ │ Fee Engine  │
                        │ Link Svc   │ │ Orchestrator│ │    3003     │
                        │   8083     │ │    3006     │ └─────────────┘
                        └────────────┘ └─────────────┘
                             │              │
                             ↓              ↓
                        ┌────────────────────────┐
                        │   PostgreSQL (x402)    │
                        │ • hyperlink_links      │
                        │ • payment_jobs         │
                        └────────────────────────┘
```

## Deployment Steps

### 1. Prepare Environment Files

**555x402/.env**:
```env
# API Gateway
API_KEYS=bot_production_key_xyz,backend_production_key_abc
LINK_SERVICE_URL=http://hyperlink-link-service:8083
ORCHESTRATOR_URL=http://cctp-orchestrator:3006
FEE_ENGINE_URL=http://fee-engine:3003

# Database
POSTGRES_URL=postgresql://x402user:password@postgres:5432/x402

# Orchestrator
WAAS_API_KEY=your_circle_production_key
BACKEND_WEBHOOK_URL=https://api.555games.com/webhooks/payment-status
BACKEND_WEBHOOK_SECRET=production_webhook_secret_456
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**backend/.env**:
```env
# Database
POSTGRES_DSN=postgresql://backend:password@postgres:5432/five55
DB_PATH=/app/data/badger

# Server
BIND_ADDR=0.0.0.0:9000

# Hyperlink Integration
HYPERLINK_API_URL=https://x402-api.555games.com
HYPERLINK_API_KEY=backend_production_key_abc
HYPERLINK_WEBHOOK_SECRET=production_webhook_secret_456

# Daily Payouts
DAILY_PAYOUT_ENABLED=true
DAILY_PAYOUT_POOL_USD=100.00
DAILY_PAYOUT_WINNERS_COUNT=10

# Twitter Bot
TWITTER_BOT_HMAC_SECRET=production_hmac_secret
TWITTER_BOT_KEY=production_bot_key
```

**555-bot/.env**:
```env
# Twitter API
TWITTER_USERNAME=555games_bot
TWITTER_PASSWORD=secure_password

# Backend
TWITTER_BOT_MAIN_API_BASE=https://api.555games.com
TWITTER_BOT_HMAC_SECRET=production_hmac_secret
TWITTER_BOT_KEY=production_bot_key

# Hyperlink
HYPERLINK_API_BASE=https://x402-api.555games.com
HYPERLINK_API_KEY=bot_production_key_xyz

# SSE
SOCIAL_SSE_URL=https://api.555games.com/events
```

### 2. Database Migrations

**Run 555x402 migration:**
```bash
# SSH into database server or use Kubernetes job
psql -h postgres.x402.internal -U x402user -d x402 << EOF
CREATE TABLE IF NOT EXISTS payment_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'queued',
  reason TEXT NOT NULL,
  payments JSONB NOT NULL,
  tx_hashes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_jobs_status ON payment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_created ON payment_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_reason ON payment_jobs(reason);
EOF
```

**Run backend migration:**
```bash
psql -h postgres.backend.internal -U backenduser -d five55 << EOF
$(cat backend/sql/migrations/008_usdc_payments.sql)
EOF
```

### 3. Deploy Services

**Option A: Docker Compose (Local/Staging)**

Create `docker-compose.integration.yaml`:
```yaml
version: '3.8'

services:
  postgres-x402:
    image: postgres:15
    environment:
      POSTGRES_DB: x402
      POSTGRES_USER: x402user
      POSTGRES_PASSWORD: password
    volumes:
      - x402-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  postgres-backend:
    image: postgres:15
    environment:
      POSTGRES_DB: five55
      POSTGRES_USER: backenduser
      POSTGRES_PASSWORD: password
    volumes:
      - backend-data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
  
  hyperlink-link-service:
    build:
      context: ./555x402/services/hyperlink-link-service
    environment:
      POSTGRES_URL: postgresql://x402user:password@postgres-x402:5432/x402
      LISTEN_ADDR: :8083
    ports:
      - "8083:8083"
    depends_on:
      - postgres-x402
  
  cctp-orchestrator:
    build:
      context: ./555x402/services/cctp-orchestrator
    environment:
      DATABASE_URL: postgresql://x402user:password@postgres-x402:5432/x402
      ORCHESTRATOR_PORT: 3006
      BACKEND_WEBHOOK_URL: http://backend:9000/webhooks/payment-status
      BACKEND_WEBHOOK_SECRET: webhook_secret_123
    ports:
      - "3006:3006"
    depends_on:
      - postgres-x402
  
  api-gateway:
    build:
      context: ./555x402/services/api-gateway
    environment:
      LISTEN_ADDR: :8090
      LINK_SERVICE_URL: http://hyperlink-link-service:8083
      ORCHESTRATOR_URL: http://cctp-orchestrator:3006
      API_KEYS: bot_key_xyz,backend_key_abc
    ports:
      - "8090:8090"
    depends_on:
      - hyperlink-link-service
      - cctp-orchestrator
  
  backend:
    build:
      context: ./backend
    environment:
      POSTGRES_DSN: postgresql://backenduser:password@postgres-backend:5432/five55
      BIND_ADDR: 0.0.0.0:9000
      HYPERLINK_API_URL: http://api-gateway:8090
      HYPERLINK_API_KEY: backend_key_abc
      DAILY_PAYOUT_ENABLED: "true"
      DAILY_PAYOUT_POOL_USD: "100.00"
      DAILY_PAYOUT_WINNERS_COUNT: "10"
    ports:
      - "9000:9000"
    volumes:
      - badger-data:/app/data
    depends_on:
      - postgres-backend
      - api-gateway
  
  bot:
    build:
      context: ./555-bot
    environment:
      TWITTER_BOT_MAIN_API_BASE: http://backend:9000
      HYPERLINK_API_BASE: http://api-gateway:8090
      HYPERLINK_API_KEY: bot_key_xyz
      SOCIAL_SSE_URL: http://backend:9000/events
    depends_on:
      - backend
      - api-gateway

volumes:
  x402-data:
  backend-data:
  badger-data:
```

Start services:
```bash
docker-compose -f docker-compose.integration.yaml up -d
```

**Option B: Kubernetes (Production)**

Update `555x402/infra/k8s/apps/api-gateway.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: x402-api-gateway
  namespace: x402
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: registry.example.com/x402-api-gateway:latest
        ports:
        - containerPort: 8090
        env:
        - name: API_KEYS
          valueFrom:
            secretKeyRef:
              name: x402-secrets
              key: api-keys
        - name: LINK_SERVICE_URL
          value: "http://hyperlink-link-service:8083"
        - name: ORCHESTRATOR_URL
          value: "http://cctp-orchestrator:3006"
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8090
          initialDelaySeconds: 10
          periodSeconds: 30
```

Update `backend/render.yaml` to include new environment variables:
```yaml
services:
  - type: web
    name: five55-backend
    env: docker
    envVars:
      # ... existing vars ...
      - key: HYPERLINK_API_URL
        value: https://x402-api.555games.com
      - key: HYPERLINK_API_KEY
        sync: false
      - key: HYPERLINK_WEBHOOK_SECRET
        sync: false
      - key: DAILY_PAYOUT_ENABLED
        value: "true"
      - key: DAILY_PAYOUT_POOL_USD
        value: "100.00"
      - key: DAILY_PAYOUT_WINNERS_COUNT
        value: "10"
```

### 4. Deploy Frontend Updates

Update `555-mono/apps/web/app/dashboard/page.tsx` to include PaymentHistory:

```typescript
import PaymentHistory from '@/components/PaymentHistory';

export default function DashboardPage() {
  return (
    <div>
      {/* ... existing components ... */}
      
      <div className="mt-8">
        <PaymentHistory limit={20} />
      </div>
    </div>
  );
}
```

Deploy:
```bash
cd 555-mono/apps/web
npm run build
# Deploy to Vercel or Render
```

### 5. Monitoring Setup

**Prometheus Metrics to Track:**

```yaml
# 555x402 metrics
- hyperlink_events_total{kind, code}
- payment_jobs_total{status, reason}
- payment_processing_duration_seconds

# Backend metrics (add these)
- usdc_payments_triggered_total{reason, chain}
- usdc_payments_completed_total{chain}
- usdc_payments_failed_total{chain, error_type}
- hyperlink_api_calls_total{endpoint, status}
- daily_payout_duration_seconds
- quest_usdc_rewards_total
```

**Grafana Dashboard Queries:**

```promql
# Payment success rate
rate(usdc_payments_completed_total[5m]) / rate(usdc_payments_triggered_total[5m])

# Daily payout latency
histogram_quantile(0.95, payment_processing_duration_seconds_bucket{reason="daily_rewards"})

# Quest USDC distribution
sum(rate(quest_usdc_rewards_total[1h])) by (quest_id)
```

**Alerts to Configure:**

```yaml
alerts:
  - alert: PaymentFailureRateHigh
    expr: rate(usdc_payments_failed_total[5m]) / rate(usdc_payments_triggered_total[5m]) > 0.05
    for: 5m
    annotations:
      summary: "Payment failure rate above 5%"
  
  - alert: DailyPayoutFailed
    expr: time() - daily_payout_last_success_timestamp > 86400
    annotations:
      summary: "Daily payout hasn't run in 24 hours"
  
  - alert: HyperlinkAPIDown
    expr: up{job="api-gateway"} == 0
    for: 2m
    annotations:
      summary: "555x402 API Gateway is down"
  
  - alert: PaymentQueueBacklog
    expr: payment_jobs_total{status="queued"} > 50
    for: 10m
    annotations:
      summary: "Large payment queue backlog"
```

### 6. Security Checklist

- [ ] Rotate all API keys before production
- [ ] Use strong HMAC secrets (64+ characters)
- [ ] Enable HTTPS/TLS for all services
- [ ] Restrict database access to service accounts only
- [ ] Use secrets management (Kubernetes Secrets, Vault, etc.)
- [ ] Enable rate limiting on all public endpoints
- [ ] Configure firewall rules (only allow necessary ports)
- [ ] Set up VPC/network isolation
- [ ] Enable audit logging for all payment triggers
- [ ] Configure backup and disaster recovery
- [ ] Set up monitoring and alerting
- [ ] Perform security audit of smart contracts
- [ ] Test with small amounts first ($10-50 pool)

### 7. Rollout Plan

**Week 1: Testnet Deployment**
- Deploy all services to staging with testnet RPC
- Create test hyperlinks for 5-10 test users
- Run integration tests
- Verify payments on testnet explorers
- Monitor logs for errors

**Week 2: Mainnet Soft Launch**
- Deploy to production
- Set daily pool to $10
- Enable for 20 beta users only
- Monitor closely for 7 days
- Fix any issues discovered

**Week 3: Scale Up**
- Increase pool to $50
- Open to 100 users
- Launch first USDC quest campaigns
- Monitor payment success rate
- Optimize gas/fees as needed

**Week 4: Full Launch**
- Increase pool to $100+
- Open to all users
- Launch multiple quest types
- Announce publicly
- Monitor and scale

### 8. Health Checks

**Pre-deployment Checks:**
```bash
# Check all services are running
curl http://api-gateway:8090/api/v1/health
curl http://backend:9000/healthz
curl http://cctp-orchestrator:3006/health

# Check database connectivity
psql -h postgres -U x402user -d x402 -c "SELECT COUNT(*) FROM payment_jobs;"
psql -h postgres -U backenduser -d five55 -c "SELECT COUNT(*) FROM usdc_payments;"

# Check hyperlink link service
curl http://api-gateway:8090/pub/v1/links/test_code -H "X-API-Key: test_key"
```

**Post-deployment Verification:**
```bash
# Create test link and verify lookup works
TEST_CODE=$(curl -X POST http://api-gateway:8090/pub/v1/links \
  -H "X-API-Key: backend_key" \
  -H "Content-Type: application/json" \
  -d '{"creatorId":"healthcheck","wallet":"test","chainType":"solana","model":"test","splits":{},"metadata":{}}' \
  | jq -r '.code')

curl http://api-gateway:8090/pub/v1/links/by-creator/healthcheck \
  -H "X-API-Key: backend_key"

# Verify bot can resolve hyperlinks
# (Check bot logs for "Resolved wallet from hyperlink")

# Test SSE connection
curl -N http://backend:9000/events
```

### 9. Backup and Recovery

**Database Backups:**
```bash
# Automated daily backups
0 2 * * * pg_dump -h postgres -U x402user x402 | gzip > /backups/x402_$(date +\%Y\%m\%d).sql.gz
0 3 * * * pg_dump -h postgres -U backenduser five55 | gzip > /backups/backend_$(date +\%Y\%m\%d).sql.gz
```

**Service Recovery:**
- Use Kubernetes Deployments with rolling updates
- Set replica count to 3+ for critical services
- Configure auto-restart policies
- Use health checks and readiness probes

### 10. Cost Estimation

**Monthly Costs (Estimated):**
- Kubernetes cluster (3 nodes): $150
- PostgreSQL (managed): $75
- Solana RPC (premium): $50
- Circle WaaS: $0 (free tier) to $500+ (depends on volume)
- Gas costs (Solana): ~$5-10 per day for 100 payments
- Gas costs (Base/Polygon): ~$20-50 per day (using gasless where possible)
- Monitoring (Datadog/NewRelic): $50-100
- **Total**: ~$500-1000/month + USDC pool ($3,000/month for $100/day pool)

### 11. Scaling Considerations

**Current Capacity:**
- Backend: ~1000 requests/sec
- API Gateway: ~500 requests/sec with rate limiting
- Orchestrator: ~50 concurrent payment jobs
- Bot: ~100 tweets monitored per minute

**Scaling Triggers:**
- Add replicas when CPU > 70%
- Add database read replicas when queries slow down
- Increase orchestrator workers when job queue > 100
- Upgrade RPC endpoints when rate limits hit

**Bottlenecks to Watch:**
- Database connections (pool size)
- Blockchain RPC rate limits
- WaaS transaction signing rate
- SSE connection count
- Twitter API rate limits

### 12. Maintenance Windows

**Recommended Schedule:**
- Deploy updates: Tuesday/Thursday 2-4 AM UTC
- Database maintenance: Sunday 3-5 AM UTC
- Never deploy on: Friday evening, weekends
- Always test in staging first

## Deployment Commands

### Build and Deploy Services

```bash
# Build 555x402 services
cd 555x402/services
for svc in api-gateway hyperlink-link-service; do
  cd $svc
  docker build -t registry.example.com/x402-$svc:latest .
  docker push registry.example.com/x402-$svc:latest
  cd ..
done

# Build cctp-orchestrator
cd cctp-orchestrator
npm run build
docker build -t registry.example.com/x402-orchestrator:latest .
docker push registry.example.com/x402-orchestrator:latest

# Deploy to Kubernetes
kubectl apply -f 555x402/infra/k8s/apps/
kubectl rollout status deployment/api-gateway -n x402
kubectl rollout status deployment/cctp-orchestrator -n x402

# Build and deploy backend
cd backend
docker build -t registry.example.com/555-backend:latest .
docker push registry.example.com/555-backend:latest
kubectl rollout restart deployment/backend -n five55

# Build and deploy bot
cd 555-bot
docker build -t registry.example.com/555-bot:latest .
docker push registry.example.com/555-bot:latest
kubectl rollout restart deployment/bot -n five55
```

### Verify Deployment

```bash
# Check pod status
kubectl get pods -n x402
kubectl get pods -n five55

# Check logs
kubectl logs -f deployment/api-gateway -n x402
kubectl logs -f deployment/backend -n five55
kubectl logs -f deployment/bot -n five55

# Test endpoints
kubectl port-forward svc/api-gateway 8090:8090 -n x402
curl http://localhost:8090/api/v1/health
```

## Rollback Procedure

If deployment fails:

```bash
# Rollback Kubernetes deployments
kubectl rollout undo deployment/api-gateway -n x402
kubectl rollout undo deployment/cctp-orchestrator -n x402
kubectl rollout undo deployment/backend -n five55
kubectl rollout undo deployment/bot -n five55

# Rollback database migrations (if needed)
psql -h postgres -U x402user -d x402 << EOF
DROP TABLE IF EXISTS payment_jobs;
EOF

psql -h postgres -U backenduser -d five55 << EOF
DROP TABLE IF EXISTS usdc_payments;
ALTER TABLE quest_definitions DROP COLUMN IF EXISTS reward_type;
ALTER TABLE quest_definitions DROP COLUMN IF EXISTS reward_usdc;
EOF

# Verify services are stable
kubectl get pods -n x402
kubectl get pods -n five55
```

## Success Criteria

✅ All services healthy and responding
✅ Hyperlink resolution working (95%+ success rate)
✅ USDC quest payments triggering correctly
✅ Daily payouts running at midnight CST
✅ Multi-chain payments working (Solana, Base, Polygon)
✅ SSE events broadcasting properly
✅ Frontend displaying payments
✅ Zero duplicate payments
✅ Payment success rate > 99%
✅ Average payment confirmation time < 2 minutes

## Post-Deployment Tasks

1. Monitor logs for 24 hours
2. Verify first daily payout runs successfully
3. Test each quest type
4. Check gas tanker balances daily
5. Review payment success rates
6. Optimize fee estimation if needed
7. Document any issues and solutions
8. Update runbooks based on learnings

