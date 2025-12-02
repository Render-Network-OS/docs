# API Contract Audit Report

## Executive Summary

This document provides a comprehensive audit of API contracts across frontend, backend, and gateway services, focusing on request/response validation, error formats, versioning, and idempotency.

## 1. API Versioning

### Current State
- **Backend**: Uses `/v1/` prefix for all routes (e.g., `/v1/quote`, `/v1/pay/{id}`)
- **Frontend API Routes**: No explicit versioning (e.g., `/api/auth/challenge`)
- **Gateway**: No versioning (e.g., `/session/start`, `/arcade/claim`)

### Issues Identified
1. ❌ **Inconsistent versioning**: Backend uses `/v1/` but frontend proxy routes don't
2. ❌ **No version negotiation**: No `Accept-Version` header or query parameter support
3. ❌ **No deprecation strategy**: No mechanism to deprecate old API versions

### Recommendations
- **HIGH**: Standardize versioning across all services
- **MEDIUM**: Implement version negotiation headers
- **LOW**: Add deprecation warnings for old versions

## 2. Error Response Formats

### Current State

#### Backend Error Format
```go
// Inconsistent error formats:
http.Error(w, "invalid wallet", 400)                    // Plain text
http.Error(w, err.Error(), 500)                        // Error message
json.NewEncoder(w).Encode(map[string]any{               // JSON (inconsistent)
    "success": false,
    "error": err.Error(),
})
```

#### Frontend API Routes Error Format
```typescript
// Inconsistent formats:
res.status(400).json({ error: "message" })              // Some routes
res.status(401).json({ success: false, error: "..." })  // Auth routes
res.status(500).json({ error: err.message })           // Generic errors
```

#### Gateway Error Format
```typescript
// Plain text responses:
res.writeHead(400); res.end('bad input')               // Plain text
res.writeHead(401); res.end('unauthorized')            // Plain text
res.writeHead(429); res.end('rate limit')              // Plain text
```

### Issues Identified
1. ❌ **CRITICAL**: No standardized error format across services
2. ❌ **No error codes**: Errors use plain messages, no error codes
3. ❌ **No error context**: Missing request IDs, timestamps, error details
4. ❌ **Inconsistent HTTP status codes**: Some errors use wrong status codes

### Recommended Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_WALLET",
    "message": "Invalid wallet address format",
    "details": {
      "field": "wallet",
      "value": "invalid-address"
    },
    "requestId": "req-123456",
    "timestamp": "2025-01-17T12:00:00Z"
  }
}
```

## 3. Request/Response Validation

### Current State

#### Backend Validation
- ✅ Basic wallet address validation using `gsol.PublicKeyFromBase58`
- ✅ JSON decoding with error handling
- ❌ No comprehensive input validation library
- ❌ Missing validation for many fields (length, format, required fields)
- ❌ No request size limits enforced consistently

#### Frontend Validation
- ✅ TypeScript types provide compile-time validation
- ❌ No runtime validation before sending requests
- ❌ No request size limits

#### Gateway Validation
- ✅ Basic string validation for required fields
- ✅ Regex validation for some fields (e.g., vault code: `/^[0-9]{3,8}$/`)
- ❌ No comprehensive validation library
- ❌ Inconsistent validation across endpoints

### Issues Identified
1. ❌ **No request size limits**: Gateway has 64KB limit, backend has none
2. ❌ **Missing field validation**: Many optional fields not validated
3. ❌ **No schema validation**: No JSON schema or OpenAPI validation
4. ❌ **Type coercion issues**: String() conversions may hide type errors

### Recommendations
- **HIGH**: Implement request size limits (1MB for JSON, 10MB for uploads)
- **HIGH**: Add comprehensive input validation library
- **MEDIUM**: Implement JSON schema validation
- **LOW**: Add OpenAPI/Swagger documentation

## 4. Idempotency

### Current State

#### Score Submission (Arcade)
- ❌ **No idempotency key**: Score submissions can be duplicated
- ❌ **No duplicate detection**: Multiple submissions with same data accepted
- ⚠️ **Partial protection**: Leaderboard upsert keeps best score, but doesn't prevent duplicate submissions

#### Payment Confirmation
- ❌ **No idempotency**: `ConfirmPayment` can be called multiple times
- ⚠️ **State check**: Checks quote status but doesn't prevent race conditions
- ❌ **No transaction deduplication**: Same signature can be processed multiple times

#### Session Management
- ❌ **No idempotency**: Starting/stopping sessions multiple times creates duplicates
- ⚠️ **Upsert pattern**: Gateway uses upsert but doesn't prevent duplicate events

### Issues Identified
1. ❌ **CRITICAL**: No idempotency keys for critical operations
2. ❌ **Race conditions**: Concurrent requests can cause duplicate processing
3. ❌ **No request deduplication**: Same request can be processed multiple times

### Recommended Idempotency Pattern
```http
POST /v1/api/arcade/runs/{runId}/score
Idempotency-Key: abc-123-def-456
Content-Type: application/json

