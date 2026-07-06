# Deployment Guide

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20260706120000_initial_schema.sql` via the SQL Editor
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
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase project settings |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |
| `ALLOWED_EMAILS` | Your login email |
| `TOKEN_ENCRYPTION_KEY` | Run `openssl rand -hex 32` — do not use placeholder |
| `CRON_SECRET` | Run `openssl rand -hex 32` |

Do **not** set `DISABLE_AUTH` on Vercel. After deploy, visit `/api/health` — it should return `"ok": true`.

Generate secrets:
```bash
openssl rand -hex 32  # TOKEN_ENCRYPTION_KEY
openssl rand -hex 32  # CRON_SECRET
openssl rand -hex 32  # HEALTH_SYNC_API_KEY
```

After first login, copy your user UUID from Supabase Auth → Users into `HEALTH_SYNC_USER_ID`.

## 3. Google OAuth

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Sheets API and Google Calendar API
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

Set all environment variables in Vercel project settings. The `vercel.json` cron jobs require a Vercel Pro plan or will run on Hobby with limitations.

Add env var `CRON_SECRET` and Vercel automatically sends it as `Authorization: Bearer` header to cron routes.

**Hobby plan:** cron schedules must run at most once per day (UTC). This repo uses `0 6/7/8 * * *` for Oura, Calendar, and Sheets. For more frequent sync (e.g. every 30 minutes), upgrade to Pro and update `vercel.json`.

## 5. PWA (iPhone)

1. Open the deployed URL in Safari
2. Tap Share → Add to Home Screen
3. App launches fullscreen like a native app

## 6. Apple Health Setup

1. Install [Health Auto Export](https://apps.apple.com/us/app/health-auto-export-json-csv/id1115567069) (Premium)
2. Create REST API automation pointing to `https://your-domain.com/api/health/sync`
3. Set header: `Authorization: Bearer YOUR_HEALTH_SYNC_API_KEY`
4. Schedule 1–2 exports per day

## 7. Oura Setup

1. Create an app at [Oura Cloud → API Applications](https://cloud.ouraring.com/oauth/applications)
2. Add redirect URI: `https://your-domain.com/api/oauth/oura/callback` (local: `http://localhost:3000/api/oauth/oura/callback`)
3. Copy **Client ID** and **Client Secret** to `OURA_CLIENT_ID` and `OURA_CLIENT_SECRET`
4. In the app: Settings → Integrations → **Connect Oura** (OAuth login)

## 8. Verify

- [ ] Password login works
- [ ] Tasks CRUD and scoring
- [ ] Habits toggle with streaks
- [ ] Gym workout logging
- [ ] Oura cron syncs health data
- [ ] Google Sheets finance sync
- [ ] Google Calendar events appear
- [ ] Health Auto Export webhook receives data
