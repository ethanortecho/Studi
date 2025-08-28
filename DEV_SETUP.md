# Development Setup - Auto-Connect Solution

## Problem Solved
Previously, when your laptop's IP address changed (switching WiFi networks, etc.), the frontend app couldn't connect to the backend. Now it automatically detects and connects regardless of your network!

## How It Works

### Backend (Django)
The backend is configured to:
- Accept connections from any origin in development mode (`CORS_ALLOW_ALL_ORIGINS = True`)
- Listen on all network interfaces when started with `0.0.0.0:8000`

### Frontend (React Native/Expo)
The frontend now:
- Automatically detects your laptop's IP from Expo's debugger host
- Falls back to `localhost` for iOS Simulator or web browser
- Dynamically constructs the API URL based on your current network

## Quick Start

### 1. Start the Backend
```bash
cd backend
./start_dev_server.sh
```

Or manually:
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### 2. Start the Frontend
```bash
cd frontend/studi-app
npm start
# or
npx expo start
```

## Key Changes Made

### `/frontend/studi-app/config/api.ts`
- Added `getDevServerUrl()` function that auto-detects the host IP
- Uses Expo's `Constants.expoConfig.hostUri` to find your laptop's IP
- Falls back to `localhost` when IP detection isn't available

### `/frontend/studi-app/utils/apiClient.ts`
- Updated to use `getEffectiveApiUrl()` instead of static `API_BASE_URL`
- Allows dynamic URL resolution at runtime

### `/backend/start_dev_server.sh`
- New convenience script to start Django on `0.0.0.0:8000`
- Runs migrations automatically
- Shows helpful connection information

## Troubleshooting

### iOS Simulator
- Should work automatically with `localhost`
- If issues, the app will auto-detect your Mac's IP

### Android Emulator
- May need to use `10.0.2.2` instead of `localhost`
- The auto-detection should handle this in most cases

### Physical Device
- Make sure your phone and laptop are on the same WiFi network
- The app will automatically use your laptop's network IP

### Connection Test
You can test the connection from the frontend:
```javascript
import { testBackendConnection } from './config/api';

// In your component
const checkConnection = async () => {
  const isConnected = await testBackendConnection();
  console.log('Backend connected:', isConnected);
};
```

## Manual Override (if needed)
If auto-detection fails, you can manually set the API URL:
```javascript
import { setManualApiUrl } from './config/api';

// Force a specific URL
setManualApiUrl('http://192.168.1.100:8000/api');
```

## Benefits
✅ No more updating IP addresses in code when switching networks
✅ Works on any WiFi network automatically
✅ Supports iOS Simulator, Android Emulator, and physical devices
✅ Fallback options ensure it always tries to connect
✅ Development server accepts connections from any source

## Security Note
⚠️ These settings are for **development only**. Production uses different, secure settings with specific allowed hosts and CORS origins.