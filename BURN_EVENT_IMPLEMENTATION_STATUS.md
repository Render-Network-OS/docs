# Burn Event Implementation Status

## ✅ Completed

### 1. Master Plan Document
- **File**: `BURN_EVENT_MASTER_PLAN.md`
- **Status**: ✅ Completed and aligned with standardized spec
- **Details**:
  - 5-day event structure (NOISE → INFERNO → WILDFIRE → BLAZE → SUPERNOVA)
  - Daily USDC budget: 10 USDC per day
  - Meta prizes: 3 categories × (55 + 3×5 = 70) = 210 USDC
  - Total event budget: 260 USDC
  - Daily quest breakdown per day
  - Meta quest specifications (referrals, game points, social credit)
  - Token gating rules
  - Payout mechanics

### 2. Backend - Core Infrastructure

#### Models
- **File**: `backend/internal/models/burn_event.go`
- **Status**: ✅ Already existed
- **Contents**:
  - `BurnEvent` model
  - `BurnEventDay` model
  - `BurnEventLeaderboard` model
  - `QuestDefinition` extensions (EventID, EventDay, Category fields)

#### API Endpoints
- **File**: `backend/internal/api/burn_events.go`
- **Status**: ✅ Implemented
- **Endpoints**:
  - `GET /events/burn/active` - Get active burn event
  - `GET /events/burn/{id}/leaderboard` - Get overall event leaderboard
  - `GET /events/burn/{id}/leaderboard/referrals` - Get referral meta leaderboard (NEW)
  - `GET /events/burn/{id}/leaderboard/game` - Get game meta leaderboard (NEW)
  - `GET /events/burn/{id}/leaderboard/social` - Get social meta leaderboard (NEW)
  - `GET /events/burn/{id}/rank` - Get authenticated user's rank
  - `GET /events/burn/{id}/quests` - Get event quests (with optional ?day= filter)

#### Scheduler
- **File**: `backend/internal/scheduler/burn_event_scheduler.go`
- **Status**: ✅ Already existed
- **Details**:
  - Automated daily burns at midnight CST
  - SSE event broadcasting
  - Burn transaction recording

#### Payout Logic
- **File**: `backend/internal/scheduler/daily_payouts.go`
- **Status**: ✅ Extended with burn event functions
- **Functions**:
  - `ProcessBurnEventDailyPayouts()` - Process daily USDC payouts (placeholder)
  - `ProcessBurnEventMetaPayouts()` - Process final meta rewards (placeholder)
- **Note**: These are placeholders and need full implementation for:
  - Quest winner selection logic
  - Token eligibility checks
  - Hyperlink batch payment integration

### 3. Frontend - UI Components

#### Burn Event Dialog
- **File**: `555-mono/apps/web/components/BurnEventDialog.tsx`
- **Status**: ✅ Updated to match standardized spec
- **Features**:
  - Fire-themed styling
  - 5-day progress bar
  - Daily countdown timer
  - Daily quests display
  - Event leaderboard
  - User rank display
- **Changes**:
  - Updated daily USDC pools to 10 USDC
  - Updated total event budget to $260

#### API Client
- **File**: `555-mono/apps/web/lib/burn-events.ts`
- **Status**: ✅ Extended with meta leaderboard functions
- **Functions**:
  - `getActiveBurnEvent()`
  - `getEventLeaderboard(eventId)`
  - `getMyEventRank(eventId)`
  - `getEventQuests(eventId, day?)`
  - `getReferralsLeaderboard(eventId)` (NEW)
  - `getGameLeaderboard(eventId)` (NEW)
  - `getSocialLeaderboard(eventId)` (NEW)

### 4. Database Setup Scripts

#### Create Event Script
- **File**: `backend/scripts/create-burn-event.sh`
- **Status**: ✅ Created
- **Usage**: `./create-burn-event.sh`
- **Actions**:
  - Creates burn_events table entry
  - Creates 5 burn_event_days entries (one per day)
  - Sets initial status to 'upcoming'

#### Activate Event Script
- **File**: `backend/scripts/activate-burn-event.sh`
- **Status**: ✅ Created
- **Usage**: `./activate-burn-event.sh <event_id>`
- **Actions**:
  - Changes event status from 'upcoming' to 'active'
  - Makes event visible in frontend

