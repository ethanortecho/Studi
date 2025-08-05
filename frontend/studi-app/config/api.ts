import Constants from 'expo-constants';

// Environment-based API configuration
const LOCAL_IP = '0.0.0.0'; // Backend server IP for development
const LOCAL_PORT = '8000';

// Simple environment detection: __DEV__ for local development, production URL for App Store builds
export const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:${LOCAL_PORT}/api`  // Local development
  : 'https://studi-backend-production.onrender.com/api';  // Production (App Store)

export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

// Environment detection and logging
const environment = __DEV__ ? 'Development' : 'Production';
const environmentDescription = __DEV__ 
  ? 'Local Django server' 
  : 'Render production backend';

// Debug logging
console.log(`🌐 API Environment: ${environment}`);
console.log(`📡 Backend URL: ${API_BASE_URL}`);
console.log(`ℹ️  Description: ${environmentDescription}`); 