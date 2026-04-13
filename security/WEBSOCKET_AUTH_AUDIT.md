# Security Finding: WebSocket Connection Rate Limiting Missing

**Severity**: P2
**Status**: Open → **Owned**
**Owner**: @Sw4pIO
**Due Date**: 2026-04-24
**Source**: `audit/SECURITY_AUDIT.md` §8, stream service analysis

---

## Finding

WebSocket connections (SFU, chat, show control) have HMAC signature
verification but no connection rate limiting.  An attacker can open many
simultaneous WebSocket connections, exhausting server resources (file
descriptors, memory, mediasoup workers).

### Evidence

From `audit/SECURITY_AUDIT.md` and stream service code:
- WebSocket auth uses HMAC signature verification (secure)
- No per-IP or per-user connection rate limiting on upgrade
- No maximum concurrent connections per user/IP
- SFU service tracks `sfu_peers_total` but doesn't enforce limits

### Impact

WebSocket flood can exhaust server resources, causing denial of service
for legitimate users.  Each WebSocket connection consumes a file descriptor
and memory for the connection state.

### Remediation Plan

1. Add per-IP connection rate limiting on WebSocket upgrade
2. Set maximum concurrent connections per user/wallet
3. Add connection timeout for idle WebSocket connections
4. Monitor `sfu_peers_total` and `websocket_connections` with alerts

### Review History

| Date | Reviewer | Disposition |
|:-----|:---------|:------------|
| 2026-04-05 | @Sw4pIO | Assigned owner + due date (QA-SYS-03 first review) |
