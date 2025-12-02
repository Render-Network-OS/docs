# Quest Scores Missing from Leaderboard - Comprehensive Investigation & Fix Plan

## Problem Statement

Quest scores (points awarded from quest completion) are not showing on the leaderboard or profile. Additionally, the bot sometimes returns empty wallet addresses, causing data loss. We need to:

1. Verify if points are being awarded correctly by the bot
2. Fix leaderboard aggregation to include quest points (ROOT CAUSE IDENTIFIED)
3. Fix wallet resolution flow to prevent empty wallets
4. Implement data persistence for Twitter usernames without wallets
5. Create backend API for wallet resolution that bot can use

## Previous Investigation Findings (From QUEST_SCORES_INVESTIGATION_REPORT.md)

### ✅ Confirmed Issues:
1. **Root Cause**: Social points are excluded from global leaderboard aggregation
   - BadgerDB path: Missing `game:social:leaderboard:{period}:{key}` aggregation
   - Postgres path: `GetGlobalPeriodTop()` filters out `game_id='social'` entries
   - Games registry: Does not include "social" in games list

2. **Bot Status**: Bot is correctly sending events with wallet addresses when resolved
3. **Backend Status**: Backend is correctly receiving and processing events
4. **Quest Awards Status**: Quest points are being correctly awarded and stored
5. **Profile Status**: Profile correctly shows quest points

## New Investigation Areas

### 10. Wallet Resolution Flow Analysis (CRITICAL)

**Current State:**
- Bot resolves wallets via Hyperlink API directly (`hyperlink.ts`)
- Bot does NOT have access to backend's referral code database
- Bot only uses: cached wallet, hyperlink codes from tweet, hyperlink via Twitter handle
- Backend has additional resolution: referral codes from BadgerDB, hyperlink via handle
- **Problem**: Bot and backend use different resolution methods, causing inconsistencies

**Files to examine:**
- `555-bot/packages/client-twitter/src/integrations/ingestion.ts` (lines 228-259): Bot wallet resolution
- `555-bot/packages/client-twitter/src/integrations/hyperlink.ts`: Bot hyperlink resolution
- `backend/internal/api/integrations.go` (lines 124-141): Backend wallet resolution fallback
- `backend/internal/api/integrations.go` (lines 50-64): `resolveWalletFromReferral()` implementation

