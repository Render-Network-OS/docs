# 555 Arcade – Robustness Status & Multiplayer Readiness Checklist

This document summarizes current capabilities across backend, SDK, and UI, highlights gaps, and provides a detailed checklist to reach a robust, multi‑player‑ready system. References point to concrete files and endpoints in this repo.

## Status Summary

- Backend
  - HTTP API in `backend/internal/api/server.go:80` exposes:
    - Game state/records/leaderboards: `/game/{id}/state`, `/game/{id}/record`, `/game/{id}/play`, `/game/{id}/leaderboard`, `/game/{id}/rank`, `/game/{id}/stats`.
    - Global leaderboards and period stats: `/leaderboard/global`, `/leaderboard/global/rank`, `/leaderboard/global/period-stats`, `/leaderboard/global/stats`.
    - Normalization caps disclosure: `/config/normalization`.
    - Auth (SIWS): `/auth/nonce`, `/auth/verify`, `/auth/logout`, `/me`.
  - Record pipeline `backend/internal/api/game.go:97`:
    - Normalizes per‑game scores (`normalizeScore`) with time‑based scoring for Ninja (`timeSec`) and generic normalization for others.
    - Dedupe by run id with upgrade semantics (accepts later, higher score for same run): `dedupe: game:{id}:dedupe:{wallet}:{run}`.
    - Atomic counters for plays, per‑period plays/unique players, and global players/games with Badger TTLs to period end.
    - Best per wallet and per‑period bests; per‑game leaderboards (global + per‑period top 100).
    - Global points aggregation with daily once‑per‑game bonus, plus global leaderboard (top 100).
    - SSE broadcasts: `game_record`, `leaderboard_update`, `game_stats_update` for live UI updates.
  - SSE hub `backend/internal/api/sse.go`: lightweight fan‑out; proxied in Next via `/events`.
  - Known constraint: aggregation across games uses a hard‑coded list in `handleGetGlobalLeaderboard`/`handleGetGlobalRank`.
- Frontend SDK `555-mono/apps/web/public/games-sdk.js`
  - Single load guard; per‑game adapters for Knighthood, Ninja, Drive, Clawstrike, Flock, Sector‑13.
  - Game Over detection + meta enrichment; cooldown dedupe.
  - Exit beacons (`pagehide`, `visibilitychange`, `beforeunload`) to POST `/game/{id}/record` with last known score/meta; Sector‑13 also fires a direct record beacon on game over.
  - Sector‑13 fallback in parent (`GamePlayer.tsx`) polls nested frames for `G.h === 2` and submits score once.
- Frontend UI
  - Leaderboard dialog `555-mono/apps/web/components/LeaderboardDialog.tsx`:
    - Timeframe selector Day/Week/Month/Year drives: global leaderboard, global rank, period stats, per‑game plays and per‑game leaderboards.
    - Subscribes to `/events`; reacts to `leaderboard_update` and `game_stats_update`; debounced refresh on `game_record`.
    - Not limited to 3 games; shows all configured games (excludes casino category).
  - Game wrapper `555-mono/apps/web/components/GamePlayer.tsx`:
    - Proxies SDK `submitRecord`/`game_over` to backend; plus Sector‑13 polling failsafe; records a `/play` on exit fallback.
  - Wallet handling and alerts `555-mono/apps/web/app/page.tsx`:
    - On disconnect or wallet change: POST `/auth/logout`, clear session, disconnect adapter, prompt reconnect, clear game cache/local/sessionStorage/cookies; site alerts with auto‑hide and close “X”.
  - Sticky dialog headers (via `DialogHeaderComponent position="fixed"`).

## Observed Gaps / Risks

- Sector‑13 raw score occasionally 0 in backend logs despite visible final score in UI.
  - SDK attempts score from `window.state.score`, `__five55_lastScoreValue`, or `G.g.ja()`, but game might render score later than our capture or not expose state reliably in some modes.
  - Dedupe “upgrade” is in place, but verify that subsequent higher score posts arrive reliably and that parent‑poll path always sets a numeric `score`.
- Atomicity fragmentation:
  - Best update, leaderboard write, and global points/leaderboard update happen in multiple transactions. Transient inconsistencies are possible under heavy concurrent writes.
- Hard‑coded game registry for global aggregation (`game.go:782`, `game.go:839`).
- Drive: temporary checkpoint capture via `speak()` wrapper; brittle.
- Clawstrike: canvas text capture is brittle; score extraction depends on rendering order.
- Store/scaling: Badger is an embedded KV; multi‑instance writers require coordination or moving to a networked store (Redis/Postgres). SSE hub is single‑instance.
- CORS/cookies: ensure `AllowedOrigins` and cookie attributes align with deployment domain (Secure/HttpOnly/SameSite), especially for cross‑origin iframe.
- Observability: No percentiles/caps telemetry; limited error metrics; no rate limit/backoff around record floods.

## Recommendations

- Strengthen Sector‑13 capture
  - Keep both paths: SDK beacon + parent poll. Add explicit capture of both `raw_score` and mode (normal/hardcore) and a `score_source` meta field. If possible, read authoritative game state variables (not canvas text).
  - Instrument backend logs to track dedupe upgrades (previous run raw vs new raw) and per‑run arrival order.
- Unify atomicity
  - Group best update, per‑period best, per‑game leaderboard, global points delta, and global leaderboard into a single transactional block per submission (if KV API permits multi‑key in a single txn). Otherwise, reduce window by sequencing in one Update call.
