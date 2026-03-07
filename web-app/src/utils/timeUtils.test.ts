import { describe, it, expect } from 'vitest';
import {
  getAvailableTimezones,
  formatTime,
  timeToInputFormat,
  inputFormatToTime,
  getCurrentTimezone,
} from './timeUtils';

describe('getAvailableTimezones', () => {
  it('should return a non-empty list of timezone strings', () => {
    const zones = getAvailableTimezones();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones).toContain('UTC');
    expect(zones).toContain('America/New_York');
  });
});

describe('formatTime', () => {
  it('should format 24h time string in 12h format', () => {
    expect(formatTime('14:30', '12h')).toBe('2:30 PM');
    expect(formatTime('00:00', '12h')).toBe('12:00 AM');
    expect(formatTime('12:00', '12h')).toBe('12:00 PM');
  });

  it('should format 12h time string in 24h format', () => {
    expect(formatTime('2:30 PM', '24h')).toBe('14:30');
    expect(formatTime('12:00 AM', '24h')).toBe('00:00');
    expect(formatTime('12:00 PM', '24h')).toBe('12:00');
  });

  it('should return original string for unrecognized formats', () => {
    expect(formatTime('not-a-time', '12h')).toBe('not-a-time');
  });

  it('should default to 12h format', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
  });
});

describe('timeToInputFormat', () => {
  it('should convert 12h time to HH:MM format', () => {
    expect(timeToInputFormat('2:30 PM')).toBe('14:30');
    expect(timeToInputFormat('12:00 AM')).toBe('00:00');
    expect(timeToInputFormat('12:00 PM')).toBe('12:00');
  });

  it('should convert 24h time to HH:MM format', () => {
    expect(timeToInputFormat('14:30')).toBe('14:30');
    expect(timeToInputFormat('09:05')).toBe('09:05');
  });

  it('should return empty string for unrecognized formats', () => {
    expect(timeToInputFormat('not-a-time')).toBe('');
  });
});

describe('inputFormatToTime', () => {
  it('should convert HH:MM to 12h display format by default', () => {
    expect(inputFormatToTime('14:30')).toBe('2:30 PM');
    expect(inputFormatToTime('00:00')).toBe('12:00 AM');
    expect(inputFormatToTime('12:00')).toBe('12:00 PM');
  });

  it('should convert HH:MM to 24h display format', () => {
    expect(inputFormatToTime('14:30', '24h')).toBe('14:30');
    expect(inputFormatToTime('09:05', '24h')).toBe('09:05');
  });

  it('should return empty string for empty input', () => {
    expect(inputFormatToTime('')).toBe('');
  });
});

describe('getCurrentTimezone', () => {
  it('should return the override timezone when provided', () => {
    expect(getCurrentTimezone('America/New_York')).toBe('America/New_York');
  });

  it('should return a non-empty string when no override is provided', () => {
    const tz = getCurrentTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });
});
