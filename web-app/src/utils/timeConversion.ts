/**
 * Utility functions for converting meeting times between 12h and 24h formats
 */

// Convert a time string from one format to another
export function convertTimeFormat(timeStr: string, fromFormat: '12h' | '24h', toFormat: '12h' | '24h'): string {
  if (fromFormat === toFormat) return timeStr;
  
  // Parse the time
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return timeStr;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2];
  const period = timeMatch[3]?.toUpperCase();

  // Convert to 24-hour if coming from 12-hour
  if (fromFormat === '12h' && period) {
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  // Convert to target format
  if (toFormat === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } else {
    // 12-hour format
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
}

