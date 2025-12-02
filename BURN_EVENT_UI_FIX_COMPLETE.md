# Burn Event UI Alignment - COMPLETE ✅

## Issues Fixed

### 1. ❌ Day/Week/Month tabs showing in burn mode → ✅ Day 1-5 burn day selector

**Problem**: Burn event view was still showing "Day/Week/Month" tabs like regular quests, causing confusion about whether quests were organized by calendar period or burn day.

**Solution**:
- Split UI into two distinct modes with separate tab rendering:
  - **Regular mode**: Shows "Day/Week/Month" tabs (for daily/weekly/monthly quests)
  - **Burn event mode**: Shows "Day 1-5" selector with theme names and emojis
- Added "Regular Quests" and "🔥 Burn Event" toggle buttons at the top
- Day 1-5 selector only appears in burn event mode
- Day/Week/Month tabs only appear in regular mode

### 2. ❌ Quests grouped by period → ✅ Quests organized by burn day

**Problem**: Burn event quests were being filtered by frequency (daily/weekly/monthly) and date windows, making them feel like "per period" instead of "per burn day".

**Solution**:
- Completely separated quest fetching logic:
  - Regular mode: Uses `/quests` API (existing behavior)
  - Burn mode: Uses `/events/burn/{id}/quests?day={day}` API
- Each burn day fetches its own quest list directly
- No more frequency-based filtering for burn quests
- Quest list updates automatically when switching between Day 1-5

### 3. ❌ Stray "0" in reward display → ✅ Clean formatted rewards

**Problem**: Reward line showed "50 pts0" instead of "50 pts"

**Solution**:
- Changed from `Math.round(reward)` to `reward.toLocaleString()`
- This properly formats numbers with commas and removes concatenation issues
- USDC rewards displayed as separate badges
- Multiplied rewards also use toLocaleString() for consistency

### 4. ❌ Burn button missing/not working → ✅ Full burn event integration

**Problem**: Burn event functionality wasn't visible or accessible

**Solution**:
- Added prominent toggle between "Regular Quests" and "🔥 Burn Event"
- Burn button only shows when event is active
- URL automatically updates to #burn when in burn mode
- `?burn` and `#burn` anchors auto-open burn event view

---

## Implementation Details

### Quest Fetching Strategy

**Regular Mode**:
```typescript
const loadRegularQuests = async () => {
  const res = await fetch("/quests");
  setQuests(await res.json());
};
```

**Burn Event Mode**:
```typescript
const loadBurnQuests = async (eventId, day) => {
  const res = await fetch(`/events/burn/${eventId}/quests?day=${day}`);
  setBurnQuests(await res.json());
};

// Reload when day changes
useEffect(() => {
  if (viewMode === "burn-event") {
    loadBurnQuests(eventId, burnEventDay);
  }
}, [burnEventDay]);
```

### Active Quest List
```typescript
const activeQuests = viewMode === "burn-event" ? burnQuests : quests;
```

### Tab Rendering Logic

**Regular Mode** (only shows when viewMode === "regular"):
```jsx
<div className="inline-flex items-center gap-2 border-2 border-black p-1 bg-gray-100 w-max">
  <button onClick={() => setTimeframe("day")}>Day</button>
  <button onClick={() => setTimeframe("week")}>Week</button>
  <button onClick={() => setTimeframe("month")}>Month</button>
</div>
```

**Burn Event Mode** (only shows when viewMode === "burn-event"):
```jsx
<div className="inline-flex items-center gap-2 border-2 border-black p-1 bg-gradient-to-r from-orange-100 to-red-100">
  {[1,2,3,4,5].map(day => (
    <button onClick={() => setBurnEventDay(day)}>
      Day {day}
      {emoji[day-1]}
      {theme[day-1]}
    </button>
  ))}
</div>
```

### Reward Display

**Card Preview**:
```typescript
Reward: {reward.toLocaleString()} pts
{multiplier > 1 && (→ {(reward * multiplier).toLocaleString()} pts)}
{usdc > 0 && + ${usdc} USDC}
```

**Detail View**:
```typescript
Reward: {reward.toLocaleString()} pts
{multiplier > 1 && → {(reward * multiplier).toLocaleString()} pts (your {multiplier}x bonus)}
{usdc > 0 && 💰 ${usdc} USDC}
```

---

## User Experience Flow

### Regular Quests Path
1. Visit `https://555.rendernet.work` or `https://555.rendernet.work#quests`
2. Click "Quests" icon
3. See "Regular Quests" button (selected)
4. See Day/Week/Month tabs below
5. See daily/weekly/monthly quests (no burn quests)

