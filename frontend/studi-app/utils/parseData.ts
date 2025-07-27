import DailyDashboard from "@/app/screens/Insights/DailyDashboard";

// Filter out Break category from categoryDurations for visual displays
export function filterBreakCategory(categoryDurations: { [key: string]: number }) {
    const filtered = { ...categoryDurations };
    delete filtered['Break'];
    return filtered;
}

// Filter out Break category from dailyBreakdown data for visual displays
export function filterBreakFromDailyBreakdown(dailyBreakdown: { [date: string]: { total: number; categories: { [key: string]: number } } }) {
    const filtered = { ...dailyBreakdown };
    
    Object.keys(filtered).forEach(date => {
        if (filtered[date].categories) {
            const filteredCategories = { ...filtered[date].categories };
            delete filteredCategories['Break'];
            filtered[date] = {
                ...filtered[date],
                categories: filteredCategories
            };
        }
    });
    
    return filtered;
}

export function parseCategoryDurations(apiData: any) {
    const categoryDurations = apiData?.aggregate?.category_durations || {};
    const categoryMetadata = apiData?.category_metadata || {};

    // Create a map of category names to their metadata
    const categoryNameToMeta = Object.entries(categoryMetadata).reduce((acc, [id, meta]: [string, any]) => {
        acc[meta.name] = meta;
        return acc;
    }, {} as { [key: string]: { color: string } });

    const chartData = Object.entries(categoryDurations)
        .filter(([label, _]) => label !== 'Break') // Filter out Break category from visual displays
        .map(([label, value]) => ({
            label,
            value: Number(value),
            color: categoryNameToMeta[label]?.color || '#E8E8E8'
        }));

    return chartData;
}

export function secondsToHours(apiData:any){
    const seconds = apiData?.aggregate?.total_duration || 0;
    return standardFormatDuration(seconds);
}

export function secondsToHoursAndMinutes(apiData: any): { hours: number; minutes: number } {
    const seconds = parseInt(apiData?.aggregate?.total_duration) || 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return { hours, minutes };
}

import { formatDuration as standardFormatDuration } from '@/utils/timeFormatting';

export function formatDuration(seconds: number): string {
    return standardFormatDuration(seconds);
}

export function ParseStudyTrends(trend_data: Record<string, any>, category: string) {
    let chartData = Object.entries(trend_data).map(([day, data]) => {
        if (category === 'all') {
            return {
                day: day,
                total_time: data.total
            };
        } else {
            // For specific categories, use the same structure but call it total_time
            if (data.categories[category]) {
                return {
                    day: day,
                    total_time: data.categories[category]
                };
            } else {
                return {
                    day: day,
                    total_time: 0
                };
            }
        }
    });

    return chartData;
}
    


    
    
/**
 * Parse session times data for a simplified heatmap visualization
 * @param sessionTimes Array of session time objects with start_time, end_time
 * @returns A structure showing which hours were studied on each day
 */
export function parseSessionTimesForHeatmap(sessionTimes: Array<{ 
  start_time: string; 
  end_time: string; 
  total_duration: number;
}>) {
  // Days of week (Monday to Sunday)
  const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  
  // Hours of day (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Initialize an empty structure with all hours marked as inactive
  const heatmapData: Record<string, Record<number, boolean>> = {};
  
  // Create empty data structure
  days.forEach(day => {
    heatmapData[day] = {};
    hours.forEach(hour => {
      heatmapData[day][hour] = false;
    });
  });
  
  // Skip if no sessions
  if (!sessionTimes || !Array.isArray(sessionTimes) || sessionTimes.length === 0) {
    return { days, hours, heatmapData };
  }
  
  // Process each session
  sessionTimes.forEach(session => {
    try {
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      
      // Skip invalid dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return;
      }
      
      // Get day of week
      const dayIndex = startTime.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Convert to our day format (MO, TU, etc.)
      // Adjust index because our days array starts with Monday
      const dayCode = days[(dayIndex + 6) % 7]; // Convert Sunday (0) to position 6
      
      // For each hour between start and end time
      let currentHour = new Date(startTime);
      currentHour.setUTCMinutes(0, 0, 0); // Start at the beginning of the hour
      
      while (currentHour < endTime) {
        const hour = currentHour.getUTCHours();
        
        // Mark this hour as active for this day
        heatmapData[dayCode][hour] = true;
        
        // Move to next hour
        currentHour.setTime(currentHour.getTime() + (60 * 60 * 1000));
      }
    } catch (error) {
      console.warn("Error processing session:", error);
    }
  });
  
  return { days, hours, heatmapData };
}
    


    
    