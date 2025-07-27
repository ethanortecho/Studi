/**
 * Centralized time formatting utilities for consistent display across the app
 * 
 * Standard Format (Option A):
 * - < 1 min: "30s", "45s"
 * - < 1 hour: "5m", "30m"  
 * - ≥ 1 hour: "2h 30m", "1h 5m"
 * - Exact hours: "2h" (no zero minutes)
 */

/**
 * Format duration from seconds to standardized display format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format duration from minutes to standardized display format
 * @param minutes - Duration in minutes (can be decimal)
 * @returns Formatted duration string
 */
export function formatDurationFromMinutes(minutes: number): string {
  return formatDuration(Math.round(minutes * 60));
}

/**
 * Format duration for API data that contains total_duration in seconds
 * @param apiData - API response object with aggregate.total_duration
 * @returns Formatted duration string
 */
export function formatStudyTime(apiData: any): string {
  const seconds = apiData?.aggregate?.total_duration || 0;
  return formatDuration(seconds);
}

/**
 * Parse seconds into hours and minutes for components that need separate values
 * @param seconds - Duration in seconds
 * @returns Object with hours and minutes as numbers
 */
export function parseHoursAndMinutes(seconds: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes };
}

/**
 * Format for timer displays (mm:ss or h:mm:ss format)
 * @param seconds - Elapsed or remaining seconds
 * @returns Timer format string
 */
export function formatTimerDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format session duration from start/end times
 * @param startTime - Start time string
 * @param endTime - End time string (optional, defaults to now)
 * @returns Formatted duration string
 */
export function formatSessionDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  
  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000);
  
  return formatDuration(seconds);
}