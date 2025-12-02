# New Environment Variables for CI/CD Testing

This document lists the new environment variables introduced for automated testing in GitHub Actions.

## GitHub Secrets (Required for CI/CD)

Add these secrets to your GitHub repository settings (Settings → Secrets and variables → Actions):

### Staging Environment Secrets
- `STAGING_FRONTEND_URL` - Staging frontend URL (optional, defaults to `https://staging.render.network`)
- `STAGING_API_URL` - Staging backend API URL (e.g., `https://staging-api.render.network`)
- `STAGING_GATEWAY_URL` - Staging gateway URL (e.g., `wss://staging-gateway.render.network` or `http://staging-gateway.render.network`)

### Production Environment Secrets
- `PRODUCTION_FRONTEND_URL` - Production frontend URL (optional, defaults to `https://app.render.network`)
- `PRODUCTION_API_URL` - Production backend API URL (e.g., `https://api.render.network`)
- `PRODUCTION_GATEWAY_URL` - Production gateway URL (e.g., `wss://gateway.render.network` or `http://gateway.render.network`)

### Shared Secrets (Already Exists)
- `GATEWAY_SHARED_SECRET` - Gateway shared secret for authentication (already configured)
- `SLACK_WEBHOOK_URL` - (Optional) Slack webhook for failure notifications

## Local Development Environment Variables

### New Variables for E2E Tests

Add these to your local `.env.local` files for running E2E tests:

**Frontend (`frontend/.env.local`):**
```bash
# Base URL for E2E tests (defaults to http://localhost:3000)
BASE_URL=http://localhost:3000

# HTTP version of gateway URL for E2E tests (if different from WebSocket URL)
CHAT_GATEWAY_URL=http://localhost:7070
```

**Note:** `CHAT_GATEWAY_URL` already exists in your `.env.local` file, but ensure it's set correctly for E2E tests.

## Environment Variable Usage

### E2E Tests (Playwright)

The following environment variables are used by E2E tests:

- `BASE_URL` - Frontend base URL (defaults to `http://localhost:3000`)
- `NEXT_PUBLIC_API_URL` - Backend API URL (already exists)
- `NEXT_PUBLIC_CHAT_GATEWAY_URL` - Gateway WebSocket URL (already exists)
- `CHAT_GATEWAY_URL` - Gateway HTTP URL for REST API calls (already exists)
- `GATEWAY_SHARED_SECRET` - Gateway shared secret (already exists)

### Integration Tests

Integration tests use:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_CHAT_GATEWAY_URL` - Gateway WebSocket URL
- `CHAT_GATEWAY_URL` - Gateway HTTP URL
- `GATEWAY_SHARED_SECRET` - Gateway shared secret

## Production Pipeline Configuration

### Render.com Environment Variables

Ensure these are set in your Render.com dashboard:

**Frontend Service:**
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_CHAT_GATEWAY_URL` - Gateway WebSocket URL
- `CHAT_GATEWAY_URL` - Gateway HTTP URL (for server-side API routes)
- `GATEWAY_SHARED_SECRET` - Gateway shared secret

**Backend Service:**
- `DATABASE_URL` - PostgreSQL connection string
- `CHAT_GATEWAY_URL` - Gateway HTTP URL
- `GATEWAY_SHARED_SECRET` - Gateway shared secret
- `FRONTEND_ORIGIN` - Frontend origin for CORS

**Gateway Service:**
- `GATEWAY_SHARED_SECRET` - Gateway shared secret
- `BACKEND_API_URL` - Backend API URL
- `ALLOWED_ORIGIN` - Frontend origin for CORS

## Summary of Changes

### New Variables Introduced
1. **BASE_URL** - Used in E2E tests for frontend base URL
2. **STAGING_FRONTEND_URL** - GitHub secret for staging frontend URL
3. **STAGING_API_URL** - GitHub secret for staging backend URL
4. **STAGING_GATEWAY_URL** - GitHub secret for staging gateway URL
5. **PRODUCTION_FRONTEND_URL** - GitHub secret for production frontend URL
6. **PRODUCTION_API_URL** - GitHub secret for production backend URL
7. **PRODUCTION_GATEWAY_URL** - GitHub secret for production gateway URL

### Existing Variables Used in Tests
- `NEXT_PUBLIC_API_URL` - Already exists
- `NEXT_PUBLIC_CHAT_GATEWAY_URL` - Already exists
- `CHAT_GATEWAY_URL` - Already exists
- `GATEWAY_SHARED_SECRET` - Already exists

## Next Steps

1. **Add GitHub Secrets:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add all staging and production secrets listed above

2. **Update Local .env Files:**
   - Add `BASE_URL` to `frontend/.env.local` (optional, has defaults)
   - Verify `CHAT_GATEWAY_URL` is set correctly

3. **Verify Production Environment:**
   - Ensure all environment variables are set in Render.com dashboard
   - Test E2E workflows manually after adding secrets


