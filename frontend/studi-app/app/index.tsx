import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect root URL ("/") to the home tab so the app always launches on Home
  return <Redirect href="/(tabs)/home" />;
} 