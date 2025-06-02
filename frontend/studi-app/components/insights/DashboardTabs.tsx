import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import DashboardContent from './DashboardContent';

export default function DashboardTabs() {
    const [selectedTab, setSelectedTab] = useState('daily');

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
                    <Pressable 
                        onPress={() => setSelectedTab('monthly')} 
                        className={`flex-1 items-center py-2 px-4 rounded-2xl ${selectedTab === 'monthly' ? 'bg-primary' : ''}`}
                    >
                        <Text className={`font-bold text-xl ${selectedTab === 'monthly' ? 'text-white' : 'text-layout-faded-grey'}`}>
                            Monthly
                        </Text>
                    </Pressable>
                </View>
            </View>
            
            {/* Dashboard Content */}
            <DashboardContent selectedTab={selectedTab} />
        </View>
    );
} 