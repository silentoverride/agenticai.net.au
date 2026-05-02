---
title: Cloudflare Infrastructure
type: reference
updated: 2026-05-02
sources:
  - "https://developers.cloudflare.com/llms.txt"
  - "https://developers.cloudflare.com/dns/get-started/index.md"
  - "https://developers.cloudflare.com/ssl/get-started/index.md"
  - "https://developers.cloudflare.com/cache/get-started/index.md"
see_also:
  - "./twilio.md"
  - "./stripe.md"
  - "./retell.md"
---

# Cloudflare Infrastructure

Cloudflare provides DNS, CDN, SSL/TLS, and security services for the agenticai.net.au website. This page covers the Cloudflare services relevant to the Agentic AI project.

## DNS

Cloudflare DNS is the authoritative DNS provider for agenticai.net.au.

### Setup

1. **Add domain** to Cloudflare
2. **Import DNS records** — Cloudflare scans and imports existing records
3. **Review DNS records** — verify all required records exist before changing nameservers
4. **Update nameservers** at domain registrar to Cloudflare's nameservers
5. **Activate domain** — Cloudflare begins responding to DNS queries

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Authoritative nameservers** | Cloudflare nameservers that DNS resolvers query for your domain |
| **DNS records** | Control which resources are available on apex domain and subdomains |
| **Proxy status** | Determines whether Cloudflare proxies HTTP/S traffic (orange cloud) or passes through directly (grey cloud) |
| **Anycast IPs** | When proxied, Cloudflare responds with anycast IPs for speed and protection |

### Proxy Status

| Status | Icon | Behaviour |
|--------|------|-----------|
| **Proxied** | 🟠 Orange cloud | Traffic routed through Cloudflare (CDN, DDoS, WAF, caching) |
| **DNS-only** | ⚪ Grey cloud | Traffic goes directly to origin; no Cloudflare optimization |

For the SvelteKit website, the apex domain (`agenticai.net.au`) and `www` should be **proxied** for CDN and security benefits. API endpoints (`/api/*`) may need special cache rules to prevent caching.

## SSL/TLS

Cloudflare handles SSL/TLS encryption between visitors, Cloudflare, and the origin server.

### Edge Certificates

| Certificate Type | Best For |
|-----------------|----------|
| **Universal SSL** | Default; free, auto-renewing certificates for all domains |
| **Advanced certificates** | More customisable than Universal (hostnames, validity period) |
| **Custom certificates** | Business/Enterprise; use your own SSL certificates |
| **Keyless SSL** | Enterprise; custom certificates without exposing private keys |

Agentic AI uses **Universal SSL** (the default free certificate).

### Encryption Modes

Encryption modes control how Cloudflare connects to your origin server:

| Mode | Visitor→Cloudflare | Cloudflare→Origin | Use Case |
|------|-------------------|-------------------|----------|
| **Off** | HTTP | HTTP | Not recommended |
| **Flexible** | HTTPS | HTTP | Origin has no SSL certificate |
| **Full** | HTTPS | HTTPS (any cert) | Origin has self-signed or Cloudflare Origin CA |
| **Full (strict)** | HTTPS | HTTPS (valid cert) | Origin has publicly trusted certificate |

For production, use **Full (strict)** if the origin server has a valid certificate, or **Full** with an Origin CA certificate.

### HTTPS Enforcement

Enable **Always Use HTTPS** to redirect all HTTP requests to HTTPS. This is recommended for all production sites.

### TLS Version

Set **Minimum TLS Version** to 1.2 or higher for modern security. TLS 1.0 and 1.1 are deprecated.

## Cache / CDN

Cloudflare caches static content at data centres globally to improve performance.

### Default Cache Behaviour

Cloudflare automatically caches:
- Static file extensions (CSS, JS, images, fonts, etc.)
- Content based on origin `Cache-Control` headers
- Resources served from proxied DNS records

Cloudflare does **not** cache:
- Off-site or third-party resources (Facebook, etc.)
- Content on DNS-only (grey-clouded) records
- Dynamic HTML by default

### Cache Rules

Use **Cache Rules** to customise caching behaviour:

| Use Case | Rule |
|----------|------|
| Cache static HTML | Bypass dynamic content detection |
| Cache anonymous page views | Exclude authenticated user cookies |
| Exclude API endpoints | Bypass cache for `/api/*` paths |
| Set TTL | Override origin cache-control headers |

For the SvelteKit site:
- Cache static assets (CSS, JS, images) aggressively
- Do **not** cache `/api/*` endpoints (payment webhooks, chat API)
- Consider caching the homepage and marketing pages with short TTL

### Cache Security

| Feature | Purpose |
|---------|---------|
| **Cache Deception Armor** | Prevent web cache deception attacks |
| **CORS headers** | Control cross-origin resource sharing |
| **Query string sort** | Normalise query strings for better cache hit rates |

## Security Features

### DDoS Protection

Cloudflare provides **unmetered DDoS protection** for all plans. Automatically detects and mitigates volumetric and application-layer attacks.

### WAF (Web Application Firewall)

The WAF filters incoming HTTP traffic:
- Managed rulesets for common vulnerabilities (OWASP Top 10)
- Custom rules for blocking specific IPs, countries, or request patterns
- Rate limiting for API endpoints

### Turnstile (CAPTCHA Alternative)

Cloudflare Turnstile is a privacy-preserving CAPTCHA alternative. If the Retell chat widget needs additional bot protection beyond reCAPTCHA, Turnstile can be integrated without visual challenges.

### Bot Management

Detect and manage bot traffic:
- **Definitely automated** — block or challenge
- **Likely automated** — serve challenge
- **Verified bots** — allow (search engines, etc.)

## Cloudflare Pages (Optional)

Cloudflare Pages is a JAMstack platform for static sites. While Agentic AI uses SvelteKit (which requires a server for API endpoints), Pages could be used for:
- Static marketing landing pages
- Documentation sites
- Preview deployments

## Workers (Optional)

Cloudflare Workers are serverless edge functions. Potential use cases:
- Lightweight API endpoints (webhook handlers, redirects)
- Edge-side logic before requests reach the origin
- A/B testing or feature flags

For Agentic AI's current architecture, the SvelteKit server handles API endpoints. Workers are an option for future decoupling.

## DNS Records for Agentic AI

Example DNS configuration:

| Type | Name | Content | Proxy | Purpose |
|------|------|---------|-------|---------|
| A | `@` | origin-server-ip | 🟠 | Apex domain → SvelteKit server |
| A | `www` | origin-server-ip | 🟠 | WWW redirect |
| CNAME | `api` | origin-server-ip | 🟠 | API subdomain (optional) |
| TXT | `@` | `v=spf1 ...` | ⚪ | SPF record for email |
| MX | `@` | mail-provider | ⚪ | Email routing |

## Recommended Settings

| Setting | Value | Reason |
|---------|-------|--------|
| SSL/TLS encryption mode | Full (strict) | End-to-end encryption |
| Always Use HTTPS | On | Force HTTPS |
| Automatic HTTPS Rewrites | On | Fix mixed content |
| Minimum TLS Version | 1.2 | Modern security |
| Security Level | Medium | Balanced protection |
| Browser Integrity Check | On | Block bad browsers |
| Challenge Passage | 30 minutes | Reasonable user tolerance |
| Development Mode | Off (except when debugging) | Bypass cache during dev |

## Troubleshooting

| Problem | Check |
|---------|-------|
| Site not loading | DNS records correct; proxy status orange; origin server running |
| SSL errors | Encryption mode matches origin certificate; certificate valid |
| API webhooks failing | Cache bypass for `/api/*`; firewall not blocking Twilio/Retell IPs |
| Stale content | Purge cache from dashboard; check cache-control headers |
| Mixed content | Automatic HTTPS Rewrites enabled; update hardcoded HTTP URLs |

## Links

- [Cloudflare DNS docs](https://developers.cloudflare.com/dns/)
- [Cloudflare SSL/TLS docs](https://developers.cloudflare.com/ssl/)
- [Cloudflare Cache docs](https://developers.cloudflare.com/cache/)
- [Cloudflare WAF docs](https://developers.cloudflare.com/waf/)
- [Cloudflare Status](https://www.cloudflarestatus.com/)
