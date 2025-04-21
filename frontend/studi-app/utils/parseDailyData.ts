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
