# Deployment Guide

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run all migrations in `supabase/migrations/` via the SQL Editor (including `20260711120000_integration_engine.sql`)
3. Enable Email auth in Authentication → Providers
4. Copy Project URL, anon key, and service role key to env vars
5. Create your login account: `npm run create-user -- your-password`

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values.

**Vercel (required for production):** In Project → Settings → Environment Variables, set at minimum:

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase project settings (required for Oura token refresh + create-user script) |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth client ID (Settings → Integrations) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client secret |
| `OURA_CLIENT_ID` | Oura Cloud API application client ID |
| `OURA_CLIENT_SECRET` | Oura Cloud API application client secret |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |
| `ALLOWED_EMAILS` | Your login email |
| `TOKEN_ENCRYPTION_KEY` | Run `openssl rand -hex 32` — do not use placeholder |
| `CRON_SECRET` | Run `openssl rand -hex 32` |

Do **not** set `DISABLE_AUTH` on Vercel. After adding env vars, **Redeploy** (env changes require a new deployment). Then visit `/api/health` — it should return `"ok": true` and list `googleOAuth`, `ouraOAuth`, and `supabaseServiceRole` as `true`.

Validate local env: `npm run check-env`

Generate secrets:
```bash
openssl rand -hex 32  # TOKEN_ENCRYPTION_KEY
openssl rand -hex 32  # CRON_SECRET
```

## 3. Google OAuth

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials (Web application)
4. Add redirect URI: `https://your-domain.com/api/oauth/google/callback` (local: `http://localhost:3000/api/oauth/google/callback`)
5. Copy **Client ID** and **Client Secret** to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
6. Publish OAuth consent screen to **Production** (Testing mode tokens expire in 7 days)
7. In the app: Settings → Integrations → **Connect Google**

## 4. Vercel Deploy

```bash
npm i -g vercel
vercel
```

Set all environment variables in Vercel project settings. The unified Integration Engine cron in `vercel.json` requires a Vercel Pro plan or will run on Hobby with limitations.

Add env var `CRON_SECRET` and Vercel automatically sends it as `Authorization: Bearer` header to cron routes.

**Integration Engine cron:** `GET /api/cron/sync` runs daily at 10:00 UTC and syncs all enabled integrations (Oura, Google Calendar, etc.), writes sync logs, and refreshes `dashboard_summary`.

Legacy routes `/api/cron/oura` and `/api/cron/calendar` still work and delegate to the engine.

Manual sync: authenticated `POST /api/sync` (rate limited to once per 60 seconds).

**Hobby plan:** cron schedules must run at most once per day (UTC). This repo uses `0 10 * * *` for the unified sync job.

## 5. PWA (iPhone)

1. Open the deployed URL in **Safari** (Add to Home Screen only works in Safari on iOS)
2. Tap Share → **Add to Home Screen**
3. Confirm the icon and name **Command Center** appear correctly
4. Launch from the home screen — the app opens fullscreen without Safari chrome
5. Verify layout:
   - Header clears the notch / Dynamic Island
   - Bottom nav clears the home indicator
   - Login inputs do not zoom the page on focus
6. Optional (desktop): Chrome DevTools → Application → Manifest — confirm `/manifest.json` and icons load

**Local testing:** `npm run dev` serves the manifest and icons; for a real install test, deploy to HTTPS (Vercel) or use a LAN tunnel.

**Regenerate icons** after editing `public/icons/icon.svg`:

```bash
npm run generate-icons
```

## 6. Oura Setup

1. Create an app at [Oura Cloud → API Applications](https://cloud.ouraring.com/oauth/applications)
2. Add redirect URI: `https://your-domain.com/api/oauth/oura/callback` (local: `http://localhost:3000/api/oauth/oura/callback`)
3. Copy **Client ID** and **Client Secret** to `OURA_CLIENT_ID` and `OURA_CLIENT_SECRET`
4. In the app: Settings → Integrations → **Connect Oura** (OAuth login)

## 7. Verify

- [ ] Password login works
- [ ] Tasks CRUD and scoring
- [ ] Habits toggle with streaks
- [ ] Gym: start workout, log sets, complete session, view history & progress
- [ ] Integration Engine cron syncs all providers (`/api/cron/sync`)
- [ ] Dashboard loads from single `dashboard_summary` query
- [ ] Sync status card shows integration health on homepage
- [ ] Oura cron syncs health data
- [ ] Credit cards can be added on Finance page
- [ ] Google Calendar events appear
