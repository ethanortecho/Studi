import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import DashboardContent from './DashboardContent';
import PeriodNavigator from './PeriodNavigator';
import { getDefaultDate, getWeekStart, navigateWeek, getMonthStart } from '@/utils/dateUtils';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardTabsProps {
    onDataChange?: (data: { totalTime?: { hours: number; minutes: number }, totalHours?: string }) => void;
}

export default function DashboardTabs({ onDataChange }: DashboardTabsProps) {
    const [selectedTab, setSelectedTab] = useState('weekly'); // Default to weekly to match your usage
    const today = new Date();

    // Unified date state for all timeframes
    const [dailyDate, setDailyDate] = useState<Date>(today);
    const [weeklyDate, setWeeklyDate] = useState(getDefaultDate('weekly'));
    const [monthlyDate, setMonthlyDate] = useState(getMonthStart(today));

    // Get dashboard data
    const { daily, weekly, monthly, loading } = useDashboardData({ 
        dailyDate: dailyDate, 
        weeklyDate,
        monthlyDate 
    });

    // Expose current tab's data to parent
    React.useEffect(() => {
        const currentData = selectedTab === 'daily' ? daily : selectedTab === 'weekly' ? weekly : monthly;
        if (currentData && onDataChange) {
            onDataChange({
                totalTime: currentData.totalTime,
                totalHours: currentData.totalHours
            });
        }
    }, [selectedTab, daily, weekly, monthly, onDataChange]);

    // Get the current date and handler for the selected timeframe
    const getCurrentDate = () => {
        switch (selectedTab) {
            case 'daily': return dailyDate;
            case 'weekly': return weeklyDate;
            case 'monthly': return monthlyDate;
            default: return today;
        }
    };

    const handleDateChange = (newDate: Date) => {
        switch (selectedTab) {
            case 'daily': 
                setDailyDate(newDate);
                break;
            case 'weekly': 
                setWeeklyDate(newDate);
                break;
            case 'monthly': 
                setMonthlyDate(newDate);
                break;
        }
    };

    return (
        <View className="flex-1 pt-10">
            {/* Tab Selector */}
            <View className="px-5">
                <View className="flex-row rounded-2xl bg-surface px-2 py-2">
                    <Pressable 
                        onPress={() => setSelectedTab('daily')} 
                        className={`flex-1 items-center py-2 px-4 rounded-2xl ${selectedTab === 'daily' ? 'bg-accent' : ''}`}
                    >
                        <Text className={`font-bold text-xl ${selectedTab === 'daily' ? 'text-primaryText' : 'text-secondaryText'}`}>
                            Daily
                        </Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setSelectedTab('weekly')} 
                        className={`flex-1 items-center py-2 px-4 rounded-2xl ${selectedTab === 'weekly' ? 'bg-accent' : ''}`}
                    >
                        <Text className={`font-bold text-xl ${selectedTab === 'weekly' ? 'text-primaryText' : 'text-secondaryText'}`}>
                            Weekly
                        </Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setSelectedTab('monthly')} 
                        className={`flex-1 items-center py-2 px-4 rounded-2xl ${selectedTab === 'monthly' ? 'bg-accent' : ''}`}
                    >
                        <Text className={`font-bold text-xl ${selectedTab === 'monthly' ? 'text-primaryText' : 'text-secondaryText'}`}>
                            Monthly
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Unified Period Navigation */}
            <PeriodNavigator
                timeframe={selectedTab as 'daily' | 'weekly' | 'monthly'}
                selectedDate={getCurrentDate()}
                onSelect={handleDateChange}
            />
            
            {/* Dashboard Content */}
            <DashboardContent 
                selectedTab={selectedTab}
                dailyDate={dailyDate}
                weeklyDate={weeklyDate}
                monthlyDate={monthlyDate}
                daily={daily}
                weekly={weekly}
                monthly={monthly}
                loading={loading}
            />
        </View>
    );
} 