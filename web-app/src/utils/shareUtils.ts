/**
 * Utilities for sharing meetings and generating permalinks
 */

import { Meeting, ViewType, WeekTypeFilter } from '../types';

/**
 * Generate a permalink for a meeting
 */
export function generateMeetingPermalink(meetingId: number, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/meeting/${meetingId}`;
}

/**
 * Generate a permalink for a calendar view
 */
export function generateViewPermalink(
  view: ViewType,
  weekType?: WeekTypeFilter,
  baseUrl?: string
): string {
  const base = baseUrl || window.location.origin;
  const params = new URLSearchParams();
  params.set('view', view);
  if (weekType) {
    params.set('week', weekType);
  }
  return `${base}/?${params.toString()}`;
}

/**
 * Generate a short permalink (for go links, etc.)
 * In a real implementation, this would call a URL shortening service
 */
export async function generateShortPermalink(longUrl: string): Promise<string> {
  // For now, return the long URL
  // In production, this would call a URL shortening service like:
  // - bit.ly API
  // - tinyurl API
  // - Custom go link service
  return longUrl;
}

/**
 * Share meeting via Web Share API or copy to clipboard
 */
export async function shareMeeting(meeting: Meeting, permalink?: string): Promise<void> {
  const shareText = `Meeting: ${meeting.name}\n${meeting.startTime} - ${meeting.endTime}\n${meeting.days.join(', ')}`;
  const shareUrl = permalink || generateMeetingPermalink(meeting.id);

  if (navigator.share) {
    try {
      await navigator.share({
        title: meeting.name,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (error) {
      // User cancelled or error occurred, fall back to clipboard
    }
  }

  // Fallback to clipboard
  const fullText = `${shareText}\n${shareUrl}`;
  await navigator.clipboard.writeText(fullText);
  throw new Error('Copied to clipboard'); // Signal that we copied instead of shared
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/**
 * Generate calendar invitation text (for email)
 */
export function generateCalendarInvite(meeting: Meeting): string {
  const lines = [
    `Subject: ${meeting.name}`,
    '',
    `Time: ${meeting.startTime} - ${meeting.endTime}`,
    `Days: ${meeting.days.join(', ')}`,
    `Frequency: ${meeting.weekType}`,
  ];

  if (meeting.requiresAttendance) {
    lines.push(`Required Attendance: ${meeting.requiresAttendance}`);
  }

  if (meeting.assignedTo) {
    lines.push(`Assigned To: ${meeting.assignedTo}`);
  }

  if (meeting.notes) {
    lines.push('', 'Notes:', meeting.notes);
  }

  if (meeting.meetingLink) {
    lines.push('', `Meeting Link: ${meeting.meetingLink}`);
  }

  return lines.join('\n');
}

