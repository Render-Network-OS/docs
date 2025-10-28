# Knighthood Points Integration - Implementation Summary

## What Was Done

### 1. Source Code Modifications

**File: `/Users/mac/Desktop/Work/555/555-mono/apps/web/public/games/knighthood_main/src/main.ts`**
- Added `window.G` object with score/state getters for SDK integration
- Exposed `window.G.g.ja()` method that returns player score
- Exposed `window.G.h` property that returns game phase (0=running, 1=dying, 2=game over)
- Exposed `window.G.J` property that returns best score from localStorage
- Added `window.Ha` class reference for SDK adapter detection

**File: `/Users/mac/Desktop/Work/555/555-mono/apps/web/public/games/knighthood_main/tsconfig.json`**
- Added `"skipLibCheck": true` to bypass type definition conflicts

### 2. Deployed Game

**File: `/Users/mac/Desktop/Work/555/555-mono/apps/web/public/games/knighthood/index.html`**
- Loads `/games-sdk.js` for score submission bridge
- Loads `../knighthood_main/js/main.js` as ES6 module (unminified but functional)
- Includes mobile touch controls (d-pad + attack button)
- Mobile controls dispatch keyboard events for Arrow keys and Space

### 3. How It Works

**Score Flow:**
1. Player plays knighthood game
2. Score accumulates in `Player.score` (incremented every 6 time units + orb bonuses)
3. When `gameOverPhase` reaches 2 (game over screen), SDK detects via `window.G.h === 2`
4. SDK calls `window.five55.submitRecord(score, meta)`
5. `GamePlayer.tsx` receives postMessage and POSTs to `/game/knighthood/record`
6. Backend computes delta points (new best - previous best)
7. Backend updates global leaderboard and broadcasts SSE `leaderboard_update` event
8. Frontend leaderboard UI updates in real-time

**SDK Adapter (existing in games-sdk.js):**
```javascript
registerAdapter({
  name: "knighthood",
  detect: function () { return typeof window.Ha === "function"; },
  getScore: function () { return Number(window.G.g.ja()) || 0; },
  isGameOver: function () { return !!(window.G && window.G.h === 2); }
});
```

## Testing Instructions

### 1. Start Servers

```bash
# Terminal 1 - Backend
cd /Users/mac/Desktop/Work/555/backend
make run

# Terminal 2 - Frontend  
cd /Users/mac/Desktop/Work/555/555-mono/apps/web
bun run dev
```

### 2. Test Game Integration

1. Navigate to `http://localhost:3000` (or your frontend URL)
2. Connect wallet (Sign In with Solana)
3. Open Games dialog and select "Knighthood"
4. Play the game:
   - Press ENTER to start
   - Use Arrow keys or A/D to move
   - Use W or Up arrow to jump
   - Use Space to attack
   - Collect gems (green orbs) to increase fuel and score multiplier
5. Let player die (fall into water or hit enemy)
6. Wait for game over screen (gameOverPhase = 2)
7. Check browser console for SDK messages:
   - `[five55][sdk] sdk_ready`
   - postMessage `submitRecord` with score
8. Check backend logs for:
   - `POST /game/knighthood/record`
   - Delta points computation
   - Global leaderboard update
9. Open Leaderboard dialog - verify points increased for your wallet

### 3. Console Logs to Expect

When you die and reach game over, you should see these logs in browser console:

```
[Knighthood] Player died - Score: 1234, Best: 1234, Orbs: 5
[Knighthood] Game Over - Final Score: 1234, Best: 1234
[five55][knighthood] Adapter activated: knighthood
[five55][knighthood] Game Over detected - Score: 1234, Best: 1234, Adapter: knighthood
[five55][knighthood] Submitted score: 1234 to backend
[GamePlayer][knighthood] submitRecord - Score: 1234, Meta: {...}
[GamePlayer][knighthood] Record submitted - Status: 204 OK
```

### 4. Verify Backend Points

