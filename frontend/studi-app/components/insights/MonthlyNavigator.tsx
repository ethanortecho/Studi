import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { getMonthStart } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

interface MonthlyNavigatorProps {
    selectedMonth: Date;
    onSelect: (date: Date) => void;
}

export default function MonthlyNavigator({ selectedMonth, onSelect }: MonthlyNavigatorProps) {
    const handleNavigation = (direction: 'prev' | 'next') => {
        const newMonth = new Date(selectedMonth);
        newMonth.setMonth(selectedMonth.getMonth() + (direction === 'next' ? 1 : -1));
        onSelect(getMonthStart(newMonth));
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    };

    return (
        <View className="px-5 py-4">
            <View className="flex-row items-center justify-between">
                <Pressable
                    onPress={() => handleNavigation('prev')}
                    className="p-2 rounded-full bg-surface"
                >
                    <Ionicons name="chevron-back" size={24} color="#666" />
                </Pressable>
                
                <Text className="text-xl font-bold text-primaryText">
                    {formatMonth(selectedMonth)}
                </Text>
                
                <Pressable
                    onPress={() => handleNavigation('next')}
                    className="p-2 rounded-full bg-surface"
                >
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </Pressable>
            </View>
        </View>
    );
}