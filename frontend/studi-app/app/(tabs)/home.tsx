import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/record/StopWatch';
import { CategoryCarousel } from '@/components/record/CategoryCarousel';
import { StudySessionProvider } from '@/context/StudySessionContext';
import { router } from 'expo-router';
export default function HomeScreen() {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <StudySessionProvider>
            <SafeAreaView className="flex-1">
                <View className="p-4 flex-row justify-between items-center">
                    <Text className="text-2xl font-bold text-gray-800">Welcome Back your name</Text>
                
                </View>
                
                <ThemedView style={{ flex: 1 }}>
                <Pressable 
                        onPress={() => router.push('/screens/timer/stopwatch')}
                        className="bg-blue-500 py-2 px-4 rounded-full"
                    >
                        <Text className="text-white font-medium">Stopwatch</Text>
                    </Pressable>
                </ThemedView>
            </SafeAreaView>
        </StudySessionProvider>
    );
}