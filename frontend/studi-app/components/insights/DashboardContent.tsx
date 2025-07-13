import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming,
    Easing 
} from 'react-native-reanimated';
import DailyDashboard from '@/app/screens/Insights/DailyDashboard';
import WeeklyDashboard from '@/app/screens/Insights/WeeklyDashboard';
import MonthlyDashboard from '@/app/screens/Insights/MonthlyDashboard';
import { DashboardSkeleton } from './SkeletonLoader';

interface DashboardContentProps {
    selectedTab: string;
    dailyDate?: Date;
    weeklyDate?: Date;
    monthlyDate?: Date;
    daily: any;
    weekly: any;
    monthly: any;
    loading: { daily: boolean; weekly: boolean; monthly: boolean };
}

const { width: screenWidth } = Dimensions.get('window');
const DEBUG_DASHBOARD = false;

export default function DashboardContent({ 
    selectedTab, 
    dailyDate, 
    weeklyDate,
    monthlyDate,
    daily,
    weekly,
    monthly,
    loading
}: DashboardContentProps) {
    const renderCount = useRef(0);
    renderCount.current += 1;
    
    DEBUG_DASHBOARD && console.log(`🔄 DashboardContent: Render #${renderCount.current}`, {
        selectedTab,
        dailyDate: dailyDate?.toISOString().split('T')[0],
        weeklyDate: weeklyDate?.toISOString().split('T')[0],
        monthlyDate: monthlyDate?.toISOString().split('T')[0]
    });

    // Animation values
    const translateX = useSharedValue(0);
    
    // Update animation when tab changes
    useEffect(() => {
        DEBUG_DASHBOARD && console.log('🎬 DashboardContent: Tab animation triggered for:', selectedTab);
        const animationStart = performance.now();
        
        const targetPosition = selectedTab === 'daily' ? 0 : selectedTab === 'weekly' ? -screenWidth : -screenWidth * 2;
        translateX.value = withTiming(targetPosition, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
        
        DEBUG_DASHBOARD && console.log(`⏱️ DashboardContent: Animation setup took ${(performance.now() - animationStart).toFixed(2)}ms`);
    }, [selectedTab]);
    
    // Animated style for the container
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const renderDashboardContent = (type: 'daily' | 'weekly' | 'monthly') => {
        DEBUG_DASHBOARD && console.log(`🎯 DashboardContent: Rendering ${type} dashboard...`);
        const renderStart = performance.now();
        
        const isDaily = type === 'daily';
        const isWeekly = type === 'weekly';
        const isMonthly = type === 'monthly';
        const data = isDaily ? daily : isWeekly ? weekly : monthly;
        const isLoading = isDaily ? loading.daily : isWeekly ? loading.weekly : loading.monthly;

        DEBUG_DASHBOARD && console.log(`📊 DashboardContent: ${type} dashboard state:`, {
            isLoading,
            hasData: !!data,
            isEmpty: data?.isEmpty
        });

        // Show loading skeleton
        if (isLoading) {
            DEBUG_DASHBOARD && console.log(`⏱️ DashboardContent: ${type} skeleton render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return <DashboardSkeleton type={type} />;
        }

        // Show actual dashboard
        if (isDaily && daily) {
            const dashboardRender = (
                <DailyDashboard 
                    totalHours={daily.totalHours || '0.00'}
                    totalTime={daily.totalTime}
                    categoryDurations={daily.categoryDurations}
                    categoryMetadata={daily.categoryMetadata}
                    pieChartData={daily.pieChartData}
                    timelineData={daily.timelineData || []}
                    rawData={daily.rawData}
                    loading={false}
                    percentGoal={daily.percentGoal}
                    isEmpty={daily.isEmpty}
                />
            );
            DEBUG_DASHBOARD && console.log(`⏱️ DashboardContent: Daily dashboard render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return dashboardRender;
        } else if (isWeekly && weekly) {
            const dashboardRender = (
                <WeeklyDashboard 
                    totalHours={weekly.totalHours || '0.00'}
                    totalTime={weekly.totalTime}
                    categoryDurations={weekly.categoryDurations}
                    categoryMetadata={weekly.categoryMetadata}
                    pieChartData={weekly.pieChartData}
                    trendData={weekly.trendData}
                    sessionTimes={weekly.sessionTimes}
                    dailyBreakdown={weekly.dailyBreakdown}
                    rawData={weekly.rawData}
                    loading={false}
                    percentGoal={weekly.percentGoal}
                    isEmpty={weekly.isEmpty}
                />
            );
            DEBUG_DASHBOARD && console.log(`⏱️ DashboardContent: Weekly dashboard render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return dashboardRender;
        } else if (isMonthly && monthly) {
            const dashboardRender = (
                <MonthlyDashboard 
                    totalHours={monthly.totalHours || 0}
                    totalTime={monthly.totalTime}
                    categoryDurations={monthly.categoryDurations}
                    categoryMetadata={monthly.categoryMetadata}
                    pieChartData={monthly.pieChartData}
                    dailyBreakdown={monthly.dailyBreakdown}
                    heatmapData={monthly.heatmapData}
                    monthDate={monthlyDate || new Date()}
                    rawData={monthly.rawData}
                    loading={false}
                    percentGoal={monthly.percentGoal}
                    isEmpty={monthly.isEmpty}
                />
            );
            DEBUG_DASHBOARD && console.log(`⏱️ DashboardContent: Monthly dashboard render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return dashboardRender;
        }

        DEBUG_DASHBOARD && console.log(`⚠️ DashboardContent: ${type} dashboard returned null`);
        return null;
    };

    DEBUG_DASHBOARD && console.log(`🎯 DashboardContent: Component render complete (render #${renderCount.current})`);

    return (
        <View className="flex-1 overflow-hidden">
            <Animated.View 
                style={[animatedStyle, { 
                    flexDirection: 'row', 
                    width: screenWidth * 3,
                    flex: 1
                }]}
            >
                {/* Daily Dashboard */}
                <View style={{ width: screenWidth, flex: 1 }}>
                    {renderDashboardContent('daily')}
                </View>
                
                {/* Weekly Dashboard */}
                <View style={{ width: screenWidth, flex: 1 }}>
                    {renderDashboardContent('weekly')}
                </View>
                
                {/* Monthly Dashboard */}
                <View style={{ width: screenWidth, flex: 1 }}>
                    {renderDashboardContent('monthly')}
                </View>
            </Animated.View>
        </View>
    );
} 