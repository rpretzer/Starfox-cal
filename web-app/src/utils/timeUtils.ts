/**
 * Time utility functions for timezone conversion and formatting
 */

// Get all available timezones
export function getAvailableTimezones(): string[] {
  // Common timezones - can be expanded
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'America/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
  ];
}

// Get timezone display name
export function getTimezoneDisplayName(timezone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone;
    return `${timezone} (${timeZoneName})`;
  } catch {
    return timezone;
  }
}

// Format time string based on format preference
export function formatTime(timeStr: string, format: '12h' | '24h' = '12h'): string {
  // Parse time string like "10:00 AM" or "14:30"
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return timeStr;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2];
  const period = timeMatch[3]?.toUpperCase();

  // Convert to 24-hour if needed
  if (period) {
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  // Format based on preference
  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } else {
    // 12-hour format
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
}

// Convert time string to Date object in specified timezone
export function parseTimeInTimezone(
  timeStr: string,
  date: Date,
  timezone?: string
): Date {
  // Parse time string
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return date;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3]?.toUpperCase();

  // Convert to 24-hour
  if (period) {
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  // Create date in local timezone first
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);

  if (!timezone || timezone === Intl.DateTimeFormat().resolvedOptions().timeZone) {
    return localDate;
  }

  // Convert to target timezone
  // Get the time in the target timezone
  const targetTimeStr = localDate.toLocaleString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Get the date string in target timezone
  const targetDateStr = localDate.toLocaleDateString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Parse the combined date and time
  const [month, day, year] = targetDateStr.split('/');
  const [targetHours, targetMinutes] = targetTimeStr.split(':').map(Number);

  // Create date object
  const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), targetHours, targetMinutes);
  
  // Adjust for timezone offset
  const localOffset = localDate.getTimezoneOffset();
  const targetOffset = getTimezoneOffset(timezone, localDate);
  const offsetDiff = (targetOffset - localOffset) * 60000; // Convert to milliseconds
  
  return new Date(result.getTime() - offsetDiff);
}

// Get timezone offset in minutes
function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

// Format time for display with timezone conversion
export function formatTimeForDisplay(
  timeStr: string,
  format: '12h' | '24h' = '12h',
  timezone?: string
): string {
  if (!timezone) {
    return formatTime(timeStr, format);
  }

  // Parse the time and convert to target timezone
  const now = new Date();
  const timeDate = parseTimeInTimezone(timeStr, now, timezone);
  
  // Format in target timezone
  return timeDate.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12h',
  });
}

// Get current timezone (user's system timezone or override)
export function getCurrentTimezone(override?: string): string {
  return override || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Convert time string to HTML time input format (HH:MM)
export function timeToInputFormat(timeStr: string): string {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return '';

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2];
  const period = timeMatch[3]?.toUpperCase();

  // Convert to 24-hour if needed
  if (period) {
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Convert HTML time input format (HH:MM) to display format
export function inputFormatToTime(inputTime: string, format: '12h' | '24h' = '12h'): string {
  if (!inputTime) return '';
  
  const [hoursStr, minutesStr] = inputTime.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } else {
    // 12-hour format
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
}

