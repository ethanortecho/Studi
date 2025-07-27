import { Redirect } from 'expo-router';

/**
 * DEFAULT TAB ROUTE
 * 
 * This ensures that when users navigate to /(tabs), they get redirected
 * to the home tab by default. This fixes the "unmatched route" issue
 * after login/registration.
 */
export default function TabsIndex() {
  return <Redirect href="/(tabs)/home" />;
}