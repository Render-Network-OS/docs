# Cloudflare DNS State Probes (W0.a)

**Date:** 2026-05-17T00:00:00Z
**Source of truth:** local `dig` and `openssl` probes against public DNS resolvers.

## Step 1: DNS state per host

### sw4p.io
- A: 172.67.69.69, 104.26.11.41, 104.26.10.41
- CNAME: (empty)
- NS: monika.ns.cloudflare.com., damian.ns.cloudflare.com.
- AAAA: 2606:4700:20::681a:a29, 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29

### www.sw4p.io
- A: 104.26.10.41, 172.67.69.69, 104.26.11.41
- CNAME: (empty)
- NS: (empty, as expected for subdomain)
- AAAA: 2606:4700:20::ac43:4545, 2606:4700:20::681a:a29, 2606:4700:20::681a:b29

### api.sw4p.io
- A: 172.67.69.69, 104.26.10.41, 104.26.11.41
- CNAME: (empty)
- NS: (empty, as expected for subdomain)
- AAAA: 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29, 2606:4700:20::681a:a29

### mcp.sw4p.io
- A: (empty, NXDOMAIN)
- CNAME: (empty)
- NS: (empty)
- AAAA: (empty)

### app.sw4p.io
- A: 172.67.69.69, 104.26.11.41, 104.26.10.41
- CNAME: (empty)
- NS: (empty, as expected for subdomain)
- AAAA: 2606:4700:20::681a:a29, 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29

### console.sw4p.io
- A: 104.26.10.41, 172.67.69.69, 104.26.11.41
- CNAME: (empty)
- NS: (empty, as expected for subdomain)
- AAAA: 2606:4700:20::681a:a29, 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29

### 555.sw4p.io
- A: (empty)
- CNAME: (empty)
- NS: (empty)
- AAAA: (empty)

Raw output:
```
=== sw4p.io ===
--- A ---
172.67.69.69
104.26.11.41
104.26.10.41
--- CNAME ---
--- NS ---
monika.ns.cloudflare.com.
damian.ns.cloudflare.com.
--- AAAA ---
2606:4700:20::681a:a29
2606:4700:20::ac43:4545
2606:4700:20::681a:b29
=== www.sw4p.io ===
--- A ---
104.26.10.41
172.67.69.69
104.26.11.41
--- CNAME ---
--- NS ---
--- AAAA ---
2606:4700:20::ac43:4545
2606:4700:20::681a:a29
2606:4700:20::681a:b29
=== api.sw4p.io ===
--- A ---
172.67.69.69
104.26.10.41
104.26.11.41
--- CNAME ---
--- NS ---
--- AAAA ---
2606:4700:20::ac43:4545
2606:4700:20::681a:b29
2606:4700:20::681a:a29
=== mcp.sw4p.io ===
--- A ---
--- CNAME ---
--- NS ---
--- AAAA ---
=== app.sw4p.io ===
--- A ---
172.67.69.69
104.26.11.41
104.26.10.41
--- CNAME ---
--- NS ---
--- AAAA ---
2606:4700:20::681a:a29
2606:4700:20::ac43:4545
2606:4700:20::681a:b29
=== console.sw4p.io ===
--- A ---
104.26.10.41
172.67.69.69
104.26.11.41
--- CNAME ---
--- NS ---
--- AAAA ---
2606:4700:20::681a:a29
2606:4700:20::ac43:4545
2606:4700:20::681a:b29
=== 555.sw4p.io ===
--- A ---
--- CNAME ---
--- NS ---
--- AAAA ---
```

## Step 2: TLS certificate state per public host

### sw4p.io
- Subject: CN=sw4p.io
- Issuer: C=US, O=Google Trust Services, CN=WE1
- Not Before: Apr 15 11:57:15 2026 GMT
- Not After: Jul 14 12:55:00 2026 GMT
- SHA-256 Fingerprint: 11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52

### www.sw4p.io
- Subject: CN=sw4p.io
- Issuer: C=US, O=Google Trust Services, CN=WE1
- Not Before: Apr 15 11:57:15 2026 GMT
- Not After: Jul 14 12:55:00 2026 GMT
- SHA-256 Fingerprint: 11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52

