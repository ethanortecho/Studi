import DailyDashboard from "@/app/(tabs)/Insights/DailyDashboard";

export function parseCategoryDurations(apiData: any) {
    const categoryDurations = apiData?.aggregate?.category_durations || {};
    const categoryMetadata = apiData?.category_metadata || {};

    // Create a map of category names to their metadata
    const categoryNameToMeta = Object.entries(categoryMetadata).reduce((acc, [id, meta]: [string, any]) => {
        acc[meta.name] = meta;
        return acc;
    }, {} as { [key: string]: { color: string } });

    const chartData = Object.entries(categoryDurations).map(([label, value]) => ({
        label,
        value: Number(value),
        color: categoryNameToMeta[label]?.color || '#E8E8E8'
    }));

    return chartData;
}

export function format_Duration(apiData:any){
    
    
    const seconds = apiData?.aggregate?.total_duration;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);


    if (hrs > 0){
        return `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} min${mins !== 1 ? 's' : ''}`;
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}hrs ${minutes}min`;
}


export function ParseStudyTrends(trend_data: Record<string, any>,  // <- quick fix
    category: string
  ) {

    let chartData = Object.entries(trend_data).map(([day, data]) => {

        if (category === 'all') {
            // ✅ This part is already good
            return {
                day: day,
                total_time: data.total
            };

            
            // for granular trend breakdown as shown in mockups 
        } else {
            // ❌ You don't need a map here because you're only looking for ONE category per day.
            // ✅ Instead of mapping through categories, just check if the category exists:
            if (data.categories[category]) {
                return {
                    day: day,
                    time: data.categories[category]  // get the time for that category
                };
            } else {
                // If the category doesn't exist for that day, maybe return 0 or null to show no data.
                return {
                    day: day,
                    time: 0
                };
            }
        }
    });

    return chartData;  // ✅ Don't forget to return the result
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
    


    
    