- Replace hard‑coded game list with a registry
  - Read from config or a KV key `games:registry` and fallback to discovery from existing keys.
- Game‑specific adapters
  - Drive: expose `window.__five55_drive` with `{ checkpoints, distance, finished }` and read that directly.
  - Clawstrike: confirm a numeric global or inject a small JS shim into the game to expose final score.
- Period calibration and transparency
  - Collect p95/p99 per game weekly and adjust `normalizeScore` caps; surface via `/config/normalization` and include in UI for transparency.
- Data layer & scale
  - For multi‑instance writes and HA, migrate KV to Redis or Postgres. Keep Badger as local dev.
  - Consider a single‑writer model for now with horizontal read replicas and sticky writes.
- SSE hardening
  - Add heartbeat and resume logic (client auto reconnects already); snapshot fetch on error is implemented.
- Security & rate limiting
  - Add request throttling on `/game/{id}/record` per wallet/IP. Validate `meta` size/shape.
- CORS/Cookies
  - Ensure `AllowedOrigins` covers all frontend hosts; set cookie `Secure`, `HttpOnly`, and `SameSite=Lax/None` per deployment needs.

## Multiplayer Readiness Checklist

- Backend – Core correctness
  - [ ] Single‑txn write path: best, per‑period bests, per‑game leaderboards, global points delta, and global leaderboard write are in one `Update` block per submission (or reduced to minimum txn windows).
  - [ ] Dedupe upgrade path covered with tests: post `score=0` first (beacon), then higher score (parent‑poll); verify upgrade occurs and only last/highest is kept.
  - [ ] Period counters TTLs verified at edges (UTC midnight, ISO week rollover, month end, year end).
  - [ ] Hard‑coded game list replaced with dynamic registry.
  - [ ] Input validation and rate limiting on `/game/{id}/record`.

- Backend – Observability
  - [ ] Log fields for `run_id`, `prev_run_raw`, `new_run_raw`, upgrade/ignore decision.
  - [ ] Metrics: plays/s, unique players, dedupe hits, rejected posts, per‑game latency and error rate.
  - [ ] Weekly p95/p99 raw scores per game exported to adjust normalization caps.

- Backend – Scaling & infra
  - [ ] KV migrated (or single‑writer enforced) for multi‑instance deployments.
  - [ ] SSE hub behind a reverse proxy configured for long‑lived connections; `X-Accel-Buffering: no` (or equivalent) set.
  - [ ] CORS/Cookie config verified for production domains.

- Frontend SDK – Robust capture
  - [ ] Sector‑13: confirm exact authoritative score variable(s) for both modes; prefer direct read over canvas text. Include `mode`, `lives_left`, `max_mult`, `score_source`.
  - [ ] Ninja: always include `win/fail`, `timeSec`, `timeStr`; submit points only on win; exit beacon always sends progress metadata (0 score).
  - [ ] Drive: replace `speak()` wrapper; submit checkpoints/distance/final.
  - [ ] Clawstrike: confirm last score value stability; add backup DOM/canvas watcher if necessary.
  - [ ] Exit beacon fires once; parent‑poll fallback confirmed across browsers (Chrome, Safari, Firefox).

- Frontend UI – Live updates & accuracy
  - [ ] Leaderboard dialog reflects timeframe selector across all sections: global leaderboard, global rank, period stats, per‑game plays, per‑game leaders.
  - [ ] SSE updates incrementally update top players and per‑game leaders without closing the dialog.
  - [ ] “Your latest” per game wired to last `game_record` for the session wallet.
  - [ ] Sticky headers on dialogs and mobile scroll performance verified.

- Auth & session UX
  - [ ] On wallet disconnect or wallet change: logout backend (`/auth/logout`), disconnect wallet adapter, prompt reconnect, clear local cache/cookies.
  - [ ] Site alerts render with close “X” and auto‑hide; no console warnings.

- Testing (recommended scripts)
  - [ ] Concurrency flood test: 100–1000 RPS to `/game/{id}/record` across multiple wallets → leaderboard order stable, plays counters consistent, no partial writes.
  - [ ] Dedupe upgrade test for Sector‑13 and Clawstrike.
  - [ ] Period boundary tests around UTC midnight/week/month transitions.
  - [ ] SSE reconnect/resume tests; offline → resume path fetches fresh snapshot.
  - [ ] Auth failure (401) from record triggers UI alert; does not increment counters.

## File/Endpoint Pointers

- Backend
  - API routes: `backend/internal/api/server.go:80`
  - Record/leaderboard logic: `backend/internal/api/game.go:97`
  - SSE hub: `backend/internal/api/sse.go:12`
- Frontend
  - SDK: `555-mono/apps/web/public/games-sdk.js:1`
  - Game player: `555-mono/apps/web/components/GamePlayer.tsx:1`
  - Leaderboard dialog: `555-mono/apps/web/components/LeaderboardDialog.tsx:63`
  - Home/page with alerts, wallet, sticky headers: `555-mono/apps/web/app/page.tsx:1`

---

Notes:
- Backend is already the source of truth; UI consumes server‑computed period leaderboards/stats and listens to SSE for live updates.
- Sector‑13 reliability hinges on capturing the authoritative score; instrument and, if possible, coordinate a small shim in the game bundle to expose final values.