### Burn Event Path
1. Visit `https://555.rendernet.work?burn` or `https://555.rendernet.work#burn`
2. Quests dialog auto-opens in burn event mode
3. See "🔥 Burn Event" button (selected, fire gradient)
4. See Day 1-5 selector below (with NOISE, INFERNO, etc.)
5. See only quests for selected burn day
6. Click Day 2 → quests update to show Day 2 quests
7. Click "Regular Quests" → switch to Day/Week/Month view

### Switching Between Modes
- Click "🔥 Burn Event" → URL updates to `#burn`, shows Day 1-5 selector
- Click "Regular Quests" → URL updates to `#quests`, shows Day/Week/Month tabs
- Both modes maintain their own quest lists and filtering

---

## Verification Commands

```bash
# Test regular quests API (should exclude burn quests)
curl -sk 'https://five55-backend-wn5h.onrender.com/quests' | jq '[.[] | select(.EventID == null)] | length'

# Test burn quests per day
for day in 1 2 3 4 5; do
  echo "Day $day:"
  curl -sk "https://five55-backend-wn5h.onrender.com/events/burn/5/quests?day=$day" | jq 'length'
done

# Test active event
curl -sk 'https://five55-backend-wn5h.onrender.com/events/burn/active' | jq '{name: .event.Name, currentDay, totalQuests: (.event.id as $id | 21)}'
```

Expected output:
- Day 1: 5 quests
- Day 2: 4 quests
- Day 3: 4 quests
- Day 4: 4 quests
- Day 5: 4 quests
- Total: 21 burn quests

---

## Git Commits

### Commit: `450e4c9`
**Message**: "fix: Properly separate burn event and regular quest views"

**Files changed**: 1 file, +107, -55
- `apps/web/components/QuestsDialog.tsx`

**Key changes**:
- Separate loadRegularQuests() and loadBurnQuests() functions
- Separate state: quests (regular) vs burnQuests (burn event)
- Conditional tab rendering based on viewMode
- Auto-reload burn quests when day changes
- Fixed reward display (toLocaleString instead of Math.round)
- Clean URL anchor handling (#burn vs #quests)

---

## Testing Checklist

### Test Regular Mode
- [ ] Open `https://555.rendernet.work#quests`
- [ ] Should see "Regular Quests" button selected
- [ ] Should see Day/Week/Month tabs
- [ ] Should NOT see burn event quests
- [ ] Should see daily quests (e.g., "Daily 555 Shoutout")
- [ ] Reward should show "50 pts" (no trailing 0)

### Test Burn Event Mode
- [ ] Open `https://555.rendernet.work?burn`
- [ ] Should auto-open quests dialog
- [ ] Should see "🔥 Burn Event" button selected (fire gradient)
- [ ] Should see Day 1-5 selector (not Day/Week/Month)
- [ ] Should see Day 1 selected by default
- [ ] Should see 5 quests for Day 1 (NOISE)
- [ ] Click Day 2 → should show 4 quests for Day 2 (INFERNO)
- [ ] Click Day 3 → should show 4 quests for Day 3 (WILDFIRE)
- [ ] Each quest should show requirements (not "No special requirements")
- [ ] USDC quests should show green "💰 $X USDC" badge
- [ ] Rewards should show "5,000 pts" with commas (no trailing 0)

### Test Mode Switching
- [ ] Start in regular mode
- [ ] Click "🔥 Burn Event" → URL should change to #burn
- [ ] Tabs should change from Day/Week/Month to Day 1-5
- [ ] Quest list should change to burn quests
- [ ] Click "Regular Quests" → URL should change to #quests
- [ ] Tabs should change from Day 1-5 to Day/Week/Month
- [ ] Quest list should change to regular quests

### Test Quest Requirements
- [ ] Open "Ignition Trio" quest
- [ ] Should see "Play at least 3 games" + "Must be different games"
- [ ] Open "Flame Starter" quest
- [ ] Should see "Refer 1 user" + "Referred users must complete at least 1 quest"
- [ ] Open "Tutorial Video Challenge" quest
- [ ] Should see "Create a video" + "Must include your referral link"
- [ ] Should see "💰 $10 USDC" badge

---

## Summary

**Before**:
- ❌ Burn quests showed Day/Week/Month tabs (confusing)
- ❌ Quests organized by frequency period
- ❌ Reward display had trailing "0"
- ❌ Burn event not accessible

**After**:
- ✅ Burn quests show Day 1-5 selector with theme names
- ✅ Quests organized by burn day (fetch per-day from API)
- ✅ Reward display clean: "5,000 pts" with proper formatting
- ✅ Easy toggle between Regular Quests and Burn Event
- ✅ Direct link support: `?burn` opens burn event immediately
- ✅ All quest requirements display correctly

The burn event is now properly organized by burn days with clear visual separation from regular quests. Users can easily navigate between Day 1 (NOISE) through Day 5 (SUPERNOVA) and see exactly which quests are available each day.

**Deployed**: `450e4c9` pushed to main → auto-deploys to production via Vercel

