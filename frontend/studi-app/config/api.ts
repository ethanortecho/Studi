import Constants from 'expo-constants';

// Environment-based API configuration
const LOCAL_IP = '192.168.86.31'; // Your computer's local IP - update this!
const LOCAL_PORT = '8000';

// Environment-based URL selection
export const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:${LOCAL_PORT}/api`  // Local development
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
  ? 'Local Django server' 
  : process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging'
  ? 'Render staging backend'
  : 'Render production backend';

// Debug logging
console.log(`🌐 API Environment: ${environment}`);
console.log(`📡 Backend URL: ${API_BASE_URL}`);
console.log(`ℹ️  Description: ${environmentDescription}`); 