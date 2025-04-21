/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#2C2C2C',          // textPrimary
    background: '#F8F8F8',    // background
    surface: '#FFFFFF',       // surface
    primary: '#3A4A8C',      // primary
    secondary: '#2B2B2B',    // secondary
    muted: '#A0A0A0',        // muted text
    border: '#E6E6E6',       // borders
    tabIconDefault: '#D0D0D0', // tabInactive
    tabIconSelected: '#4CAF50', // tabActive
  },
  dark: {
    text: '#FFFFFF',          // textInverse
    background: '#202037',    // dark background
    surface: '#2B2B2B',      // secondary as surface in dark mode
    primary: '#3A4A8C',      // keep primary consistent
    secondary: '#2B2B2B',    // secondary
    muted: '#A0A0A0',        // keep muted consistent
    border: '#404040',       // darker border for dark mode
    tabIconDefault: '##F8F8F8', // muted icon color
    tabIconSelected: '#4CAF50', // keep active tab color consistent
  }
};
