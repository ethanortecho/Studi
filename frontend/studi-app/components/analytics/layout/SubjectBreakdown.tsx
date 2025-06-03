import React from 'react';
import { View, Text } from 'react-native';
import CustomPieChart from '../charts/CustomPieChart';
import DashboardCard from '@/components/insights/DashboardContainer';

interface SubjectBreakdownProps {
    pieChartData?: Array<{ label: string; value: number; color: string }>;
}

export default function SubjectBreakdown({ pieChartData }: SubjectBreakdownProps) {
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