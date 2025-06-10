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
import { DashboardSkeleton, EmptyState } from './SkeletonLoader';

interface DashboardContentProps {
    selectedTab: string;
    dailyDate?: Date;
    weeklyDate?: Date;
    daily: any;
    weekly: any;
    loading: { daily: boolean; weekly: boolean };
}

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardContent({ 
    selectedTab, 
    dailyDate, 
    weeklyDate,
    daily,
    weekly,
    loading
}: DashboardContentProps) {
    const renderCount = useRef(0);
    renderCount.current += 1;
    
    console.log(`🔄 DashboardContent: Render #${renderCount.current}`, {
        selectedTab,
        dailyDate: dailyDate?.toISOString().split('T')[0],
        weeklyDate: weeklyDate?.toISOString().split('T')[0]
    });

    // Animation values
    const translateX = useSharedValue(0);
    
    // Update animation when tab changes
    useEffect(() => {
        console.log('🎬 DashboardContent: Tab animation triggered for:', selectedTab);
        const animationStart = performance.now();
        
        const targetPosition = selectedTab === 'daily' ? 0 : -screenWidth;
        translateX.value = withTiming(targetPosition, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
        
        console.log(`⏱️ DashboardContent: Animation setup took ${(performance.now() - animationStart).toFixed(2)}ms`);
    }, [selectedTab]);
    
    // Animated style for the container
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const renderDashboardContent = (type: 'daily' | 'weekly') => {
        console.log(`🎯 DashboardContent: Rendering ${type} dashboard...`);
        const renderStart = performance.now();
        
        const isDaily = type === 'daily';
        const data = isDaily ? daily : weekly;
        const isLoading = isDaily ? loading.daily : loading.weekly;

        console.log(`📊 DashboardContent: ${type} dashboard state:`, {
            isLoading,
            hasData: !!data,
            isEmpty: data?.isEmpty
        });

        // Show loading skeleton
        if (isLoading) {
            console.log(`⏱️ DashboardContent: ${type} skeleton render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return <DashboardSkeleton type={type} />;
        }

        // Show empty state
        if (data?.isEmpty) {
            console.log(`⏱️ DashboardContent: ${type} empty state render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return <EmptyState message="No study sessions recorded" />;
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
                    timelineData={daily.timelineData}
                    rawData={daily.rawData}
                    loading={false}
                />
            );
            console.log(`⏱️ DashboardContent: Daily dashboard render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return dashboardRender;
        } else if (!isDaily && weekly) {
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
                />
            );
            console.log(`⏱️ DashboardContent: Weekly dashboard render took ${(performance.now() - renderStart).toFixed(2)}ms`);
            return dashboardRender;
        }

        console.log(`⚠️ DashboardContent: ${type} dashboard returned null`);
        return null;
    };

    console.log(`🎯 DashboardContent: Component render complete (render #${renderCount.current})`);

    return (
        <View className="flex-1 overflow-hidden">
            <Animated.View 
                style={[animatedStyle, { 
                    flexDirection: 'row', 
                    width: screenWidth * 2,
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
            </Animated.View>
        </View>
    );
} 