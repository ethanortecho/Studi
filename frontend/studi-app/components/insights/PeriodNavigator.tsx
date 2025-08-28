import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWeekStart, navigateWeek, getMonthStart, canNavigate } from '../../utils/dateUtils';
import { usePremium } from '../../contexts/PremiumContext';

type Timeframe = 'daily' | 'weekly' | 'monthly';

interface PeriodNavigatorProps {
    timeframe: Timeframe;
    selectedDate: Date;
    onSelect: (date: Date) => void;
}

export default function PeriodNavigator({ timeframe, selectedDate, onSelect }: PeriodNavigatorProps) {
    const { isPremium } = usePremium();
    
    const handleNavigation = (direction: 'prev' | 'next') => {
        let newDate: Date;
        
        switch (timeframe) {
            case 'daily':
                newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'weekly':
                newDate = navigateWeek(selectedDate, direction);
                break;
            case 'monthly':
                newDate = new Date(selectedDate);
                newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
                newDate = getMonthStart(newDate);
                break;
        }
        
        onSelect(newDate);
    };

    const formatDate = (date: Date): string => {
        switch (timeframe) {
            case 'daily':
                return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric' 
                });
            case 'weekly':
                const weekStart = getWeekStart(date);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const formatWeekDate = (d: Date) => d.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                // Same month: "Jan 6 - 12, 2025"
                if (weekStart.getMonth() === weekEnd.getMonth()) {
                    return `${formatWeekDate(weekStart).replace(',', '')} - ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
                }
                // Different months: "Jan 30 - Feb 5, 2025"
                else {
                    return `${formatWeekDate(weekStart)} - ${formatWeekDate(weekEnd)}, ${weekEnd.getFullYear()}`;
                }
            case 'monthly':
                return date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                });
        }
    };

    const canGoPrev = canNavigate(selectedDate, 'prev', timeframe, isPremium);
    const canGoNext = canNavigate(selectedDate, 'next', timeframe, isPremium);

    return (
        <View className="px-5 py-4">
            <View className="flex-row items-center justify-between">
                <Pressable
                    onPress={() => handleNavigation('prev')}
                    className={`p-2 rounded-full ${canGoPrev ? 'bg-surface' : 'bg-surface opacity-30'}`}
                    disabled={!canGoPrev}
                >
                    <Ionicons name="chevron-back" size={24} color="#666" />
                </Pressable>
                
                <Text className="text-xl font-bold text-primaryText text-center flex-1 px-4">
                    {formatDate(selectedDate)}
                </Text>
                
                <Pressable
                    onPress={() => handleNavigation('next')}
                    className={`p-2 rounded-full ${canGoNext ? 'bg-surface' : 'bg-surface opacity-30'}`}
                    disabled={!canGoNext}
                >
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </Pressable>
            </View>
        </View>
    );
}