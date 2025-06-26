import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardTabs from '@/components/insights/DashboardTabs';

export default function InsightsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background">
            <DashboardTabs />
        </SafeAreaView>
    );
} 