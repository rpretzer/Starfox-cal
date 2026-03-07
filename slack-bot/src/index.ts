/**
 * Starfox Calendar Slack Bot
 *
 * Listens for webhook events from Supabase and handles slash commands.
 * Phase 1: Daily digests, conflict alerts, meeting reminders.
 */

import { App, type ExpressReceiver } from '@slack/bolt';
import { getMeetingsForToday, getAllMeetings, detectConflicts } from './meetingStore.js';
import { buildDailyDigestBlocks, buildConflictAlertBlocks, buildReminderBlocks } from './blocks.js';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const DEFAULT_CHANNEL = process.env.SLACK_DEFAULT_CHANNEL ?? '#team-calendar';
const PORT = parseInt(process.env.PORT ?? '3001', 10);

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET) {
  throw new Error('SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variables are required');
}

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

// ---------------------------------------------------------------------------
// Slash commands
// ---------------------------------------------------------------------------

app.command('/starfox', async ({ command, ack, respond }) => {
  await ack();

  const subcommand = command.text.trim().toLowerCase();

  if (subcommand === 'today' || subcommand === '') {
    const meetings = await getMeetingsForToday();
    const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    await respond({
      blocks: buildDailyDigestBlocks(meetings, dateLabel),
      response_type: 'in_channel',
    });
    return;
  }

  if (subcommand === 'conflicts') {
    const meetings = await getAllMeetings();
    const conflicts = detectConflicts(meetings);
    if (conflicts.length === 0) {
      await respond({ text: '✅ No scheduling conflicts found.' });
      return;
    }
    for (const conflict of conflicts) {
      await respond({
        blocks: buildConflictAlertBlocks(conflict, meetings),
        response_type: 'in_channel',
      });
    }
    return;
  }

  await respond({
    text: 'Unknown command. Try `/starfox today` or `/starfox conflicts`.',
  });
});

// ---------------------------------------------------------------------------
// Webhook handler for Supabase Database Webhooks
// ---------------------------------------------------------------------------

const expressReceiver = (app.receiver as ExpressReceiver);
if (expressReceiver.router) {
  expressReceiver.router.post('/webhook/meeting-changed', async (req, res) => {
    try {
      const { type } = req.body as { type?: string };

      if (type === 'INSERT' || type === 'UPDATE') {
        // Detect conflicts after any insert/update
        const meetings = await getAllMeetings();
        const conflicts = detectConflicts(meetings);

        for (const conflict of conflicts) {
          await app.client.chat.postMessage({
            channel: DEFAULT_CHANNEL,
            blocks: buildConflictAlertBlocks(conflict, meetings),
          });
        }
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[webhook] Error:', err);
      res.status(500).json({ error: 'Internal error' });
    }
  });
}

// ---------------------------------------------------------------------------
// Daily digest — triggered externally (cron / Supabase pg_cron)
// ---------------------------------------------------------------------------

async function postDailyDigest(): Promise<void> {
  const meetings = await getMeetingsForToday();
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  await app.client.chat.postMessage({
    channel: DEFAULT_CHANNEL,
    blocks: buildDailyDigestBlocks(meetings, dateLabel),
  });
}

// Expose for external trigger (e.g., HTTP POST /digest)
const receiver = (app.receiver as ExpressReceiver);
if (receiver.router) {
  receiver.router.post('/digest', async (_req, res) => {
    try {
      await postDailyDigest();
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[digest] Error:', err);
      res.status(500).json({ error: 'Internal error' });
    }
  });
}

// ---------------------------------------------------------------------------
// Reminder helper (called by scheduler or webhook)
// ---------------------------------------------------------------------------

export async function sendReminder(meetingId: number, minutesBefore: number, channel: string): Promise<void> {
  const meetings = await getAllMeetings();
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

  await app.client.chat.postMessage({
    channel,
    blocks: buildReminderBlocks(meeting, minutesBefore),
  });
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

(async () => {
  await app.start(PORT);
  console.warn(`[Starfox Slack Bot] Running on port ${PORT}`);
})();