#### Create Quests Script
- **File**: `backend/scripts/create-burn-quests.sh`
- **Status**: ✅ Created
- **Usage**: `./create-burn-quests.sh <event_id>`
- **Actions**:
  - Seeds 20 quest definitions (4-5 per day)
  - Templates for all 5 days
  - Includes USDC and points-only quests

---

## ⚠️ Partially Implemented (Needs Completion)

### 1. Meta Leaderboard Aggregation

**Files**: 
- `backend/internal/api/burn_events.go` (endpoints exist but return empty data)

**What's needed**:
- Implement actual data aggregation for:
  - **Referrals leaderboard**: Query referrals table, filter by event window, aggregate by referrer, rank by count
  - **Game leaderboard**: Query game scores table, filter by event window, aggregate by wallet, rank by total points
  - **Social leaderboard**: Query social_posts/social_event_logs, calculate weighted score, rank

**Current status**: Endpoints return placeholder empty arrays

**Implementation steps**:
1. Create referral aggregation query (group by referrer_wallet, count active referrals in event window)
2. Create game points aggregation query (sum game points per wallet during event window)
3. Create social credit scoring (likes×1 + replies×2 + retweets×3 + quotes×3 + mentions×2)
4. Add ranking logic (ORDER BY DESC, assign rank numbers)
5. Join with twitter handles for display

### 2. Daily & Meta Payout Logic

**Files**:
- `backend/internal/scheduler/daily_payouts.go` (functions exist but are placeholders)

**What's needed**:
- **Daily payouts**:
  - Query quest_progress for completed USDC quests
  - Apply "first N completions" caps from quest rules
  - Verify token eligibility for each winner
  - Create usdc_payments entries
  - Trigger Hyperlink batch payment via authority wallet
  
- **Meta payouts**:
  - Finalize all 3 meta leaderboards at event end
  - Select 1st place + 3 runner-ups per category
  - Create usdc_payments entries (55 + 3×5 per category)
  - Create reward_points entries (555,555 + 3×55,555 per category)
  - Trigger Hyperlink batch payment

**Current status**: Functions are stubs with TODO comments

### 3. Quest Matching Logic

**Files**:
- `backend/internal/api/integrations.go` (Twitter event handler)
- `backend/internal/api/quests.go` (Quest completion logic)

**What's needed**:
- Extend quest matching to handle burn event quest types:
  - `referral` type: Check referral table for new valid referrals
  - `content_creation` type: Track unique referral clicks for tutorial video
  - `play_score` type: Apply event_id filter, check daily targets
  - `social_post` type: Match hashtags and burn event criteria
  - `completion` type: Check cross-day completion (e.g., "Perfect Week")

**Current status**: Basic quest matching exists but needs burn event extensions

### 4. Referral Tracking for Events

**Files**:
- Need to extend referral system to track event_id and time windows

**What's needed**:
- Add event_id to referrals table (or use created_at + event time window)
- Track referral status (pending vs active based on token holdings)
- Implement daily cron to upgrade pending → active when referee gets tokens
- Award referral points when status changes to active

**Current status**: Referral system exists but not event-aware

---

## 🔴 Not Started (Critical)

### 1. Token Burning

**Status**: Manual execution required
- **Reason**: Per plan, burns are executed manually by operator
- **Process**:
  1. You decide when and how much to burn
  2. You execute on-chain burn transactions manually
  3. Record tx hash in burn_event_days table (optional, for UI display)
- **Note**: BurnEventScheduler has burn logic but it's disabled per plan

### 2. Bot Integration

**Files needed**:
- `555-bot/packages/client-twitter/src/integrations/burn-events.ts` (new)
- Extend `555-bot/packages/client-twitter/src/post.ts`

**What's needed**:
- **Burn announcements** (manual or webhook-triggered):
  - Post burn event daily announcements
  - Post leaderboard updates
  - Post event completion recap
- **USDC payouts via Hyperlink**:
  - Read pending usdc_payments entries
  - Call Hyperlink batch payment API with authority wallet
  - Update payment status to settled
  - Schedule daily at event end-of-day
  - Schedule final meta payout after Day 5

**Current status**: Not implemented

### 3. Social Credit Scoring Table

**Files**:
- May need a dedicated aggregation table for social engagement metrics

