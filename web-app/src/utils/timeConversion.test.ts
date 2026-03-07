import { describe, it, expect } from 'vitest';
import { convertTimeFormat } from './timeConversion';

describe('convertTimeFormat', () => {
  it('should return the same string when fromFormat equals toFormat', () => {
    expect(convertTimeFormat('10:30 AM', '12h', '12h')).toBe('10:30 AM');
    expect(convertTimeFormat('14:30', '24h', '24h')).toBe('14:30');
  });

  it('should convert 12h AM to 24h', () => {
    expect(convertTimeFormat('10:30 AM', '12h', '24h')).toBe('10:30');
    expect(convertTimeFormat('12:00 AM', '12h', '24h')).toBe('00:00');
    expect(convertTimeFormat('1:05 AM', '12h', '24h')).toBe('01:05');
  });

  it('should convert 12h PM to 24h', () => {
    expect(convertTimeFormat('2:30 PM', '12h', '24h')).toBe('14:30');
    expect(convertTimeFormat('12:00 PM', '12h', '24h')).toBe('12:00');
    expect(convertTimeFormat('11:59 PM', '12h', '24h')).toBe('23:59');
  });

  it('should convert 24h to 12h', () => {
    expect(convertTimeFormat('14:30', '24h', '12h')).toBe('2:30 PM');
    expect(convertTimeFormat('00:00', '24h', '12h')).toBe('12:00 AM');
    expect(convertTimeFormat('12:00', '24h', '12h')).toBe('12:00 PM');
    expect(convertTimeFormat('23:59', '24h', '12h')).toBe('11:59 PM');
  });

  it('should return the original string when it does not match the expected pattern', () => {
    expect(convertTimeFormat('invalid', '12h', '24h')).toBe('invalid');
  });
});
