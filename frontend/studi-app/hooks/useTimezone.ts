import { useContext } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';
import { 
  formatTimeInUserTimezone, 
  formatDateTimeInUserTimezone, 
  getChartTimeLabel,
  convertUTCToUserTimezone
} from '@/utils/timezoneUtils';

/**
 * Custom hook for timezone-aware time formatting
 * Provides consistent time formatting throughout the app
 */
export const useTimezone = () => {
  const { userTimezone } = useContext(StudySessionContext);

  return {
    /**
     * The user's current timezone (e.g., "America/New_York")
     */
    userTimezone,

    /**
     * Format UTC time for display in user's timezone
     * @param utcDateString - UTC timestamp string
     * @param options - Optional Intl.DateTimeFormatOptions
     * @returns Formatted time string (default: "HH:MM AM/PM")
     */
    formatTime: (utcDateString: string, options?: Intl.DateTimeFormatOptions) => 
      formatTimeInUserTimezone(utcDateString, userTimezone, options),

    /**
     * Format UTC datetime for display in user's timezone
     * @param utcDateString - UTC timestamp string
     * @returns Formatted datetime string (e.g., "Dec 17, 2025, 2:30 PM")
     */
    formatDateTime: (utcDateString: string) => 
      formatDateTimeInUserTimezone(utcDateString, userTimezone),

    /**
     * Get time label for charts in user's timezone
     * @param utcDateString - UTC timestamp string
     * @returns Time in 24-hour format (e.g., "14:30")
     */
    getChartLabel: (utcDateString: string) => 
      getChartTimeLabel(utcDateString, userTimezone),

    /**
     * Convert UTC date to user's timezone Date object
     * @param utcDateString - UTC timestamp string
     * @returns Date object in user's timezone
     */
    convertToUserTime: (utcDateString: string) => 
      convertUTCToUserTimezone(utcDateString, userTimezone),


    /**
     * Format session duration display
     * @param startTime - UTC start time string
     * @param endTime - UTC end time string (optional, defaults to now)
     * @returns Formatted duration display
     */
    formatSessionDuration: (startTime: string, endTime?: string) => {
      const start = convertUTCToUserTimezone(startTime, userTimezone);
      const end = endTime ? convertUTCToUserTimezone(endTime, userTimezone) : new Date();
      
      const durationMs = end.getTime() - start.getTime();
      const minutes = Math.floor(durationMs / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${minutes}m`;
    },

    /**
     * Format time range display (e.g., "2:30 PM - 4:15 PM")
     * @param startTime - UTC start time string
     * @param endTime - UTC end time string
     * @returns Formatted time range
     */
    formatTimeRange: (startTime: string, endTime: string) => {
      const startFormatted = formatTimeInUserTimezone(startTime, userTimezone, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const endFormatted = formatTimeInUserTimezone(endTime, userTimezone, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${startFormatted} - ${endFormatted}`;
    },

    /**
     * Check if a date is today in user's timezone
     * @param utcDateString - UTC timestamp string
     * @returns true if the date is today in user's timezone
     */
    isToday: (utcDateString: string) => {
      const date = convertUTCToUserTimezone(utcDateString, userTimezone);
      const today = new Date();
      
      return date.toDateString() === today.toDateString();
    },

    /**
     * Get relative time display (e.g., "2 hours ago", "in 30 minutes")
     * @param utcDateString - UTC timestamp string
     * @returns Relative time string
     */
    getRelativeTime: (utcDateString: string) => {
      const date = convertUTCToUserTimezone(utcDateString, userTimezone);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
      } else if (diffMinutes < 0) {
        const futureMinutes = Math.abs(diffMinutes);
        return futureMinutes === 1 ? 'in 1 minute' : `in ${futureMinutes} minutes`;
      } else {
        return 'just now';
      }
    }
  };
};