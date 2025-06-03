import { useEffect, useMemo, useState } from 'react';
import useAggregateData from '@/utils/fetchApi';
import { parseCategoryDurations, ParseStudyTrends, secondsToHours } from '@/utils/parseData';
import { DailyInsightsResponse, WeeklyInsightsResponse } from '@/types/api';

export function useDashboardData() {
    const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyInsightsResponse | null>(null);

    // Fetch data for daily and weekly dashboards
    const { data: dailyResponse, loading: dailyLoading } = useAggregateData('daily', '2025-01-23', undefined);
    const { data: weeklyResponse, loading: weeklyLoading } = useAggregateData('weekly', '2025-01-13', '2025-01-19');

    // Update state when data comes in
    useEffect(() => {
        if (dailyResponse) setDailyData(dailyResponse);
    }, [dailyResponse]);

    useEffect(() => {
        if (weeklyResponse) setWeeklyData(weeklyResponse);
    }, [weeklyResponse]);

    // Process data for each dashboard
    const processedDailyData = useMemo(() => {
        if (!dailyData) return null;
        
        return {
            totalHours: secondsToHours(dailyData),
            categoryDurations: dailyData.aggregate.category_durations,
            categoryMetadata: dailyData.category_metadata,
            pieChartData: parseCategoryDurations(dailyData),
            timelineData: dailyData.timeline_data,
            rawData: dailyData
        };
    }, [dailyData]);

    const processedWeeklyData = useMemo(() => {
        if (!weeklyData) return null;
        
        return {
            totalHours: secondsToHours(weeklyData),
            categoryDurations: weeklyData.aggregate.category_durations,
            categoryMetadata: weeklyData.category_metadata,
            pieChartData: parseCategoryDurations(weeklyData),
            trendData: ParseStudyTrends(weeklyData.daily_breakdown, 'all'),
            sessionTimes: weeklyData.session_times,
            dailyBreakdown: weeklyData.daily_breakdown,
            rawData: weeklyData
        };
    }, [weeklyData]);

    return {
        daily: processedDailyData,
        weekly: processedWeeklyData,
        loading: {
            daily: dailyLoading,
            weekly: weeklyLoading
        }
    };
} 