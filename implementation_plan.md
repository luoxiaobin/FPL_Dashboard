# FPL Dashboard MVP Setup

Based on your detailed Product Requirements & Technical Specification, this plan outlines the technical approach to bootstrapping and building the FPL Dashboard. 

## User Review Required

> [!CAUTION]
> As this is a brand new project, we are starting from scratch. Please review the proposed architecture and answer the open questions below before we execute the initial project setup.

## Proposed Changes

We will use Next.js for this project. Next.js aligns perfectly with your requirements for Vercel/Netlify deployment, serverless functions (through Next.js API Routes), and a React-based frontend.

### Infrastructure & Core Setup

- Initialize a Next.js project using the App Router (`npx create-next-app`).
- Set up the foundational project structure for components, lib (utilities/API integrations), and serverless API proxy routes.

### API & Proxy Layer (Next.js Edge/Serverless API Routes)

We will build out the API contract specifications inside Next.js to act as the secure session-based proxy to the strict FPL API:
#### [NEW] `src/app/api/v1/user/summary/route.ts`
#### [NEW] `src/app/api/v1/squad/live/route.ts`
#### [NEW] `src/app/api/v1/leagues/route.ts`
#### [NEW] `src/app/api/v1/squad/optimize/route.ts`

These routes will implement in-memory/Upstash Redis caching as requested to respect the FPL API rate limits.

### Frontend & UI

- Set up a highly responsive, mobile-first aesthetic design.
- We will construct the UI using Vanilla CSS (CSS Modules) to achieve a modern, glassmorphism-inspired, dark-mode heavy interface with micro-animations to satisfy our premium design standards.
- Build the initial skeleton for:
  - **Live Points Dashboard Component**
  - **League Standings Component**
  - **15-Player Squad Pitch View**

## Open Questions

> [!IMPORTANT]
> 1. **Styling Framework**: My default setup will use standard CSS / CSS Modules with custom, rich aesthetic styling to ensure a premium look. However, given Next.js is often paired with TailwindCSS, please let me know if you would specifically prefer to use TailwindCSS. If so, which version?
> 2. **Database Selection**: You mentioned both MongoDB Atlas and Supabase. Supabase (PostgreSQL) maps perfectly to the relational Logical Data Model you described (1:N, M:N relationships). Shall we lock in Supabase for the database layer?
> 3. **Testing Data**: Do you have a dummy/active FPL account (or an `entry_id`) we can use for development, or should we build out the UI with mock JSON data first before live integration?

## Verification Plan

### Automated Tests
- We will use basic unit tests for the complex calculation logic (e.g., Captaincy multiplier logic, automatic substitute visual logic).

### Manual Verification
- Run `npm run dev` to verify the application shell loads successfully.
- Test mobile-responsiveness using browser DevTools.
- Verify proxy API endpoints can securely fetch FPL data without exposing PII.
