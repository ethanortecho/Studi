import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import DashboardCard from '@/components/insights/DashboardContainer';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import Legend from '@/components/analytics/DashboardLegend';
import WeeklyBarChart from '@/components/analytics/WeeklyBarchart';
import SessionBarchart from '../SessionBarchart';
import { CategoryMetadata, TimelineSession } from '@/types/api';
import PagedCarousel from '@/components/navigation/PagedCarousel';


interface MultiChartContainerProps {
    // Required for all views
    timeframe: 'daily' | 'weekly';
    categoryMetadata: { [key: string]: CategoryMetadata };
    categoryDurations: { [key: string]: number };
    
    // Chart data
    pieChartData: Array<{ label: string; value: number; color: string }>;
    
    // Daily-specific data
    timelineData?: TimelineSession[];
    
    // Weekly-specific data  
    weeklyChartData?: { [date: string]: { total: number; categories: { [key: string]: number } } };
    
    // Optional customization
    defaultChart?: 'pie' | 'sessions' | 'bar';
    showTitle?: boolean;
    title?: string;

    /**
     * Explicit flag from parent indicating that the day/week has no data at all.
     * When provided it overrides internal checks so the parent can make the decision.
     */
    isEmpty?: boolean;

    /** Stats banner data */
    totalTime?: { hours: number; minutes: number };
    percentGoal?: number | null;
}

type ChartType = 'pie' | 'sessions' | 'bar';

interface ChartData {
    pie: Array<{ label: string; value: number; color: string }>;
    sessions: { timelineData?: TimelineSession[]; categoryMetadata: { [key: string]: CategoryMetadata } };
    bar: { [date: string]: { total: number; categories: { [key: string]: number } } } | undefined;
}

