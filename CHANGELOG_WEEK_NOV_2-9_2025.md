# Changelog - Week of November 2-9, 2025

## Overview
This week saw major feature additions including beta game integration, Postgres migration completion, referral system enhancements, daily tasks system, and comprehensive scoring improvements. The platform expanded from 6 to 19 games with full beta mode support.

---

## 🎮 Major Features

### Beta Games Integration (Nov 8-9)
**Status:** Complete

- **13 new beta games integrated** into the platform:
  - `pixel-copter` - Helicopter flight game
  - `fighter-planes` - Aerial combat game
  - `peanball` - Pinball game with pea theme
  - `chesspursuit` - Chess-based puzzle game
  - `eat-my-dust` - Racing game with ghost mechanics
  - `floor13` - Dungeon crawler RPG
  - `godai-is-back` - Multiplayer game
  - `leftandright` - Simple directional game
  - `loud-maze` - Maze navigation game
  - `playback` - Platformer game
  - `vedas-run` - Endless runner
  - `where-were-going-we-do-need-roads` - Racing game
  - `wolf-and-sheep` - Strategy puzzle game

- **Beta Mode Toggle**
  - UI toggle in header to enable/disable beta mode
  - Backend persistence of beta mode preference
  - Beta games only visible when beta mode is enabled
  - Visual "BETA" badges on beta game cards

- **Beta Points System**
  - Separate point tracking for beta games (`mode='beta'` in database)
  - Beta points displayed separately on leaderboards: `(beta: X)` format
  - Profile shows beta points when beta mode is ON
  - Beta points attenuation: diminishing returns for non-improvement plays
    - 1st non-improvement: 1/50th of points
    - 2nd non-improvement: 1/500th of points
    - 3rd+ non-improvement: 1/5000th of points
    - Counter resets daily at CST midnight
  - Daily bonus (100 points) unaffected by attenuation

- **Game-Specific Fixes**
  - Fixed module import paths (added `.js` extensions) for ES6 modules
  - Fixed CSS loading issues (vedas-run, eat-my-dust)
  - Fixed audio manager initialization (peanball, chesspursuit)
  - Fixed score submission logic (vedas-run distance tracking)
  - Fixed circular dependencies (wolf-and-sheep)
  - Fixed TypeScript compilation errors (playback)
  - Fixed asset path resolution (eat-my-dust images)

---

## 🗄️ Database & Storage

### Postgres Migration (Nov 4-5)
**Status:** Complete

- **Full Postgres Integration**
  - Postgres now PRIMARY storage (required)
  - BadgerDB remains as BACKUP storage (cache layer duo with redis)
  - GORM models for all game-related data
  - Auto-migration on startup

- **New Database Models**
  - `DailyNonBestCounter` - Tracks consecutive non-improvement plays per game/day
  - `LeaderboardPoints` - Extended with `mode` column ('regular' or 'beta')
  - `GlobalPoints` - Split into `regular_points` and `beta_points` columns

- **Database Schema Fixes**
  - Fixed `ux_lb_points` unique index to include `mode` column (5-column index)
  - Idempotent execution
  - Health check verifies correct index on startup

- **Atomic UPSERTs**
  - Implemented robust SELECT/UPDATE/INSERT pattern for concurrent writes
  - Prevents duplicate key violations (`23505` errors)
  - Handles wallet address case sensitivity correctly
  - SAVEPOINT-based transaction isolation for `LeaderboardPoints` writes

---

## 🎯 Scoring & Normalization

### Score Normalization Improvements (Nov 3-4)
**Status:** Complete

- **Difficulty Multipliers**
  - Normal difficulty: 1.35x multiplier
  - Hard difficulty: 1.75x multiplier
  - 2-tier games (normal only): 1.5x multiplier
  - Mid-run difficulty change guardrails

- **Removed Normalization Cap**
  - Previously capped at 10,000 normalized points
  - Now allows exceptional scores to exceed baseline
  - Better reflects high-skill gameplay

- **Game-Specific Normalization**
  - Ninja: Time-based fallback scoring
  - Clawstrike: Removed cap, improved normalization
  - Sector-13: Robust score capture with `window.G` exposure. Sets up future levels
  - All beta games: Individual `maxScores` configuration

