import Constants from 'expo-constants';

// Development server configuration
const LOCAL_PORT = '8000';

// Function to get the development server URL
const getDevServerUrl = (): string => {
  // Option 1: Use localhost for iOS Simulator and Android Emulator
  // iOS Simulator can use localhost, Android Emulator needs 10.0.2.2
  if (__DEV__) {
    // Check if we're in Expo Go or a dev client
    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    
    if (debuggerHost) {
      // Extract IP from Expo's debugger host (format: "192.168.1.100:19000")
      const ip = debuggerHost.split(':')[0];
      console.log(`🔍 Detected Expo host IP: ${ip}`);
      return `http://${ip}:${LOCAL_PORT}/api`;
    }
    
    // Fallback to localhost (works for iOS simulator and web)
    // For Android emulator, you might need to use 10.0.2.2
    console.log('📱 Using localhost (iOS/Web) or configure for Android');
    return `http://localhost:${LOCAL_PORT}/api`;
  }
  
  return ''; // Will use production URL
};

// Environment-based URL selection (kept for backward compatibility)
export const API_BASE_URL = __DEV__ 
  ? getDevServerUrl()  // Dynamic local development URL
  : process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging'
  ? 'https://studi-backend-staging.onrender.com/api'  // Staging (preview builds)
  : 'https://studi-backend-production.onrender.com/api';  // Production (App Store)

export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

// Environment detection and logging
const environment = __DEV__ 
  ? 'Development' 
  : process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging' 
  ? 'Staging' 
  : 'Production';

const environmentDescription = __DEV__ 
  ? 'Local Django server (auto-detected)' 
  : process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging'
  ? 'Render staging backend'
  : 'Render production backend';

// Debug logging
console.log(`🌐 API Environment: ${environment}`);
console.log(`📡 Backend URL: ${API_BASE_URL}`);
console.log(`ℹ️  Description: ${environmentDescription}`);

// Optional: Function to manually override the API URL if needed
let manualOverrideUrl: string | null = null;

export const setManualApiUrl = (url: string) => {
  manualOverrideUrl = url;
  console.log(`🔧 Manual API URL override set to: ${url}`);
};

export const getEffectiveApiUrl = (): string => {
  return manualOverrideUrl || API_BASE_URL;
};

// Export a function to test backend connectivity
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const testUrl = `${getEffectiveApiUrl()}/health/`; // Assuming you have a health check endpoint
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Backend connection successful');
      return true;
    } else {
      console.log(`❌ Backend returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error);
    return false;
  }
};