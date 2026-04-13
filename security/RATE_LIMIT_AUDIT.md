# Security Finding: Rate Limiting Missing on Auth Endpoints

**Severity**: P2
**Status**: Open → **Owned**
**Owner**: @Sw4pIO
**Due Date**: 2026-04-24
**Source**: `audit/SECURITY_AUDIT.md` §8 — Rate Limiting

---

## Finding

Auth endpoints (`/v1/auth/wallet/challenge`, `/v1/auth/wallet/verify`) rely on
IP-based rate limiting only.  No user-based or endpoint-specific rate limiting
is applied.  Rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)
are not returned to clients.

### Evidence

From `audit/SECURITY_AUDIT.md`:
- IP-based rate limiting implemented in backend and gateway
- No user-based limiting — can be bypassed with multiple IPs
- No rate limit headers returned
- No distributed rate limiting across instances

### Impact

Brute-force attacks against wallet verification can be distributed across IPs.
Without rate limit headers, legitimate clients cannot back off gracefully.

### Remediation Plan

1. Add per-endpoint rate limiting on auth routes (stricter than global)
2. Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
3. Add user/wallet-based rate limiting where identity is known
4. Consider Redis-backed distributed rate limiting for multi-instance deploys

### Review History

| Date | Reviewer | Disposition |
|:-----|:---------|:------------|
| 2026-04-05 | @Sw4pIO | Assigned owner + due date (QA-SYS-03 first review) |
