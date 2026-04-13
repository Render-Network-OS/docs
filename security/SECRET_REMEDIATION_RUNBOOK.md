# Secret Remediation Runbook

**Owner:** @rndrntwrk
**Last updated:** 2026-04-10
**Applies to:** All Render-Network-OS repos (555-bot, stream, docs)

---

## Purpose

Step-by-step procedure for detecting, removing, and recovering from a secret committed to any repository in the organization. This runbook covers both prevention (pre-commit hooks) and response (post-commit remediation).

---

## Part 1: Prevention — Pre-Commit Hook Installation

### 1.1 Install the hook

Copy the secret-detection hook to your repo:

```bash
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
# Secret-detection pre-commit hook
# Scans staged files for common secret patterns

PATTERNS=(
  'AKIA[0-9A-Z]{16}'                    # AWS Access Key
  'ghp_[a-zA-Z0-9]{36}'                 # GitHub PAT
  'sk-[a-zA-Z0-9]{48}'                  # OpenAI API key
  'xox[bps]-[0-9a-zA-Z-]+'             # Slack token
  'AIza[0-9A-Za-z_-]{35}'              # Google API key
  'sk_live_[0-9a-zA-Z]{24,}'           # Stripe live key
  'password\s*=\s*["\x27][^"\x27]{8,}' # Hardcoded passwords
  'secret\s*=\s*["\x27][^"\x27]{8,}'   # Hardcoded secrets
  'PRIVATE.KEY'                          # Private key markers
  '-----BEGIN.*PRIVATE KEY-----'        # PEM private keys
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR)
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(echo "$STAGED_FILES" | xargs grep -lPn "$pattern" 2>/dev/null)
  if [ -n "$MATCHES" ]; then
    echo "❌ SECRET DETECTED by pattern: $pattern"
    echo "$STAGED_FILES" | xargs grep -Pn "$pattern" 2>/dev/null | while read -r match; do
      echo "   $match"
    done
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo ""
  echo "🚫 Commit blocked: secrets detected in staged files."
  echo "   Remove the secrets and try again."
  echo "   If this is a false positive, use: git commit --no-verify"
  exit 1
fi

echo "✅ No secrets detected in staged files."
exit 0
HOOK
chmod +x .git/hooks/pre-commit
```

### 1.2 Verify installation

```bash
# Create a test file with a dummy secret
echo 'TEST_KEY=ghp_ABCDEFghijklmnop1234567890abcdefghij' > /tmp/test-secret.txt
cp /tmp/test-secret.txt .
git add test-secret.txt
git commit -m "test: should be blocked"
# Expected: commit is blocked with "SECRET DETECTED" message
git reset HEAD test-secret.txt
rm test-secret.txt
```

### 1.3 Limitations

- Hooks are local-only — each developer must install them manually
- Hooks can be bypassed with `git commit --no-verify`
- Pattern-based detection has false positives and false negatives
- No server-side enforcement on GitHub Free plan

---

## Part 2: Detection — Scanning Git History

### 2.1 Install truffleHog

```bash
pip install truffleHog --break-system-packages
```

### 2.2 Scan a repository

```bash
# Full scan with regex patterns and entropy detection
trufflehog --regex --entropy=True --json --max_depth 500 /path/to/repo \
  | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        obj = json.loads(line.strip())
        reason = obj.get('reason','')
        path = obj.get('path','')
        commit = obj.get('commitHash','')[:8]
        print(f'{reason:20s} | {path:50s} | {commit}')
    except: pass
"
```

### 2.3 Triage results

| Category | Action |
|----------|--------|
| Known secret patterns (AWS, GitHub, Stripe, etc.) | **Rotate immediately**, then remove from history |
| High entropy in `.env.example` or template files | Likely false positive — verify values are placeholders |
| High entropy in `pnpm-lock.yaml`, `package-lock.json` | False positive — integrity hashes, ignore |
| High entropy in `.svg`, `.json` data files | False positive — encoded data, ignore |
| Password-in-URL in `docker-compose.yml` or example configs | Verify these are placeholder values, not real credentials |

---

## Part 3: Remediation — Removing a Secret from Git History

### 3.1 Immediate response (within 15 minutes)

