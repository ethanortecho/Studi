import React, { useState } from 'react';
import DailyDashboard from '../screens/Insights/DailyDashboard';
import WeeklyDashboard from '../screens/Insights/WeeklyDashboard';
import MonthlyDashboard from '../screens/Insights/MonthlyDashboard';
import { Text } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Pressable, View } from 'react-native';

export default function DashboardLayout() {
  const [selectedTab, setSelectedTab] = useState('daily');

  const renderDashboard = () => {
    switch (selectedTab) {
      case 'daily':
        return <DailyDashboard />;
      case 'weekly':
        return <WeeklyDashboard />;
      case 'monthly':
        return <MonthlyDashboard />;
      default:
        return null;
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View className="flex-row rounded-full bg-gray-100 p-1 mx-4">
        <Pressable 
          onPress={() => setSelectedTab('daily')} 
          className={`flex-1 items-center py-2 px-4 rounded-full ${selectedTab === 'daily' ? 'bg-primary' : ''}`}
        >
          <Text className={`font-medium ${selectedTab === 'daily' ? 'text-white' : 'text-gray-600'}`}>
            Daily
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setSelectedTab('weekly')} 
          className={`flex-1 items-center py-2 px-4  ${selectedTab === 'weekly' ? 'bg-primary' : ''}`}
        >
          <Text className={`font-medium ${selectedTab === 'weekly' ? 'text-white' : 'text-gray-600'}`}>
            Weekly
          </Text>
        </Pressable>
        
      </View>
      <View className="flex-1">
        {renderDashboard()}
      </View>
    </ThemedView>
  );
}

