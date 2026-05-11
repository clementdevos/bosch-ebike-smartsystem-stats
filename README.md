# Bosch eBike Smart System Stats

**Live:** [bosch-smartsystem-ebike-stats.vercel.app](https://bosch-smartsystem-ebike-stats.vercel.app/)

A personal dashboard for Bosch Smart System eBike data — activities, odometer history, and bike profiles — pulled from the [Bosch eBike Cloud API (EUDA)](https://www.bosch-ebike.com/en/services/connectivity).

> **⚠️ AI Trigger warning : ** — This was largely built with AI assistance and may contain rough edges, incomplete error handling, or non-idiomatic patterns. Use at your own risk.

---

## Privacy

**No data leaves your browser.** Auth tokens are stored in `sessionStorage` only and cleared when the tab closes (unless a refresh token is issued via `offline_access`). No analytics, no telemetry, no database. Everything is fetched live from the Bosch eBike Cloud API and rendered locally. The server-side proxy exists solely to avoid CORS restrictions — it does not log or persist anything.

---

## Features

- **OAuth 2.0 / PKCE** authentication via Bosch SingleKey ID
- **Garage** — bike profiles with drive unit, battery, remote control, and head unit details
- **Activity history** — paginated list with distance, elevation, duration, speed, and assist level breakdown; click any row for full detail
- **Odometer chart** — per-bike cumulative distance over time
- **Heatmap** — GPS ride density map from activity traces, with date-range, sample size, and resolution controls
- **Multi-bike** — per-bike filtering across all views
- Server-side Bosch API proxy (avoids CORS, stores nothing)

## Tech stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [TanStack Router](https://tanstack.com/router) — file-based routing
- [Nitro](https://nitro.build) — server runtime
- [Recharts](https://recharts.org) — charting
- [Tailwind CSS v4](https://tailwindcss.com)

## Requirements

- A registered Bosch EUDA client application (obtain a `client_id` from Bosch)
- Node.js 20+

## Setup

```bash
npm install
```

Create `.env.local`:

```env
VITE_BOSCH_CLIENT_ID=your-client-id-here
```

Register `https://localhost:8080/callback` as an allowed redirect URI in your Bosch EUDA client registration.

```bash
npm run dev
```

App runs at `https://localhost:8080` (self-signed cert — accept the browser warning).

## Build

```bash
npm run build
node dist/server/index.mjs
```

## Notes

- Uses `offline_access` scope to persist sessions across browser restarts via refresh token
- Before data appears, enable third-party app access at [flow.bosch-ebike.com/data-act](https://flow.bosch-ebike.com/data-act)
- Heatmap requires activity GPS traces — not all activities include them

## Framework docs

See [TANSTACK.md](./TANSTACK.md) for TanStack Start / Router / Server Functions reference.
