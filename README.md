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
* **Backend:** Native Next.js Serverless Proxy Routes (`/api/v1/...`)

## 🚀 Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

4. You will be actively redirected to the secure `/login` portal. Enter any valid numeric FPL Team ID (e.g. `123456`) to access the dashboard!

## 🔮 Future Roadmap (Phase 3)

- **Live Rank Projections:** Injecting a third-party LiveFPL API to calculate live intra-gameweek rank movements.
- **Transfers Analyzer:** Analyzing historical point hits and tracking upcoming fixture difficulty.
- **Fixture Ticker:** A visual queue of upcoming opponents mapped directly onto the squad pitch.

*Built for FPL Managers who demand data delivered with aesthetic excellence.*
