# Bosch eBike Smart System Stats

A personal dashboard for Bosch Smart System eBike data — activities, odometer history, and bike profiles — pulled from the [Bosch eBike Cloud API (EUDA)](https://www.bosch-ebike.com/en/services/connectivity).

> **⚠️ Vibe-coded project** — This was largely built with AI assistance and may contain rough edges, incomplete error handling, or non-idiomatic patterns. Use at your own risk.

---

## Features

- **OAuth 2.0 / PKCE** authentication via Bosch SingleKey ID
- **Bike profiles** — drive unit, battery, remote control details
- **Activity history** — paginated list with distance, duration, speed, odometer
- **Odometer chart** — per-bike line chart over time
- Server-side Bosch API calls (avoids CORS restrictions)

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

- The app uses `offline_access` scope to persist sessions across browser restarts
- Bike API data is fetched server-side to avoid CORS restrictions from `api.bosch-ebike.com`
- Tokens are stored in `sessionStorage` — cleared on tab close unless `offline_access` refresh token is used

## Framework docs

See [TANSTACK.md](./TANSTACK.md) for TanStack Start / Router / Server Functions reference.
