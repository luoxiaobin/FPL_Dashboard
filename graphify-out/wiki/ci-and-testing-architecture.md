# CI & Testing Architecture

*Community 33 · 2 nodes*

[← Back to index](index.md)

## Nodes

### Testing Strategy (Vitest unit + Playwright E2E + ESLint)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **CI Pipeline (lint + test + build on push/PR)**

### CI Pipeline (lint + test + build on push/PR)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Testing Strategy (Vitest unit + Playwright E2E + ESLint)**