- **Raw Score Display**
  - Leaderboard now shows raw scores alongside normalized points
  - Format: `{points} pts ({raw_score} raw)`
  - Fetches both period leaderboards (points) and best leaderboards (raw scores)
  - Merges results for comprehensive display

---

## 🔗 Referral System (Nov 2-4)
**Status:** Complete

- **Referral Link Management**
  - Create referral links with token gating
  - Capacity: 25 referrals (55,555 token balance) or 100 referrals (555,555+ balance)
  - Copy-to-clipboard
  - Visual feedback with toasts

- **Referral Binding**
  - Bind to referral link via wallet address input
  - Prevents duplicate binds (409 error handling)
  - Shows capacity used/total
  - Disables bind button when already bound

- **Referral Points**
  - +555 points per referral (up to 10/day)
  - Points awarded immediately on bind
  - Idempotent award logic
  - Daily cap enforcement

- **Referral Leaderboards**
  - New `/game/referral/leaderboard` endpoint
  - Period-based leaderboards (day/week/month/year)
  - Included in global points aggregation
  - SSE updates on referral events

---

## ✅ Daily Tasks System (Nov 2-4)
**Status:** Complete

- **Task Types**
  - Play games (5 different games)
  - Referral task (+555 per referral, cap 10/day)
  - Live chat participation
  - Complete-all bonus: +1000 points when all tasks done

- **API Endpoints**
  - `GET /api/tasks/daily` - Fetch current tasks and progress
  - `POST /api/tasks/daily/complete` - Claim complete-all bonus
  - Returns per-task points, progress, and completion status

- **UI Integration**
  - Profile dialog shows daily tasks
  - Progress indicators (e.g., "3/5 tasks complete")
  - Referral progress with dynamic points display
  - "Claim +1000" button when all tasks complete
  - Daily reset clock next to wallet button
  - Shows next reset time (midnight CST) with countdown

- **Backend Logic**
  - Per-task point configuration
  - Eligibility caching
  - SSE task events for real-time updates
  - Threshold-based awards (>= threshold)

---

## 🎨 UI/UX Improvements (Nov 2-9)

### Visual Design
- **Color Scheme Updates**
  - Changed icon/button fills from white to `#fefce8` (warm yellow)
  - Applied to: wallet button, clock button, profile icons, copy/bind buttons
  - Applied to: RenderNet, Docs, Community, Profile home icons
  - Live dot border adjustments

- **Profile Dialog**
  - Sticky header (remains visible on scroll)
  - Filled profile icon (yellow fill on hover)
  - Tasks section with progress indicators
  - Global points display
  - Referral link management UI

- **Leaderboard Dialog**
  - Separate beta points display: `(beta: X)` format
  - Raw score display alongside normalized points
  - Improved merge logic for period + best leaderboards
  - Game count stat: correctly shows 19 games (was showing 0%)
  - Percentage change calculation: 217% increase (6 → 19 games)

- **Accessibility**
  - Added `DialogDescription` components to all dialogs
  - Screen reader support with `sr-only` class
  - Fixed ARIA warnings

- **Loading States**
  - Site-wide `Loader` component
  - App-level `loading.tsx` for route transitions
  - Improved loading feedback

---

## 🔧 Backend API Enhancements

### Game Record Submission (Nov 8-9)
- **Rate Limiting**
  - Frontend: 2-second cooldown between submissions
  - Pending submission flag prevents duplicate requests
  - Prevents `ERR_INSUFFICIENT_RESOURCES` errors

- **Error Handling**
  - Detailed error logging with `error_details` in JSON responses
  - Frontend parses and displays error details
  - Beta mode rejection: structured `beta_mode_required` error
  - Token gating: fail-open on RPC errors (allows play, logs error)

- **Token Gating**
  - Uses mainnet RPC for token balance checks (even in beta)
  - 30-second cache for token balances
  - Graceful handling of RPC rate limits (429 errors)
  - Returns stale cached value on rate limit

- **Score Submission**
  - Unique `run_id` generation if empty
  - Duplicate `run_id` handling (update if score higher, ignore otherwise)
  - Beta mode flag passed to repository
  - Comprehensive logging for debugging

### Leaderboard Endpoints (Nov 8-9)
- **Raw Score Support**
  - `GET /game/{id}/leaderboard` (no period) returns `raw_score`
  - Increased limit to 1000 for best leaderboards
  - `mode=both` parameter to fetch regular + beta points

