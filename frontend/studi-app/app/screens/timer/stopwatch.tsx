import React from 'react';
import { Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/timer/StopWatch';
import CategoryFlatListCarousel from '@/components/record/CategoryFlatListCarousel';

export default function RecordSessionScreen() {
    return (
        <SafeAreaView className="flex-1">
            <Timer />
        </SafeAreaView>
    );
}