{
  "wallet": "...",
  "score": 1000,
  ...
}
```

Response for duplicate:
```json
{
  "success": true,
  "idempotent": true,
  "data": { /* original response */ }
}
```

## 5. API Response Formats

### Current State

#### Success Responses
```json
// Inconsistent formats:
{ "quoteId": "...", "priceUsdc": 0, "priceRender": 0 }           // Quote
{ "success": true, "data": { "access_token": "..." } }          // Auth
{ "ok": true }                                                   // Gateway
{ "accepted": true, "jobId": "..." }                            // Confirm
```

### Issues Identified
1. ❌ **No consistent success format**: Some use `success`, some don't
2. ❌ **No response metadata**: Missing timestamps, request IDs
3. ❌ **Inconsistent nesting**: Some wrap in `data`, some don't

### Recommended Standard Success Format
```json
{
  "success": true,
  "data": {
    "quoteId": "...",
    "priceUsdc": 0,
    "priceRender": 0
  },
  "meta": {
    "requestId": "req-123456",
    "timestamp": "2025-01-17T12:00:00Z"
  }
}
```

## 6. Content-Type Handling

### Current State
- ✅ Most endpoints set `Content-Type: application/json`
- ❌ **Missing Content-Type validation**: No enforcement of expected content types
- ❌ **No Accept header handling**: No content negotiation

### Issues Identified
1. ⚠️ **Missing validation**: Should reject requests with wrong Content-Type
2. ⚠️ **No content negotiation**: No support for different response formats

## 7. Rate Limiting Headers

### Current State
- ✅ Rate limiting implemented (IP-based)
- ❌ **No rate limit headers**: Missing `X-RateLimit-*` headers
- ❌ **No retry-after**: Missing `Retry-After` header on 429 responses

### Recommended Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1642424400
Retry-After: 60
```

## 8. CORS Configuration

### Current State
- ✅ CORS middleware in backend
- ✅ CORS headers in gateway
- ⚠️ **Single origin**: Only one allowed origin configured
- ❌ **No preflight caching**: No `Access-Control-Max-Age` header

### Issues Identified
1. ⚠️ **Limited flexibility**: Hard to support multiple frontend domains
2. ⚠️ **No credentials handling**: Missing `Access-Control-Allow-Credentials` configuration

## 9. Request/Response Logging

### Current State
- ✅ Basic logging in gateway (`console.log`)
- ✅ Logging in backend (`log.Printf`)
- ❌ **No structured logging**: Plain text logs, no JSON format
- ❌ **No request IDs**: Cannot trace requests across services
- ❌ **No correlation IDs**: Cannot correlate related requests

### Recommendations
- **HIGH**: Implement structured logging with request IDs
- **MEDIUM**: Add correlation IDs for distributed tracing
- **LOW**: Add request/response logging middleware

## 10. API Documentation

### Current State
- ❌ **No OpenAPI/Swagger**: No API documentation
- ❌ **No API versioning docs**: No documentation of version changes
- ❌ **No error code documentation**: No list of error codes

### Recommendations
- **HIGH**: Generate OpenAPI/Swagger documentation
- **MEDIUM**: Add API versioning documentation
- **LOW**: Create error code reference

## Priority Recommendations

### Critical (P0)
1. **Standardize error response format** across all services
2. **Add idempotency keys** for critical operations (payments, scores)
3. **Implement request size limits** to prevent DoS

### High (P1)
4. **Standardize success response format**
5. **Add comprehensive input validation**
6. **Implement structured logging with request IDs**
7. **Add rate limit headers**

### Medium (P2)
8. **Implement API versioning strategy**
9. **Add OpenAPI documentation**
10. **Add request/response correlation IDs**

### Low (P3)
11. **Add content negotiation**
12. **Improve CORS configuration**
13. **Add deprecation warnings**

## Next Steps

1. Create standardized error response utility
2. Implement idempotency middleware
3. Add request validation library
4. Generate OpenAPI documentation
5. Add structured logging