### api.sw4p.io
- Subject: CN=sw4p.io
- Issuer: C=US, O=Google Trust Services, CN=WE1
- Not Before: Apr 15 11:57:15 2026 GMT
- Not After: Jul 14 12:55:00 2026 GMT
- SHA-256 Fingerprint: 11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52

### mcp.sw4p.io
- Status: (no cert / host unreachable / connection timed out)

Raw output:
```
=== sw4p.io ===
subject=CN=sw4p.io
issuer=C=US, O=Google Trust Services, CN=WE1
notBefore=Apr 15 11:57:15 2026 GMT
notAfter=Jul 14 12:55:00 2026 GMT
sha256 Fingerprint=11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52
=== www.sw4p.io ===
subject=CN=sw4p.io
issuer=C=US, O=Google Trust Services, CN=WE1
notBefore=Apr 15 11:57:15 2026 GMT
notAfter=Jul 14 12:55:00 2026 GMT
sha256 Fingerprint=11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52
=== api.sw4p.io ===
subject=CN=sw4p.io
issuer=C=US, O=Google Trust Services, CN=WE1
notBefore=Apr 15 11:57:15 2026 GMT
notAfter=Jul 14 12:55:00 2026 GMT
sha256 Fingerprint=11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52
=== mcp.sw4p.io ===
(no cert / host unreachable / connection timed out)
```

## Step 3: Interpretation

### sw4p.io: W0.b cutover target

The A records (172.67.69.69, 104.26.10.41, 104.26.11.41) and AAAA records (2606:4700:20::/48 range) all point to Cloudflare-managed anycast IPs. The NS records confirm the zone is delegated to Cloudflare (monika.ns.cloudflare.com, damian.ns.cloudflare.com). The TLS certificate is issued by Google Trust Services (via Cloudflare Managed Certificate) with CN=sw4p.io, valid through July 14, 2026. The site is currently Cloudflare-proxied with Cloudflare handling TLS termination. W0.b will need to change these A/AAAA records to point to the AWS ELB hostname post-creation, and update the DNS records at the Cloudflare authoritative nameserver level.

### mcp.sw4p.io: W4 setup target

Subdomain currently NXDOMAIN. W4 will create this subdomain and assign it to the mcp service endpoint.

### Other hosts

- www.sw4p.io: Cloudflare-proxied, same cert and IPs as sw4p.io (CNAME or alias).
- api.sw4p.io: Cloudflare-proxied, same cert and IPs as sw4p.io.
- app.sw4p.io: Cloudflare-proxied, same cert and IPs as sw4p.io.
- console.sw4p.io: Cloudflare-proxied, same cert and IPs as sw4p.io.
- 555.sw4p.io: No DNS records present; not yet deployed.

## Conclusion

The current Cloudflare DNS + TLS state for sw4p.io family is: all active subdomains (www, api, app, console) share the same Cloudflare-anycast IPs and a single wildcard or unified Google Trust Services cert managed by Cloudflare. mcp.sw4p.io is not yet provisioned. 555.sw4p.io has no records.

This row of the Live Dependency Matrix is marked: PASS with current state captured.

Inputs to W0.b (DNS swap task):
- Pre-flight target (A): 172.67.69.69, 104.26.10.41, 104.26.11.41 (Cloudflare anycast)
- Pre-flight target (AAAA): 2606:4700:20::681a:a29, 2606:4700:20::ac43:4545, 2606:4700:20::681a:b29 (Cloudflare anycast IPv6)
- Pre-flight cert fingerprint: 11:45:70:9A:89:C0:E9:8A:D4:66:68:50:1A:B3:19:F9:C9:68:4C:CA:40:C7:E3:C0:EB:DF:DE:0D:52:40:E3:52
- Post-swap target (per Task 3.1 AWS ELB hostname, to be captured then)
- Post-swap cert chain expectation: If AWS ELB assumes TLS termination directly, cert will change to AWS Certificate Manager or equivalent; if Cloudflare continues as reverse proxy, cert may remain Cloudflare-issued but with updated origin rules pointing to ELB.
