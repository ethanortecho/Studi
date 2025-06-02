import React, { ReactNode } from 'react';
import { View } from 'react-native';

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
}

export default function DashboardCard({ children, className = '' }: DashboardCardProps) {
    return (
        <View className={`bg-white rounded-2xl p-5 mb-4 ${className}`}>
            {children}
        </View>
    );
} 