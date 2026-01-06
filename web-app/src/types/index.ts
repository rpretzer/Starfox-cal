export enum WeekType {
  Both = 'both',
  A = 'a',
  B = 'b',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

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
  seriesId?: string; // Optional: ID to group meetings in a series
  // Share and visibility
  meetingLink?: string; // Zoom/Teams/Meet link
  meetingLinkType?: 'zoom' | 'teams' | 'meet' | 'other';
  publicVisibility?: 'private' | 'busy' | 'titles' | 'full'; // Public visibility setting
  permalink?: string; // Short permalink for sharing
  // Synced meeting fields
  syncSource?: 'google' | 'outlook' | 'apple' | 'ical'; // Source of synced meeting
  externalId?: string; // External calendar event ID
  meetingRoomLink?: string; // Meeting room or video chat link (editable for synced meetings)
  importedAttendees?: string[]; // Attendees imported from external calendar (read-only)
}

export interface MeetingSeries {
  seriesId: string;
  name: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  weekType: WeekType;
  requiresAttendance: string;
  notes: string;
  assignedTo: string;
  meetingIds: number[];
  days: string[]; // All days across all meetings in the series
}

export interface Category {
  id: string;
  name: string;
  colorValue: number; // Hex color as number
}

export type ViewType = 'weekly' | 'conflicts' | 'categories' | 'monthly' | 'teams';
export type WeekTypeFilter = 'A' | 'B';

export interface AppSettings {
  monthlyViewEnabled: boolean;
  timezone?: string; // IANA timezone (e.g., 'America/New_York', 'Europe/London')
  timeFormat: '12h' | '24h'; // 12-hour or 24-hour format
  oauthClientIds?: {
    google?: string;
    microsoft?: string;
    apple?: string;
  };
  defaultPublicVisibility?: 'private' | 'busy' | 'titles' | 'full'; // Default visibility for new meetings
  permalinkBaseUrl?: string; // Base URL for permalinks (e.g., 'https://go.rspmgmt.com')
}

export type CalendarProvider = 'google' | 'outlook' | 'ical' | 'apple';

export interface CalendarSyncConfig {
  provider: CalendarProvider;
  enabled: boolean;
  name: string; // User-friendly name for this sync
  lastSync?: Date | string;
  syncInterval?: number; // Minutes between syncs
  // Provider-specific config
  googleCalendarId?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  outlookCalendarId?: string;
  outlookClientId?: string;
  outlookClientSecret?: string;
  icsUrl?: string; // For iCal/Apple - URL to fetch ICS file
  // OAuth tokens (stored securely)
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date | string;
}

export interface CalendarSyncSettings {
  syncConfigs: CalendarSyncConfig[];
}