- **Beta Points Endpoints**
  - `GET /api/beta/points` - Fetch user's beta points
  - `GET /api/beta/stats` - Fetch beta statistics
  - Fallback aggregation from `LeaderboardPoints` if `GlobalPoints.BetaPoints` is zero

- **Profile Endpoint**
  - `GET /api/profile` - Reads regular points from Postgres
  - Includes global points and task progress

### Referral Endpoints (Nov 2-4)
- `GET /api/referral/link` - Get or create referral link
- `POST /api/referral/bind` - Bind wallet to referral link
- `GET /api/referral/stats` - Get referral statistics
- `GET /game/referral/leaderboard` - Referral leaderboard

### Daily Tasks Endpoints (Nov 2-4)
- `GET /api/tasks/daily` - Get daily tasks and progress
- `POST /api/tasks/daily/complete` - Claim complete-all bonus

---

## 🐛 Bug Fixes

### Frontend Fixes
- Fixed game count stat showing 0%
- Fixed raw score not displaying on leaderboards
- Fixed beta points not showing in profile
- Fixed leaderboard empty for beta-only games
- Fixed "pts0" display when beta points are zero
- Fixed puzzle dialog back button styling
- Fixed game path corrections (peanball, playback, eat-my-dust, vedas-run)
- Fixed TypeScript compilation errors (playback, vedas-run)
- Fixed module import paths (missing `.js` extensions)
- Fixed CSS loading (vedas-run, eat-my-dust)
- Fixed asset path resolution (eat-my-dust images)

### 555-Backend Fixes
- Fixed duplicate key violations (`23505` errors) with atomic UPSERTs
- Fixed transaction abort errors (`25P02`) with SAVEPOINT isolation
- Fixed unique index constraint errors (`42P10`) with correct 5-column index
- Fixed wallet casing inconsistencies
- Fixed `GlobalPoints` duplicate key errors with `ON CONFLICT` upserts
- Fixed RPC rate limiting blocking score submissions (fail-open logic)
- Fixed token balance checks using wrong network (now always mainnet)
- Fixed empty `run_id` causing duplicate errors (generate unique ID)
- Fixed beta points not accumulating (correct mode flag passing)
- Fixed raw score not returned in leaderboard API (added to response)

### Game-Specific Fixes
- **vedas-run**: Fixed score submission (distance tracking), CSS clipping, module paths
- **eat-my-dust**: Fixed module imports, CSS loading, asset paths
- **peanball**: Fixed audio manager initialization, score variable scope
- **wolf-and-sheep**: Fixed circular dependencies, ES module loading, CSS imports
- **floor13**: Fixed missing `constants.js` file
- **chesspursuit**: Fixed audio manager initialization
- **playback**: Fixed TypeScript compilation errors

---

### Testing Infrastructure (Nov 7)
- Comprehensive e2e test infrastructure
- Game play flow tests
- Test helpers for database, Solana, wallets, server

---

## 📊 Statistics

### Code Changes
- **555-mono**: 358 files changed, 69,969 insertions(+), 92 deletions(-)
- **555-backend**: 22 files changed, 3,521 insertions(+), 330 deletions(-)

### New Features
- 13 beta games integrated
- Beta mode toggle
- Referral system
- Daily tasks system
- Postgres migration
- Raw score display
- Beta points system

---

## 🔄 Breaking Changes

### Database Schema
- `LeaderboardPoints` now requires `mode` column
- `GlobalPoints` split into `regular_points` and `beta_points`
- New `DailyNonBestCounter` table

### API Changes
- `GET /game/{id}/leaderboard` now includes `raw_score` for best leaderboards
- New `mode` parameter for leaderboard endpoints
- Beta mode required header (`X-Beta-Mode: true`) for beta game submissions

---

## 📝 Notes

### Lottery/VRF System
- Temporarily disabled (on ice)
- VRF commit retries disabled
- Lottery-related functionality wip

### Migration Notes
- SQL migration auto-runs on deploy
- Safe to run multiple times (idempotent)
- Health check ensures correct index before startup

### Beta Games
- Only accessible when beta mode is enabled
- Separate point tracking
- Attenuation for non-improvement plays
- Daily reset at CST midnight

**Generated:** November 9, 2025  
**Period:** November 2-9, 2025  
**Repos:** 555-mono, 555-backend

