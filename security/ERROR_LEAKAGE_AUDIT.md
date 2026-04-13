# Security Finding: x402 Middleware Leaks err.message to Client

**Severity**: P2
**Status**: Open → **Owned**
**Owner**: @Sw4pIO
**Due Date**: 2026-04-24
**Source**: `audit/SECURITY_AUDIT.md` §5 — Input Validation, `audit/ERROR_HANDLING_AUDIT.md`

---

## Finding

The x402 payment middleware and several other error handlers return raw
`err.message` content to the client in JSON error responses.  This can leak
internal implementation details (stack traces, database error strings, file
paths) to external callers.

### Evidence

From `audit/ERROR_HANDLING_AUDIT.md` and code inspection:
- Error responses include `{ error: err.message }` without sanitization
- Internal error details (DB connection strings, file paths) can surface
- No error classification layer between internal errors and client responses

### Impact

Attackers can use leaked error messages to map internal architecture,
identify database types, discover file paths, and craft targeted attacks.

### Remediation Plan

1. Add an error classification middleware that maps internal errors to safe client messages
2. Return generic error codes (e.g., `PAYMENT_FAILED`) instead of raw messages
3. Log full error details server-side only
4. Audit all `res.status(N).json({ error: ... })` patterns across services

### Review History

| Date | Reviewer | Disposition |
|:-----|:---------|:------------|
| 2026-04-05 | @Sw4pIO | Assigned owner + due date (QA-SYS-03 first review) |
