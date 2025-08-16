import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardTabs from '@/components/insights/DashboardTabs';
import { View, Text } from 'react-native';

export default function InsightsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
          
            <DashboardTabs />
        </SafeAreaView>
    );
} // <View className="pt-12">
//<Text className="text-2xl px-12 font-light text-white">Stop Scrolling and join the</Text>
//<Text className="text-primary italic px-12 text-4xl font-light pt-3">
 //   Waitlist
//</Text>
//</View>