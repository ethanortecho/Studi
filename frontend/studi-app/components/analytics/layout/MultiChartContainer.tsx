import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import DashboardCard from '@/components/insights/DashboardContainer';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import Legend from '@/components/analytics/DashboardLegend';
import WeeklyBarChart from '@/components/analytics/WeeklyBarchart';
import SessionBarchart from '../SessionBarchart';
import { CategoryMetadata, TimelineSession } from '@/types/api';


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
    title = "Chart Analysis"
}: MultiChartContainerProps) {
    const [selectedChart, setSelectedChart] = useState<ChartType>(defaultChart);

    // ✅ Memoize chart availability and options
    const chartOptions = useMemo(() => {
        const hasPieData = pieChartData && pieChartData.length > 0;
        const hasSessionData = timeframe === 'daily' && timelineData && categoryMetadata;
        const hasWeeklyData = timeframe === 'weekly' && weeklyChartData && Object.keys(weeklyChartData).length > 0;
        
        return {
            pie: { 
                title: 'Subject Breakdown',
                available: hasPieData, 
                label: 'Categories',
                show: true // Always show pie chart option
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
    }, [timeframe, pieChartData, timelineData, categoryMetadata, weeklyChartData]);

    // ✅ Memoize chart data for each type
    const chartData = useMemo<ChartData>(() => ({
        pie: pieChartData,
        sessions: { timelineData, categoryMetadata },
        bar: weeklyChartData
    }), [pieChartData, timelineData, categoryMetadata, weeklyChartData]);

   

    return (
        <DashboardCard>
            {showTitle && (
                <View className="flex-row items-center justify-center py-5">
                    <Text className="text-xl font-bold text-gray-500 mb-3 ">{chartOptions[selectedChart].title}</Text>
                </View>
            )}
            
            {/* Chart Display */}
            <View className="mb-4" style={{ height: 225 }}>
                {selectedChart === 'pie' && chartOptions.pie.available && (
                    <View className="flex-row items-center justify-center h-full">
                        <CustomPieChart data={chartData.pie} />
                    </View>
                )}
                {selectedChart === 'sessions' && chartOptions.sessions.available && chartData.sessions.timelineData && chartData.sessions.categoryMetadata && (
                    <View className="px-2 h-full justify-center">
                        <SessionBarchart 
                            timelineData={chartData.sessions.timelineData} 
                            categoryMetadata={chartData.sessions.categoryMetadata} 
                            width={320}
                        />
                    </View>
                )}
                {selectedChart === 'bar' && chartOptions.bar.available && chartData.bar && (
                    <View className="flex-row items-end justify-center h-full px- pt-2">
                        <WeeklyBarChart data={chartData.bar}
                        categoryMetadata={categoryMetadata} />
                    </View>
                )}
            </View>
            
            {/* Chart Toggle Buttons */}
            
            
            {/* Legend */}
            <View className="flex-row items-center justify-center py-10 px-4">
                <Legend 
                    category_durations={categoryDurations} 
                    category_metadata={categoryMetadata} 
                />
            </View>
            <View className="flex-row items-center justify-center gap-2 mb-4">
                {/* Pie Chart Button */}
                <Pressable 
                    onPress={() => setSelectedChart('pie')}
                    className={`rounded-lg p-3 ${
                        selectedChart === 'pie' 
                            ? 'bg-primary' 
                            : 'bg-white border border-gray-300'
                    }`}
                >
                    <Text className={`text-sm font-bold ${
                        selectedChart === 'pie' 
                            ? 'text-white' 
                            : 'text-gray-500'
                    }`}>
                        {chartOptions.pie.label}
                    </Text>
                </Pressable>
                
                {/* Sessions Button (Daily only) */}
                {chartOptions.sessions.show && (
                    <Pressable 
                        onPress={() => setSelectedChart('sessions')}
                        disabled={!chartOptions.sessions.available}
                        className={`rounded-lg p-3 ${
                            selectedChart === 'sessions' 
                                ? 'bg-primary' 
                                : 'bg-white border border-gray-300'
                        }`}
                    >
                        <Text className={`text-sm font-bold ${
                            selectedChart === 'sessions' 
                                ? 'text-white' 
                                : 'text-gray-500'
                        }`}>
                            {chartOptions.sessions.label}
                        </Text>
                    </Pressable>
                )}
                
                {/* Weekly Bar Button (Weekly only) */} 
                {chartOptions.bar.show && (
                    <Pressable 
                        onPress={() => setSelectedChart('bar')}
                        disabled={!chartOptions.bar.available}
                        className={`rounded-lg p-3 ${
                            selectedChart === 'bar' 
                                ? 'bg-primary' 
                                : 'bg-white border border-gray-300'
                        }`}
                    >
                        <Text className={`text-sm font-bold ${
                            selectedChart === 'bar' 
                                ? 'text-white' 
                                : 'text-gray-500'
                        }`}>
                            {chartOptions.bar.label}
                        </Text>
                    </Pressable>
                )}
            </View>
        </DashboardCard>
    );
}