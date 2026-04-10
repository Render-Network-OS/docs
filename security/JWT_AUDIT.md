# Security Finding: JWT Token Revocation Not Implemented

**Severity**: P2
**Status**: Open → **Owned**
**Owner**: @Sw4pIO
**Due Date**: 2026-04-24
**Source**: `audit/SECURITY_AUDIT.md` §7 — Authentication & Authorization

---

## Finding

JWT tokens have no revocation mechanism.  Once issued, a token remains valid
until expiry.  There is no blacklist, no token version tracking, and no way
to invalidate a compromised token before its natural expiration.

### Evidence

From `audit/SECURITY_AUDIT.md`:
- JWT tokens used for authentication with expiration
- No token blacklist exists
- No mechanism to revoke tokens
- Tokens stored in cookies without SameSite attribute

### Impact

If a token is compromised (e.g., XSS exfiltration, session hijacking), there
is no way to revoke it.  The attacker retains access until the token expires.

### Remediation Plan

1. Implement a Redis-backed token blacklist (check on every authenticated request)
2. Add a token version field to user records — increment on password change / revoke
3. Add SameSite=Strict to auth cookies
4. Consider short-lived access tokens + refresh token pattern

### Review History

| Date | Reviewer | Disposition |
|:-----|:---------|:------------|
| 2026-04-05 | @Sw4pIO | Assigned owner + due date (QA-SYS-03 first review) |
