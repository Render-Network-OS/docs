#!/usr/bin/env bash
# Build the Alice runtime release artifact consumed by alice_runtime.py.
#
# Produces the encrypted, chunked source tarball that the Modal image build
# pulls from R2, decrypts, and builds. The tarball layout MUST match the
# launcher contract: it extracts to /build/src so that
#   /build/src/555-bot/milaidy        == MILAIDY
#   /build/src/555-bot/milaidy/scripts == SCRIPTS (proven release build scripts)
# and it MUST carry a freshly built apps/app/dist (the SPA the runtime serves
# from packages/agent/src/api/static-file-server.ts; the image never runs the
# Vite build). node_modules is EXCLUDED (the image runs bun install).
#
# Fresh key material is minted every run and written to a gitignored meta file;
# it is NEVER printed. The June key/iv are retired (were exposed 2026-07-20).
#
# Usage:
#   scripts/awsless/modal/build-alice-artifact.sh <hydrated-milaidy-root> <out-dir>
#
# <hydrated-milaidy-root> is a CLEAN 3294f8e11 assembly that has already run
# `node scripts/run-production-build.mjs` (so dist/entry.js AND apps/app/dist
# exist). <out-dir> receives alice.enc.part0..N and alice-artifact-meta.json.
set -euo pipefail

MILAIDY_ROOT="${1:?usage: build-alice-artifact.sh <hydrated-milaidy-root> <out-dir>}"
OUT_DIR="${2:?usage: build-alice-artifact.sh <hydrated-milaidy-root> <out-dir>}"
CHUNKS="${ALICE_ARTIFACT_CHUNKS:-4}"

# Preflight: the two build outputs the runtime depends on must be present.
test -f "$MILAIDY_ROOT/dist/entry.js" || { echo "FATAL: $MILAIDY_ROOT/dist/entry.js missing (run run-production-build.mjs first)"; exit 1; }
test -f "$MILAIDY_ROOT/apps/app/dist/index.html" || { echo "FATAL: $MILAIDY_ROOT/apps/app/dist/index.html missing (SPA not built)"; exit 1; }
test -d "$MILAIDY_ROOT/eliza/packages/vault" || { echo "FATAL: $MILAIDY_ROOT/eliza subtree missing"; exit 1; }
for s in resolve-milaidy-missing-workspaces.mjs pin-alice-release-runtime-deps.mjs build-milaidy-runtime-plugin-workspaces.mjs; do
  test -f "$MILAIDY_ROOT/scripts/$s" || { echo "FATAL: $MILAIDY_ROOT/scripts/$s missing"; exit 1; }
done

mkdir -p "$OUT_DIR"
STAGE="$(mktemp -d /tmp/alice-artifact-stage.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT

echo "[artifact] staging tree under 555-bot/milaidy (excluding node_modules, .git)"
mkdir -p "$STAGE/555-bot/milaidy"
# rsync the milaidy tree, excluding install output and vcs; KEEP dist/ and
# apps/app/dist (the prebuilt backend + SPA) and the eliza source subtree.
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'eliza/**/node_modules' \
  --exclude '.turbo' \
  --exclude '**/.cache' \
  --exclude '**/*.log' \
  "$MILAIDY_ROOT/" "$STAGE/555-bot/milaidy/"

# Optional seed-knowledge.ts: the launcher's `cp {SCRIPTS}/seed-knowledge.ts`
# is `|| true`, but carry it if a sibling 555-bot/scripts copy exists so agent
# knowledge seeding is preserved.
BOT_SEED="$(cd "$MILAIDY_ROOT/.." 2>/dev/null && pwd)/scripts/seed-knowledge.ts"
if [ -f "$BOT_SEED" ] && [ ! -f "$STAGE/555-bot/milaidy/scripts/seed-knowledge.ts" ]; then
  cp "$BOT_SEED" "$STAGE/555-bot/milaidy/scripts/seed-knowledge.ts"
  echo "[artifact] carried seed-knowledge.ts into milaidy/scripts"
fi

echo "[artifact] creating tarball"
tar czf "$STAGE/alice.tar.gz" -C "$STAGE" 555-bot
SHA="$(shasum -a 256 "$STAGE/alice.tar.gz" | cut -d' ' -f1)"
echo "[artifact] tarball sha256=$SHA size=$(du -h "$STAGE/alice.tar.gz" | cut -f1)"

echo "[artifact] minting fresh aes-256-cbc key material"
KEY_HEX="$(openssl rand -hex 32)"
IV_HEX="$(openssl rand -hex 16)"
openssl enc -aes-256-cbc -K "$KEY_HEX" -iv "$IV_HEX" -in "$STAGE/alice.tar.gz" -out "$STAGE/alice.enc"

echo "[artifact] splitting into $CHUNKS chunks"
ENC_SIZE="$(stat -f%z "$STAGE/alice.enc")"
PART_SIZE="$(( (ENC_SIZE + CHUNKS - 1) / CHUNKS ))"
rm -f "$OUT_DIR"/alice.enc.part*
split -b "$PART_SIZE" "$STAGE/alice.enc" "$OUT_DIR/alice.enc.part."
# rename split's alphabetic suffixes (aa,ab,...) to numeric part0..N
i=0
for f in "$OUT_DIR"/alice.enc.part.*; do
  mv "$f" "$OUT_DIR/alice.enc.part$i"
  i=$((i+1))
done
echo "[artifact] wrote $i chunk(s) to $OUT_DIR"

# Meta file holds the SECRET key material — gitignored, never printed.
umask 077
cat > "$OUT_DIR/alice-artifact-meta.json" <<META
{
  "sha256": "$SHA",
  "keyHex": "$KEY_HEX",
  "ivHex": "$IV_HEX",
  "chunks": $i,
  "encBytes": $ENC_SIZE
}
META
echo "[artifact] key material written to $OUT_DIR/alice-artifact-meta.json (gitignored, do not commit)"
echo "[artifact] DONE. Next: rotate the alice-build Modal secret to keyHex/ivHex,"
echo "[artifact] upload alice.enc.part* to R2, set EXPECTED_SHA=$SHA in alice_runtime.py."
