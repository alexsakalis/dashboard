# Deployment Guide

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20260706120000_initial_schema.sql` via the SQL Editor
3. Enable Email auth (Magic Link) in Authentication → Providers
4. Copy Project URL, anon key, and service role key to env vars

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values.

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
4. Add redirect URI: `https://your-domain.com/api/oauth/google/callback`
5. Publish OAuth consent screen to **Production** (Testing mode tokens expire in 7 days)

## 4. Vercel Deploy

```bash
npm i -g vercel
vercel
```

Set all environment variables in Vercel project settings. The `vercel.json` cron jobs require a Vercel Pro plan or will run on Hobby with limitations.

Add env var `CRON_SECRET` and Vercel automatically sends it as `Authorization: Bearer` header to cron routes.

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

1. Get a Personal Access Token from [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Paste in Settings → Integrations

## 8. Verify

- [ ] Magic link login works
- [ ] Tasks CRUD and scoring
- [ ] Habits toggle with streaks
- [ ] Gym workout logging
- [ ] Oura cron syncs health data
- [ ] Google Sheets finance sync
- [ ] Google Calendar events appear
- [ ] Health Auto Export webhook receives data
