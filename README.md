# FPL Dashboard MVP 🚀

A sleek, responsive, and blazing-fast Fantasy Premier League Dashboard built with **Next.js 15**, **React**, and **TypeScript**. 
Engineered with a stunning dark-mode Glassmorphism UI, this application seamlessly integrates with the official public FPL API endpoints to deliver real-time football analytics without requiring any sensitive passwords.

## 🌟 Key Features

**🟢 Live Production URL:** [https://fpl-dashboard-seven-pi.vercel.app](https://fpl-dashboard-seven-pi.vercel.app)
*(Note: Vercel provides this permanent, clean URL for free to keep running costs at $0.00. Every individual code push will also silently generate a temporary "Preview" URL with random hash characters that can be safely ignored.)*

* **Public Team ID Authentication:** Securely built on top of the Public FPL Protocol. Simply enter your official numeric FPL Team ID to immediately load your entire dashboard—no email, passwords, or cookies required.
* **Dynamic Season Trajectory (Recharts):** A fully interactive dual-axis line chart tracking your volatile Gameweek Points perfectly synchronized against your Overall Rank trajectory.
* **Live Squad Pitch:** A visual 15-man roster pitch that maps out your active starting XI alongside their live match minutes, BPS, and points.
* **Bonus Point System (BPS) Radar:** Our intelligent API parser flags high-performing players with golden `[X bps]` indicators or confirmed `[+X B]` markers dynamically across your pitch array during live matches.
* **Mini-League Standings:** Instantly pulls down your active Classic Leagues and flags your up/down movement patterns against your friends.

## 🛠 Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **Styling:** Vanilla CSS Modules (Glassmorphism design language)
* **Data Visualization:** Recharts
* **Database:** Supabase (PostgreSQL) — persists user profiles, full player list, gameweek data, and squad history
* **Backend:** Native Next.js Serverless Proxy Routes (`/api/v1/...`)
* **CI/CD:** GitHub Actions + Vercel (auto-deploy on every push to `master`)

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/luoxiaobin/FPL_Dashboard.git
cd FPL_Dashboard
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Supabase — get these from supabase.com → Project Settings → API Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # "Publishable key" tab
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...             # "Secret keys" tab — NEVER expose to browser
```

> ⚠️ **Security note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Supabase Row Level Security and is used exclusively in server-side API routes. It must **never** be prefixed with `NEXT_PUBLIC_`.

### 3. Set Up Supabase Database
1. Go to your Supabase project → **SQL Editor**
2. Paste the full contents of `supabase/schema.sql` and click **Run**
3. This creates all 5 tables: `users`, `players`, `gameweeks`, `squads`, `squad_players`

### 4. Configure Vercel (Production)
In Vercel → **Settings → Environment Variables**, add all three variables:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API Keys page |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Secret key |

### 5. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and log in with your FPL Team ID.

## 🔮 Future Roadmap (Phase 3)

- **Live Rank Projections:** Injecting a third-party LiveFPL API to calculate live intra-gameweek rank movements.
- **Transfers Analyzer:** Analyzing historical point hits and tracking upcoming fixture difficulty.
- **Fixture Ticker:** A visual queue of upcoming opponents mapped directly onto the squad pitch.

## 🧪 Running Tests
```bash
npm run test      # Vitest unit tests
npm run lint      # ESLint
npm run build     # Production build check
```

*Built for FPL Managers who demand data delivered with aesthetic excellence.*
