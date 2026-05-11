# Bosch eBike Smart System Stats

**Live:** [bosch-smartsystem-ebike-stats.vercel.app](https://bosch-smartsystem-ebike-stats.vercel.app/)

A personal dashboard for Bosch Smart System eBike data — activities, odometer history, and bike profiles — pulled from the [Bosch eBike Cloud API (EUDA)](https://www.bosch-ebike.com/en/services/connectivity).

> **⚠️ AI Trigger warning : ** — This was largely built with AI assistance and may contain rough edges, incomplete error handling, or non-idiomatic patterns. Use at your own risk.

---

## Privacy & security

Authentication uses **OAuth 2.0 + PKCE** via Bosch SingleKey ID — no password is ever handled by this app.

After sign-in, the access and refresh tokens are stored in an **encrypted, HttpOnly server-side cookie**. They are never sent to or readable by the browser or JavaScript. The cookie is encrypted with AES-GCM using the `SESSION_SECRET` env var; intercepting the cookie without the key yields nothing usable.

- **Session duration:** up to 30 days. The access token is automatically refreshed server-side before it expires — no re-login needed until the refresh token itself expires.
- **No database.** No eBike data, tokens, or personal information is persisted anywhere. The server does not log requests.
- **No analytics, no telemetry.** Everything is fetched live from the Bosch eBike Cloud API and rendered client-side.
- The server-side proxy exists solely to hold the session and forward requests to Bosch — it stores nothing beyond the encrypted cookie.

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
SESSION_SECRET=a-random-string-of-at-least-32-characters
```

`SESSION_SECRET` is used to encrypt the server-side session cookie (HttpOnly — tokens never reach the browser). Generate one with `openssl rand -base64 32`.

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
