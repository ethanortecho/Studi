import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import CustomPieChart from '../charts/CustomPieChart';
import DashboardCard from '@/components/insights/DashboardCard';
import { parseCategoryDurations } from '@/utils/parseData';
import { DailyInsightsResponse } from '@/types/api';

interface SubjectBreakdownProps {
    dailyData: DailyInsightsResponse | null;
}

export default function SubjectBreakdown({ dailyData }: SubjectBreakdownProps) {
    const pieChartData = useMemo(() => 
        dailyData ? parseCategoryDurations(dailyData) : null, 
        [dailyData]
    );

    return (
        <DashboardCard >
            <View className="flex-row items-center justify-between">
                <Text className="text-md font-bold text-category-purple mb-3">Subject Breakdown</Text>
            </View>
            <View className="flex-row items-center justify-center">
            {pieChartData && (
                <CustomPieChart 
                    data={pieChartData}
                    size={125}
                />
            )}

            </View>
            
        </DashboardCard>
    );
}