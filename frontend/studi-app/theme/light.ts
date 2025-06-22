export const light = {
  text: '#11181C',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#282257', // Brand purple (same as dark)
  icon: '#687076',
  tint: '#0a7ea4',
  tabIconDefault: '#687076',
  tabIconSelected: '#0a7ea4',
  border: '#E5E7EB',
  accent: '#5D3EDA',  // Brand purple accent
} as const;

export type LightTheme = typeof light; 