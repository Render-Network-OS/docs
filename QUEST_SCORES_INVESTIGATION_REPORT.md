# Quest Scores Missing from Leaderboard - Investigation Report

## Executive Summary

**Root Cause Identified**: Quest points (social points) are being correctly awarded and stored in the database, but they are **NOT included in the global leaderboard aggregation** because the "social" game_id is excluded from the games registry used for aggregation.

## Investigation Findings

### ✅ Bot Quest Award Verification (Section 0)

**Status**: Bot is correctly sending events with wallet addresses

**Findings**:
1. Bot correctly detects quest-eligible posts via hashtags, mentions, and allowlist handles
2. Bot attempts wallet resolution from hyperlink codes in tweet text (`ingestion.ts` lines 233-258)
3. Bot sends `post_published` events to backend with wallet addresses when resolved
4. Bot has retry logic (5 attempts) for failed event posts
5. Bot logs successful event emissions: `"TwitterIngestion emitted post_published event"`

**Code References**:
- `555-bot/packages/client-twitter/src/integrations/ingestion.ts`: Lines 183-289
- `555-bot/packages/client-twitter/src/integrations/webhook.ts`: Lines 216-276

### ✅ Backend Event Reception (Section 1)

**Status**: Backend is correctly receiving and processing events

**Findings**:
1. Backend receives events at `/integrations/twitter/events` endpoint
2. HMAC signature verification is working correctly
3. Wallet resolution fallback chain is implemented (referral codes, hyperlink API)
4. Events are processed and social posts are upserted to database

**Code References**:
- `backend/internal/api/integrations.go`: Lines 66-167

### ✅ Quest Points Award Flow (Section 2)

**Status**: Quest points are being correctly awarded and stored

**Findings**:
1. Quest matching logic correctly identifies eligible posts (`integrations.go` lines 252-253)
2. Quest awards are created in `quest_awards` table (line 318)
3. `AddSocialPoints()` is called with correct wallet and points (line 333)
4. `AddSocialPoints()` correctly writes to:
   - `leaderboard_points` table with `game_id='social'` and `mode='social'`
   - `global_points.regular_points` table
5. Points are correctly updated in `quest_progress` table

**Code References**:
- `backend/internal/api/integrations.go`: Lines 234-353
- `backend/internal/store/sql/repo.go`: Lines 163-211 (`AddSocialPoints()`)

### ❌ Global Leaderboard Aggregation Logic (Section 3) - **ROOT CAUSE**

**Status**: **CRITICAL ISSUE FOUND** - Social points are excluded from aggregation

**Findings**:

#### BadgerDB Path Issue:
- **File**: `backend/internal/api/game.go` lines 1964-2016
- **Problem**: `handleGetGlobalLeaderboard()` only aggregates from `GamesRegistryFromEnv()` which does NOT include "social"
- **Code**: Line 1965: `allGames := config.GamesRegistryFromEnv()`
- **Missing**: No code to aggregate from `game:social:leaderboard:{period}:{key}` keys
- **Note**: Referral points ARE included (lines 1987-2002), but social points are NOT

#### Postgres Path Issue:
- **File**: `backend/internal/store/sql/repo.go` lines 827-859
- **Problem**: `GetGlobalPeriodTop()` only includes games from the `games` parameter
- **Code**: Line 840: `set["referral"] = true` (referral is added)
- **Missing**: `set["social"] = true` is NOT present
- **Impact**: Social points in `leaderboard_points` table with `game_id='social'` are filtered out at line 843

#### Games Registry Issue:
- **File**: `backend/internal/config/config.go` lines 334-355
- **Problem**: `GamesRegistryFromEnv()` returns actual game IDs (knighthood, sector-13, etc.) but does NOT include "social"
- **Default**: `"knighthood,ninja-evilcorp,sector-13,drive,clawstrike,flock,..."`
- **Missing**: "social" is not in the registry

**Code References**:
- `backend/internal/api/game.go`: Lines 1964-2016 (BadgerDB path)
- `backend/internal/store/sql/repo.go`: Lines 827-859 (Postgres path)
- `backend/internal/config/config.go`: Lines 334-355 (Games registry)

### ✅ Profile Points Display (Section 4)

**Status**: Profile correctly shows quest points

**Findings**:
1. `GetRegularPoints()` reads from `global_points.regular_points` which includes quest points
2. Profile endpoint (`handleMe()`) returns correct `points` field
3. Frontend displays points correctly

**Code References**:
- `backend/internal/api/server.go`: Lines 2632-2711
- `backend/internal/store/sql/repo.go`: Lines 744-758

### ❌ Global Rank Calculation (Section 5)

**Status**: **ISSUE FOUND** - Rank calculation also excludes social points

**Findings**:
- Uses same aggregation logic as leaderboard (`GetGlobalPeriodTop()`)
- Therefore, social points are also excluded from rank calculation
- Same root cause as leaderboard aggregation

**Code References**:
- `backend/internal/api/game.go`: Lines 2032-2149

## Root Cause Summary

**Primary Issue**: Social points (quest points) are stored correctly in the database but are excluded from global leaderboard aggregation because:

1. `GamesRegistryFromEnv()` does not include "social" in the games list
2. BadgerDB path does not explicitly aggregate from `game:social:leaderboard:{period}:{key}` keys
3. Postgres path filters out `game_id='social'` entries because "social" is not in the games set

**Secondary Issue**: Global rank calculation uses the same aggregation logic, so it also excludes social points.

## Impact Assessment

- ✅ Quest points ARE being awarded correctly
- ✅ Quest points ARE stored in database correctly
- ✅ Profile DOES show quest points (via `global_points.regular_points`)
- ❌ Leaderboard DOES NOT show quest points
- ❌ Global rank DOES NOT include quest points

## Recommended Fixes

### Fix 1: Include "social" in Postgres Path Aggregation
**File**: `backend/internal/store/sql/repo.go` line 840
**Change**: Add `set["social"] = true` after `set["referral"] = true`

### Fix 2: Include "social" in BadgerDB Path Aggregation
**File**: `backend/internal/api/game.go` after line 2002
**Change**: Add code block to aggregate from `game:social:leaderboard:{period}:{key}` keys (similar to referral aggregation)

### Fix 3: (Optional) Add "social" to Games Registry
**File**: `backend/internal/config/config.go` line 337
**Change**: Add "social" to default games registry OR ensure it's always included

## Verification Queries

Run these SQL queries to verify the fix:

```sql
-- Check quest awards exist
SELECT COUNT(*), SUM(points) FROM quest_awards WHERE awarded_at >= NOW() - INTERVAL '7 days';

-- Check social points in leaderboard_points
SELECT COUNT(*), SUM(points) FROM leaderboard_points 
WHERE game_id = 'social' AND mode = 'social' 
AND period = 'day' AND key = TO_CHAR(NOW() AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD');

-- Compare quest points vs leaderboard_points for a wallet
SELECT 
  qa.wallet,
  SUM(qa.points) as quest_total,
  COALESCE(SUM(lp.points), 0) as social_leaderboard_points
FROM quest_awards qa
LEFT JOIN leaderboard_points lp ON qa.wallet = lp.wallet 
  AND lp.game_id = 'social' AND lp.mode = 'social'
WHERE qa.awarded_at >= NOW() - INTERVAL '7 days'
GROUP BY qa.wallet
LIMIT 10;
```

## Additional Findings: Wallet Resolution & Data Loss Issues

### Issue 1: Bot Sometimes Returns Empty Wallet

**Root Cause**: Bot resolves wallets independently via Hyperlink API but does NOT have access to backend's referral code database. When hyperlink resolution fails, bot sends events with empty wallet.

**Current Bot Resolution Flow** (`ingestion.ts` lines 228-259):
1. Check cached wallet for handle
2. Extract hyperlink codes from tweet text
3. Resolve via Hyperlink API (`resolveWalletFromHyperlink`)
4. If mentioned, try Twitter handle mapping via Hyperlink API
5. If all fail, send event with empty wallet

**Backend Resolution Flow** (`integrations.go` lines 124-141):
1. Use wallet from event if provided
2. If empty and referral_code exists, resolve from BadgerDB (`resolveWalletFromReferral`)
3. If still empty and handle exists, try Hyperlink API via handle
4. **Problem**: Backend has referral code access that bot doesn't

**Impact**: 
- Bot misses wallet resolution via referral codes
- Events sent with empty wallet may be rejected by database
- Data loss occurs when posts cannot be saved

### Issue 2: SocialPost Model Constraint Prevents Saving Posts Without Wallets

**Root Cause**: `SocialPost.Wallet` has `gorm:"not null"` constraint, but bot sometimes sends empty wallet.

**Model Definition** (`models/social.go` line 10):
```go
Wallet    string    `gorm:"size:64;index;not null"`   // linked wallet (case preserved)
```

**Current Behavior** (`repo.go` lines 116-161):
- `UpsertSocialPost()` accepts empty wallet string
- Database will reject INSERT/UPDATE with empty wallet due to NOT NULL constraint
- **Result**: Posts without wallets are lost, not saved

**Impact**:
- Twitter handles without wallets are not persisted
- Cannot retry wallet resolution later
- Data loss for future scraping/rechecking

### Issue 3: No Backend API for Wallet Resolution

**Current State**:
- Backend has `resolveWalletFromReferral()` but it's internal only
- No public API endpoint for wallet resolution
- Bot cannot leverage backend's referral code database

**Missing Capability**:
- Bot cannot call backend to resolve wallets
- Bot misses referral code resolution
- Duplicate resolution logic between bot and backend

## Next Steps

### Immediate Fixes:
1. Implement fixes for Postgres and BadgerDB paths (leaderboard aggregation)
2. Test leaderboard aggregation includes social points
3. Test global rank calculation includes social points
4. Verify profile continues to show correct points

### Wallet Resolution Fixes:
5. Create backend API endpoint: `POST /api/wallet/resolve`
6. Update bot to call backend API when local resolution fails
7. Make `SocialPost.Wallet` nullable OR create separate table for unresolved posts
8. Implement background job to retry wallet resolution

### Data Protection:
9. Ensure all Twitter handles are saved even without wallets
10. Create mechanism to retry wallet resolution later
11. Monitor production logs to ensure no regressions

