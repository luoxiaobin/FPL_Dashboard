# Next.js 16 Migration & Proxy

*Community 11 · 5 nodes*

[← Back to index](index.md)

## Nodes

### Edge Proxy (proxy.ts) — IP-based rate limiting
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js 16 Breaking Changes (proxy.ts, request.ip removal, bundler module resolution)**
  - `references` [EXTRACTED] → **Rate Limiting (proxy.ts + rateLimit.ts, 30 req/min/IP)**

### Next.js 16 Breaking Changes (proxy.ts, request.ip removal, bundler module resolution)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js 16 Breaking Changes Warning**
  - `references` [EXTRACTED] → **Edge Proxy (proxy.ts) — IP-based rate limiting**

### Rate Limiting (proxy.ts + rateLimit.ts, 30 req/min/IP)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Edge Proxy (proxy.ts) — IP-based rate limiting**
  - `references` [EXTRACTED] → **README Security Architecture (rate limiting + short TTL caching)**

### Next.js 16 Breaking Changes Warning
- **Source:** `AGENTS.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Next.js 16 Breaking Changes (proxy.ts, request.ip removal, bundler module resolution)**

### README Security Architecture (rate limiting + short TTL caching)
- **Source:** `README.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Rate Limiting (proxy.ts + rateLimit.ts, 30 req/min/IP)**
