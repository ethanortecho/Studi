import React from 'react';
import { View } from 'react-native';
import DailyDashboard from '@/app/screens/Insights/DailyDashboard';
import WeeklyDashboard from '@/app/screens/Insights/WeeklyDashboard';
import MonthlyDashboard from '@/app/screens/Insights/MonthlyDashboard';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardContentProps {
    selectedTab: string;
}

export default function DashboardContent({ selectedTab }: DashboardContentProps) {
    const { daily, weekly, monthly, loading } = useDashboardData();

    const renderDashboard = () => {
        switch (selectedTab) {
            case 'daily':
                return (
                    <DailyDashboard 
                        totalHours={daily?.totalHours || '0.00'}
                        categoryDurations={daily?.categoryDurations}
                        categoryMetadata={daily?.categoryMetadata}
                        pieChartData={daily?.pieChartData}
                        timelineData={daily?.timelineData}
                        rawData={daily?.rawData}
                        loading={loading.daily}
                    />
                );
            case 'weekly':
                return (
                    <WeeklyDashboard 
                        totalHours={weekly?.totalHours || '0.00'}
                        categoryDurations={weekly?.categoryDurations}
                        categoryMetadata={weekly?.categoryMetadata}
                        pieChartData={weekly?.pieChartData}
                        trendData={weekly?.trendData}
                        sessionTimes={weekly?.sessionTimes}
                        dailyBreakdown={weekly?.dailyBreakdown}
                        rawData={weekly?.rawData}
                        loading={loading.weekly}
                    />
                );
            case 'monthly':
                return (
                    <MonthlyDashboard 
                        totalHours={monthly?.totalHours || '0.00'}
                        categoryDurations={monthly?.categoryDurations}
                        categoryMetadata={monthly?.categoryMetadata}
                        rawData={monthly?.rawData}
                        loading={loading.monthly}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-1">
            {renderDashboard()}
        </View>
    );
} 