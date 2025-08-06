/**
 * Utility functions for checking WCAG color contrast compliance
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors.')
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if color combination meets WCAG AA standards
 * @param ratio - The contrast ratio
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 */
export function meetsWCAG_AA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if color combination meets WCAG AAA standards
 * @param ratio - The contrast ratio
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 */
export function meetsWCAG_AAA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Get WCAG compliance level for a color combination
 */
export function getWCAGCompliance(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number
  AA: boolean
  AAA: boolean
  recommendation: string
} {
  const ratio = getContrastRatio(foreground, background)
  const AA = meetsWCAG_AA(ratio, isLargeText)
  const AAA = meetsWCAG_AAA(ratio, isLargeText)

  let recommendation = ''
  if (!AA) {
    recommendation = `Contrast ratio ${ratio.toFixed(
      2
    )}:1 fails WCAG AA. Minimum required: ${isLargeText ? '3:1' : '4.5:1'}`
  } else if (!AAA) {
    recommendation = `Meets WCAG AA (${ratio.toFixed(
      2
    )}:1) but not AAA. For AAA, need ${isLargeText ? '4.5:1' : '7:1'}`
  } else {
    recommendation = `Excellent! Meets WCAG AAA (${ratio.toFixed(2)}:1)`
  }

  return { ratio, AA, AAA, recommendation }
}

/**
 * Suggest a better color if current combination fails WCAG
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  targetLevel: 'AA' | 'AAA' = 'AA'
): string | null {
  const currentRatio = getContrastRatio(foreground, background)
  const targetRatio = targetLevel === 'AA' ? 4.5 : 7

  if (currentRatio >= targetRatio) {
    return null // Already meets target
  }

  // This is a simplified suggestion - in production, use a more sophisticated algorithm
  const rgb = hexToRgb(foreground)
  if (!rgb) return null

  // Try making the color lighter or darker
  const factor = currentRatio < 2 ? 2 : 1.5
  const lighter = {
    r: Math.min(255, Math.round(rgb.r * factor)),
    g: Math.min(255, Math.round(rgb.g * factor)),
    b: Math.min(255, Math.round(rgb.b * factor)),
  }

  const darker = {
    r: Math.max(0, Math.round(rgb.r / factor)),
    g: Math.max(0, Math.round(rgb.g / factor)),
    b: Math.max(0, Math.round(rgb.b / factor)),
  }

  // Convert back to hex and return the one with better contrast
  const toHex = (c: { r: number; g: number; b: number }) =>
    '#' +
    [c.r, c.g, c.b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')

  const lighterHex = toHex(lighter)
  const darkerHex = toHex(darker)

  const lighterRatio = getContrastRatio(lighterHex, background)
  const darkerRatio = getContrastRatio(darkerHex, background)

  if (lighterRatio >= targetRatio) return lighterHex
  if (darkerRatio >= targetRatio) return darkerHex

  // If neither works, return the better one
  return lighterRatio > darkerRatio ? lighterHex : darkerHex
}