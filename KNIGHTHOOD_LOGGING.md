# Knighthood Complete Logging Reference

## All Console Logs You'll See (in Order)

### 1. Game Initialization
```
[Knighthood] Game initializing...
[Knighthood] Program started
[Knighthood] SDK globals exposed - window.G and window.Ha ready
```

### 2. SDK Ready
```
[five55][knighthood] Adapter activated: knighthood
```

### 3. Title Screen → Start Game
```
[Knighthood] Game started - Title screen dismissed
```

### 4. Camera Transition
```
[Knighthood] Resetting game state
[Knighthood] Reset complete - Ready to play
[Knighthood] Gameplay active - Camera reached initial position
```

### 5. During Gameplay

**Speed increases (every 1200 ticks ≈ 20 seconds):**
```
[Knighthood] Speed increase! Level 1, Speed: 1.25x
[Knighthood] Speed increase! Level 2, Speed: 1.50x
[Knighthood] Speed increase! Level 3, Speed: 1.75x
[Knighthood] Speed increase! Level 4, Speed: 2.00x
```

**Collecting gems:**
```
[Knighthood] Gem collected! Total orbs: 1, Fuel: 85%
[Knighthood] Gem collected! Total orbs: 2, Fuel: 100%
[Knighthood] Gem collected! Total orbs: 3, Fuel: 100%
```

**Score milestones (every 1000 points):**
```
[Knighthood] Score milestone: 1000 (Orbs: 2, Multiplier: 1.20x)
[Knighthood] Score milestone: 2000 (Orbs: 3, Multiplier: 1.30x)
[Knighthood] Score milestone: 3000 (Orbs: 5, Multiplier: 1.50x)
```

### 6. Player Death

**Option A: Fell into water**
```
[Knighthood] Player fell into water - Score at death: 2547
[Knighthood] Player died - Score: 2547, Best: 2547, Orbs: 4
```

**Option B: Hit enemy**
```
[Knighthood] Hit enemy - Player dying
[Knighthood] Player died - Score: 1823, Best: 1823, Orbs: 3
```

### 7. Game Over Screen Appears
```
[Knighthood] Game Over - Final Score: 2547, Best: 2547
```

### 8. SDK Detects Game Over and Submits Score
```
[five55][knighthood] Game Over detected - Score: 2547, Best: 2547, Adapter: knighthood
[five55][knighthood] Submitted score: 2547 to backend
```

### 9. Frontend Processes Submission
```
[GamePlayer][knighthood] submitRecord - Score: 2547, Meta: {game: "knighthood", best: 2547, ...}
[GamePlayer][knighthood] Record submitted - Status: 204 OK
```

### 10. Restart Game (Press Enter)
```
[Knighthood] Restarting game - Enter pressed on game over screen
[Knighthood] Resetting game state
[Knighthood] Reset complete - Ready to play
```

---

## Backend Logs (in Terminal)

When score is submitted, you'll see in your backend server logs:

```
INFO processing game record game_id=knighthood wallet=YOUR_WALLET_ADDRESS
INFO play counter incremented game_id=knighthood total_plays=42
INFO broadcasting game_stats_update game_id=knighthood unique_players=5 plays=42
INFO leaderboard_update event broadcasted delta_points=2547 new_global_points=5123
```

---

## Complete Game Flow with Logs

```
Page Load:
  [Knighthood] Game initializing...
  [Knighthood] Program started
  [Knighthood] SDK globals exposed - window.G and window.Ha ready
  [five55][knighthood] Adapter activated: knighthood

Press Enter:
  [Knighthood] Game started - Title screen dismissed
  [Knighthood] Resetting game state
  [Knighthood] Reset complete - Ready to play
  [Knighthood] Gameplay active - Camera reached initial position

During Play:
  [Knighthood] Gem collected! Total orbs: 1, Fuel: 85%
  [Knighthood] Score milestone: 1000 (Orbs: 1, Multiplier: 1.10x)
  [Knighthood] Speed increase! Level 1, Speed: 1.25x
  [Knighthood] Gem collected! Total orbs: 2, Fuel: 100%
  [Knighthood] Score milestone: 2000 (Orbs: 2, Multiplier: 1.20x)

Player Dies:
  [Knighthood] Player fell into water - Score at death: 2547
  [Knighthood] Player died - Score: 2547, Best: 2547, Orbs: 2

Game Over Screen:
  [Knighthood] Game Over - Final Score: 2547, Best: 2547

SDK Submission (auto after ~3 seconds):
  [five55][knighthood] Game Over detected - Score: 2547, Best: 2547, Adapter: knighthood
  [five55][knighthood] Submitted score: 2547 to backend
  [GamePlayer][knighthood] submitRecord - Score: 2547, Meta: {...}
  [GamePlayer][knighthood] Record submitted - Status: 204 OK

Backend (in terminal):
  INFO processing game record game_id=knighthood wallet=...
  INFO leaderboard_update event broadcasted
```

---

## Debugging Tips

1. **No SDK logs?** 
   - Check if `/games-sdk.js` loaded (should see `[five55][knighthood] Adapter activated`)
   - Verify `window.G` exists in console: type `window.G` and press Enter

2. **Score not submitting?**
   - Check `window.G.h` value (should be 2 at game over screen)
   - Check `window.G.g.ja()` returns correct score
   - Verify wallet is connected (check for `sid=` cookie)

3. **Backend not receiving?**
   - Check frontend logs for "Record submitted - Status: 204 OK"
   - If Status is 401, wallet not authenticated
   - If Status is 500, backend error (check backend logs)

4. **Points not updating in leaderboard?**
   - Check backend logs for "delta_points" value
   - If delta is 0, score didn't improve from previous best
   - Open leaderboard and check if SSE connection is active

---

## Log Levels Summary

**Game Events:**
- Initialization, start, reset
- Gameplay milestones (speed ups, score 1000s)
- Item collection (gems)
- Death (water fall, enemy hit)
- Game over screen
- Restart

**SDK Events:**
- Adapter activation
- Game over detection
- Score submission to parent

**Frontend Events:**
- submitRecord received
- Backend POST status

**Backend Events:**
- Record processing
- Delta point computation
- Leaderboard broadcast

All logs are prefixed with `[Knighthood]`, `[five55]`, or `[GamePlayer]` for easy filtering.

