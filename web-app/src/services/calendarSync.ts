import { Meeting, CalendarSyncConfig, WeekType } from '../types';
import { storageService } from './storage';


// Convert Date to day name
function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Format time as "10:00 AM"
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Convert external calendar event to Meeting
function convertEventToMeeting(event: any, defaultCategoryId: string): Meeting | null {
  try {
    const startDate = new Date(event.start.dateTime || event.start.date);
    const endDate = new Date(event.end.dateTime || event.end.date);
    
    // Get day name
    const dayName = getDayName(startDate);
    
    // Check if it's a weekday (Monday-Friday)
    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(dayName)) {
      return null; // Skip weekends
    }

    // Determine week type (simplified - could be enhanced)
    const weekType = WeekType.Both; // Default to both weeks

    return {
      id: Date.now() + Math.random(), // Temporary ID, will be replaced
      name: event.summary || event.title || 'Untitled Event',
      categoryId: defaultCategoryId,
      days: [dayName],
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
      weekType,
      requiresAttendance: event.attendees?.map((a: any) => a.email).join(', ') || '',
      notes: event.description || event.notes || '',
      assignedTo: event.organizer?.email || '',
    };
  } catch (error) {
    console.error('Error converting event to meeting:', error);
    return null;
  }
}

// Google Calendar Sync
export async function syncGoogleCalendar(config: CalendarSyncConfig): Promise<Meeting[]> {
  if (!config.accessToken || !config.googleCalendarId) {
    throw new Error('Google Calendar not properly configured');
  }

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.googleCalendarId)}/events?` +
    `timeMin=${now.toISOString()}&timeMax=${thirtyDaysLater.toISOString()}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication expired. Please reconnect.');
    }
    throw new Error(`Google Calendar API error: ${response.statusText}`);
  }

  const data = await response.json();
  const defaultCategoryId = 'synced'; // Default category for synced events
  
  const meetings: Meeting[] = [];
  for (const event of data.items || []) {
    const meeting = convertEventToMeeting(event, defaultCategoryId);
    if (meeting) {
      meetings.push(meeting);
    }
  }

  return meetings;
}

// Outlook/Microsoft Calendar Sync
export async function syncOutlookCalendar(config: CalendarSyncConfig): Promise<Meeting[]> {
  if (!config.accessToken || !config.outlookCalendarId) {
    throw new Error('Outlook Calendar not properly configured');
  }

  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const url = `https://graph.microsoft.com/v1.0/me/calendars/${config.outlookCalendarId}/calendarView?` +
    `startDateTime=${now.toISOString()}&endDateTime=${thirtyDaysLater.toISOString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication expired. Please reconnect.');
    }
    throw new Error(`Microsoft Graph API error: ${response.statusText}`);
  }

  const data = await response.json();
  const defaultCategoryId = 'synced';
  
  const meetings: Meeting[] = [];
  for (const event of data.value || []) {
    const meeting = convertEventToMeeting(event, defaultCategoryId);
    if (meeting) {
      meetings.push(meeting);
    }
  }

  return meetings;
}

// iCal/ICS File Sync
export async function syncICSFile(_config: CalendarSyncConfig, icsContent: string): Promise<Meeting[]> {
  // Simple ICS parser (for production, consider using a library like ical.js)
  const lines = icsContent.split('\n');
  const events: any[] = [];
  let currentEvent: any = null;
  let inEvent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
    } else if (trimmed.startsWith('END:VEVENT')) {
      if (currentEvent) {
        events.push(currentEvent);
      }
      inEvent = false;
      currentEvent = null;
    } else if (inEvent && currentEvent) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':');
      const cleanKey = key.split(';')[0]; // Remove parameters
      
      if (cleanKey === 'SUMMARY') {
        currentEvent.summary = value;
      } else if (cleanKey === 'DTSTART') {
        currentEvent.start = { dateTime: parseICSDate(value) };
      } else if (cleanKey === 'DTEND') {
        currentEvent.end = { dateTime: parseICSDate(value) };
      } else if (cleanKey === 'DESCRIPTION') {
        currentEvent.description = value;
      }
    }
  }

  const defaultCategoryId = 'synced';
  const meetings: Meeting[] = [];
  for (const event of events) {
    const meeting = convertEventToMeeting(event, defaultCategoryId);
    if (meeting) {
      meetings.push(meeting);
    }
  }

  return meetings;
}

// Fetch ICS from URL
export async function syncICSFromURL(config: CalendarSyncConfig): Promise<Meeting[]> {
  if (!config.icsUrl) {
    throw new Error('ICS URL not configured');
  }

  const response = await fetch(config.icsUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ICS file: ${response.statusText}`);
  }

  const icsContent = await response.text();
  return syncICSFile(config, icsContent);
}

