/**
 * Slack Block Kit message builders.
 */

import type { Meeting, Conflict } from './types.js';

export function buildDailyDigestBlocks(meetings: Meeting[], dateLabel: string): object[] {
  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📅 Meeting Digest — ${dateLabel}`, emoji: true },
    },
  ];

  if (meetings.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '_No meetings scheduled for today._' },
    });
    return blocks;
  }

  for (const meeting of meetings) {
    const joinText = meeting.meetingLink
      ? ` · <${meeting.meetingLink}|Join ${meeting.meetingLinkType ?? 'meeting'}>`
      : '';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${meeting.name}*\n${meeting.startTime} – ${meeting.endTime}${joinText}`,
      },
    });
  }

  blocks.push({ type: 'divider' });
  return blocks;
}

export function buildConflictAlertBlocks(conflict: Conflict, meetings: Meeting[]): object[] {
  const conflictMeetings = meetings.filter(m => conflict.meetings.includes(m.id));
  const names = conflictMeetings.map(m => `*${m.name}*`).join(' and ');

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '⚠️ Meeting Conflict Detected', emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${names} overlap on *${conflict.day}* at ${conflict.time}.`,
      },
    },
  ];
}

export function buildReminderBlocks(meeting: Meeting, minutesBefore: number): object[] {
  const joinButton = meeting.meetingLink
    ? [
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Join Meeting', emoji: true },
              url: meeting.meetingLink,
              action_id: 'join_meeting',
              style: 'primary',
            },
          ],
        },
      ]
    : [];

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `⏰ *${meeting.name}* starts in ${minutesBefore} minutes (${meeting.startTime} – ${meeting.endTime})`,
      },
    },
    ...joinButton,
  ];
}
