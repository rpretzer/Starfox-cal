/**
 * Microsoft Graph API — calendar and Teams meeting integration.
 *
 * Uses delta queries for efficient incremental sync.
 * Teams meetings are detected from the onlineMeeting property on Graph events.
 */

import { msGetToken } from './msalService';
import type { Meeting } from '../types';
import { WeekType } from '../types';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

interface GraphCalendar {
  id: string;
  name: string;
  isDefaultCalendar: boolean;
  canEdit: boolean;
}

interface GraphEventTime {
  dateTime: string;
  timeZone: string;
}

interface GraphOnlineMeeting {
  joinUrl: string;
  conferenceId?: string;
  tollNumber?: string;
}

interface GraphEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  start: GraphEventTime;
  end: GraphEventTime;
  recurrence?: unknown;
  organizer?: { emailAddress?: { name?: string; address?: string } };
  attendees?: Array<{ emailAddress?: { address?: string; name?: string }; status?: { response?: string } }>;
  onlineMeeting?: GraphOnlineMeeting;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  seriesMasterId?: string;
}

interface GraphEventPage {
  value: GraphEvent[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

interface GraphCalendarListPage {
  value: GraphCalendar[];
  '@odata.nextLink'?: string;
}

async function graphFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await msGetToken();
  // Graph returns absolute URLs in @odata.nextLink / @odata.deltaLink, so only
  // prepend the base URL when the path is relative (doesn't start with http).
  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

/**
 * List all calendars visible to the signed-in user.
 */
export async function listCalendars(): Promise<GraphCalendar[]> {
  const page = await graphFetch<GraphCalendarListPage>('/me/calendars?$select=id,name,isDefaultCalendar,canEdit');
  return page.value;
}

const WEEKDAY_MAP: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function graphEventToMeeting(event: GraphEvent, nextId: number): Meeting {
  const startDate = new Date(event.start.dateTime);
  const endDate = new Date(event.end.dateTime);

  const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: event.start.timeZone });
  const mappedDay = WEEKDAY_MAP[dayName.toLowerCase()] ?? dayName;

  const startHour = startDate.getHours();
  const startMin = startDate.getMinutes().toString().padStart(2, '0');
  const endHour = endDate.getHours();
  const endMin = endDate.getMinutes().toString().padStart(2, '0');

  const to12h = (h: number, m: string) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m} ${period}`;
  };

  const isTeams = event.isOnlineMeeting === true && event.onlineMeetingProvider === 'teamsForBusiness';

  const attendees = (event.attendees ?? [])
    .map(a => a.emailAddress?.address)
    .filter((a): a is string => Boolean(a));

  return {
    id: nextId,
    name: event.subject,
    categoryId: '', // User assigns categories after import
    days: [mappedDay],
    startTime: to12h(startHour, startMin),
    endTime: to12h(endHour, endMin),
    weekType: WeekType.Both,
    requiresAttendance: '',
    notes: event.bodyPreview ?? '',
    assignedTo: event.organizer?.emailAddress?.address ?? '',
    importedAttendees: attendees.length > 0 ? attendees : undefined,
    syncSource: 'outlook',
    externalId: event.id,
    meetingLink: event.onlineMeeting?.joinUrl,
    meetingLinkType: isTeams ? 'teams' : event.onlineMeeting ? 'other' : undefined,
    publicVisibility: event.sensitivity === 'private' ? 'private' : 'busy',
    seriesId: event.seriesMasterId,
  };
}

/**
 * Fetch calendar events in a date range and convert to Meeting objects.
 * Uses calendarView to handle recurring event expansion.
 */
export async function fetchCalendarEvents(
  calendarId: string,
  startDateTime: Date,
  endDateTime: Date,
  startId: number
): Promise<{ meetings: Meeting[]; deltaLink: string | null }> {
  const start = startDateTime.toISOString();
  const end = endDateTime.toISOString();

  const path = `/me/calendars/${encodeURIComponent(calendarId)}/calendarView` +
    `?startDateTime=${start}&endDateTime=${end}` +
    `&$select=id,subject,bodyPreview,start,end,organizer,attendees,onlineMeeting,isOnlineMeeting,onlineMeetingProvider,sensitivity,seriesMasterId` +
    `&$top=100` +
    `&$deltaToken`;

  const meetings: Meeting[] = [];
  let idCounter = startId;
  let nextLink: string | undefined = path;
  let deltaLink: string | null = null;

  while (nextLink) {
    const currentLink = nextLink;
    const page: GraphEventPage = await graphFetch<GraphEventPage>(currentLink);
    for (const event of page.value) {
      meetings.push(graphEventToMeeting(event, idCounter++));
    }
    nextLink = page['@odata.nextLink'];
    deltaLink = page['@odata.deltaLink'] ?? deltaLink;
  }

  return { meetings, deltaLink };
}

/**
 * Perform a delta (incremental) sync using a previously stored delta link.
 * Returns only changed/deleted meetings and an updated delta link.
 */
export async function deltaSync(deltaLink: string, startId: number): Promise<{
  added: Meeting[];
  removedExternalIds: string[];
  newDeltaLink: string | null;
}> {
  const added: Meeting[] = [];
  const removedExternalIds: string[] = [];
  let idCounter = startId;
  let nextLink: string | undefined = deltaLink;
  let newDeltaLink: string | null = null;

  type DeltaPage = GraphEventPage & { value: (GraphEvent & { '@removed'?: unknown })[] };
  while (nextLink) {
    const currentLink = nextLink;
    const page: DeltaPage = await graphFetch<DeltaPage>(currentLink);
    for (const event of page.value) {
      if ('@removed' in event) {
        removedExternalIds.push(event.id);
      } else {
        added.push(graphEventToMeeting(event, idCounter++));
      }
    }
    nextLink = page['@odata.nextLink'];
    newDeltaLink = page['@odata.deltaLink'] ?? newDeltaLink;
  }

  return { added, removedExternalIds, newDeltaLink };
}
