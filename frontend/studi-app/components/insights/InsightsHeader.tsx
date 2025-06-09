import React from 'react';
import { Text, View } from 'react-native';
import TotalHours from '@/components/analytics/TotalHoursContainer';

interface InsightsHeaderProps {
    totalTime?: { hours: number; minutes: number };
    totalHours?: string;
}

export default function InsightsHeader({ totalTime, totalHours }: InsightsHeaderProps) {
    return (
        <View className="pt-20 pb-8 px-5 items-center">
            <TotalHours 
                totalTime={totalTime}
                totalHours={totalHours || '0.00'}
            />
        </View>
    );
} 