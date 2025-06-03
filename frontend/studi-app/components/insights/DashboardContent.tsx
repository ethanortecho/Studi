import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming,
    Easing 
} from 'react-native-reanimated';
import DailyDashboard from '@/app/screens/Insights/DailyDashboard';
import WeeklyDashboard from '@/app/screens/Insights/WeeklyDashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardSkeleton, EmptyState } from './SkeletonLoader';

interface DashboardContentProps {
    selectedTab: string;
    dailyDate?: Date;
    weeklyDate?: Date;
}

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardContent({ selectedTab, dailyDate, weeklyDate }: DashboardContentProps) {
    const { daily, weekly, loading } = useDashboardData({ dailyDate, weeklyDate });
    
    // Animation values
    const translateX = useSharedValue(0);
    
    // Update animation when tab changes
    useEffect(() => {
        const targetPosition = selectedTab === 'daily' ? 0 : -screenWidth;
        translateX.value = withTiming(targetPosition, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
        });
    }, [selectedTab]);
    
    // Animated style for the container
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const renderDashboardContent = (type: 'daily' | 'weekly') => {
        const isDaily = type === 'daily';
        const data = isDaily ? daily : weekly;
        const isLoading = isDaily ? loading.daily : loading.weekly;

        // Show loading skeleton
        if (isLoading) {
            return <DashboardSkeleton type={type} />;
        }

        // Show empty state
        if (data?.isEmpty) {
            return <EmptyState message="No study sessions recorded" />;
        }

        // Show actual dashboard
        if (isDaily && daily) {
            return (
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
        } else if (!isDaily && weekly) {
            return (
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
        }

        return null;
    };

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