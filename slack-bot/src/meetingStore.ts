/**
 * Fetch meetings and conflict data from Supabase (server-side, service role).
 */

import { supabase } from './supabaseClient.js';
import type { Meeting, Conflict } from './types.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export async function getMeetingsForToday(): Promise<Meeting[]> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const { data, error } = await supabase
    .from('meetings')
    .select('*');

  if (error) throw new Error(`Failed to fetch meetings: ${error.message}`);

  return (data as Meeting[]).filter(m => m.days.includes(today));
}

export async function getAllMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('id');

  if (error) throw new Error(`Failed to fetch meetings: ${error.message}`);
  return data as Meeting[];
}

/**
 * Detect scheduling conflicts across all meetings for a given day.
 * Two meetings conflict when their time ranges overlap.
 */
export function detectConflicts(meetings: Meeting[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const day of DAYS) {
    const dayMeetings = meetings
      .filter(m => m.days.includes(day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < dayMeetings.length; i++) {
      for (let j = i + 1; j < dayMeetings.length; j++) {
        const a = dayMeetings[i];
        const b = dayMeetings[j];
        if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
          conflicts.push({
            day,
            time: `${a.startTime} – ${a.endTime}`,
            meetings: [a.id, b.id],
          });
        }
      }
    }
  }

  return conflicts;
}

function parseTime(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = parseTime(aStart);
  const ae = parseTime(aEnd);
  const bs = parseTime(bStart);
  const be = parseTime(bEnd);
  return as < be && ae > bs;
}
