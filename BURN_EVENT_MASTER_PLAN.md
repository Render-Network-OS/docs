# 555 Burn Event – Standardized Master Plan

## 1. Global Parameters

- **Event name**: 555 Burn Event
- **Duration**: 5 consecutive days
- **Day labels** (for UI & queries):
  - Day 1: `NOISE`
  - Day 2: `INFERNO`
  - Day 3: `WILDFIRE`
  - Day 4: `BLAZE`
  - Day 5: `SUPERNOVA`
- **Time window**:
  - Start: `T0` (UTC)
  - End: `T0 + 5 days` (UTC)
- **Daily USDC budget**: `10 USDC` per day (for daily event quests)
- **Meta USDC budget**:
  - For each meta category (3 categories):
    - 1st place: `55 USDC`
    - Runner-ups (3): `5 USDC` each
  - Total meta USDC: `3 × (55 + 3×5) = 210 USDC`
- **Total event USDC budget**: `5 × 10 + 210 = 260 USDC`

---

## 2. Eligibility & Token Gating

- **Global rule**:
  - Only wallets holding at least `MIN_TOKENS_FOR_USDC` 555 tokens are eligible to:
    - Earn **any points** from burn-event quests
    - Receive **any USDC** rewards
- **Referrals**:
  - Referrals are **tracked for everyone**, but:
    - A referral grants points **only when**:
      - Referrer holds ≥ `MIN_TOKENS_FOR_USDC`
      - Referee holds ≥ `MIN_TOKENS_FOR_USDC`
    - Until then, referral status = `pending` (no points, no leaderboard credit)
- **Multipliers**:
  - All per-quest point rewards (including per-referral points) are multiplied by existing token-based multipliers
  - **Meta prize points** (555,555 / 55,555) are **fixed**, no multipliers
  - USDC amounts are **never multiplied**

---

## 3. Referrals

- **Referral capacity**:
  - Every user can refer **unlimited** users
- **Referral representation**:
  - `referrer_wallet`
  - `referee_wallet`
  - `event_id`
  - `created_at`
  - `status`: `pending` | `active`
- **Valid referral**:
  - `status = active`
  - Within event window `[T0, T0+5d]`
- **Points for referrals**:
  - Each `active` referral during the event grants:
    - `REFERRAL_BASE_POINTS` (e.g. `1,000`) × user's token multiplier
- **USDC for referrals**:
  - **None** per referral
  - Referrals influence:
    - Total points (feeds final point-based payouts if you run them)
    - Ranking in the **Referral Meta Leaderboard** (which has its own USDC rewards)

---

## 4. Quest Taxonomy

Define 3 quest types:

1. **Daily quests** (day-scoped)
2. **Meta quests** (event-scoped)
3. **Special quests** (explicitly defined, event- or day-scoped)

### 4.1 Daily Quests (Per Day)

- **Lifetime**:
  - Active only for the specified day, `00:00–23:59 UTC`
- **Reward style**:
  - Most: **points-only**, high but within multiplier-safe bounds
  - A small number: **points + USDC**, but the total daily USDC across all daily quests ≤ `10 USDC`
- **USDC rule**:
  - For daily quests that grant USDC:
    - Either:
      - Top `N` completions (e.g. first 10) each get `1 USDC`, or
      - Single winner gets `10 USDC`
    - These USDC amounts are **not paid instantly**, only at daily settlement

#### Day 1 – NOISE (Kickoff & Awareness)

**Focus**: Social reach & maximum noise

**Quests**:
1. **Social Quest**: "Spread the Flame"
   - Post about burn event with #555BurnEvent
   - Reward: 5,000 pts (points-only)

2. **Social Quest**: "First Burn Witness"
   - Be online and tweet when burn happens
   - Reward: 3,000 pts (points-only)

3. **Game Quest**: "Ignition Trio"
   - Play any 3 different games today
   - Reward: 5,000 pts (points-only)

4. **Referral Quest**: "Flame Starter"
   - Refer 1 friend who completes 1 quest
   - Reward: 3,000 pts per referral (cap: 3 referrals)

5. **Special Quest**: "Tutorial Video Challenge" (USDC-bearing)
   - Create and post tutorial video with referral link
   - Metric: Unique referral clicks during event
   - Reward:
     - 1st: 10 USDC + 111,111 pts (fixed, no multiplier)
     - 2–5th: 50,000 pts (no USDC)
   - **Consumes entire Day 1 USDC budget (10 USDC)**

#### Day 2 – INFERNO (Intense Gameplay)

**Focus**: Game mastery & grind

