import { useEffect, useMemo, useState } from 'react';
import useAggregateData from '@/utils/fetchApi';
import { parseCategoryDurations, ParseStudyTrends, secondsToHours, secondsToHoursAndMinutes } from '@/utils/parseData';
import { DailyInsightsResponse, WeeklyInsightsResponse } from '@/types/api';
import { formatDateForAPI, getWeekEnd, getWeekStart, navigateDate } from '@/utils/dateUtils';

interface UseDashboardDataParams {
    dailyDate?: Date;
    weeklyDate?: Date;
}

export function useDashboardData({ dailyDate, weeklyDate }: UseDashboardDataParams = {}) {
    const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyInsightsResponse | null>(null);

    // Format dates for API
    const dailyDateStr = dailyDate ? formatDateForAPI(dailyDate) : formatDateForAPI(new Date());
    const currentWeekStart = weeklyDate || getWeekStart(new Date());
    const weeklyStartStr = formatDateForAPI(currentWeekStart);
    const weeklyEndStr = formatDateForAPI(getWeekEnd(currentWeekStart));

    // Fetch data for daily and weekly dashboards
    const { data: dailyResponse, loading: dailyLoading } = useAggregateData('daily', dailyDateStr, undefined);
    const { data: weeklyResponse, loading: weeklyLoading } = useAggregateData('weekly', weeklyStartStr, weeklyEndStr);

    // Prefetch adjacent dates for faster navigation
    const currentDaily = dailyDate || new Date();
    const currentWeekly = weeklyDate || getWeekStart(new Date());
    
    // Prefetch previous/next day (but don't use the results - just for caching)
    const prevDay = navigateDate(currentDaily, 'prev', 'daily');
    const nextDay = navigateDate(currentDaily, 'next', 'daily');
    const prevWeek = navigateDate(currentWeekly, 'prev', 'weekly');
    const nextWeek = navigateDate(currentWeekly, 'next', 'weekly');

    useAggregateData('daily', formatDateForAPI(prevDay), undefined);
    useAggregateData('daily', formatDateForAPI(nextDay), undefined);
    useAggregateData('weekly', formatDateForAPI(getWeekStart(prevWeek)), formatDateForAPI(getWeekEnd(prevWeek)));
    useAggregateData('weekly', formatDateForAPI(getWeekStart(nextWeek)), formatDateForAPI(getWeekEnd(nextWeek)));

    // Update state when data comes in
    useEffect(() => {
        if (dailyResponse) setDailyData(dailyResponse);
    }, [dailyResponse]);

    useEffect(() => {
        if (weeklyResponse) setWeeklyData(weeklyResponse);
    }, [weeklyResponse]);

    // Check if data is empty
    const isDailyEmpty = useMemo(() => {
        if (!dailyData || dailyLoading) return false;
        const totalDuration = parseInt(dailyData.aggregate?.total_duration) || 0;
        const sessionCount = dailyData.aggregate?.session_count || 0;
        // Period is empty only if both duration AND session count are 0
        return totalDuration === 0 && sessionCount === 0;
    }, [dailyData, dailyLoading]);

    const isWeeklyEmpty = useMemo(() => {
        if (!weeklyData || weeklyLoading) return false;
        const totalDuration = parseInt(weeklyData.aggregate?.total_duration) || 0;
        const sessionCount = weeklyData.aggregate?.session_count || 0;
        // Period is empty only if both duration AND session count are 0
        return totalDuration === 0 && sessionCount === 0;
    }, [weeklyData, weeklyLoading]);

    // Process data for each dashboard
    const processedDailyData = useMemo(() => {
        if (!dailyData) return null;
        
        return {
            totalHours: secondsToHours(dailyData),
            totalTime: secondsToHoursAndMinutes(dailyData),
            categoryDurations: dailyData.aggregate.category_durations,
            categoryMetadata: dailyData.category_metadata,
            pieChartData: parseCategoryDurations(dailyData),
            timelineData: dailyData.timeline_data,
            rawData: dailyData,
            isEmpty: isDailyEmpty
        };
    }, [dailyData, isDailyEmpty]);

    const processedWeeklyData = useMemo(() => {
        if (!weeklyData) return null;
        
        return {
            totalHours: secondsToHours(weeklyData),
            totalTime: secondsToHoursAndMinutes(weeklyData),
            categoryDurations: weeklyData.aggregate.category_durations,
            categoryMetadata: weeklyData.category_metadata,
            pieChartData: parseCategoryDurations(weeklyData),
            trendData: ParseStudyTrends(weeklyData.daily_breakdown, 'all'),
            sessionTimes: weeklyData.session_times,
            dailyBreakdown: weeklyData.daily_breakdown,
            rawData: weeklyData,
            isEmpty: isWeeklyEmpty
        };
    }, [weeklyData, isWeeklyEmpty]);

    return {
        daily: processedDailyData,
        weekly: processedWeeklyData,
        loading: {
            daily: dailyLoading,
            weekly: weeklyLoading
        }
    };
} 