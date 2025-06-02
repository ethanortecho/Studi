export function formatStudyTime(apiData:any){
    const seconds = apiData?.aggregate?.total_duration;
    const totalHours = seconds / 3600;
    
    // Round to 1 decimal place
    return totalHours.toFixed(2);
}

