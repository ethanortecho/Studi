import { useEffect, useMemo, useState } from 'react';
import useAggregateData from '@/utils/fetchApi';
import { parseCategoryDurations, ParseStudyTrends, secondsToHours, secondsToHoursAndMinutes, filterBreakCategory, filterBreakFromDailyBreakdown } from '@/utils/parseData';
import { DailyInsightsResponse, WeeklyInsightsResponse } from '@/types/api';
import { formatDateForAPI, getWeekEnd, getWeekStart, navigateDate, getWeekDays } from '@/utils/dateUtils';
import { useGoalForWeek } from '@/hooks/useGoalForWeek';

interface UseDashboardDataParams {
    dailyDate?: Date;
    weeklyDate?: Date;
}

// Toggle for verbose dashboard logging
const DEBUG_DASHBOARD = false;

export function useDashboardData({ dailyDate, weeklyDate }: UseDashboardDataParams = {}) {
    DEBUG_DASHBOARD && console.log('🔄 useDashboardData: Hook called with dates:', { 
        dailyDate: dailyDate?.toISOString().split('T')[0], 
        weeklyDate: weeklyDate?.toISOString().split('T')[0] 
    });
    
    const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyInsightsResponse | null>(null);

    // Format dates for API
    const dailyDateStr = dailyDate ? formatDateForAPI(dailyDate) : formatDateForAPI(new Date());
    const currentWeekStart = weeklyDate || getWeekStart(new Date());
    // ISO strings for the 7 days in the currently visible week (Sun→Sat)
    const weekDates = useMemo(() => {
        return getWeekDays(currentWeekStart).map(d => formatDateForAPI(d));
    }, [currentWeekStart]);

    const weeklyStartStr = formatDateForAPI(currentWeekStart);
    const weeklyEndStr = formatDateForAPI(getWeekEnd(currentWeekStart));

    // Fetch study goal for the visible week
    const { goal: weeklyGoal, loading: _goalLoading } = useGoalForWeek(currentWeekStart);

    DEBUG_DASHBOARD && console.log('📅 useDashboardData: Formatted dates:', { dailyDateStr, weeklyStartStr, weeklyEndStr });

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

    DEBUG_DASHBOARD && console.log('🚀 useDashboardData: Prefetching adjacent dates...');
    useAggregateData('daily', formatDateForAPI(prevDay), undefined);
    useAggregateData('daily', formatDateForAPI(nextDay), undefined);
    useAggregateData('weekly', formatDateForAPI(getWeekStart(prevWeek)), formatDateForAPI(getWeekEnd(prevWeek)));
    useAggregateData('weekly', formatDateForAPI(getWeekStart(nextWeek)), formatDateForAPI(getWeekEnd(nextWeek)));

    // 🔄 Fetch all 7 daily responses for the current week (prefetch)
    const weekDailyResults = weekDates.map(dateStr => {
        const { data, loading } = useAggregateData('daily', dateStr, undefined);
        return { dateStr, data, loading };
    });

    // Derive maps for UI (no state updates — avoids render loop)
    const weekDaily = useMemo(() => {
        const dataMap: { [iso: string]: DailyInsightsResponse | null } = {};
        const loadingMap: { [iso: string]: boolean } = {};
        const hasDataMap: { [iso: string]: boolean } = {};

        weekDailyResults.forEach(({ dateStr, data, loading }) => {
            dataMap[dateStr] = data || null;
            loadingMap[dateStr] = loading;
            if (data && data.aggregate) {
                const total = parseInt(data.aggregate.total_duration) || 0;
                hasDataMap[dateStr] = total > 0;
            }
        });

        return { data: dataMap, loading: loadingMap, hasData: hasDataMap };
    }, [weekDailyResults]);

    // Update state when data comes in
    useEffect(() => {
        if (dailyResponse) {
            DEBUG_DASHBOARD && console.log('📈 useDashboardData: Daily response received, updating state');
            setDailyData(dailyResponse);
        }
    }, [dailyResponse]);

    useEffect(() => {
        if (weeklyResponse) {
            DEBUG_DASHBOARD && console.log('📈 useDashboardData: Weekly response received, updating state');
            setWeeklyData(weeklyResponse);
        }
    }, [weeklyResponse]);

    // Check if data is empty
    const isDailyEmpty = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🔍 useDashboardData: Calculating isDailyEmpty...');
        const start = performance.now();
        
        if (!dailyData || dailyLoading) return false;
        const totalDuration = parseInt(dailyData.aggregate?.total_duration) || 0;
        const sessionCount = dailyData.aggregate?.session_count || 0;
        const isEmpty = totalDuration < 60 || (totalDuration === 0 && sessionCount === 0);
        
        const end = performance.now();
        DEBUG_DASHBOARD && console.log(`⏱️ useDashboardData: isDailyEmpty calculated in ${(end - start).toFixed(2)}ms, result: ${isEmpty}`);
        return isEmpty;
    }, [dailyData, dailyLoading]);

    const isWeeklyEmpty = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🔍 useDashboardData: Calculating isWeeklyEmpty...');
        const start = performance.now();
        
        if (!weeklyData || weeklyLoading) return false;
        const totalDuration = parseInt(weeklyData.aggregate?.total_duration) || 0;
        const sessionCount = weeklyData.aggregate?.session_count || 0;
        const isEmpty = totalDuration === 0 && sessionCount === 0;
        
        const end = performance.now();
        DEBUG_DASHBOARD && console.log(`⏱️ useDashboardData: isWeeklyEmpty calculated in ${(end - start).toFixed(2)}ms, result: ${isEmpty}`);
        return isEmpty;
    }, [weeklyData, weeklyLoading]);

    // Process data for each dashboard
    const processedDailyData = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🏭 useDashboardData: Processing daily data...');
        const start = performance.now();
        
        if (!dailyData) return null;
        
        const totalHoursStart = performance.now();
        const totalHours = secondsToHours(dailyData);
        DEBUG_DASHBOARD && console.log(`⏱️ secondsToHours took ${(performance.now() - totalHoursStart).toFixed(2)}ms`);
        
        const totalTimeStart = performance.now();
        const totalTime = secondsToHoursAndMinutes(dailyData);
        DEBUG_DASHBOARD && console.log(`⏱️ secondsToHoursAndMinutes took ${(performance.now() - totalTimeStart).toFixed(2)}ms`);
        
        const categoryDurationsStart = performance.now();
        const categoryDurations = filterBreakCategory(dailyData.aggregate.category_durations);
        DEBUG_DASHBOARD && console.log(`⏱️ filterBreakCategory took ${(performance.now() - categoryDurationsStart).toFixed(2)}ms`);
        
        const pieChartStart = performance.now();
        const pieChartData = parseCategoryDurations(dailyData);
        DEBUG_DASHBOARD && console.log(`⏱️ parseCategoryDurations took ${(performance.now() - pieChartStart).toFixed(2)}ms`);
        
        // 📊 Goal percentage calculation (daily)
        let goalMinutes: number | null = null;
        let percentGoal: number | null = null;
        if (weeklyGoal) {
            // Try find explicit DailyGoal entry first
            const dayGoal = weeklyGoal.daily_goals?.find(g => g.date === dailyDateStr);
            if (dayGoal) {
                goalMinutes = dayGoal.target_minutes;
            } else {
                // fallback: even split across active weekdays or 7
                const activeDays = weeklyGoal.active_weekdays?.length || 7;
                goalMinutes = Math.round(weeklyGoal.total_minutes / activeDays);
            }

            const studiedMinutes = parseInt(dailyData.aggregate.total_duration) / 60;
            if (goalMinutes > 0) {
                percentGoal = Math.min(100, Math.round((studiedMinutes / goalMinutes) * 100));
            }
        }
        
        const result = {
            totalHours,
            totalTime,
            categoryDurations,
            categoryMetadata: dailyData.category_metadata,
            pieChartData,
            timelineData: dailyData.timeline_data,
            rawData: dailyData,
            isEmpty: isDailyEmpty,
            goal: weeklyGoal,
            goalMinutes,
            percentGoal
        };
        
        const end = performance.now();
        DEBUG_DASHBOARD && console.log(`🏭 useDashboardData: Daily data processed in ${(end - start).toFixed(2)}ms`);
        return result;
    }, [dailyData, isDailyEmpty, weeklyGoal]);

    const processedWeeklyData = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🏭 useDashboardData: Processing weekly data...');
        const start = performance.now();
        
        if (!weeklyData) return null;
        
        const totalHoursStart = performance.now();
        const totalHours = secondsToHours(weeklyData);
        DEBUG_DASHBOARD && console.log(`⏱️ secondsToHours took ${(performance.now() - totalHoursStart).toFixed(2)}ms`);
        
        const totalTimeStart = performance.now();
        const totalTime = secondsToHoursAndMinutes(weeklyData);
        DEBUG_DASHBOARD && console.log(`⏱️ secondsToHoursAndMinutes took ${(performance.now() - totalTimeStart).toFixed(2)}ms`);
        
        const categoryDurationsStart = performance.now();
        const categoryDurations = filterBreakCategory(weeklyData.aggregate.category_durations);
        DEBUG_DASHBOARD && console.log(`⏱️ filterBreakCategory took ${(performance.now() - categoryDurationsStart).toFixed(2)}ms`);
        
        const pieChartStart = performance.now();
        const pieChartData = parseCategoryDurations(weeklyData);
        DEBUG_DASHBOARD && console.log(`⏱️ parseCategoryDurations took ${(performance.now() - pieChartStart).toFixed(2)}ms`);
        
        const trendDataStart = performance.now();
        const trendData = ParseStudyTrends(weeklyData.daily_breakdown, 'all');
        DEBUG_DASHBOARD && console.log(`⏱️ ParseStudyTrends took ${(performance.now() - trendDataStart).toFixed(2)}ms`);
        
        const dailyBreakdownStart = performance.now();
        const dailyBreakdown = filterBreakFromDailyBreakdown(weeklyData.daily_breakdown);
        DEBUG_DASHBOARD && console.log(`⏱️ filterBreakFromDailyBreakdown took ${(performance.now() - dailyBreakdownStart).toFixed(2)}ms`);
        
        // 📊 Goal percentage calculation (weekly)
        let weekGoalMinutes: number | null = null;
        let weekPercentGoal: number | null = null;
        if (weeklyGoal) {
            weekGoalMinutes = weeklyGoal.total_minutes;
            const studiedMinutes = parseInt(weeklyData.aggregate.total_duration) / 60;
            if (weekGoalMinutes > 0) {
                weekPercentGoal = Math.min(100, Math.round((studiedMinutes / weekGoalMinutes) * 100));
            }
        }
        
        const result = {
            totalHours,
            totalTime,
            categoryDurations,
            categoryMetadata: weeklyData.category_metadata,
            pieChartData,
            trendData,
            sessionTimes: weeklyData.session_times,
            dailyBreakdown,
            rawData: weeklyData,
            isEmpty: isWeeklyEmpty,
            goal: weeklyGoal,
            goalMinutes: weekGoalMinutes,
            percentGoal: weekPercentGoal
        };
        
        const end = performance.now();
        DEBUG_DASHBOARD && console.log(`🏭 useDashboardData: Weekly data processed in ${(end - start).toFixed(2)}ms`);
        return result;
    }, [weeklyData, isWeeklyEmpty, weeklyGoal]);

    DEBUG_DASHBOARD && console.log('📊 useDashboardData: Returning processed data, loading states:', { 
        dailyLoading, 
        weeklyLoading,
        hasDaily: !!processedDailyData,
        hasWeekly: !!processedWeeklyData
    });

    const anyWeekDailyLoading = Object.values(weekDaily.loading).some(Boolean);

    return {
        daily: processedDailyData,
        weekly: processedWeeklyData,
        loading: {
            daily: dailyLoading || anyWeekDailyLoading,
            weekly: weeklyLoading
        },
        weekDaily
    };
} 