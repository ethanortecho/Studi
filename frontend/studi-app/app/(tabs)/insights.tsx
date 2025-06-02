import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InsightsHeader from '@/components/insights/InsightsHeader';
import DashboardTabs from '@/components/insights/DashboardTabs';

export default function InsightsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-primary">
            <InsightsHeader />
            <DashboardTabs />
        </SafeAreaView>
    );
} 