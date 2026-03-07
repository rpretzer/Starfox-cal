/**
 * Shared types for the Starfox Calendar Slack bot.
 * These mirror the web app types but are kept local to avoid coupling.
 */

export type WeekType = 'both' | 'a' | 'b' | 'monthly' | 'quarterly';

export interface Meeting {
  id: number;
  name: string;
  categoryId: string;
  days: string[];
  startTime: string;
  endTime: string;
  weekType: WeekType;
  requiresAttendance: string;
  notes: string;
  assignedTo: string;
  meetingLink?: string;
  meetingLinkType?: 'zoom' | 'teams' | 'meet' | 'other';
}

export interface SlackConfig {
  id: string;
  teamId: string;
  defaultChannelId: string;
  channelMappings: Array<{
    categoryId: string;
    channelId: string;
    channelName: string;
  }>;
  notifications: {
    dailyDigest: boolean;
    dailyDigestTime: string;
    conflictAlerts: boolean;
    meetingReminders: boolean;
    reminderMinutesBefore: number;
  };
  installedBy: string;
  installedAt: string;
}

export interface Conflict {
  day: string;
  time: string;
  meetings: number[];
}
