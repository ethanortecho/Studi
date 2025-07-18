// Simplified timezone utilities - no storage needed, browser handles detection

/**
 * Detect user's timezone using native browser/device APIs
 * Returns IANA timezone identifier (e.g., "America/New_York")
 */
export const detectUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('⚠️ Failed to detect timezone, falling back to UTC:', error);
    return 'UTC';
  }
};

/**
 * Get hour in user's timezone from UTC string (for charts)
 * Simplified version that just extracts the hour for chart display
 */
export const getLocalHour = (utcDateString: string, userTimezone: string): number => {
  try {
    const date = new Date(utcDateString);
    const hourString = date.toLocaleString('en-US', { 
      timeZone: userTimezone, 
      hour: 'numeric', 
      hour12: false 
    });
    return parseInt(hourString);
  } catch (error) {
    console.warn('⚠️ Failed to get local hour:', error);
    return new Date(utcDateString).getHours();
  }
};

/**
 * Get Date components in user's timezone (for charts that need day/month/year)
 */
export const getLocalDateComponents = (utcDateString: string, userTimezone: string) => {
  try {
    const date = new Date(utcDateString);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const partsObj = parts.reduce((acc, part) => {
      acc[part.type] = parseInt(part.value);
      return acc;
    }, {} as any);
    
    return {
      year: partsObj.year,
      month: partsObj.month - 1, // JS months are 0-indexed
      day: partsObj.day,
      hour: partsObj.hour,
      minute: partsObj.minute
    };
  } catch (error) {
    console.warn('⚠️ Failed to get local date components:', error);
    const fallback = new Date(utcDateString);
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth(),
      day: fallback.getDate(),
      hour: fallback.getHours(),
      minute: fallback.getMinutes()
    };
  }
};

/**
 * Convert UTC datetime string to user's local timezone
 * Simplified version that creates a Date object with local timezone hour/minute for chart usage
 * ONLY USE FOR CHARTS - for display formatting use formatTimeInUserTimezone instead
 */
export const convertUTCToUserTimezone = (utcDateString: string, userTimezone: string): Date => {
  try {
    const components = getLocalDateComponents(utcDateString, userTimezone);
    
    // Create a Date object using the local timezone components
    // This is specifically for charts that need .getHours()/.getMinutes() to work correctly
    const localDate = new Date(
      components.year,
      components.month,
      components.day,
      components.hour,
      components.minute
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