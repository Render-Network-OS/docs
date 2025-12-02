# Secrets Configuration Guide

## ✅ Changes Committed Successfully

All changes have been committed to their respective repositories:

1. ✅ **555x402-hyperlink-link-service** - Commit `1c6a917`
2. ✅ **555x402-api-gateway** - Commit `e4bbda4`
3. ✅ **555x402-cctp-orchestrator** - Commit `998eaf6`
4. ✅ **backend** - Commit `dbe177b`
5. ✅ **555-bot** - Commit `2d30fb0c`
6. ✅ **555-mono** - Commit `cd02b25`

---

## 🔐 Secrets to Configure

### 1. Backend (Render.yaml - Already Updated)

The following secrets need to be set in Render dashboard:

**Secret Environment Variables (sync: false):**

```
HYPERLINK_API_KEY
- Description: API key for 555x402 API Gateway
- How to generate: openssl rand -hex 32
- Example: a1b2c3d4e5f6....(64 chars)

HYPERLINK_WEBHOOK_SECRET  
- Description: Secret for HMAC signing webhooks from orchestrator
- How to generate: openssl rand -hex 32
- Example: f1e2d3c4b5a6....(64 chars)
```

**Public Environment Variables (already in render.yaml):**
- HYPERLINK_API_URL: `https://x402-api.rendernet.work`
- DAILY_PAYOUT_ENABLED: `true`
- DAILY_PAYOUT_POOL_USD: `100.00`
- DAILY_PAYOUT_WINNERS_COUNT: `10`

---

### 2. 555-Bot (Environment Variables)

Add to `.env` file or bot deployment config:

```env
# Hyperlink Integration
HYPERLINK_API_BASE=https://x402-api.rendernet.work
HYPERLINK_API_KEY=<SAME_AS_BACKEND_KEY>

# Note: Use the SAME API key that backend uses, or generate a separate one
# If separate: Generate with: openssl rand -hex 32
```

---

### 3. 555x402 API Gateway

**Environment Variables:**

```env
# API Keys (comma-separated list of valid keys)
API_KEYS=<BOT_KEY>,<BACKEND_KEY>

# Example:
# API_KEYS=a1b2c3d4e5f6...,f1e2d3c4b5a6...

# Service URLs (should already be configured)
LINK_SERVICE_URL=http://hyperlink-link-service:8083
ORCHESTRATOR_URL=http://cctp-orchestrator:3006
```

**Note:** API keys are NOT secrets in GitHub Actions - configure via Kubernetes secrets or environment variables during deployment.

---

### 4. 555x402 CCTP Orchestrator

**Environment Variables:**

```env
# Backend webhook configuration  
BACKEND_WEBHOOK_URL=https://api.555games.com/webhooks/payment-status
BACKEND_WEBHOOK_SECRET=<SAME_AS_BACKEND_WEBHOOK_SECRET>

# Example:
# BACKEND_WEBHOOK_SECRET=f1e2d3c4b5a6....(64 chars)

# Note: This MUST match the HYPERLINK_WEBHOOK_SECRET in backend
```

---

## 🎯 Secret Generation Commands

```bash
# Generate API keys (64 characters)
openssl rand -hex 32

# Generate webhook secret (64 characters)  
openssl rand -hex 32

# Alternative: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Alternative: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📝 Secrets Mapping

| Secret | Used By | Purpose |
|--------|---------|---------|
| `HYPERLINK_API_KEY` | Backend + Bot | Authenticate to 555x402 API Gateway |
| `HYPERLINK_WEBHOOK_SECRET` | Backend + Orchestrator | Sign/verify payment webhooks |
| `API_KEYS` (Gateway) | API Gateway | Whitelist of valid API keys |

**Important**: 
- Bot and Backend can share the same `HYPERLINK_API_KEY` or use separate keys
- `HYPERLINK_WEBHOOK_SECRET` MUST be the same in Backend and Orchestrator
- All keys should be 64 characters (32 bytes hex-encoded)

---

## 🚀 Deployment Steps

### Step 1: Generate Secrets

```bash
# Generate once, store securely
export HYPERLINK_API_KEY=$(openssl rand -hex 32)
export HYPERLINK_WEBHOOK_SECRET=$(openssl rand -hex 32)

echo "HYPERLINK_API_KEY=$HYPERLINK_API_KEY"
echo "HYPERLINK_WEBHOOK_SECRET=$HYPERLINK_WEBHOOK_SECRET"

