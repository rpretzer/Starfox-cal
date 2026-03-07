# Starfox Calendar Slack Bot — Setup Guide

## Overview

The Slack bot posts daily meeting digests, conflict alerts, and reminders to your Slack workspace.

## Prerequisites

- A Slack workspace where you have admin access
- Supabase project with the Starfox Calendar database
- Node.js ≥ 20

## 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From Scratch**
2. Name: `Starfox Calendar` · Workspace: your team workspace
3. Under **OAuth & Permissions** → **Bot Token Scopes**, add:
   - `chat:write`
   - `channels:read`
   - `commands`
4. Click **Install to Workspace** and copy the **Bot User OAuth Token**
5. Under **Basic Information** → copy the **Signing Secret**
6. Under **Slash Commands** → **Create New Command**:
   - Command: `/starfox`
   - Request URL: `https://<your-bot-url>/slack/events`
   - Short description: `Starfox Calendar commands`
   - Usage hint: `today | conflicts`

## 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_DEFAULT_CHANNEL=#team-calendar

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...    # Service role key (server-side only — keep secret)

PORT=3001
```

## 3. Install Dependencies and Run

```bash
npm install
npm run dev       # Development with hot reload
npm run build     # Production build
npm start         # Production
```

## 4. Configure Supabase Webhook (for conflict alerts)

1. In Supabase → **Database** → **Webhooks** → **Create a new hook**
2. Name: `meeting-changed`
3. Table: `meetings`
4. Events: `INSERT`, `UPDATE`, `DELETE`
5. Webhook URL: `https://<your-bot-url>/webhook/meeting-changed`

## 5. Schedule Daily Digest

Use Supabase `pg_cron` or an external cron service to POST to `/digest` every morning:

```sql
-- Run at 8:30 AM UTC every weekday
SELECT cron.schedule('daily-digest', '30 8 * * 1-5', $$
  SELECT net.http_post(
    url := 'https://<your-bot-url>/digest',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
$$);
```

## 6. Test

```bash
# Trigger digest manually
curl -X POST https://<your-bot-url>/digest

# Use slash command in Slack
/starfox today
/starfox conflicts
```

## Slash Commands Reference

| Command | Description |
|---|---|
| `/starfox today` | Show today's meetings |
| `/starfox conflicts` | Show all scheduling conflicts |
