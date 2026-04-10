# Security Finding: CORS Configuration

**Severity**: P2 (aggregated — source audit rates individual items Medium–Low)
**Status**: Open → **Owned**
**Owner**: @Sw4pIO
**Due Date**: 2026-04-24
**Source**: `audit/SECURITY_AUDIT.md` §6 — CORS Configuration

---

## Finding

CORS is configured with a single allowed origin and appropriate methods
(GET, POST, OPTIONS) on both backend and gateway. There is no critical
vulnerability, but the source audit identifies four unresolved items:

### What is correctly configured

- Single origin restriction enforced on both backend and gateway
- Appropriate methods (GET, POST, OPTIONS)
- Controlled headers (Content-Type, Authorization, X-Gateway-Key)

### What is NOT resolved

From `audit/SECURITY_AUDIT.md` §6, Issues Identified:

| # | Issue | Source Severity | Status |
|---|-------|----------------|--------|
| 1 | Single origin only — hard to support multiple domains | Medium | **Open** |
| 2 | Missing `Access-Control-Allow-Credentials` | Medium | **Open** |
| 3 | Missing `Access-Control-Max-Age` (no preflight caching) | Low | **Open** |
| 4 | No origin validation logic | Low | **Open** |

### Disposition

**Not clean** — the basic CORS policy is correctly restrictive and there is no
security vulnerability, but the source audit lists 4 improvement items (2 Medium,
2 Low) that remain unresolved. These are hardening items, not critical gaps.

### Remediation Plan

1. Support multiple allowed origins via allowlist (Medium)
2. Add credentials support if cookie-based auth is needed (Medium)
3. Add `Access-Control-Max-Age` for preflight caching (Low)
4. Add origin validation logic (Low)

### Review History

| Date | Reviewer | Disposition |
|:-----|:---------|:------------|
| 2026-04-05 | @Sw4pIO | Reopened — source audit §6 has 4 unresolved items (QA-SYS-03 first review) |
