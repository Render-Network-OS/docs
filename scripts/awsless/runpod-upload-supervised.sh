#!/usr/bin/env bash
# Supervise a chunked tarball upload to a RunPod Alice bootstrap pod until it
# completes, surviving the Mac's flaky ~1.8 Mbps uplink (chunk blips) AND pod
# restarts (revert to stage-1, /workspace wiped).
#
# Loop each round:
#   1. GET /health  -> if stage-1 (installed:false), re-install the full server.
#   2. GET /status  -> if upload "uploaded", done. If partial, resume; else fresh.
#   3. Run upload-chunked (with --resume when partial). The client itself retries
#      each chunk 6x with capped exponential backoff; the supervisor catches what
#      slips through and resumes from the pod's persisted receivedBytes.
#
# Usage:
#   scripts/awsless/runpod-upload-supervised.sh <base-3999-url> <token-file> <tarball>
# Env: RUNPOD_UPLOAD_MAX_ROUNDS (default 40)
set -uo pipefail

BASE="${1:?base 3999 url}"
TOKEN_FILE="${2:?token file}"
TARBALL="${3:?tarball path}"
TOK="$(tr -d '\n' < "$TOKEN_FILE")"
TOTAL="$(stat -f%z "$TARBALL" 2>/dev/null || stat -c%s "$TARBALL")"
MAX_ROUNDS="${RUNPOD_UPLOAD_MAX_ROUNDS:-40}"
FORCE_IPV4="${FORCE_IPV4:-/tmp/force-ipv4.mjs}"

echo "[supervisor] base=$BASE tarball=$TARBALL total=$TOTAL maxRounds=$MAX_ROUNDS"

for round in $(seq 1 "$MAX_ROUNDS"); do
  HEALTH="$(curl -4 -sS -m 20 "$BASE/health" 2>/dev/null || echo '{}')"
  INSTALLED="$(printf '%s' "$HEALTH" | python3 -c "import sys,json
try: print(json.load(sys.stdin).get('installed'))
except Exception: print('err')" 2>/dev/null)"

  if [ "$INSTALLED" = "False" ]; then
    echo "[supervisor round $round] pod at stage-1 -> re-installing full server"
    node --import "$FORCE_IPV4" scripts/awsless/runpod-bootstrap.mjs \
      install-server --base-url "$BASE" --token-file "$TOKEN_FILE" >/dev/null 2>&1
    sleep 5
    continue
  fi
  if [ "$INSTALLED" = "err" ]; then
    echo "[supervisor round $round] /health unreadable; backing off"
    sleep 8
    continue
  fi

  STATUS="$(curl -4 -sS -m 20 "$BASE/status?token=$TOK" 2>/dev/null || echo '{}')"
  read -r USTATUS RECV < <(printf '%s' "$STATUS" | python3 -c "import sys,json
try:
 u=json.load(sys.stdin)['state'].get('upload') or {}
 print(u.get('status'), u.get('receivedBytes',0))
except Exception:
 print('none 0')" 2>/dev/null)
  USTATUS="${USTATUS:-none}"; RECV="${RECV:-0}"

  if [ "$USTATUS" = "uploaded" ]; then
    echo "[supervisor] UPLOAD COMPLETE after $round round(s) ($RECV/$TOTAL bytes)"
    exit 0
  fi

  RESUME=""
  if [ "$USTATUS" = "receiving_chunks" ] && [ "$RECV" -gt 0 ] 2>/dev/null; then
    RESUME="--resume"
  fi
  PCT=0; [ "$TOTAL" -gt 0 ] 2>/dev/null && PCT=$(( RECV * 100 / TOTAL ))
  echo "[supervisor round $round] upload resume='${RESUME:-none}' recv=${RECV}/${TOTAL} (${PCT}%)"

  node --import "$FORCE_IPV4" scripts/awsless/runpod-bootstrap.mjs \
    upload-chunked --base-url "$BASE" --token-file "$TOKEN_FILE" --tarball "$TARBALL" $RESUME || true
  sleep 3
done

echo "[supervisor] exhausted $MAX_ROUNDS rounds without completing"
exit 1
