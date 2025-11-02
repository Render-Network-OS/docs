# Games Integration Status

## Summary

All game sources have been modified with SDK integration. Some need building, others are ready to deploy.

---

## Game 1: Knighthood ✅ COMPLETE

**Status:** Fully integrated and deployed  
**Source:** `/games/knighthood_main/`  
**Deployed:** `/games/knighthood/index.html`  
**Build:** TypeScript compiled to JS modules  
**SDK Integration:** ✅ window.G.g.ja(), window.G.h, window.G.J exposed  
**Logging:** ✅ Comprehensive logs added  
**Testing:** ✅ Verified working with pointing system  

**Score Metric:** Points accumulated over time + orb bonuses  
**Play Counter:** ✅ Working (increments on game over)

---

## Game 2: Sector 13 ✅ BUILT, NEEDS DEPLOYMENT

**Status:** Built, needs SDK script tag added to minified version  
**Source:** `/games/sector-13-main/`  
**Built:** `/games/sector-13-main/dist/index.html` (17.7KB minified)  
**Deployed:** Needs manual SDK injection  
**Build:** Vite + TypeScript (completed)  
**SDK Integration:** ✅ Added to source (state.score, state.gameOver)  
**Logging:** ✅ Game over logging added  

**Score Metric:** Points from destroying enemies  
**Action Needed:**  
```bash
# Add SDK script before the minified bundle
sed -i '' 's|<script>|<script src="/games-sdk.js"></script><script>|' \
  /Users/mac/Desktop/Work/555/555-mono/apps/web/public/games/sector-13-main/dist/index.html
  
# Then copy to deployment
cp sector-13-main/dist/index.html sector-13/index.html
```

---

## Game 3: Drive (DR1V3N WILD) ✅ READY TO DEPLOY

**Status:** Source modified, ready to deploy  
**Source:** `/games/dr1v3n-wild-main/`  
**Deployed:** `/games/drive/index.html` points to source files  
**Build:** No build needed (standalone JS files)  
**SDK Integration:** ✅ window.G exposed in game.js  
**Logging:** ✅ Game over logging added  

**Score Metric:** Distance traveled (playerVehicle.pos.z / 10)  
**Play Counter:** Will work when deployed  

**Files Modified:**
- `game.js` - Added SDK globals, game over logging
- `index.html` - Added SDK script tag
- `/games/drive/index.html` - Created loader

---

## Game 4: Ninja vs EVILCORP ⚠️ NEEDS BUILD

**Status:** Source modified, needs js13k-compiler build  
**Source:** `/games/ninja-vs-evilcorp-master/`  
**Current:** `/games/ninja/index.html` already has SDK ✅  
**Build:** Requires js13k-compiler (blocked by ESM/CommonJS conflict)  
**SDK Integration:** Current minified version already exposes window.G ✅  
**Logging:** ✅ Added to source (needs rebuild to deploy)  

**Score Metric:** Time to complete (lower = better)  
**Play Counter:** Should already work with current minified version  

**Issue:** build.js uses CommonJS require() in ESM monorepo context  
**Workaround:** Current minified version already working, or build outside monorepo  

---

## Game 5: Clawstrike ⚠️ NEEDS BUILD + SDK TAG

**Status:** Source modified, needs build  
**Source:** `/games/clawstrike-main/`  
**Current:** `/games/clawstrike/index.html` - NO SDK script tag  
**Build:** npm/bun build scripts available  
**SDK Integration:** ✅ Added to game.js source  
**Logging:** ✅ Run complete logging added  

**Score Metric:** Run time in milliseconds  
**Action Needed:**  
1. Build: `cd clawstrike-main && bun run build:debug`
2. Add SDK tag to current `/games/clawstrike/index.html`
3. Or deploy built version with SDK tag

---

## Game 6: Flock ⚠️ NOT STARTED

**Status:** Not investigated yet  
**Source:** `/games/get-the-flock-outta-here-main/`  
**Current:** `/games/flock/index.html` - unknown state  
**SDK Integration:** Not started  
**Score System:** Unknown (needs investigation)  

**Action Needed:**  
1. Investigate score/completion mechanics
2. Add SDK integration
3. Build and deploy

---

## Quick Wins (Can Deploy Now)

### 1. Add SDK to existing minified Clawstrike
```html
<!-- In /games/clawstrike/index.html, add before existing scripts -->
<script src="/games-sdk.js"></script>
```

### 2. Deploy Sector 13
```bash
# Add SDK, then copy
cd /Users/mac/Desktop/Work/555/555-mono/apps/web/public/games
sed 's|<script>|<script src="/games-sdk.js"></script><script>|' \
  sector-13-main/dist/index.html > sector-13/index.html
```

### 3. Drive is already deployed
Just needs testing

---

## Testing Checklist

For each integrated game:

1. **Load game** - Check console for:
   ```
   [GameName] Game initializing...
   [GameName] SDK globals exposed - window.G ready
   [five55][game-id] Adapter activated: game-id
   ```

2. **Play to completion** - Check for:
   ```
   [GameName] Game Over/Complete - Final Score: XXX
   [five55][game-id] Game Over detected - Score: XXX
   [GamePlayer][game-id] Record submitted - Status: 204 OK
   ```

3. **Backend logs** - Verify:
   ```
   INFO processing game record game_id=game-id
   INFO play counter incremented total_plays=X
   ```

4. **Leaderboard** - Check:
   - Play count shows correct number
   - Progress bar fills proportionally
   - Points update in global leaderboard

---

## Build Commands Reference

**Knighthood:**
```bash
cd knighthood_main && make js
```

**Sector 13:**
```bash
cd sector-13-main && bun run build
```

**Drive:**
No build needed (standalone JS)

**Ninja:**
```bash
cd ninja-vs-evilcorp-master
# Need to fix ESM/CommonJS conflict or build outside monorepo
node build.js
```

**Clawstrike:**
```bash
cd clawstrike-main
bun install
bun run build:debug
```

**Flock:**
TBD (needs investigation)

---

## Current State

| Game | SDK Added | Built | Deployed | Tested |
|------|-----------|-------|----------|--------|
| Knighthood | ✅ | ✅ | ✅ | ✅ |
| Sector 13 | ✅ | ✅ | ⚠️ Manual | ⏳ |
| Drive | ✅ | N/A | ✅ | ⏳ |
| Ninja | ✅ | ⚠️ | ✅* | ⏳ |
| Clawstrike | ✅ | ⏳ | ⚠️ | ⏳ |
| Flock | ⏳ | ⏳ | ⏳ | ⏳ |

\* Using existing minified version (already has SDK)

---

## Next Steps

1. **Deploy Sector 13** - Add SDK tag to dist/index.html and copy to deployment
2. **Deploy Clawstrike** - Add SDK tag to existing minified version OR build from source
3. **Test Drive** - Verify score submission works
4. **Investigate Flock** - Understand scoring system and add integration
5. **Optional: Rebuild Ninja** - To get new logging (current version already works)







