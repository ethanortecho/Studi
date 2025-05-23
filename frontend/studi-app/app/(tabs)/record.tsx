import React, { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RecordScreenStyles as styles } from '@/styles/record';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/Timer';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { fetchCategories, Category } from '@/utils/studySession';
import { StudySessionContext, StudySessionProvider } from '@/context/StudySessionContext';
export default function RecordSessionScreen() {

    return (
        <StudySessionProvider>
            <SafeAreaView style={styles.contentContainer}>
            <ThemedView style={styles.headerContainer}>
                <ThemedText style={styles.title}>Record Session</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.mainContent}>
                
                <Timer />
                <CategoryCarousel/>

                
                <ThemedView style={styles.categoryContainer}>
                </ThemedView>
            </ThemedView>
        </SafeAreaView>

        </StudySessionProvider>
        
    );
}