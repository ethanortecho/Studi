import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import DashboardContent from './DashboardContent';
import DateNavigationHeader from './DateNavigationHeader';
import WeekNavigator from './WeekNavigator';
import { getDefaultDate, navigateDate, getWeekStart, navigateWeek } from '@/utils/dateUtils';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardTabsProps {
    onDataChange?: (data: { totalTime?: { hours: number; minutes: number }, totalHours?: string }) => void;
}

export default function DashboardTabs({ onDataChange }: DashboardTabsProps) {
    const [selectedTab, setSelectedTab] = useState('weekly'); // Default to weekly to match your usage
    const today = new Date();

    // Daily view state
    const [dailyWeekStart, setDailyWeekStart] = useState(getWeekStart(today));
    const [selectedDailyDate, setSelectedDailyDate] = useState<Date>(today);

    // Weekly view state (unchanged)
    const [weeklyDate, setWeeklyDate] = useState(getDefaultDate('weekly'));

    // Get dashboard data
    const { daily, weekly, loading, weekDaily } = useDashboardData({ dailyDate: selectedDailyDate, weeklyDate });

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

    const handleDailyWeekNavigation = (direction: 'prev' | 'next') => {
        setDailyWeekStart(current => {
            const newStart = navigateWeek(current, direction);
            setSelectedDailyDate(newStart); // Behaviour B: reset selection to week start (Sunday)
            return newStart;
        });
    };

    const handleWeeklyNavigation = (direction: 'prev' | 'next') => {
        setWeeklyDate(current => navigateDate(current, direction, 'weekly'));
    };

    // Keep weeklyDate in sync with current daily week when on daily tab so we have weekly data for dots
    React.useEffect(() => {
        if (selectedTab === 'daily') {
            setWeeklyDate(dailyWeekStart);
        }
    }, [selectedTab, dailyWeekStart]);

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

            {/* Date / Week Navigation */}
            {selectedTab === 'daily' ? (
                <WeekNavigator
                    weekStart={dailyWeekStart}
                    selectedDay={selectedDailyDate}
                    onSelect={(date) => setSelectedDailyDate(date)}
                    onNavigate={handleDailyWeekNavigation}
                    hasData={weekDaily?.hasData}
                />
            ) : (
                <DateNavigationHeader
                    currentDate={weeklyDate}
                    type="weekly"
                    onNavigate={handleWeeklyNavigation}
                />
            )}
            
            {/* Dashboard Content */}
            <DashboardContent 
                selectedTab={selectedTab}
                dailyDate={selectedDailyDate}
                weeklyDate={weeklyDate}
                daily={daily}
                weekly={weekly}
                loading={loading}
            />
        </View>
    );
} 