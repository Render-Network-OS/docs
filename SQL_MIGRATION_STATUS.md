# SQL Migration Status Check

## Files Found

### In `sql/` (auto-loaded via go:embed):
1. ✅ `008_usdc_payments.sql` - USDC payment tables
2. ✅ `009_burn_events.sql` - Burn event tables
3. ⚠️ `2025-11-fix-leaderboard-points.sql` - **Leaderboard unique index fix**

### In `sql/migrations/`:
1. ✅ `008_usdc_payments.sql`
2. ✅ `009_burn_events.sql`
3. ❌ `2025-11-fix-leaderboard-points.sql` - **MISSING!**

---

## The `2025-11-fix-leaderboard-points.sql` Migration

**What it does:**
1. Fixes duplicate leaderboard entries
2. Drops legacy 4-column unique index
3. Creates correct 5-column unique index (includes `mode`)
4. Adds constraint to enforce mode values ('regular', 'beta')

**Critical?** YES - Without this:
- Duplicate entries can occur
- Beta/regular mode separation breaks
- Database constraint violations possible

---

## Check if Migration Ran on Production

### Method 1: Check Database (SQL)

```sql
-- Check if the unique index exists with correct columns
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'leaderboard_points'
  AND indexname = 'ux_lb_points';
```

**Expected if migration RAN:**
```
ux_lb_points | CREATE UNIQUE INDEX ux_lb_points ON leaderboard_points USING btree (period, key, game_id, wallet, mode)
```

**If migration NOT run:**
```
ux_lb_points | CREATE UNIQUE INDEX ux_lb_points ON leaderboard_points USING btree (period, key, game_id, wallet)
(only 4 columns - missing "mode")
```

### Method 2: Check Backend Logs

When backend starts, it runs migrations. Look for:
```
Running SQL migrations from sql/*.sql
Applied migration: 2025-11-fix-leaderboard-points.sql
```

### Method 3: Check for Constraint

```sql
-- Check if mode constraint exists
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'leaderboard_points'::regclass
  AND conname = 'ck_lb_points_mode';
```

**Expected if migration RAN:**
```
ck_lb_points_mode | CHECK | CHECK (mode IN ('regular', 'beta'))
```

**If migration NOT run:**
```
(no rows)
```

---

## How Backend Runs Migrations

**File:** `backend/cmd/555d/main.go`

```go
//go:embed sql/*.sql
var sqlMigrations embed.FS
```

The backend loads ALL `.sql` files from `sql/` directory at startup.

**This means:**
- ✅ `2025-11-fix-leaderboard-points.sql` WILL be loaded
- ✅ It will run automatically on next backend deploy
- ⚠️ But we need to check if it's ALREADY run

---

## Should We Run It Manually?

### Check Production Database First:

```sql
-- Quick check: do we have duplicates?
SELECT period, key, game_id, wallet, mode, COUNT(*)
FROM leaderboard_points
GROUP BY period, key, game_id, wallet, mode
HAVING COUNT(*) > 1;
```

**If you see rows:**
→ Migration hasn't run, duplicates exist

**If empty:**
→ Either migration ran OR no duplicates yet

---

## Recommendation

### Option A: Let Backend Auto-Run (Safe)

The migration is in `sql/` so it will run on next backend deploy.

**Action:** Redeploy backend (trigger GitHub Actions or Render manual deploy)

### Option B: Run Manually Now (Faster)

If you have database access:

```bash
# Connect to production database
psql $DATABASE_URL

# Run the migration
\i /path/to/2025-11-fix-leaderboard-points.sql

# Verify
\d leaderboard_points
```

### Option C: Copy to Migrations Folder (Documentation)

```bash
cp backend/sql/2025-11-fix-leaderboard-points.sql \
   backend/sql/migrations/2025-11-fix-leaderboard-points.sql
```

This is just for documentation - the migration will still run from `sql/` folder.

---

## Check Current Status

**Run this SQL on production:**

```sql
-- 1. Check index structure
SELECT indexdef
FROM pg_indexes
WHERE tablename = 'leaderboard_points' 
  AND indexname = 'ux_lb_points';

-- 2. Check for duplicates
SELECT COUNT(*) as duplicate_groups
FROM (
  SELECT period, key, game_id, wallet, mode, COUNT(*) as cnt
  FROM leaderboard_points
  GROUP BY period, key, game_id, wallet, mode
  HAVING COUNT(*) > 1
) sub;

-- 3. Check constraint
SELECT COUNT(*) as has_constraint
FROM pg_constraint
WHERE conrelid = 'leaderboard_points'::regclass
  AND conname = 'ck_lb_points_mode';
```

**Results tell you:**
- Query 1: Shows if index has 5 cols (with mode) or 4 cols (without)
- Query 2: Shows number of duplicate entry groups
- Query 3: Shows if constraint exists (1=yes, 0=no)

---

## What to Do

1. **Check production database** with queries above
2. **If migration hasn't run:** Redeploy backend to trigger it
3. **If duplicates exist:** Migration will consolidate them
4. **Monitor backend logs** during next deploy for migration messages

Want me to commit the bot fix and create a migration status check script?

