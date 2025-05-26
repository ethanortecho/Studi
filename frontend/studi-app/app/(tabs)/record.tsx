import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/Timer';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { StudySessionProvider } from '@/context/StudySessionContext';
import CategoryManager from '@/components/CategoryManager';

export default function RecordSessionScreen() {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <StudySessionProvider>
            <SafeAreaView className="flex-1">
                <View className="p-4 flex-row justify-between items-center">
                    <Text className="text-2xl font-bold text-gray-800">Record Session</Text>
                    <Pressable 
                        onPress={() => setModalVisible(true)}
                        className="bg-blue-500 py-2 px-4 rounded-full"
                    >
                        <Text className="text-white font-medium">Manage Categories</Text>
                    </Pressable>
                </View>
                
                <ThemedView style={{ flex: 1 }}>
                    <View className="flex-1 p-4 gap-6">
                        <Timer />
                        <CategoryCarousel />
                    </View>
                </ThemedView>
                <CategoryManager visible={modalVisible} onClose={() => setModalVisible(false)} />
            </SafeAreaView>
        </StudySessionProvider>
    );
}