**What's needed**:
- Track likes, replies, retweets, quotes, mentions per wallet per event
- Update in real-time or via nightly aggregation
- Use for social meta leaderboard

**Current status**: Not implemented

---

## 📋 Testing Checklist

### Before Launch

- [ ] Test event creation script
- [ ] Test event activation
- [ ] Test quest seeding
- [ ] Verify /events/burn/active returns event
- [ ] Verify frontend shows burn event dialog
- [ ] Test daily quest filtering
- [ ] Test quest completion flow (at least 1 quest type)
- [ ] Test token eligibility check
- [ ] Test USDC payment creation
- [ ] Test Hyperlink batch payout (on testnet)
- [ ] Test leaderboard aggregation (mock data)
- [ ] Test countdown timer
- [ ] Test SSE events for burn notifications

### During Event

- [ ] Monitor daily burns (manual execution)
- [ ] Monitor quest completions
- [ ] Monitor USDC payouts (daily)
- [ ] Monitor leaderboard updates
- [ ] Check for errors/panics in logs
- [ ] Verify no duplicate payments

### After Event

- [ ] Finalize meta leaderboards
- [ ] Execute meta payouts
- [ ] Verify all winners paid
- [ ] Post event recap
- [ ] Archive event data
- [ ] Gather feedback

---

## 🚀 Launch Sequence

### 1. Setup Phase (Before Event Start)

```bash
# 1. Create event in database
cd /Users/mac/Desktop/Work/555/backend/scripts
chmod +x create-burn-event.sh activate-burn-event.sh create-burn-quests.sh

# Edit create-burn-event.sh to set start/end dates
nano create-burn-event.sh

# Run creation script
./create-burn-event.sh

# 2. Create quest definitions
./create-burn-quests.sh <event_id>

# 3. Review and adjust quests if needed
psql -d fivefivefive -c "SELECT id, title, event_day, reward_usdc FROM quest_definitions WHERE event_id = <event_id>;"

# 4. Activate event (makes it visible in UI)
./activate-burn-event.sh <event_id>
```

### 2. During Event (Daily Operations)

**Midnight CST each day**:
- Backend scheduler auto-processes (if burns are automated)
- OR: You manually execute burn and record tx hash

**End of each day (~00:05 UTC next day)**:
- Backend computes daily USDC winners
- Bot reads usdc_payments table
- Bot triggers Hyperlink batch payout
- Winners receive USDC

### 3. Post-Event (After Day 5)

**Within 1 hour of event end**:
```bash
# Run meta leaderboard finalization (once implemented)
# This would be a backend API call or script
curl -X POST http://backend/events/burn/<event_id>/finalize
```

**Verify meta payouts**:
```sql
SELECT wallet, reason, amount_usdc, status 
FROM usdc_payments 
WHERE reason LIKE 'burn_meta%';
```

**Bot posts event recap**:
- Winners announcement
- Total stats
- Highlights

---

## 🔧 Quick Reference

### Environment Variables

**Backend (render.yaml)**:
```yaml
HYPERLINK_API_BASE: "http://api.555hyper.link/pub/v1"
HYPERLINK_API_KEY: "<your_key>"
MIN_TOKENS_FOR_USDC: "1000000"  # 1M tokens (adjust as needed)
TOKEN_555_MINT: "<mint_address>"
```

**Bot (.env.github-secrets)**:
```bash
HYPERLINK_API_BASE=http://api.555hyper.link/pub/v1
HYPERLINK_API_KEY=<your_key>
BACKEND_WEBHOOK_URL=https://five55-backend-wn5h.onrender.com/integrations/twitter/events
BACKEND_WEBHOOK_SECRET=<your_hmac_secret>
```

### Key Endpoints

- `GET /events/burn/active` - Frontend polls this
- `GET /events/burn/{id}/quests?day=1` - Daily quests
- `GET /events/burn/{id}/leaderboard` - Overall leaderboard
- `GET /events/burn/{id}/leaderboard/referrals` - Meta referral leaders
- `GET /events/burn/{id}/leaderboard/game` - Meta game leaders
- `GET /events/burn/{id}/leaderboard/social` - Meta social leaders
- `POST /integrations/twitter/events` - Bot sends events here

### Database Tables

