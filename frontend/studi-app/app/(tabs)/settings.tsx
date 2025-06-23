import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SettingsScreen() {
    return (
        <SafeAreaView className="flex-1">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800 mb-6">Settings</Text>
                
                <Pressable 
                    onPress={() => router.push('/screens/manage-categories' as any)}
                    className="bg-blue-500 py-3 px-4 rounded-lg"
                >
                    <Text className="text-white font-medium text-center">Manage Categories</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push('/screens/set-weekly-goal?edit=1' as any)}
                    className="bg-purple-600 py-3 px-4 rounded-lg mt-4"
                >
                    <Text className="text-white font-medium text-center">Manage Study Goal</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
} 