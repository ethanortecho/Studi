import { formatDuration } from '../../../utils/timeFormatting';

export function formatStudyTime(apiData:any){
    const seconds = apiData?.aggregate?.total_duration || 0;
    return formatDuration(seconds);
}

