/**
 * Color utility functions for gradient generation and manipulation
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Generate gradient shades from a base color
 * Returns an array of 3 colors: [lighter, base, darker]
 */
export function generateGradientShades(baseColor: string): string[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Create lighter shade (increase lightness, slightly decrease saturation)
  // More variation for better gradient effect
  const lighterHsl = {
    h: (hsl.h + 5) % 360, // Slight hue shift for richness
    s: Math.max(0, hsl.s - 8), // Slightly less saturated
    l: Math.min(90, hsl.l + 20), // 20% lighter, cap at 90 to avoid washing out
  };

  // Create darker shade (decrease lightness, slightly increase saturation)
  const darkerHsl = {
    h: (hsl.h - 5 + 360) % 360, // Slight hue shift opposite direction
    s: Math.min(100, hsl.s + 10), // More saturated for depth
    l: Math.max(10, hsl.l - 25), // 25% darker, floor at 10 to maintain visibility
  };

  const lighterRgb = hslToRgb(lighterHsl.h, lighterHsl.s, lighterHsl.l);
  const darkerRgb = hslToRgb(darkerHsl.h, darkerHsl.s, darkerHsl.l);

  return [
    rgbToHex(lighterRgb.r, lighterRgb.g, lighterRgb.b),
    baseColor,
    rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b),
  ];
}

/**
 * Interpolate between two colors
 * Used for smooth color transitions
 */
export function interpolateColor(
  color1: string,
  color2: string,
  progress: number
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * progress);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * progress);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * progress);

  return rgbToHex(r, g, b);
}

/**
 * Get a slightly varied shade of a color
 * Useful for creating subtle gradient variations
 */
export function getColorVariation(color: string, variation: 'light' | 'dark' | 'vibrant'): string {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  let newHsl = { ...hsl };

  switch (variation) {
    case 'light':
      newHsl.l = Math.min(100, hsl.l + 12);
      newHsl.s = Math.max(0, hsl.s - 8);
      break;
    case 'dark':
      newHsl.l = Math.max(0, hsl.l - 12);
      newHsl.s = Math.min(100, hsl.s + 5);
      break;
    case 'vibrant':
      newHsl.s = Math.min(100, hsl.s + 15);
      newHsl.l = hsl.l > 50 ? hsl.l - 5 : hsl.l + 5;
      break;
  }

  const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}