# Save these to your secrets manager!
```

### Step 2: Configure Backend (Render)

1. Go to Render dashboard → five55-backend service
2. Navigate to Environment tab
3. Add secrets:
   - `HYPERLINK_API_KEY` = (paste generated key)
   - `HYPERLINK_WEBHOOK_SECRET` = (paste generated secret)
4. Click "Save Changes"
5. Service will redeploy automatically

### Step 3: Configure Bot

**Option A: Environment Variables (if deployed on Render/similar)**
1. Go to bot service dashboard
2. Add environment variables:
   - `HYPERLINK_API_BASE` = `https://x402-api.rendernet.work`
   - `HYPERLINK_API_KEY` = (paste same or different key)

**Option B: .env file (if self-hosted)**
1. Edit `555-bot/.env`
2. Add lines:
```env
HYPERLINK_API_BASE=https://x402-api.rendernet.work
HYPERLINK_API_KEY=<paste_generated_key>
```

### Step 4: Configure 555x402 Services

**API Gateway:**
```bash
# Update API_KEYS environment variable to include your generated key
kubectl set env deployment/api-gateway \
  API_KEYS="<BOT_KEY>,<BACKEND_KEY>" \
  -n x402

# Or via Helm values / ConfigMap
```

**CCTP Orchestrator:**
```bash
# Update webhook configuration
kubectl set env deployment/cctp-orchestrator \
  BACKEND_WEBHOOK_URL="https://api.555games.com/webhooks/payment-status" \
  BACKEND_WEBHOOK_SECRET="<SAME_AS_BACKEND_SECRET>" \
  -n x402
```

### Step 5: Verify Configuration

```bash
# Test backend can reach API gateway
curl https://x402-api.rendernet.work/pub/v1/links/test \
  -H "X-API-Key: YOUR_KEY"

# Should return 404 (not found) or 200 (if test link exists)
# Should NOT return 401 (unauthorized) - that means key is wrong

# Test webhook endpoint is reachable
curl -X POST https://api.555games.com/webhooks/payment-status \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 401 (unauthorized) - that means endpoint exists
# Should NOT return 404 (not found)
```

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env` files (added to `.gitignore`)
   - Use secrets managers (Render secrets, K8s secrets, Vault)

2. **Rotate secrets periodically**
   - Recommendation: Every 90 days
   - After any suspected compromise: Immediately

3. **Use different keys per environment**
   - Development: `dev_key_xxx`
   - Staging: `staging_key_xxx`
   - Production: `prod_key_xxx`

4. **Restrict secret access**
   - Only admins should see secrets
   - Use role-based access control (RBAC)

5. **Monitor for unauthorized usage**
   - Track API requests by key
   - Alert on unusual patterns
   - Log all payment triggers

---

## 📋 Checklist

Before pushing to production:

- [ ] All secrets generated (64+ characters each)
- [ ] Secrets stored in secrets manager
- [ ] Backend render.yaml updated
- [ ] Backend secrets configured in Render dashboard
- [ ] Bot .env file updated (if self-hosted)
- [ ] Bot environment variables configured (if cloud)
- [ ] API Gateway API_KEYS updated
- [ ] Orchestrator webhook config updated
- [ ] Secrets match across services where required
- [ ] Test API auth works (non-401 response)
- [ ] Test webhook endpoint reachable
- [ ] Documentation updated with secret requirements
- [ ] Backup of secrets stored securely offline

---

## 🆘 Troubleshooting

### Issue: 401 Unauthorized from API Gateway

**Solution:**
- Verify `HYPERLINK_API_KEY` is set in backend/bot
- Verify key exists in API Gateway `API_KEYS` list
- Check for extra whitespace in key values
- Verify `X-API-Key` header is being sent

### Issue: Webhooks not received

**Solution:**
- Verify `BACKEND_WEBHOOK_URL` is correct and reachable
- Verify `BACKEND_WEBHOOK_SECRET` matches on both ends
- Check backend webhook endpoint logs
- Test webhook endpoint manually with curl

### Issue: Payment jobs stuck in "queued"

**Solution:**
- Check orchestrator logs for errors
- Verify database connection
- Check `payment_jobs` table exists
- Verify WaaS/payment services are running

---

## 📞 Support

If you need help:
1. Check service logs first
2. Verify secrets are configured correctly
3. Test each endpoint individually
4. Review INTEGRATION_SETUP.md for full setup guide
5. Check TEST_INTEGRATION.md for testing procedures

---

## ✅ All Done!

Secrets are configured via:
- ✅ **Backend**: Render dashboard (sync: false)
- ✅ **Bot**: .env file or deployment config
- ✅ **555x402**: Kubernetes ConfigMap/Secrets or docker-compose env

**Next Steps:**
1. Generate secrets using commands above
2. Configure in respective services
3. Test integration end-to-end
4. Deploy to production

**No CLI secret configuration needed** - all secrets are managed through service-specific configuration systems (Render dashboard, .env files, K8s secrets).