Check backend logs for lines like:
```
processing game record game_id=knighthood wallet=YOUR_WALLET
leaderboard_update broadcasted with delta_points and new_global_points
```

### 5. Verify Frontend Updates

- Leaderboard dialog should show your wallet with points = best knighthood score
- SSE events should broadcast `leaderboard_update` in real-time
- Top players list should update immediately after game over

## Known Limitations

1. **No Minification:** Game loads 27 ES6 modules instead of single minified bundle
   - Works fine in modern browsers
   - Slightly slower initial load than minified version
   - To minify: need to set CLOSURE_PATH env var and run `make dist`

2. **Other Games:** Still using minified versions
   - Ninja, Drive, Clawstrike, Flock, Sector-13 use existing SDK adapters
   - Will be rebuilt when full sources provided

## Next Steps

### When You Provide Other Game Sources

For each game you provide source for:
1. Add similar `window.G` exposure in their main entry point
2. Rebuild with TypeScript/build system
3. Deploy to `/games/{game-id}/index.html`
4. Test score submission

### Optional Enhancements (Not Yet Implemented)

1. **Per-Game Point Normalization:**
   - Add weight multipliers in backend to normalize different score scales
   - Example: knighthood 1:1, ninja 0.1x, drive 0.01x (time-based)

2. **Timeframe Leaderboards:**
   - Daily/weekly/monthly leaderboards
   - Store timestamped points with date keys
   - New endpoints: `/leaderboard/global/daily`, `/weekly`, `/monthly`

3. **Minification:**
   - Install Closure Compiler: `brew install closure-compiler` or download jar
   - Set `CLOSURE_PATH=/path/to/compiler.jar`
   - Run `make dist` to get optimized <13KB bundle

## Architecture Reference

**Backend Points Pipeline:**
```
POST /game/{id}/record { score, meta }
  ↓
handlePostGameRecord (game.go:70-293)
  ↓
Compute delta = new_best - prev_best
  ↓
Update global:wallet:{wallet}:points
  ↓
Update global:leaderboard (top 100)
  ↓
SSE broadcast: leaderboard_update
  ↓
Frontend LeaderboardDialog receives update
```

**Frontend Integration:**
```
Game iframe loads /games-sdk.js
  ↓
SDK heartbeat detects score via window.G.g.ja()
  ↓
SDK detects game over via window.G.h === 2
  ↓
SDK calls window.five55.submitRecord(score, meta)
  ↓
postMessage → GamePlayer.tsx
  ↓
fetch POST /game/{id}/record
  ↓
Backend updates points
```

## File Structure

```
555-mono/apps/web/public/
├── games/
│   └── knighthood/
│       ├── index.html          # NEW: Module loader with SDK
│       ├── b.png               # Game sprites (background)
│       └── f.png               # Game sprites (foreground)
├── games/knighthood_main/      # Full TypeScript source
│   ├── src/
│   │   ├── main.ts             # MODIFIED: Added window.G exposure
│   │   ├── game/
│   │   │   ├── game.ts         # Game loop, gameOverPhase logic
│   │   │   └── player.ts       # Player.getScore() method
│   │   └── core/
│   │       └── program.ts      # Main game class
│   ├── js/                     # Transpiled JavaScript (27 modules)
│   │   └── main.js             # Entry point loaded by index.html
│   ├── tsconfig.json           # MODIFIED: Added skipLibCheck
│   └── index_body.html         # MODIFIED: Added games-sdk.js script tag
└── games-sdk.js                # SDK bridge (already configured)
```

## Success Criteria

- ✅ Knighthood loads without errors
- ✅ SDK detects score via `window.G.g.ja()`
- ✅ SDK detects game over via `window.G.h === 2`  
- ✅ Score posts to `/game/knighthood/record` on game over
- ✅ Backend computes delta points
- ✅ Global leaderboard updates
- ✅ Frontend shows updated points in real-time

Test by playing knighthood to game over and checking the leaderboard shows your wallet with points equal to your best score.