**Quests**:
1. **Game Quest**: "Arcade Master"
   - Reach 10,000 points in any arcade game
   - Reward: 8,000 pts + 1 USDC (first 5 completions)

2. **Game Quest**: "RPG Grinder"
   - Play 5 different games today
   - Reward: 6,000 pts + 1 USDC (first 5 completions)

3. **Social Quest**: "Inferno Tweet"
   - Post your best score with #555Inferno
   - Reward: 3,000 pts (points-only)

4. **Game Quest**: "Marathon Player"
   - Play 10+ games today
   - Reward: 10,000 pts (points-only)

**Daily USDC**: 10 USDC (5+5 from first two quests)

#### Day 3 – WILDFIRE (Viral Spread)

**Focus**: Referrals and social amplification

**Quests**:
1. **Referral Quest**: "Referral Sprint"
   - Refer 5 new users who each complete 1 quest
   - Reward: 15,000 pts + 5 USDC (first 2 completions)

2. **Social Quest**: "Viral Post"
   - Get 100+ likes on burn event post
   - Reward: 5,000 pts (points-only)

3. **Game Quest**: "Wildfire Streak"
   - Achieve personal best in 3 different games
   - Reward: 8,000 pts (points-only)

4. **Social Quest**: "Community Flame"
   - Reply to 10 other players' posts
   - Reward: 4,000 pts (points-only)

**Daily USDC**: 10 USDC (5+5 from referral quest)

#### Day 4 – BLAZE (High Competition)

**Focus**: Skill showcases & PvP

**Quests**:
1. **Game Quest**: "Top 10 Finish"
   - Finish in top 10 for any game today
   - Reward: 10,000 pts + 2 USDC (first 5 completions)

2. **Social Quest**: "Gameplay Clip"
   - Upload 30s+ gameplay clip
   - Reward: 5,000 pts (points-only)

3. **Game Quest**: "Speed Demon"
   - Complete 15 games in under 3 hours
   - Reward: 12,000 pts (points-only)

4. **Social Quest**: "Thread Creator"
   - Create 5+ tweet thread about burn event
   - Reward: 6,000 pts (points-only)

**Daily USDC**: 10 USDC (2×5 from top 10 quest)

#### Day 5 – SUPERNOVA (Grand Finale)

**Focus**: Epic conclusion & lasting impressions

**Quests**:
1. **Completion Quest**: "Perfect Week"
   - Complete at least 1 quest every day (1-5)
   - Reward: 20,000 pts + 5 USDC (first 2 completions)

2. **Game Quest**: "Final Push"
   - Earn 25,000+ points on Day 5 alone
   - Reward: 15,000 pts (points-only)

3. **Social Quest**: "Supernova Tweet"
   - Create viral tweet summarizing burn event
   - Reward: 8,000 pts (points-only)

4. **Game Quest**: "All Games Challenge"
   - Play every game at least once during event
   - Reward: 10,000 pts (points-only)

**Daily USDC**: 10 USDC (5×2 from perfect week quest)

### 4.2 Meta Quests (5-Day Window)

Each meta quest:

- **Scope**: Whole event `[T0, T0+5d]`
- **Winners**:
  - 1 × winner + 3 × runner-ups
- **Rewards**:
  - Winner: `555,555 points` (fixed) + `55 USDC`
  - Each runner-up: `55,555 points` (fixed) + `5 USDC`

The three meta quests:

1. **Meta – Top Referrer (Burn Referral King)**
   - **Objective**: Maximize valid referrals during event
   - **Metric**: `valid_referrals_count` over event
   - **Tracking**: Backend aggregates all active referrals for event window
   - **Rewards**:
     - 1st: 555,555 pts + 55 USDC
     - 2nd-4th: 55,555 pts + 5 USDC each

2. **Meta – Top Gamer (Burn MVP)**
   - **Objective**: Earn highest total game points during event
   - **Metric**: `sum(game_points)` over event (only from allowed games)
   - **Tracking**: Backend aggregates game scores during event window
   - **Rewards**: Same as Top Referrer

3. **Meta – Top Social Credit (Social Pyromancer)**
   - **Objective**: Maximize social engagement during event
   - **Metric**: `social_score` over event, where:
     - `social_score = likes×1 + replies×2 + retweets×3 + quotes×3 + unique_mentions×2`
     - Count only event-tagged/qualified posts
   - **Tracking**: Backend tracks social events during event window
   - **Rewards**: Same as Top Referrer

### 4.3 Special Day 1 Quest – Tutorial Video

- **Name**: `Tutorial Video – Burn Onboarding`
- **Scope**:
  - Starts Day 1 (`NOISE`), ends at overall event end (so clicks over all 5 days count)
