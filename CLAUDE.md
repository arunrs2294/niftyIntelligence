# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (http://localhost:3000)

# Database
npm run db:init      # Create PostgreSQL tables (run once before first use)

# Analysis
npm run analyze      # Manually trigger today's analysis
npm run cron         # Start scheduled runner (8:30 AM IST, Mon–Fri) — run in separate terminal

# Type checking
npx tsc --noEmit
```

## Setup Order

1. Create a local PostgreSQL database named `nifty_intelligence`
2. Fill in `.env.local` with `DATABASE_URL`, `UPSTOX_ANALYTICS_TOKEN`, `ANALYSIS_RUN_SECRET`
3. `npm run db:init` — creates the `daily_analysis` table
4. `npm run dev` — start the app
5. `npm run analyze` — verify a full analysis run works
6. `npm run cron` — start the scheduler (separate terminal)

## Architecture

### Request Flow

```
Browser → /dashboard (Server Component)
            ↓
        dailyAnalysis.model.ts → PostgreSQL

POST /api/analysis/run (protected by ANALYSIS_RUN_SECRET header)
            ↓
        orchestrator.ts
            ↓ fetches data in parallel
        upstox.service.ts  event.service.ts
            ↓ runs engines sequentially
        marketStructure → levels → options → gap → event → candle → bias → scenario
            ↓
        dailyAnalysis.model.ts (upsert by date)
```

### Key Design Rules

- **All engines are pure functions** — `(inputs) => output`. No DB access, no side effects.
- **Orchestrator owns all I/O** — fetches data, calls engines, saves result.
- **Frontend only reads** — dashboard page fetches from DB directly (Server Component), no client-side fetching.
- **Standalone scripts load `.env.local` manually** via `dotenv` — Next.js does not do this automatically for `tsx` scripts.

### Engine Scoring (bias.engine.ts)

Score range ≈ −14 to +14. Mapped to probability (50% ± 40%). Direction: bullish if score ≥ 3, bearish if ≤ −3.

| Signal | Score |
|--------|-------|
| Daily trend bullish/bearish | ±2 |
| Weekly trend bullish/bearish | ±1 |
| Price near support/resistance | ±2 |
| PCR > 1.2 or < 0.8 | ±2 |
| Bullish/bearish candle pattern | ±2 |
| Strong OHLC context | ±1 |
| HIGH/MEDIUM impact event | −2/−1 |

### Upstox API Notes

- Uses the **Analytics Token** — valid for 1 year, no daily reconnection needed.
- Set `UPSTOX_ANALYTICS_TOKEN` in `.env.local`. Generate from: Upstox Developer Apps → your app → Analytics tab.
- NIFTY 50 instrument key: `NSE_INDEX|Nifty 50`
- Candle intervals: `day`, `week`. Endpoint: `/v2/historical-candle/{instrument_key}/{interval}/{to}/{from}`
- Option chain endpoint: `/v2/option/chain?instrument_key=...&expiry_date=YYYY-MM-DD`
- Option chain returns greeks (delta, gamma, theta, vega), IV, prev_oi (for change in OI calculation), and PCR.
- Weekly NIFTY options expire every Thursday — expiry date is auto-computed as nearest upcoming Thursday.
