import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import DashboardContent from './DashboardContent';
import DateNavigationHeader from './DateNavigationHeader';
import { getDefaultDate, navigateDate } from '@/utils/dateUtils';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardTabsProps {
    onDataChange?: (data: { totalTime?: { hours: number; minutes: number }, totalHours?: string }) => void;
}

export default function DashboardTabs({ onDataChange }: DashboardTabsProps) {
    const [selectedTab, setSelectedTab] = useState('weekly'); // Default to weekly to match your usage
    const [dailyDate, setDailyDate] = useState(getDefaultDate('daily'));
    const [weeklyDate, setWeeklyDate] = useState(getDefaultDate('weekly'));

    // Get dashboard data
    const { daily, weekly, loading } = useDashboardData({ dailyDate, weeklyDate });
    
    // Expose current tab's data to parent
    React.useEffect(() => {
        const currentData = selectedTab === 'daily' ? daily : weekly;
        if (currentData && onDataChange) {
            onDataChange({
                totalTime: currentData.totalTime,
                totalHours: currentData.totalHours
            });
        }
    }, [selectedTab, daily, weekly, onDataChange]);

    const handleDateNavigation = (direction: 'prev' | 'next') => {
        if (selectedTab === 'daily') {
            setDailyDate(current => navigateDate(current, direction, 'daily'));
        } else {
            setWeeklyDate(current => navigateDate(current, direction, 'weekly'));
        }
    };

    const currentDate = selectedTab === 'daily' ? dailyDate : weeklyDate;

    return (
        <View className="flex-1">
            {/* Tab Selector */}
            <View className="px-5 mb-6">
                <View className="flex-row rounded-xl bg-layout-off-white px-1 py-1">
                    <Pressable 
                        onPress={() => setSelectedTab('daily')} 
                        className={`flex-1 items-center py-2 px-4 rounded-2xl ${selectedTab === 'daily' ? 'bg-primary' : ''}`}
                    >
                        <Text className={`font-bold text-xl ${selectedTab === 'daily' ? 'text-white' : 'text-layout-faded-grey'}`}>
                            Daily
                        </Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setSelectedTab('weekly')} 
                        className={`flex-1 items-center py-2 px-4 rounded-2xl ${selectedTab === 'weekly' ? 'bg-primary' : ''}`}
                    >
                        <Text className={`font-bold text-xl ${selectedTab === 'weekly' ? 'text-white' : 'text-layout-faded-grey'}`}>
                            Weekly
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Date Navigation Header */}
            <DateNavigationHeader
                currentDate={currentDate}
                type={selectedTab as 'daily' | 'weekly'}
                onNavigate={handleDateNavigation}
            />
            
            {/* Dashboard Content */}
            <DashboardContent 
                selectedTab={selectedTab} 
                dailyDate={dailyDate}
                weeklyDate={weeklyDate}
            />
        </View>
    );
} 