- **Requirement**:
  - Create and post a video explaining how to join and play during the Burn Event
  - Must include the user's personal **referral link**
- **Metric**:
  - `unique_referral_clicks` or `unique referred wallets` originating from that video during event
- **Rewards**:
  - 1st: 10 USDC + 111,111 points (fixed, no multiplier)
  - Runner-ups (ranks 2–5): 50,000 points (no USDC)
- **USDC accounting**:
  - This quest **consumes the entire Day 1 USDC budget**: `10 USDC`

---

## 5. Leaderboards

Create a dedicated **Burn Event** leaderboard section with the following logical "boards".

### 5.1 Boards

1. **Daily Quest Progress (Per Day)**:
   - Shows:
     - Quest list for the selected day
     - Completion counts
     - Whether user is among "first 10" for USDC quests

2. **Meta – Referrals**:
   - Fields per row:
     - `rank`
     - `wallet`
     - `handle` (if linked)
     - `valid_referrals_count`
     - (After event) `points_awarded`, `usdc_awarded`

3. **Meta – Game Points**:
   - Fields:
     - `rank`, `wallet`, `handle`
     - `total_event_game_points`
     - (After event) reward fields

4. **Meta – Social Credit**:
   - Fields:
     - `rank`, `wallet`, `handle`
     - `social_score`
     - (After event) reward fields

5. **Special Quests Board**:
   - E.g. Tutorial Video:
     - `rank`, `wallet`, `handle`
     - `unique_referral_clicks`
     - `status` (pending/paid)
     - (After event) reward fields

### 5.2 Backend Endpoints

- `GET /events/burn/active` – Get active burn event
- `GET /events/burn/{id}` – Get event details
- `GET /events/burn/{id}/leaderboard` – Get overall event leaderboard
- `GET /events/burn/{id}/leaderboard/referrals` – Get referral meta leaderboard
- `GET /events/burn/{id}/leaderboard/game` – Get game meta leaderboard
- `GET /events/burn/{id}/leaderboard/social` – Get social meta leaderboard
- `GET /events/burn/{id}/quests` – Get event quests (filtered by day with `?day=X`)
- `GET /events/burn/{id}/rank` – Get authenticated user's rank

---

## 6. Payout Mechanics

### 6.1 Manual Burns

- **Out of scope for system**:
  - The bot / backend does **not** call burn instructions
- **Operator responsibility**:
  - You decide when and how much to burn (tokens/USDC)
  - You execute on-chain burns manually
- **Optional**:
  - System can store **burn logs** for UI (date, amount, tx hash)

### 6.2 Daily USDC Payouts

For each day `D`:

1. **End-of-day aggregation** (e.g. `D+1 00:05 UTC`):
   - Determine winners for all daily USDC quests (respect "first N completions" or single-winner rules)
   - Ensure total `sum(amounts) ≤ 10 USDC`

2. **Payment entries**:
   - For each winning wallet:
     - Create `usdc_payment` record:
       - `wallet`
       - `amount_usdc`
       - `event_id`
       - `day = D`
       - `reason` (e.g. `burn_day2_arcade_master`)
       - `status = pending`

3. **Bot batch payout via authority wallet**:
   - Bot scheduler picks up all `pending` entries with `day = D`
   - Sends **one batch** via Hyperlink using the **authority wallet**
   - On success:
     - Update `status = settled`
   - If any failure:
     - Log + retry policy as per existing payout system

### 6.3 Final Meta Payouts (After 5 Days)

1. **Finalize leaderboards** for:
   - Meta – Referrals
   - Meta – Game Points
   - Meta – Social Credit

2. **Select winners**:
   - For each board:
     - `rank = 1` → winner
     - `rank = 2–4` → runner-ups

3. **Create payment and point awards**:
   - For each:
     - `555,555` or `55,555` points (fixed)
     - `55` or `5` USDC
     - Corresponding entries in `usdc_payments` and `reward_points`

4. **Batch payout**:
   - Bot runs final Hyperlink batch from authority wallet for these meta rewards

5. **Announce**:
   - Bot posts Winners recap
   - Frontend shows "Final Results" state

---

## 7. Standardized Naming (For Docs & Code)

- **Event**: `BurnEvent`
- **Daily quests**: `BurnEventDailyQuest`
- **Meta quests**: `BurnEventMetaQuest`
- **Special quest**: `BurnEventSpecialQuest` (e.g. type = `tutorial_video`)
- **Leaderboards**:
  - `BurnReferralsLeaderboard`
  - `BurnGamePointsLeaderboard`
  - `BurnSocialLeaderboard`
  - `BurnSpecialLeaderboard` (e.g. `tutorial_video`)
