import React from 'react';
import { View } from 'react-native';
import DailyDashboard from '@/app/screens/Insights/DailyDashboard';
import WeeklyDashboard from '@/app/screens/Insights/WeeklyDashboard';
import MonthlyDashboard from '@/app/screens/Insights/MonthlyDashboard';

interface DashboardContentProps {
    selectedTab: string;
}

export default function DashboardContent({ selectedTab }: DashboardContentProps) {
    const renderDashboard = () => {
        switch (selectedTab) {
            case 'daily':
                return <DailyDashboard />;
            case 'weekly':
                return <WeeklyDashboard />;
            case 'monthly':
                return <MonthlyDashboard />;
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