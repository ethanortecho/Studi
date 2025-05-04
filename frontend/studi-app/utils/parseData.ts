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


export function ParseStudyTrends(trend_data, category) {

    let chartData = Object.entries(trend_data).map(([day, data]) => {

        if (category === 'all') {
            // ✅ This part is already good
            return {
                day: day,
                total_time: data.total
            };

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
    


    
    