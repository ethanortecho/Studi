export function parseCategoryDurations(apiData:any) {
    const categoryDurations = apiData?.aggregate?.category_durations || {};

    const chartData = Object.entries(categoryDurations).map(([label,value]) => ({
        label: label as string,
        value: Number(value),
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
