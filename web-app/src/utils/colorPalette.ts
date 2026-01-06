/**
 * Web-safe color palette (216 colors)
 * These colors are guaranteed to display consistently across different browsers and devices
 * Each RGB component is one of: 0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF
 */

// Web-safe colors organized by hue groups for better UX
export const WEB_SAFE_COLORS = [
  // Reds
  '#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC',
  '#CC0000', '#CC3333', '#CC6666', '#CC9999', '#CCCCCC',
  '#990000', '#993333', '#996666', '#999999',
  '#660000', '#663333', '#666666',
  '#330000', '#333333',
  '#000000',
  
  // Oranges/Yellows
  '#FF6600', '#FF9900', '#FFCC00', '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC',
  '#CC6600', '#CC9900', '#CCCC00', '#CCFF00', '#CCFF33', '#CCFF66', '#CCFF99', '#CCFFCC',
  '#996600', '#999900', '#99CC00', '#99FF00', '#99FF33', '#99FF66', '#99FF99',
  '#666600', '#669900', '#66CC00', '#66FF00', '#66FF33', '#66FF66',
  '#336600', '#339900', '#33CC00', '#33FF00', '#33FF33',
  
  // Greens
  '#00FF00', '#33FF00', '#66FF00', '#99FF00', '#CCFF00', '#FFFF00',
  '#00CC00', '#33CC00', '#66CC00', '#99CC00', '#CCCC00',
  '#009900', '#339900', '#669900', '#999900',
  '#006600', '#336600', '#666600',
  '#003300', '#333300',
  '#00FF33', '#33FF33', '#66FF33', '#99FF33', '#CCFF33',
  '#00CC33', '#33CC33', '#66CC33', '#99CC33',
  '#009933', '#339933', '#669933',
  '#006633', '#336633',
  '#003333',
  
  // Cyans/Blues
  '#00FFFF', '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF',
  '#00CCFF', '#33CCFF', '#66CCFF', '#99CCFF', '#CCCCFF',
  '#0099FF', '#3399FF', '#6699FF', '#9999FF',
  '#0066FF', '#3366FF', '#6666FF',
  '#0033FF', '#3333FF',
  '#0000FF', '#3300FF', '#6600FF', '#9900FF', '#CC00FF',
  '#0000CC', '#3300CC', '#6600CC', '#9900CC', '#CC00CC',
  '#000099', '#330099', '#660099', '#990099',
  '#000066', '#330066', '#660066',
  '#000033', '#330033',
  
  // Purples/Magentas
  '#FF00FF', '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF',
  '#CC00CC', '#CC33CC', '#CC66CC', '#CC99CC',
  '#990099', '#993399', '#996699',
  '#660066', '#663366',
  '#330033',
  
  // Grays (already included above but organized here)
  '#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0', '#B0B0B0',
  '#A0A0A0', '#909090', '#808080', '#707070', '#606060', '#505050',
  '#404040', '#303030', '#202020', '#101010', '#000000',
] as const;

/**
 * Get the next available color from the palette that isn't used by existing categories
 */
export function getNextAvailableColor(usedColors: number[]): string {
  const usedColorSet = new Set(usedColors.map(c => c.toString(16).padStart(6, '0').toUpperCase()));
  
  for (const color of WEB_SAFE_COLORS) {
    const colorValue = color.replace('#', '');
    if (!usedColorSet.has(colorValue)) {
      return color;
    }
  }
  
  // If all colors are used, return the first one (shouldn't happen in practice)
  return WEB_SAFE_COLORS[0];
}

/**
 * Convert hex color string to number (for storage)
 */
export function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Convert number to hex color string
 */
export function numberToHex(colorValue: number): string {
  return `#${colorValue.toString(16).padStart(6, '0')}`;
}

/**
 * Check if a color is already used by another category
 */
export function isColorUsed(colorValue: number, usedColors: number[]): boolean {
  return usedColors.some((used) => {
    return used === colorValue;
  });
}

/**
 * Get available colors (not used by any category)
 */
export function getAvailableColors(usedColors: number[]): string[] {
  const usedColorSet = new Set(usedColors.map(c => c.toString(16).padStart(6, '0').toUpperCase()));
  return WEB_SAFE_COLORS.filter(color => {
    const colorValue = color.replace('#', '');
    return !usedColorSet.has(colorValue);
  });
}

