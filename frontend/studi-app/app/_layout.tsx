import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { Appearance } from 'react-native';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { 
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import { StudySessionProvider } from '@/context/StudySessionContext';
import { applyDarkTheme } from '@/theme/applyTheme';
import { dark } from '@/theme/dark';
import { light } from '@/theme/light';
import { useWeeklyGoal } from '@/hooks/useWeeklyGoal';

import { useColorScheme } from '@/hooks/useColorScheme';

// Fix SafeAreaView compatibility with NativeWind
cssInterop(SafeAreaView, { className: "style" });

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Set initial background color before the first render so the OS areas
// (status-bar notch and home-indicator strip) start with the correct theme.
const initialScheme = Appearance.getColorScheme();
SystemUI.setBackgroundColorAsync(initialScheme === 'dark' ? dark.background : light.background);

export default function RootLayout() {
  // Guard: redirect to goal-setting screen if none exists
  const { missing: goalMissing, loading: goalLoading } = useWeeklyGoal();
  const pathname = usePathname();

  useEffect(() => {
    // Avoid redirect loop: if we are already on the goal screen, do not replace again
    const onGoalScreen = pathname.startsWith('/screens/set-weekly-goal');
    if (!goalLoading && goalMissing && !onGoalScreen) {
      router.replace('/screens/set-weekly-goal' as any);
    }
  }, [goalMissing, goalLoading, pathname]);

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Poppins: Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const darkStyles = applyDarkTheme() as any;

  // Ensure the OS background outside the safe area matches our theme
  useEffect(() => {
    const bgColor = colorScheme === 'dark' ? dark.background : light.background;
    SystemUI.setBackgroundColorAsync(bgColor);
  }, [colorScheme]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <StudySessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaView edges={['left', 'right']} style={[{ flex: 1 }, darkStyles]}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="screens/manage-categories" options={{ headerShown: true, title: 'Manage Categories' }} />
            <Stack.Screen name="screens/set-weekly-goal" options={{ headerShown: false }} />
            <Stack.Screen name="screens/record" options={{ headerShown: true, title: 'Record Session' }} />
            <Stack.Screen name="screens/timer/stopwatch" options={{ headerShown: false }} />
            <Stack.Screen name="screens/timer/countdown" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaView>
        <StatusBar translucent backgroundColor="transparent" style="light" />
      </ThemeProvider>
    </StudySessionProvider>
  );
}
