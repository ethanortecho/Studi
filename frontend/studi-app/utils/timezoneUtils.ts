import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEZONE_STORAGE_KEY = 'user_timezone';

export interface TimezoneInfo {
  timezone: string;
  offset: number; // UTC offset in minutes
  displayName: string;
}

/**
 * Detect user's timezone using native browser/device APIs
 * Returns IANA timezone identifier (e.g., "America/New_York")
 */
export const detectUserTimezone = (): string => {
  try {
    // Use Intl API - works on iOS, Android, Web
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
    const now = new Date();
    
    // Get UTC offset in minutes
    const offset = -now.getTimezoneOffset();
    
    // Get display name (e.g., "Eastern Standard Time")
    const displayName = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'long'
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || tz;
    
    return {
      timezone: tz,
      offset,
      displayName
    };
  } catch (error) {
    console.warn('⚠️ Failed to get timezone info:', error);
    return {
      timezone: 'UTC',
      offset: 0,
      displayName: 'Coordinated Universal Time'
    };
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
 * Convert UTC datetime string to user's local timezone
 * Returns a Date object that behaves as if it's in the user's timezone
 */
export const convertUTCToUserTimezone = (utcDateString: string, userTimezone: string): Date => {
  try {
    const utcDate = new Date(utcDateString);
    
    // Create a date formatter for the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Format the UTC date in the target timezone
    const parts = formatter.formatToParts(utcDate);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as { [key: string]: string });
    
    // Create a new date using the local time components
    // This creates a date that represents the local time
    const localDate = new Date(
      parseInt(partsObj.year),
      parseInt(partsObj.month) - 1, // Month is 0-indexed
      parseInt(partsObj.day),
      parseInt(partsObj.hour),
      parseInt(partsObj.minute),
      parseInt(partsObj.second)
    );
    
    return localDate;
  } catch (error) {
    console.warn('⚠️ Failed to convert timezone:', error);
    return new Date(utcDateString);
  }
};

/**
 * Format UTC time for display in user's timezone
 * This is the main function for converting API times to display times
 */
export const formatTimeInUserTimezone = (
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
    // Fallback to basic formatting
    return new Date(utcDateString).toLocaleTimeString();
  }
};

/**
 * Format full datetime in user's timezone
 */
export const formatDateTimeInUserTimezone = (
  utcDateString: string, 
  userTimezone: string
): string => {
  return formatTimeInUserTimezone(utcDateString, userTimezone, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get time in user's timezone for chart axes
 * Returns time suitable for chart labels (HH:MM format)
 */
export const getChartTimeLabel = (utcDateString: string, userTimezone: string): string => {
  return formatTimeInUserTimezone(utcDateString, userTimezone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24-hour format for charts
  });
};

/**
 * Check if timezone is valid
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
 * Get offset between UTC and user timezone in minutes
 * Positive values mean ahead of UTC, negative means behind
 */
export const getTimezoneOffsetMinutes = (timezone: string, date?: Date): number => {
  try {
    const testDate = date || new Date();
    
    // Get UTC time in milliseconds
    const utcTime = testDate.getTime();
    
    // Get local time in the specified timezone
    const localTime = new Date(testDate.toLocaleString('en-US', { timeZone: timezone })).getTime();
    
    // Calculate offset in minutes
    return Math.round((localTime - utcTime) / (1000 * 60));
  } catch (error) {
    console.warn('⚠️ Failed to get timezone offset:', error);
    return 0;
  }
};

/**
 * Convert timeline data from UTC to user timezone
 * Specifically for chart data that contains time arrays
 */
export const convertTimelineDataToUserTimezone = <T extends { start_time: string; end_time?: string }>(
  data: T[],
  userTimezone: string
): T[] => {
  return data.map(item => ({
    ...item,
    start_time: convertUTCToUserTimezone(item.start_time, userTimezone).toISOString(),
    ...(item.end_time && {
      end_time: convertUTCToUserTimezone(item.end_time, userTimezone).toISOString()
    })
  }));
};