**Checkpoints:**
- Verify bot's wallet resolution flow and failure points
- Identify when bot sends empty wallet (no hyperlink code, no cached wallet, hyperlink API fails)
- Check if bot attempts to call backend for wallet resolution (it doesn't currently)
- Verify backend's referral code resolution works correctly
- Check if backend's hyperlink client is properly configured
- Identify gaps between bot and backend resolution methods

**Database queries:**
```sql
-- Check social posts with empty/null wallets
SELECT COUNT(*) as total_posts,
       COUNT(CASE WHEN wallet IS NULL OR wallet = '' THEN 1 END) as empty_wallet,
       COUNT(CASE WHEN wallet IS NOT NULL AND wallet != '' THEN 1 END) as with_wallet
FROM social_posts
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Check recent posts without wallets
SELECT platform, post_id, handle, url, created_at
FROM social_posts
WHERE (wallet IS NULL OR wallet = '')
ORDER BY created_at DESC
LIMIT 20;

-- Check if referral codes exist in BadgerDB (via backend logs or migration)
-- Note: BadgerDB is not directly queryable via SQL, need to check backend code
```

### 11. SocialPost Model Constraint Analysis

**Current State:**
- `SocialPost.Wallet` has `gorm:"not null"` constraint
- `UpsertSocialPost()` accepts empty wallet string but database will reject it
- **Problem**: Posts without wallets cannot be saved, causing data loss

**Files to examine:**
- `backend/internal/models/social.go` (line 10): SocialPost model definition
- `backend/internal/store/sql/repo.go` (lines 116-161): `UpsertSocialPost()` implementation
- Check database migration files for SocialPost table schema

**Checkpoints:**
- Verify if database actually enforces NOT NULL constraint
- Check if `UpsertSocialPost()` handles empty wallet gracefully
- Identify if posts are being rejected silently or with errors
- Check backend logs for database constraint violations

**Investigation queries:**
```sql
-- Check table schema
SELECT column_name, is_nullable, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'social_posts' AND column_name = 'wallet';

-- Check for any posts that somehow have empty wallets (if constraint allows)
SELECT COUNT(*) FROM social_posts WHERE wallet = '' OR wallet IS NULL;
```

### 12. Backend Wallet Resolution API Gap Analysis

**Current State:**
- Backend has `resolveWalletFromReferral()` but it's internal only
- Backend has hyperlink client but no public API endpoint
- Bot cannot call backend for wallet resolution
- **Problem**: Bot doesn't have access to backend's referral code database

**Files to examine:**
- `backend/internal/api/server.go`: Check for existing wallet resolution endpoints
- `backend/internal/api/integrations.go`: Internal resolution methods
- Check if any admin endpoints exist for wallet resolution

**Checkpoints:**
- Verify no public API endpoint exists for wallet resolution
- Check if admin endpoints exist that bot could use
- Identify what data backend has that bot doesn't (referral codes)
- Determine if backend should expose wallet resolution API

### 13. Data Persistence Strategy for Unresolved Wallets

**Requirements:**
- Store Twitter usernames even when wallet cannot be resolved
- Enable future scraping/rechecking of unresolved entries
- Protect against data loss
- Maintain referential integrity

**Current State:**
- `SocialPost` model requires wallet (NOT NULL)
- No separate table for unresolved Twitter handles
- No mechanism to retry wallet resolution later

**Files to examine:**
- `backend/internal/models/social.go`: All social-related models
- Check if any pending/unresolved tables exist
- Review database schema for social-related tables

**Checkpoints:**
- Identify if we need a new model for unresolved handles
- Determine if we should make SocialPost.Wallet nullable
- Check if we need a separate `TwitterHandle` or `UnresolvedSocialPost` table
- Verify if we can use a placeholder wallet value temporarily

### 14. Bot-Backend Wallet Resolution Integration

**Requirements:**
- Bot should call backend API for wallet resolution
- Backend should consolidate all resolution methods (referral, hyperlink, etc.)
- Bot should fallback to backend if local resolution fails
- Backend should return wallet or indicate resolution failed

**Current State:**
- Bot resolves independently via Hyperlink API
- Bot does not call backend for resolution
- Backend resolves as fallback but bot doesn't know about it
- **Problem**: Duplicate resolution logic, bot misses backend's referral codes

**Files to examine:**
- `555-bot/packages/client-twitter/src/integrations/ingestion.ts`: Bot resolution flow
- `backend/internal/api/integrations.go`: Backend resolution flow
- Check bot's HTTP client configuration for backend API calls

**Checkpoints:**
- Identify where bot should call backend API
- Determine API endpoint design for wallet resolution
- Check if bot has proper authentication for backend API
- Verify bot's error handling for backend API failures

## Implementation Plan

### Phase 1: Investigation & Documentation (Current Phase)

**Tasks:**
1. ✅ Complete wallet resolution flow analysis
2. ✅ Document SocialPost constraint issues
3. ✅ Identify backend API gaps
4. ✅ Design data persistence strategy
5. ✅ Design bot-backend integration approach

**Deliverables:**
- Updated investigation report with wallet resolution findings
- Data model design for unresolved handles
- API endpoint specification for wallet resolution
- Integration flow diagram

### Phase 2: Fix Leaderboard Aggregation (Known Issue)

**Tasks:**
1. Fix Postgres path: Add "social" to games set in `GetGlobalPeriodTop()`
2. Fix BadgerDB path: Add social leaderboard aggregation
3. Test leaderboard includes quest points
4. Test global rank includes quest points

**Files to modify:**
- `backend/internal/store/sql/repo.go` (line 840): Add `set["social"] = true`
- `backend/internal/api/game.go` (after line 2002): Add social aggregation block

### Phase 3: Fix Wallet Resolution

**Tasks:**
1. Create backend API endpoint: `POST /api/wallet/resolve`
   - Accept: referral_code, hyperlink_code, twitter_handle
   - Return: wallet, chain_type, resolution_method
   - Use existing internal resolution methods
2. Update bot to call backend API when local resolution fails
3. Add retry logic for backend API calls
4. Update bot to send referral_code in events (already done)
5. Test end-to-end wallet resolution

**Files to create/modify:**
- `backend/internal/api/wallet.go`: New wallet resolution endpoint
- `backend/internal/api/server.go`: Register new route
- `555-bot/packages/client-twitter/src/integrations/ingestion.ts`: Call backend API
- `555-bot/packages/client-twitter/src/integrations/webhook.ts`: Add wallet resolution helper

### Phase 4: Data Persistence for Unresolved Wallets

**Tasks:**
1. Make `SocialPost.Wallet` nullable OR create `UnresolvedSocialPost` table
2. Update `UpsertSocialPost()` to handle empty wallets
3. Create migration for schema change
4. Update bot to always send events even without wallet
5. Create background job to retry wallet resolution for unresolved posts
6. Add admin endpoint to manually trigger resolution retry

**Files to create/modify:**
- `backend/internal/models/social.go`: Update SocialPost model OR create new model
- `backend/internal/store/sql/repo.go`: Update UpsertSocialPost logic
- `backend/migrations/`: Create migration file
- `backend/internal/scheduler/`: Create wallet resolution retry job
- `backend/internal/api/admin.go`: Add retry endpoint

### Phase 5: Testing & Verification

**Tasks:**
1. Test wallet resolution with all methods (referral, hyperlink, handle)
2. Test posts without wallets are saved correctly
3. Test leaderboard includes quest points
4. Test retry job resolves previously unresolved wallets
5. Verify no data loss in production

## Success Criteria

### Investigation Complete When:
- ✅ All wallet resolution failure points identified
- ✅ SocialPost constraint impact documented
- ✅ Backend API gaps identified
- ✅ Data persistence strategy designed
- ✅ Integration approach designed

### Implementation Complete When:
- ✅ Leaderboard shows quest points
- ✅ Bot calls backend for wallet resolution
- ✅ Posts without wallets are saved (not lost)
- ✅ Background job retries unresolved wallets
- ✅ No data loss in production
- ✅ All tests passing

## Risk Mitigation

1. **Data Loss Prevention**: Always save Twitter handles even without wallets
2. **Backward Compatibility**: Ensure existing posts with wallets continue to work
3. **Performance**: Cache wallet resolutions to avoid excessive API calls
4. **Error Handling**: Graceful degradation when resolution fails
5. **Monitoring**: Log all wallet resolution attempts and failures

