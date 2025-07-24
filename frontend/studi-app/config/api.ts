import Constants from 'expo-constants';

// Simple config for phone testing
const LOCAL_IP = '0.0.0.0'; // Backend server IP
const PORT = '8000';

// Always use network IP for now (works for both simulator and device)
export const API_BASE_URL = `http://${LOCAL_IP}:${PORT}/api`;

export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

// Debug logging
console.log('API Configuration:', {
  apiBaseUrl: API_BASE_URL
}); 