export default function MultiChartContainer({ 
    timelineData, 
    categoryMetadata, 
    categoryDurations, 
    timeframe, 
    pieChartData, 
    weeklyChartData,
    defaultChart = 'pie',
    showTitle = true,
    title = "Chart Analysis",
    isEmpty,
    totalTime,
    percentGoal
}: MultiChartContainerProps) {
    const [selectedChart, setSelectedChart] = useState<ChartType>(defaultChart);

    // ⬇️ Consistent sizing for pie to avoid clipping
    const PIE_SIZE = 165;          // diameter passed into CustomPieChart
    const PIE_PADDING = 20;        // extra space for stroke / rounding
    const chartContainerHeight = isEmpty
        ? 400
        : selectedChart === 'pie'
            ? PIE_SIZE + PIE_PADDING
            : 185;

    // 🚦 Single indicator: any non-zero duration means there is data
    const hasAnyData = Object.values(categoryDurations || {}).some((duration) => duration > 0);

    // ✅ Memoize chart availability and options – gated by hasAnyData to avoid zero-value noise
    const chartOptions = useMemo(() => {
        const hasPieData = hasAnyData && Array.isArray(pieChartData) && pieChartData.length > 0;

        const hasSessionData = hasAnyData && timeframe === 'daily' && Array.isArray(timelineData) && timelineData.length > 0;

        const hasWeeklyData = hasAnyData && timeframe === 'weekly' && weeklyChartData && Object.keys(weeklyChartData).length > 0;

        return {
            pie: {
                title: 'Subject Breakdown',
                available: hasPieData,
                label: 'Categories',
                show: true
            },
            sessions: {
                title: 'Session Breakdown',
                available: hasSessionData,
                label: 'Sessions',
                show: timeframe === 'daily'
            },
            bar: {
                title: 'Weekly Trends',
                available: hasWeeklyData,
                label: 'Weekly Trends',
                show: timeframe === 'weekly'
            }
        };
    }, [timeframe, pieChartData, timelineData, weeklyChartData, hasAnyData]);

    // ✅ Memoize chart data for each type
    const chartData = useMemo<ChartData>(() => ({
        pie: pieChartData,
        sessions: { timelineData, categoryMetadata },
        bar: weeklyChartData
    }), [pieChartData, timelineData, categoryMetadata, weeklyChartData]);

    // 🚦 Single indicator: if all category durations are zero, treat as empty day
    const noChartAvailable = typeof isEmpty === 'boolean' ? isEmpty : !hasAnyData;

    /* ------------------------------------------------------------------
       Chart Pages & Carousel Setup
    ------------------------------------------------------------------ */
    const chartPages = useMemo<ChartType[]>(() => {
        // Determine which chart types should actually render as pages – maintain order
        const pages: ChartType[] = [];
        if (chartOptions.pie.available) pages.push('pie');
        if (chartOptions.sessions.available && chartOptions.sessions.show) pages.push('sessions');
        if (chartOptions.bar.available && chartOptions.bar.show) pages.push('bar');
        return pages;
    }, [chartOptions]);

    // Keep selectedChart in sync with visible page
    const handlePageChange = (pageIdx: number) => {
        setSelectedChart(chartPages[pageIdx]);
    };

    // Width of one page equals card width (screen minus horizontal margins)
    const PAGE_WIDTH = Dimensions.get('window').width - 32; // parent adds mx-4 (≈16px each side)

    return (
        <DashboardCard className="bg-surface rounded-[35px] ">
            {/* Stats Banner */}
            {!noChartAvailable && totalTime && percentGoal != null && (
                <View className="flex-row justify-between px-6 pt-6">
                    {/* Total Time */}
                    <View>
                        <View className="flex-row items-baseline">
                            <Text className="text-primaryText text-2xl font-bold">{totalTime.hours}</Text>
                            <Text className="text-primaryText text-2xl font-semibold ml-1">h</Text>
                            <Text className="text-primaryText text-2xl font-bold ml-2">{totalTime.minutes}</Text>
                            <Text className="text-primaryText text-2xl font-semibold ml-1">m</Text>
                        </View>
                        <Text className="text-secondaryText text-md">Study Time</Text>
                    </View>

                    {/* Percent to Goal */}
                    <View className="items-end">
                        <Text className="text-primaryText text-2xl font-bold">{percentGoal}%</Text>
                        <Text className="text-secondaryText text-md">to goal</Text>
                    </View>
                </View>
            )}

            {showTitle && !noChartAvailable && (
                <View className="flex-row  items-center justify-center py-5">
                    <Text className="text-2xl font-bold text-primaryText mt-5 mb-5 ">{chartOptions[selectedChart].title}</Text>
                </View>
            )}
            
            {/* Chart Display – swipeable */}
            <View className="items-center justify-center" style={{ height: chartContainerHeight }}>
                {noChartAvailable ? (
                    <Text className="text-md text-secondaryText">
                        {`No data available for this ${timeframe === 'weekly' ? 'week' : 'day'}.`}
                    </Text>
                ) : (
                    <PagedCarousel
                        items={chartPages}
                        itemsPerPage={1}
                        keyExtractor={(type) => type}
                        pageWidth={PAGE_WIDTH}
                        onPageChange={handlePageChange}
                        renderItem={({ item }) => {
                            switch (item) {
                                case 'pie':
                                    return (
                                        <View className="items-center justify-center" style={{ width: PAGE_WIDTH }}>
                                            <CustomPieChart data={chartData.pie} size={PIE_SIZE} />
                                        </View>
                                    );
                                case 'sessions':
                                    return (
                                        <View className="px-2 h-full justify-center" style={{ width: PAGE_WIDTH }}>
                                            <SessionBarchart 
                                                timelineData={chartData.sessions.timelineData!} 
                                                categoryMetadata={chartData.sessions.categoryMetadata} 
                                                width={320}
                                            />
                                        </View>
                                    );
                                case 'bar':
                                    return (
                                        <View className="flex-row items-end justify-center h-full" style={{ width: PAGE_WIDTH }}>
                                            <WeeklyBarChart 
                                                data={chartData.bar!}
                                                categoryMetadata={categoryMetadata} 
                                            />
                                        </View>
                                    );
                                default:
                                    return null;
                            }
                        }}
                    />
                )}
            </View>
            
            {/* Legend */}
            {!noChartAvailable && (
                <View className="flex-row items-center justify-center pt-10 px-4">
                    <Legend 
                        category_durations={categoryDurations} 
                        category_metadata={categoryMetadata} 
                    />
                </View>
            )}

            {/* Dot Indicator */}
            {!noChartAvailable && chartPages.length > 1 && (
                <View className="flex-row items-center justify-center py-5 gap-2 mb-4">
                    {chartPages.map((_, idx) => (
                        <View
                            key={idx}
                            className={`w-2 h-2 rounded-full mx-1 ${idx === chartPages.indexOf(selectedChart) ? 'bg-primaryText' : 'bg-secondaryText'}`}
                        />
                    ))}
                </View>
            )}
        </DashboardCard>
    );
}