import { useEffect, useMemo, useState } from 'react';
import useAggregateData from '../utils/fetchApi';
import { parseCategoryDurations, ParseStudyTrends, secondsToHours, secondsToHoursAndMinutes, filterBreakCategory, filterBreakFromDailyBreakdown } from '../utils/parseData';
import { DailyInsightsResponse, WeeklyInsightsResponse, MonthlyInsightsResponse } from '../types/api';
import { formatDateForAPI, getWeekEnd, getWeekStart, navigateDate, getWeekDays, getMonthStart, getMonthEnd } from '../utils/dateUtils';
import { useGoalForWeek } from './useGoalForWeek';
import { useApiWithToast } from './useApiWithToast';

interface UseDashboardDataParams {
    dailyDate?: Date;
    weeklyDate?: Date;
    monthlyDate?: Date;
}

// Toggle for verbose dashboard logging
const DEBUG_DASHBOARD = false;

export function useDashboardData({ dailyDate, weeklyDate, monthlyDate }: UseDashboardDataParams = {}) {
    DEBUG_DASHBOARD && console.log('🔄 useDashboardData: Hook called with dates:', { 
        dailyDate: dailyDate?.toISOString().split('T')[0], 
        weeklyDate: weeklyDate?.toISOString().split('T')[0],
        monthlyDate: monthlyDate?.toISOString().split('T')[0] 
    });
    
    const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyInsightsResponse | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyInsightsResponse | null>(null);

    // Format dates for API
    const dailyDateStr = dailyDate ? formatDateForAPI(dailyDate) : formatDateForAPI(new Date());
    const currentWeekStart = weeklyDate || getWeekStart(new Date());
    const weeklyStartStr = formatDateForAPI(currentWeekStart);
    const weeklyEndStr = formatDateForAPI(getWeekEnd(currentWeekStart));
    
    // Monthly date formatting
    const currentMonthStart = monthlyDate || getMonthStart(new Date());
    const monthlyStartStr = formatDateForAPI(currentMonthStart);
    const monthlyEndStr = formatDateForAPI(getMonthEnd(currentMonthStart));

    // Fetch study goal for the visible week
    const { goal: weeklyGoal, loading: _goalLoading } = useGoalForWeek(currentWeekStart);

    DEBUG_DASHBOARD && console.log('📅 useDashboardData: Formatted dates:', { dailyDateStr, weeklyStartStr, weeklyEndStr, monthlyStartStr, monthlyEndStr });

    // Fetch data for daily, weekly, and monthly dashboards
    const { data: dailyResponse, loading: dailyLoading, error: dailyError } = useAggregateData('daily', dailyDateStr, undefined);
    const { data: weeklyResponse, loading: weeklyLoading, error: weeklyError } = useAggregateData('weekly', weeklyStartStr, weeklyEndStr);
    const { data: monthlyResponse, loading: monthlyLoading, error: monthlyError } = useAggregateData('monthly', monthlyStartStr, monthlyEndStr);
    
    // Show toast notifications for errors
    useApiWithToast(dailyError, dailyLoading);
    useApiWithToast(weeklyError, weeklyLoading);
    useApiWithToast(monthlyError, monthlyLoading);

    // Prefetch adjacent dates for smoother navigation
    const currentDaily = dailyDate || new Date();
    const currentWeekly = weeklyDate || getWeekStart(new Date());
    
    const prevDay = navigateDate(currentDaily, 'prev', 'daily');
    const nextDay = navigateDate(currentDaily, 'next', 'daily');
    const prevWeek = navigateDate(currentWeekly, 'prev', 'weekly');
    const nextWeek = navigateDate(currentWeekly, 'next', 'weekly');

    // Prefetch only prev/next days for daily navigation efficiency
    const prevDayStr = formatDateForAPI(prevDay);
    const nextDayStr = formatDateForAPI(nextDay);
    
    DEBUG_DASHBOARD && console.log('🚀 useDashboardData: Prefetching prev/next days:', { prevDayStr, nextDayStr });

    // 🔄 Prefetch adjacent daily data (prev/next only)
    const { data: prevDayData, loading: prevDayLoading } = useAggregateData('daily', prevDayStr, undefined);
    const { data: nextDayData, loading: nextDayLoading } = useAggregateData('daily', nextDayStr, undefined);

    // Create simplified weekDaily for compatibility (only contains current/prev/next days)
    const weekDaily = useMemo(() => {
        const dataMap: { [iso: string]: DailyInsightsResponse | null } = {};
        const loadingMap: { [iso: string]: boolean } = {};
        const hasDataMap: { [iso: string]: boolean } = {};

        // Include current day data
        dataMap[dailyDateStr] = dailyResponse || null;
        loadingMap[dailyDateStr] = dailyLoading;
        if (dailyResponse && dailyResponse.aggregate) {
            const total = parseInt(dailyResponse.aggregate.total_duration) || 0;
            hasDataMap[dailyDateStr] = total > 0;
        }

        // Include prev day data
        dataMap[prevDayStr] = prevDayData || null;
        loadingMap[prevDayStr] = prevDayLoading;
        if (prevDayData && prevDayData.aggregate) {
            const total = parseInt(prevDayData.aggregate.total_duration) || 0;
            hasDataMap[prevDayStr] = total > 0;
        }

        // Include next day data
        dataMap[nextDayStr] = nextDayData || null;
        loadingMap[nextDayStr] = nextDayLoading;
        if (nextDayData && nextDayData.aggregate) {
            const total = parseInt(nextDayData.aggregate.total_duration) || 0;
            hasDataMap[nextDayStr] = total > 0;
        }

        return { data: dataMap, loading: loadingMap, hasData: hasDataMap };
    }, [dailyResponse, dailyLoading, prevDayData, prevDayLoading, nextDayData, nextDayLoading, dailyDateStr, prevDayStr, nextDayStr]);

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

    useEffect(() => {
        if (monthlyResponse) {
            DEBUG_DASHBOARD && console.log('📈 useDashboardData: Monthly response received, updating state');
            setMonthlyData(monthlyResponse);
        }
    }, [monthlyResponse]);

    // Check if data is empty
    const isDailyEmpty = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🔍 useDashboardData: Calculating isDailyEmpty...');
        const start = performance.now();
        
        if (!dailyData || dailyLoading) return false;
        const totalDuration = parseInt(dailyData.aggregate?.total_duration) || 0;
        const sessionCount = dailyData.aggregate?.session_count || 0;
        const isEmpty = totalDuration === 0 && sessionCount === 0;
        
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

    const isMonthlyEmpty = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🔍 useDashboardData: Calculating isMonthlyEmpty...');
        const start = performance.now();
        
        if (!monthlyData || monthlyLoading) return false;
        const totalDuration = parseInt(monthlyData.monthly_aggregate?.total_duration) || 0;
        const sessionCount = monthlyData.monthly_aggregate?.session_count || 0;
        const isEmpty = totalDuration === 0 && sessionCount === 0;
        
        const end = performance.now();
        DEBUG_DASHBOARD && console.log(`⏱️ useDashboardData: isMonthlyEmpty calculated in ${(end - start).toFixed(2)}ms, result: ${isEmpty}`);
        return isEmpty;
    }, [monthlyData, monthlyLoading]);

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
            percentGoal,
            productivityScore: dailyData.aggregate?.productivity_score ?? null,
            allTimeAvgProductivity: dailyData.all_time_avg_productivity ?? null,
            flowScore: dailyData.aggregate?.flow_score ?? null,
            flowScoreDetails: dailyData.aggregate?.flow_score_details ?? null
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

    // Process monthly data
    const processedMonthlyData = useMemo(() => {
        DEBUG_DASHBOARD && console.log('🏭 useDashboardData: Processing monthly data...');
        const start = performance.now();
        
        if (!monthlyData) return null;
        
        // Handle null monthly_aggregate
        const aggregate = monthlyData.monthly_aggregate;
        if (!aggregate) {
            return {
                totalHours: 0,
                totalTime: { hours: 0, minutes: 0 },
                categoryDurations: {},
                categoryMetadata: monthlyData.category_metadata || {},
                pieChartData: [],
                dailyBreakdown: monthlyData.daily_breakdown || [],
                heatmapData: monthlyData.heatmap_data || {},
                rawData: monthlyData,
                isEmpty: true,
                percentGoal: null
            };
        }
        
        const totalHoursStart = performance.now();
        const totalHours = parseInt(aggregate.total_duration) / 3600;
        DEBUG_DASHBOARD && console.log(`⏱️ monthly totalHours took ${(performance.now() - totalHoursStart).toFixed(2)}ms`);
        
        const totalTimeStart = performance.now();
        const totalSeconds = parseInt(aggregate.total_duration);
        const totalTime = {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60)
        };
        DEBUG_DASHBOARD && console.log(`⏱️ monthly totalTime took ${(performance.now() - totalTimeStart).toFixed(2)}ms`);
        
        const categoryDurationsStart = performance.now();
        const categoryDurations = filterBreakCategory(aggregate.category_durations);
        DEBUG_DASHBOARD && console.log(`⏱️ monthly filterBreakCategory took ${(performance.now() - categoryDurationsStart).toFixed(2)}ms`);
        
        const pieChartStart = performance.now();
        // Create pie chart data from category durations
        const pieChartData = Object.entries(categoryDurations).map(([categoryName, duration]) => {
            const categoryMetadata = Object.values(monthlyData.category_metadata || {}).find(meta => meta.name === categoryName);
            return {
                label: categoryName,
                value: duration,
                color: categoryMetadata?.color || '#CCCCCC'
            };
        });
        DEBUG_DASHBOARD && console.log(`⏱️ monthly pieChartData took ${(performance.now() - pieChartStart).toFixed(2)}ms`);
        
        const result = {
            totalHours,
            totalTime,
            categoryDurations,
            categoryMetadata: monthlyData.category_metadata || {},
            pieChartData,
            dailyBreakdown: monthlyData.daily_breakdown || [],
            heatmapData: monthlyData.heatmap_data || {},
            rawData: monthlyData,
            isEmpty: isMonthlyEmpty,
            percentGoal: null // Monthly goals not implemented yet
        };
        
        const end = performance.now();
        DEBUG_DASHBOARD && console.log(`🏭 useDashboardData: Monthly data processed in ${(end - start).toFixed(2)}ms`);
        return result;
    }, [monthlyData, isMonthlyEmpty]);

    DEBUG_DASHBOARD && console.log('📊 useDashboardData: Returning processed data, loading states:', { 
        dailyLoading, 
        weeklyLoading,
        monthlyLoading,
        hasDaily: !!processedDailyData,
        hasWeekly: !!processedWeeklyData,
        hasMonthly: !!processedMonthlyData
    });

    const anyWeekDailyLoading = Object.values(weekDaily.loading).some(Boolean);

    return {
        daily: processedDailyData,
        weekly: processedWeeklyData,
        monthly: processedMonthlyData,
        loading: {
            daily: dailyLoading, // Remove anyWeekDailyLoading to fix skeleton display
            weekly: weeklyLoading,
            monthly: monthlyLoading
        },
        weekDaily
    };
} 