- `burn_events` - Event metadata
- `burn_event_days` - Per-day records (theme, pool, burn tx)
- `burn_event_leaderboard` - Overall event rankings
- `quest_definitions` - Quests (with event_id, event_day)
- `quest_progress` - User quest completions
- `usdc_payments` - USDC payment records
- `referrals` - (extend with event awareness)
- `social_event_logs` - (for social credit scoring)

---

## 📝 Next Steps Priority

### High Priority (Blocker for Launch)
1. ✅ Update BURN_EVENT_MASTER_PLAN.md (done)
2. ✅ Add meta leaderboard endpoints (done - need data aggregation)
3. **Implement meta leaderboard data aggregation** (in progress)
4. **Implement daily payout logic** (in progress)
5. **Implement meta payout logic** (in progress)
6. **Bot: Hyperlink payout integration** (not started)

### Medium Priority (Needed for Full Experience)
7. **Quest matching for burn event types** (partially done)
8. **Referral tracking with event awareness** (not started)
9. **Social credit scoring aggregation** (not started)
10. **Test suite for burn event flows** (not started)

### Low Priority (Nice to Have)
11. **Frontend meta leaderboard tabs** (basic version done)
12. **Admin panel for event management** (not started)
13. **Bot: Event announcements** (not started)
14. **Analytics & reporting** (not started)

---

## 💡 Implementation Tips

### For Meta Leaderboard Aggregation

Use window functions for efficient ranking:

```sql
-- Example: Referrals leaderboard
WITH referral_counts AS (
  SELECT 
    referrer_wallet,
    COUNT(*) as referral_count
  FROM referrals
  WHERE status = 'active'
    AND created_at BETWEEN :event_start AND :event_end
  GROUP BY referrer_wallet
),
ranked AS (
  SELECT 
    referrer_wallet,
    referral_count,
    RANK() OVER (ORDER BY referral_count DESC) as rank
  FROM referral_counts
)
SELECT * FROM ranked WHERE rank <= 100;
```

### For Daily Payouts

Pseudo-code for daily USDC winners:

```go
// Get all USDC quests for the day
quests := getUSDCQuestsForDay(eventID, day)

for _, quest := range quests {
  // Get completions for this quest
  completions := getQuestCompletions(quest.ID, day)
  
  // Apply caps (e.g., "first 5 completions")
  caps := quest.Caps // e.g., {"cap_awards": 5}
  winners := completions[:min(len(completions), caps.CapAwards)]
  
  for _, winner := range winners {
    // Check token eligibility
    if !hasMinTokens(winner.Wallet) {
      continue
    }
    
    // Create payment entry
    createUSDCPayment(winner.Wallet, quest.RewardUSDC, "burn_day"+day+"_"+quest.Title)
  }
}

// Trigger Hyperlink batch payout
triggerBatchPayout(day)
```

### For Token Eligibility

Use existing helpers:

```go
import "github.com/your-org/555/backend/internal/solana"

func CheckTokenEligibility(ctx context.Context, wallet string) (bool, error) {
  // Get token balance
  balance, err := solana.GetTokenBalance(ctx, wallet, TOKEN_555_MINT)
  if err != nil {
    return false, err
  }
  
  minRequired := MIN_TOKENS_FOR_USDC // from config
  return balance >= minRequired, nil
}
```

---

## ✅ Summary

**What's Done**:
- Core infrastructure (models, scheduler, basic endpoints)
- Frontend UI (burn event dialog with fire theme)
- Setup scripts (create event, activate, seed quests)
- Master plan documentation (aligned with standardized spec)
- API client extensions (meta leaderboard functions)

**What's In Progress** (placeholders exist, need full implementation):
- Meta leaderboard data aggregation
- Daily payout selection logic
- Final meta payout logic

**What's Not Started** (critical for launch):
- Bot Hyperlink payout integration
- Quest matching extensions for event types
- Referral event tracking
- Social credit scoring

**Estimated Effort to Launch**:
- Meta aggregation: 4-6 hours
- Payout logic: 6-8 hours
- Bot integration: 4-6 hours
- Testing: 4-6 hours
- **Total: ~20-26 hours of dev work**

The foundation is solid. The remaining work is primarily data aggregation queries, payout orchestration, and bot integration for automated USDC distribution via Hyperlink.

