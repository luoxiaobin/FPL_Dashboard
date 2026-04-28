# Static Assets & Next.js Icons

*Community 4 · 8 nodes*

[← Back to index](index.md)

## Nodes

### Public Static Assets Directory
- **Source:** `public/`
- **Type:** directory
- **Connections:** 5
- **Edges:**
  - `references` [EXTRACTED] → **File Document Icon**
  - `references` [EXTRACTED] → **Globe / Internet Icon**
  - `references` [EXTRACTED] → **Next.js Wordmark Logo**
  - `references` [EXTRACTED] → **Vercel Triangle Logo**
  - `references` [EXTRACTED] → **Browser Window Icon**

### File Document Icon
- **Source:** `public/file.svg`
- **Type:** image
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Public Static Assets Directory**
  - `conceptually_related_to` [INFERRED] → **Browser Window Icon**
  - `semantically_similar_to` [AMBIGUOUS] → **Globe / Internet Icon**

### Globe / Internet Icon
- **Source:** `public/globe.svg`
- **Type:** image
- **Connections:** 3
- **Edges:**
  - `semantically_similar_to` [AMBIGUOUS] → **File Document Icon**
  - `references` [EXTRACTED] → **Public Static Assets Directory**
  - `conceptually_related_to` [INFERRED] → **Browser Window Icon**

### Next.js Wordmark Logo
- **Source:** `public/next.svg`
- **Type:** image
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Public Static Assets Directory**
  - `references` [EXTRACTED] → **Next.js Framework**
  - `conceptually_related_to` [INFERRED] → **Vercel Triangle Logo**

### Vercel Triangle Logo
- **Source:** `public/vercel.svg`
- **Type:** image
- **Connections:** 3
- **Edges:**
  - `conceptually_related_to` [INFERRED] → **Next.js Wordmark Logo**
  - `references` [EXTRACTED] → **Public Static Assets Directory**
  - `references` [EXTRACTED] → **Vercel Deployment Platform**

### Browser Window Icon
- **Source:** `public/window.svg`
- **Type:** image
- **Connections:** 3
- **Edges:**
  - `conceptually_related_to` [INFERRED] → **File Document Icon**
  - `conceptually_related_to` [INFERRED] → **Globe / Internet Icon**
  - `references` [EXTRACTED] → **Public Static Assets Directory**

### Next.js Framework
- **Type:** concept
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js Wordmark Logo**
  - `conceptually_related_to` [INFERRED] → **Vercel Deployment Platform**

### Vercel Deployment Platform
- **Type:** concept
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Vercel Triangle Logo**
  - `conceptually_related_to` [INFERRED] → **Next.js Framework**
