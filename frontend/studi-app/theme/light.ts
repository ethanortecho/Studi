export const light = {
  primaryText: '#828282',
  secondaryText: '#A3A3A3',
  background: '#D4DCF0', //light blue
  surface: '#FFFFFF', //white
  primary: '#3F2E91', // Brand purple
  accent: '#5D3EDA',  // purple accent
  icon: '#9BA1A6',
  tint: '#FFFFFF',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#FFFFFF',
  border: '#2D2F31',
} as const;

export type LightTheme = typeof light; 