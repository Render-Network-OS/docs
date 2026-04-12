# QA-031: Secret Protection Pipeline — Evidence Report

**Ticket:** docs#74
**Status:** TESTED
**Date:** 2026-04-10
**Tested by:** @Sw4pIO

---

## 1. What This Tests

A committed secret is either blocked before push or handled by a documented remediation path.

## 2. Current Protection State

### 2.1 Automated Blocking Layers

| Layer | 555-bot | stream | docs |
|-------|---------|--------|------|
| GitHub push protection | Not available (free plan) | Not available (free plan) | Not available (free plan) |
| Pre-commit hook (secret scan) | Removed (PR #514 added husky, later stripped in `df0869f6`) | None | None |
| CI secret scanning job | Present on `main`: `.github/workflows/ci.yml` runs `scripts/ci/check-secret-exposure.sh`; `package.json` also exposes `pnpm scan:secrets` | None | None |
| Branch protection rules | Not available (free plan) | Not available (free plan) | Not available (free plan) |

**Result:** 555-bot now has a CI detection layer for secret exposure, but no
server-side push protection or mandatory branch rule blocks are available on the
current plan. Stream and docs still have no configured automated blocking or CI
secret-scan layer.

### 2.2 Detection Layers

| Layer | 555-bot | stream | docs |
|-------|---------|--------|------|
| Manual code review | Yes (PR-based) | Yes (PR-based) | Yes (PR-based) |
| Codex / AI review | Sometimes flags secret-adjacent code | No | No |
| Automated scanning (gitleaks/trufflehog) | `pnpm scan:secrets` and CI `secret-protection` job run the repo script; this is not GitHub Advanced Security push protection | None configured | None configured |

### 2.3 Existing Documentation

| Document | Repo | Content |
|----------|------|---------|
| `.github/workflows/ci.yml` | 555-bot | `secret-protection` job runs `scripts/ci/check-secret-exposure.sh` |
| `package.json` | 555-bot | Exposes `pnpm scan:secrets` for the same secret-exposure check |
| `SECURITY.md` | 555-bot | Vulnerability reporting policy; mentions planned automated scanning |
| `docs/guides/secrets-management.md` | 555-bot | Comprehensive env var management guide |
| `docs/STREAM_SECRET_INVENTORY.md` | stream | 37 secrets inventoried; 4 stdout leak findings |
| `docs/SECRET_ROTATION_POLICY.md` | stream | Rotation schedule — all critical secrets marked OVERDUE |
| `docs/DEPLOY_SECRET_INVENTORY.md` | stream | Build-time and runtime secret inventory |
| `security/SECRET_SCAN_RESULTS.md` | docs | Clean working-tree scan (history not scanned) |
| `BRANCH_RULES.md` | 555-bot | Mentions gitleaks as planned pre-commit hook |

## 3. Git History Scan Results

**Tool:** truffleHog v2.2.1 (regex + entropy)
**Scope:** Full git history, all branches, max depth 500

### 3.1 555-bot

| Category | Count | Key Paths |
|----------|-------|-----------|
| Twitter OAuth tokens | 4 | `.env.github-secrets` (commits from 2025-11-20 to 2025-11-26) |
| High entropy strings | 43 | `game_history.json` (13), `.env.example` (6), `.env.github-secrets` (6), `pnpm-lock.yaml` (4) |
| **Total** | **47** | |

**Assessment:** The 4 Twitter OAuth findings in `.env.github-secrets` are the highest-confidence hits. The file was committed to history, but it is a historical-exposure finding: `.env.github-secrets` is not present in the current 555-bot `main` tree. High-entropy hits in `.env.example` and `game_history.json` are likely false positives (example values and game state hashes).

### 3.2 stream

| Category | Count | Key Paths |
|----------|-------|-----------|
| Password in URL | 20+ | `.env.example`, `docker-compose.yml`, `k8s/base/*-secrets.yaml`, `.secrets.template.env`, `.circleci/config.yml` |
| High entropy strings | 27 | `services/control-plane/prisma/schema.prisma` (19), `.env.example` (18), various docs (18 each) |
| **Total** | **47** | |

**Assessment:** "Password in URL" hits are from Redis/Postgres connection strings with placeholder passwords in example/template files (e.g., `redis://:password@localhost:6379`). These are intentional placeholders, not leaked credentials. High-entropy hits in `schema.prisma` are Prisma model hashes, not secrets. The SVG files are base64-encoded image data.

### 3.3 docs

| Category | Count | Key Paths |
|----------|-------|-----------|
| GitHub token patterns | 16 | Various markdown files referencing GitHub API patterns |
| AWS API Key patterns | 4 | Documentation files with example key formats |
| High entropy strings | 441 | Spread across documentation markdown files |
| **Total** | **461** | |

**Assessment:** The docs repo has the highest count because documentation files contain example API keys, code snippets with high-entropy strings, and references to secret patterns in audit reports. All 461 findings are documentation artifacts — no real secrets. The 16 "GitHub" hits are example patterns in security audit docs. The 4 "AWS" hits are example key formats in guides.

### 3.4 Summary Verdict

| Repo | Real secrets in history? | Action needed? |
|------|--------------------------|----------------|
| 555-bot | **YES** — `.env.github-secrets` contains Twitter OAuth tokens committed in Nov 2025 history, not in the current `main` tree | Verify token rotation status; history rewrite if the historical exposure still matters operationally |
| stream | No — all hits are placeholder passwords in example/template files | No action (false positives) |
| docs | No — all hits are documentation examples | No action (false positives) |

## 4. Dummy Secret Blocking Test

**Objective:** Demonstrate that a pre-commit hook can catch and block secrets before they enter git history.

**Hook implementation:** Regex-based pre-commit script scanning staged files against 7 common secret patterns (AWS keys, GitHub PATs, OpenAI keys, Slack tokens, Google API keys, Stripe keys, hardcoded passwords).

### Test Results

| Test | Input | Pattern | Result |
|------|-------|---------|--------|
| 1 — AWS key | `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE` | `AKIA[0-9A-Z]{16}` | **BLOCKED** |
| 2 — GitHub PAT | `GITHUB_TOKEN=ghp_ABCDEFghijklmnop1234567890abcdefghij` | `ghp_[a-zA-Z0-9]{36}` | **BLOCKED** |
| 3 — Clean config | `DATABASE_URL=postgresql://localhost:5432/mydb` | (no match) | **ALLOWED** |

**Test output (Test 1):**
```
❌ SECRET DETECTED by pattern: AKIA[0-9A-Z]{16}
   1:AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

🚫 Commit blocked: secrets detected in staged files.
   Remove the secrets and try again.
```

**Test output (Test 3):**
```
✅ No secrets detected in staged files.
[master 27accfe] test: add clean config
```

## 5. Plan-Gated Gaps

The following protections are **not available on GitHub Free plan** and cannot be implemented without a plan upgrade:

| Feature | Required Plan | Impact |
|---------|---------------|--------|
| GitHub Push Protection (secret scanning) | GitHub Team or Enterprise | Would block pushes containing known secret patterns server-side |
| Branch protection rules | GitHub Team (private repos) | Would enforce PR reviews and status checks before merge to main |
| GitHub Advanced Security | GitHub Enterprise | Would provide code scanning, secret scanning, and dependency review |

**What this means:** Secret protection must be implemented client-side (pre-commit hooks) or in CI (GitHub Actions). 555-bot already has a CI detection path; stream and docs still need one. There is no server-side push-protection safety net on the current plan.

## 6. What Happens Today If Someone Commits a Secret

1. No pre-commit hook blocks it → secret gets committed locally
2. No push protection blocks it → secret can be pushed to remote
3. CI may catch it in 555-bot through the `secret-protection` job; stream and docs currently have no equivalent CI gate
4. PR review may catch it (manual only, no guarantee)
5. If missed, secret sits in git history indefinitely
6. Remediation requires manual `git filter-repo` or BFG + token rotation

**See:** `security/SECRET_REMEDIATION_RUNBOOK.md` for the step-by-step remediation path.
