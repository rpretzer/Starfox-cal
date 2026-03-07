import { describe, it, expect } from 'vitest';
import {
  hexToNumber,
  numberToHex,
  isColorUsed,
  getAvailableColors,
  getNextAvailableColor,
  WEB_SAFE_COLORS,
} from './colorPalette';

describe('hexToNumber', () => {
  it('should convert hex string to number', () => {
    expect(hexToNumber('#FF0000')).toBe(0xff0000);
    expect(hexToNumber('#000000')).toBe(0);
    expect(hexToNumber('#FFFFFF')).toBe(0xffffff);
  });
});

describe('numberToHex', () => {
  it('should convert number to hex string with leading #', () => {
    expect(numberToHex(0xff0000)).toBe('#ff0000');
    expect(numberToHex(0)).toBe('#000000');
    expect(numberToHex(0xffffff)).toBe('#ffffff');
  });

  it('should pad short hex values', () => {
    expect(numberToHex(0x0000ff)).toBe('#0000ff');
    expect(numberToHex(0x000033)).toBe('#000033');
  });
});

describe('isColorUsed', () => {
  it('should return true when color is in the used list', () => {
    expect(isColorUsed(0xff0000, [0xff0000, 0x00ff00])).toBe(true);
  });

  it('should return false when color is not in the used list', () => {
    expect(isColorUsed(0x0000ff, [0xff0000, 0x00ff00])).toBe(false);
  });

  it('should return false for empty used list', () => {
    expect(isColorUsed(0xff0000, [])).toBe(false);
  });
});

describe('getAvailableColors', () => {
  it('should return all colors when nothing is used', () => {
    const available = getAvailableColors([]);
    expect(available.length).toBe(WEB_SAFE_COLORS.length);
  });

  it('should exclude used colors from the result', () => {
    const usedHex = hexToNumber('#FF0000');
    const available = getAvailableColors([usedHex]);
    expect(available).not.toContain('#FF0000');
    expect(available.length).toBe(WEB_SAFE_COLORS.length - 1);
  });
});

describe('getNextAvailableColor', () => {
  it('should return the first color when no colors are used', () => {
    expect(getNextAvailableColor([])).toBe(WEB_SAFE_COLORS[0]);
  });

  it('should skip used colors and return the next available', () => {
    const firstColorNum = hexToNumber(WEB_SAFE_COLORS[0]);
    const result = getNextAvailableColor([firstColorNum]);
    expect(result).toBe(WEB_SAFE_COLORS[1]);
  });

  it('should return the first color as fallback when all are used', () => {
    // Use all colors
    const allNums = WEB_SAFE_COLORS.map(c => hexToNumber(c));
    const result = getNextAvailableColor(allNums);
    expect(result).toBe(WEB_SAFE_COLORS[0]);
  });
});
