import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEZONE_STORAGE_KEY = 'user_timezone';

export interface TimezoneInfo {
  timezone: string;
  offset: number; // UTC offset in minutes
  name: string; // Human readable name
}

/**
 * Detect user's timezone using browser/device APIs
 * Returns IANA timezone identifier (e.g., "America/New_York")
 */
export const detectUserTimezone = (): string => {
  try {
    // Use Intl API to get timezone - works on all modern platforms
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🕒 Detected timezone:', timezone);
    return timezone;
  } catch (error) {
    console.warn('⚠️ Failed to detect timezone, falling back to UTC:', error);
    return 'UTC';
  }
};

/**
 * Get detailed timezone information
 */
export const getTimezoneInfo = (timezone?: string): TimezoneInfo => {
  const tz = timezone || detectUserTimezone();
  
  try {
    // Get current UTC offset
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const tzTime = new Date(utcTime + (getTimezoneOffset(tz) * 60000));
    const offset = -now.getTimezoneOffset(); // Convert to minutes ahead of UTC
    
    // Get human readable name
    const name = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'long'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || tz;
    
    return {
      timezone: tz,
      offset,
      name
    };
  } catch (error) {
    console.warn('⚠️ Failed to get timezone info:', error);
    return {
      timezone: 'UTC',
      offset: 0,
      name: 'Coordinated Universal Time'
    };
  }
};

/**
 * Get timezone offset in minutes for a specific timezone
 */
export const getTimezoneOffset = (timezone: string): number => {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (local.getTime() - utc.getTime()) / (1000 * 60);
  } catch (error) {
    console.warn('⚠️ Failed to get timezone offset:', error);
    return 0;
  }
};

/**
 * Store user timezone in AsyncStorage
 */
export const storeUserTimezone = async (timezone: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
    console.log('💾 Stored user timezone:', timezone);
  } catch (error) {
    console.warn('⚠️ Failed to store timezone:', error);
  }
};

/**
 * Get stored user timezone from AsyncStorage
 */
export const getStoredTimezone = async (): Promise<string | null> => {
  try {
    const timezone = await AsyncStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (timezone) {
      console.log('🔍 Retrieved stored timezone:', timezone);
    }
    return timezone;
  } catch (error) {
    console.warn('⚠️ Failed to retrieve stored timezone:', error);
    return null;
  }
};

/**
 * Initialize timezone detection and storage
 * Call this on app startup
 */
export const initializeTimezone = async (): Promise<string> => {
  try {
    // First check if we have a stored timezone
    const storedTimezone = await getStoredTimezone();
    
    // Always detect current timezone
    const detectedTimezone = detectUserTimezone();
    
    // If stored timezone is different from detected, update it
    if (!storedTimezone || storedTimezone !== detectedTimezone) {
      await storeUserTimezone(detectedTimezone);
      console.log('🔄 Updated timezone from', storedTimezone, 'to', detectedTimezone);
      return detectedTimezone;
    }
    
    console.log('✅ Using stored timezone:', storedTimezone);
    return storedTimezone;
  } catch (error) {
    console.warn('⚠️ Timezone initialization failed, using detected timezone:', error);
    const fallback = detectUserTimezone();
    await storeUserTimezone(fallback);
    return fallback;
  }
};

/**
 * Check if a timezone string is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Convert UTC date string to user's timezone
 * Returns ISO string in user timezone
 */
export const convertUTCToUserTimezone = (utcDateString: string, userTimezone: string): string => {
  try {
    const utcDate = new Date(utcDateString);
    
    // Create date in user timezone
    const userDate = new Date(utcDate.toLocaleString('en-US', { timeZone: userTimezone }));
    
    return userDate.toISOString();
  } catch (error) {
    console.warn('⚠️ Failed to convert timezone:', error);
    return utcDateString;
  }
};

/**
 * Format time in user's timezone for display
 */
export const formatTimeInTimezone = (
  utcDateString: string, 
  userTimezone: string, 
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const date = new Date(utcDateString);
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone,
      ...options
    };
    
    return date.toLocaleString('en-US', defaultOptions);
  } catch (error) {
    console.warn('⚠️ Failed to format time in timezone:', error);
    return new Date(utcDateString).toLocaleString();
  }
};