- **Statuses**:
  - Referral: `pending` | `active`
  - Payment: `pending` | `sent` | `settled` | `failed`

---

## 8. Implementation Checklist

### Backend

- [x] Event models (`internal/models/burn_event.go`)
- [x] Basic event API endpoints (`internal/api/burn_events.go`)
- [x] Burn event scheduler (`internal/scheduler/burn_event_scheduler.go`)
- [ ] Meta leaderboard endpoints (referrals, game, social)
- [ ] Daily payout aggregation logic
- [ ] Final meta payout logic
- [ ] Quest definition extensions (event_id, event_day)
- [ ] Referral tracking for burn events
- [ ] Social credit scoring for burn events
- [ ] Game points aggregation for burn events

### Frontend

- [ ] BurnEventDialog component
- [ ] Fire-themed styling
- [ ] Countdown timers
- [ ] Meta leaderboard views
- [ ] Daily quest list with progress
- [ ] User event rank display

### Bot

- [ ] Burn event announcements (manual trigger)
- [ ] Daily USDC payout via Hyperlink
- [ ] Final meta payout via Hyperlink
- [ ] Event recap tweets

### Database

- [x] burn_events table
- [x] burn_event_days table
- [x] burn_event_leaderboard table
- [ ] quest_definitions extensions (event_id, event_day columns)
- [ ] referrals tracking for events
- [ ] social_credit aggregation table for events

---

## 9. Economics Summary

### Total USDC Distribution

- **Daily quests**: 5 days × 10 USDC = 50 USDC
- **Meta prizes**:
  - 3 categories × (55 + 3×5) = 3 × 70 = 210 USDC
- **Total event budget**: 260 USDC

### Breakdown by Category

- Day 1 (NOISE): 10 USDC (tutorial video)
- Day 2 (INFERNO): 10 USDC (arcade + rpg quests)
- Day 3 (WILDFIRE): 10 USDC (referral sprint)
- Day 4 (BLAZE): 10 USDC (top 10 finishes)
- Day 5 (SUPERNOVA): 10 USDC (perfect week)
- **Meta (Referrals)**: 70 USDC (1×55 + 3×5)
- **Meta (Game)**: 70 USDC (1×55 + 3×5)
- **Meta (Social)**: 70 USDC (1×55 + 3×5)

### Point Distribution

- **Per-quest points**: 3,000 – 20,000 pts (subject to multipliers)
- **Per-referral points**: 1,000 pts (subject to multipliers)
- **Meta prizes**: 555,555 pts (winner) + 3×55,555 pts (runner-ups) per category (fixed, no multipliers)
- **Total meta points**: 3 × (555,555 + 3×55,555) = 3 × 722,220 = 2,166,660 pts (fixed)

---

## 10. Security & Fairness

### Anti-Cheat

- Rate limit game submissions during event
- Manual review for high-value rewards (10 USDC+)
- Multi-account detection via IP tracking
- Score validation (outlier detection)

### Burn Security (Manual)

- You execute burns manually with proper custody
- Record burn tx hashes in `burn_event_days` table for transparency
- Public burn tx hashes displayed in UI

### Payout Security

- Quest completion requires proof (tx hash, tweet ID, referral link)
- Admin approval for content quests (tutorial video)
- Daily caps per wallet (prevent gaming)
- Idempotency on all USDC payments via Hyperlink

---

## 11. Success Metrics

### Engagement Targets

- 200+ unique participants
- 5,000+ game plays during event
- 500+ social posts with hashtags
- 20,000+ total reach on Twitter

### Technical Targets

- >99% payout success rate
- Zero duplicate payouts
- <5 second leaderboard update latency
- All meta leaderboards finalized within 1 hour of event end

### Business Targets

- 260 USDC distributed
- Tokens manually burned as planned
- 50+ new users onboarded
- 25+ viral tweets generated

---

## 12. Launch Timeline

### Development Phase

- Implement meta leaderboard endpoints
- Add daily/meta payout schedulers
- Build frontend burn event UI
- Test with staging event

### Setup Phase

- Create burn event in database
- Seed quest definitions
- Configure bot payout scheduler
- Test payouts on testnet

### Launch Phase

- Activate event
- Monitor daily operations
- Execute manual burns
- Finalize and distribute rewards

---

This standardized plan ensures the burn event is highly rewarding in points, carefully constrained in USDC outlay, fully aligned with manual burn execution, and transparent via dedicated leaderboards.