// Parse ICS date format (YYYYMMDDTHHMMSS or YYYYMMDD)
function parseICSDate(dateStr: string): string {
  // Handle format like 20240115T100000 or 20240115
  if (dateStr.length === 8) {
    // Date only
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}T00:00:00`;
  } else if (dateStr.length >= 15) {
    // Date and time
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }
  return dateStr;
}

// Main sync function
export async function syncCalendar(config: CalendarSyncConfig): Promise<{ meetings: Meeting[]; success: boolean; error?: string }> {
  try {
    let meetings: Meeting[] = [];

    switch (config.provider) {
      case 'google':
        meetings = await syncGoogleCalendar(config);
        break;
      case 'outlook':
        meetings = await syncOutlookCalendar(config);
        break;
      case 'ical':
      case 'apple':
        if (config.icsUrl) {
          meetings = await syncICSFromURL(config);
        } else {
          throw new Error('ICS URL not configured');
        }
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // Update last sync time
    config.lastSync = new Date();
    const configId = `${config.provider}-${config.name}`;
    await storageService.saveSyncConfig({ ...config, id: configId });

    return { meetings, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { meetings: [], success: false, error: errorMessage };
  }
}

// PKCE helpers for OAuth2 public clients
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// OAuth helpers with PKCE support
export async function getGoogleAuthUrl(redirectUri: string, usePKCE: boolean = true, clientId?: string): Promise<{ url: string; codeVerifier?: string }> {
  const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  
  // Use provided client ID or placeholder
  const finalClientId = clientId || 'YOUR_GOOGLE_CLIENT_ID';
  
  if (usePKCE) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    const params = new URLSearchParams({
      client_id: finalClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });
    
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      codeVerifier,
    };
  } else {
    if (!clientId || finalClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      throw new Error('Client ID required for non-PKCE flow');
    }
    const params = new URLSearchParams({
      client_id: finalClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }
}

export async function getOutlookAuthUrl(redirectUri: string, usePKCE: boolean = true, clientId?: string): Promise<{ url: string; codeVerifier?: string }> {
  const scope = 'https://graph.microsoft.com/Calendars.Read';
  const finalClientId = clientId || 'YOUR_MICROSOFT_CLIENT_ID'; // This should be configured or use a default
  
  if (usePKCE) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    const params = new URLSearchParams({
      client_id: finalClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    
    return {
      url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`,
      codeVerifier,
    };
  } else {
    if (!clientId || finalClientId === 'YOUR_MICROSOFT_CLIENT_ID') {
      throw new Error('Client ID required for non-PKCE flow');
    }
    const params = new URLSearchParams({
      client_id: finalClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
    });
    return { url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}` };
  }
}

// Apple Sign In (uses OAuth2)
export async function getAppleAuthUrl(redirectUri: string): Promise<{ url: string; state: string }> {
  const clientId = 'YOUR_APPLE_CLIENT_ID';
  const state = generateCodeVerifier(); // Use as state for CSRF protection
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email',
    response_mode: 'form_post',
    state,
  });
  
  return {
    url: `https://appleid.apple.com/auth/authorize?${params.toString()}`,
    state,
  };
}

// Exchange authorization code for token (Google) - with PKCE support
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body: Record<string, string> = {
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  if (codeVerifier) {
    // PKCE flow (no client secret needed)
    body.code_verifier = codeVerifier;
    if (clientId) {
      body.client_id = clientId;
    }
  } else if (clientId && clientSecret) {
    // Traditional flow with client secret
    body.client_id = clientId;
    body.client_secret = clientSecret;
  } else {
    throw new Error('Either codeVerifier or clientId/clientSecret required');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange authorization code: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
    expiresIn: data.expires_in,
  };
}

// Exchange authorization code for token (Outlook) - with PKCE support
export async function exchangeOutlookCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
  clientId?: string,
  clientSecret?: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const body: Record<string, string> = {
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  if (codeVerifier) {
    // PKCE flow
    body.code_verifier = codeVerifier;
    if (clientId) {
      body.client_id = clientId;
    }
  } else if (clientId && clientSecret) {
    // Traditional flow
    body.client_id = clientId;
    body.client_secret = clientSecret;
  } else {
    throw new Error('Either codeVerifier or clientId/clientSecret required');
  }

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange authorization code: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
    expiresIn: data.expires_in,
  };
}

// Exchange authorization code for token (Apple)
export async function exchangeAppleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange authorization code: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
    expiresIn: data.expires_in,
  };
}

