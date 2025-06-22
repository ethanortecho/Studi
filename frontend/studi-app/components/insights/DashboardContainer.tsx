import React, { ReactNode } from 'react';
import { View } from 'react-native';

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
}

export default function DashboardCard({ children, className = '' }: DashboardCardProps) {
    return (
        <View className={`  ${className}`}>
            {children}
        </View>
    );
} 