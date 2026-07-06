# Command Center

Personal daily-life dashboard — mobile-first command center for tasks, habits, gym, health, finance, and calendar.

## Quick Start

```bash
cp .env.local.example .env.local
# Fill in Supabase and other credentials

# Run Supabase migration (SQL Editor or CLI)
# supabase/migrations/20260706120000_initial_schema.sql

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Dashboard** — Daily score, tasks, habits, health, gym, finance, calendar cards
- **Tasks** — CRUD with priorities, due dates, recurrence, motivational scoring
- **Habits** — Daily toggles with streaks and score integration
- **Gym** — Workout logging with sets/reps/weight, history, templates
- **Health** — Oura API sync + Apple Health webhook (Health Auto Export)
- **Finance** — Google Sheets bidirectional sync
- **Calendar** — Google Calendar events (iCloud via Google sync bridge)

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Vercel deployment with cron jobs

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full setup instructions.
