import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InsightsHeader from '@/components/insights/InsightsHeader';
import DashboardTabs from '@/components/insights/DashboardTabs';

export default function InsightsScreen() {
    const [dashboardData, setDashboardData] = useState<{
        totalTime?: { hours: number; minutes: number };
        totalHours?: string;
    }>({});

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <InsightsHeader 
                totalTime={dashboardData.totalTime}
                totalHours={dashboardData.totalHours || '0.00'}
            />
            <DashboardTabs onDataChange={setDashboardData} />
        </SafeAreaView>
    );
} 