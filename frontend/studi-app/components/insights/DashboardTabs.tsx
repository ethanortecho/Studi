import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import DashboardContent from './DashboardContent';

export default function DashboardTabs() {
    const [selectedTab, setSelectedTab] = useState('daily');

    return (
        <View className="flex-1">
            {/* Tab Selector */}
            <View className="px-4 mb-6">
                <View className="flex-row rounded-full bg-layout-off-white p-1">
                    <Pressable 
                        onPress={() => setSelectedTab('daily')} 
                        className={`flex-1 items-center py-2 px-4 rounded-full ${selectedTab === 'daily' ? 'bg-primary' : ''}`}
                    >
                        <Text className={`font-medium ${selectedTab === 'daily' ? 'text-white' : 'text-layout-dark-grey'}`}>
                            Daily
                        </Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setSelectedTab('weekly')} 
                        className={`flex-1 items-center py-2 px-4 rounded-full ${selectedTab === 'weekly' ? 'bg-primary' : ''}`}
                    >
                        <Text className={`font-medium ${selectedTab === 'weekly' ? 'text-white' : 'text-layout-dark-grey'}`}>
                            Weekly
                        </Text>
                    </Pressable>
                    <Pressable 
                        onPress={() => setSelectedTab('monthly')} 
                        className={`flex-1 items-center py-2 px-4 rounded-full ${selectedTab === 'monthly' ? 'bg-primary' : ''}`}
                    >
                        <Text className={`font-medium ${selectedTab === 'monthly' ? 'text-white' : 'text-layout-dark-grey'}`}>
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