1. **Rotate the secret immediately.** Do not wait for history cleanup.
   - Revoke the compromised token/key at its provider (GitHub, AWS, Stripe, etc.)
   - Generate a new token/key
   - Update the secret in the deployment environment (K8s secrets, CI variables)
   - Verify the service still works with the new secret

2. **Assess exposure.**
   - Was the repo public when the secret was pushed?
   - How long was the secret in the remote history?
   - Was the branch merged to main?

### 3.2 Remove from git history

**Option A: BFG Repo-Cleaner (recommended for most cases)**

```bash
# Install BFG
# Download from https://rtyley.github.io/bfg-repo-cleaner/

# Create a file listing the secret values to remove
echo "ghp_ACTUAL_TOKEN_VALUE_HERE" > /tmp/secrets-to-remove.txt

# Clone a bare copy
git clone --mirror git@github.com:Render-Network-OS/REPO.git

# Run BFG to replace secrets with ***REMOVED***
java -jar bfg.jar --replace-text /tmp/secrets-to-remove.txt REPO.git

# Clean up and push
cd REPO.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Delete the secrets file
rm /tmp/secrets-to-remove.txt
```

**Option B: git filter-repo (for surgical removal)**

```bash
pip install git-filter-repo

# Remove a specific file from all history
git filter-repo --invert-paths --path .env.github-secrets

# Or replace specific strings
git filter-repo --replace-text <(echo 'ACTUAL_SECRET==>***REMOVED***')
```

### 3.3 Post-cleanup

1. **Force-push the cleaned history** to all remotes
2. **Notify all contributors** to re-clone or `git fetch --all && git reset --hard origin/main`
3. **Verify the secret is gone**: re-run truffleHog scan
4. **Document the incident**: record what happened, when, and what was done in `security/REVIEWS/`

---

## Part 4: Known Findings Requiring Action

### 4.1 555-bot: Twitter OAuth tokens in history

- **File:** `.env.github-secrets`
- **Commits:** `5f2b38c2` through `a1d15c22` (2025-11-20 to 2025-11-26)
- **Finding:** 4 Twitter OAuth token patterns detected by truffleHog
- **Current tree status:** `.env.github-secrets` is not present on current 555-bot `main`; this is a historical-exposure finding, not a live-tree file finding.
- **Action required:**
  1. Verify whether these tokens are still active
  2. If active: rotate tokens at Twitter/X developer portal
  3. Remove `.env.github-secrets` from git history using BFG or git filter-repo
  4. Keep `.env.github-secrets` ignored if the operational file name is still used outside git

### 4.2 stream: Secrets logged to stdout

- **Source:** `docs/STREAM_SECRET_INVENTORY.md` (existing audit)
- **Findings:**
  - HIGH: `media-engine/src/worker.js:226` — RTMP URL with stream keys logged
  - HIGH: `control-plane/scripts/setup-cf-sfu.js:89` — Cloudflare SFU secret logged
  - MEDIUM: `control-plane/src/index.js:3541` — RTMPS URL logged
  - MEDIUM: `control-plane/src/index.js:4769` — RTMPS URL logged
- **Action required:** Redact secrets from log output (tracked in stream security remediation)

---

## Part 5: Recommended Next Steps

| Priority | Action | Owner | Target |
|----------|--------|-------|--------|
| P1 | Verify whether the historical 555-bot Twitter OAuth tokens are still active; rotate them if they are | @rndrntwrk | Immediate |
| P1 | Remove `.env.github-secrets` from 555-bot git history if the historical exposure remains operationally relevant after rotation verification | @rndrntwrk | 2026-04-17 |
| P2 | Install pre-commit hook in all three repos | @rndrntwrk | 2026-04-17 |
| P2 | Add truffleHog scan to stream/docs CI; 555-bot already has `secret-protection` / `pnpm scan:secrets` | @rndrntwrk | 2026-04-24 |
| P3 | Evaluate GitHub Team plan for push protection | @rndrntwrk | 2026-05-01 |
| P3 | Confirm `.env.github-secrets` remains ignored in 555-bot if the file name is still used operationally | @rndrntwrk | 2026-04-17 |
