import { dark } from './dark';
import { light } from './light';
import { vars } from 'nativewind';

export type ThemeMode = 'light' | 'dark';
export type ThemeTokens = typeof dark;

// Helper to convert #rrggbb to "r g b" format required by Tailwind rgb(var(...))
const hexToRgb = (hex: string) => {
  const parsed = hex.replace('#', '');
  if (parsed.length !== 6) return hex; // return original if not hex string
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
};

/**
 * Injects CSS variables for each token and toggles the `dark` class
 * on the document root so NativeWind's `dark:` utilities work on web.
 * For native platforms, the function is a no-op except returning the tokens.
 */
export function applyTheme(tokens: ThemeTokens, mode: ThemeMode) {
  const isWeb = typeof document !== 'undefined';

  // Create vars-compatible map
  const varMap = Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => {
      const cssValue = typeof value === 'string' && value.startsWith('#') ? hexToRgb(value) : String(value);
      return [`--color-${key}`, cssValue];
    })
  );

  // Always create style object for NativeWind consumers
  const styleObj = vars(varMap);

  if (isWeb) {
    const root = document.documentElement;

    // Apply CSS vars
    Object.entries(varMap).forEach(([cssVar, cssValue]) => {
      root.style.setProperty(cssVar, cssValue as string);
    });

    // Toggle the `dark` class for Tailwind (web)
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return styleObj;
  }

  // Native platforms: use `vars` helper from NativeWind
  return styleObj;
}

// Convenience functions
export const applyDarkTheme = () => applyTheme(dark, 'dark');
export const applyLightTheme = () => applyTheme(light, 'light'); 