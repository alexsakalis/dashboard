# Command Center

Personal daily-life dashboard — mobile-first command center for tasks, habits, gym, health, finance, and calendar.

## Quick Start

```bash
cp .env.local.example .env.local
# Fill in Supabase and other credentials

# Run Supabase migrations (SQL Editor or CLI)
# supabase/migrations/*.sql — including gym workout tracker migrations

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Dashboard** — Daily score, tasks, habits, health, gym, finance, calendar cards
- **Tasks** — CRUD with priorities, due dates, recurrence, motivational scoring
- **Habits** — Daily toggles with streaks and score integration
- **Gym** — Full workout tracker: splits (push/pull/legs), set logging, history, templates, progress charts, body weight, PRs
- **Health** — Oura API sync
- **Finance** — Credit card tracker with manual entry
- **Calendar** — Google Calendar events (iCloud via Google sync bridge)

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Vercel deployment with cron jobs

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full setup instructions.
