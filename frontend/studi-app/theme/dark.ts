export const dark = {
  text: '#ECEDEE',
  background: '#212030', //deep navy
  surface: '#262748', //slightly lighter navy
  primary: '#3F2E91', // Brand purple
  accent: '#5D3EDA',  // purple accent
  icon: '#9BA1A6',
  tint: '#FFFFFF',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#FFFFFF',
  border: '#2D2F31',
} as const;

export type DarkTheme = typeof dark; 