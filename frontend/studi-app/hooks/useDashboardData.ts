import { useEffect, useMemo, useState } from 'react';
import useAggregateData from '@/utils/fetchApi';
import { parseCategoryDurations, ParseStudyTrends, secondsToHours } from '@/utils/parseData';
import { DailyInsightsResponse, WeeklyInsightsResponse } from '@/types/api';

export function useDashboardData() {
    const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyInsightsResponse | null>(null);
    const [monthlyData, setMonthlyData] = useState<any | null>(null);

    // Fetch data for all dashboards
    const { data: dailyResponse, loading: dailyLoading } = useAggregateData('daily', '2025-01-23', undefined);
    const { data: weeklyResponse, loading: weeklyLoading } = useAggregateData('weekly', '2025-01-13', '2025-01-19');
    const { data: monthlyResponse, loading: monthlyLoading } = useAggregateData('monthly', '2025-01-01', '2025-01-31');

    // Update state when data comes in
    useEffect(() => {
        if (dailyResponse) setDailyData(dailyResponse);
    }, [dailyResponse]);

    useEffect(() => {
        if (weeklyResponse) setWeeklyData(weeklyResponse);
    }, [weeklyResponse]);

    useEffect(() => {
        if (monthlyResponse) setMonthlyData(monthlyResponse);
    }, [monthlyResponse]);

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

    const processedMonthlyData = useMemo(() => {
        if (!monthlyData) return null;
        
        return {
            totalHours: secondsToHours(monthlyData),
            categoryDurations: monthlyData.aggregate?.category_durations,
            categoryMetadata: monthlyData.category_metadata,
            rawData: monthlyData
        };
    }, [monthlyData]);

    return {
        daily: processedDailyData,
        weekly: processedWeeklyData,
        monthly: processedMonthlyData,
        loading: {
            daily: dailyLoading,
            weekly: weeklyLoading,
            monthly: monthlyLoading
        }
    };
} 