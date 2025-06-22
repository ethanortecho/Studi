/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { light } from '@/theme/light';
import { dark } from '@/theme/dark';

export const Colors = { light, dark } as const;

export const CATEGORY_COLORS = [
  { name: 'Purple', value: '#5A4FCF' },
  { name: 'Blue', value: '#4F9DDE' },
  { name: 'Yellow', value: '#F3C44B' },
  { name: 'Coral', value: '#F46D75' },
  { name: 'Teal', value: '#2EC4B6' },
] as const;
