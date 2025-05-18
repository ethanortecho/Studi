import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RecordScreenStyles as styles } from '@/styles/record';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordSessionScreen(){
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [elapsed, setElapsed] = useState<number>(0); // in seconds
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive && startTime) {
            interval = setInterval (() =>{
                const now = new Date();
                setElapsed(Math.floor((now.getTime() - startTime.getTime()) / 1000));
            }, 1000);

        }
        return () => clearInterval(interval);

    }, [timerActive, startTime]);

    const startTimer = () => {
        setStartTime(new Date());
        setTimerActive(true);
      };
      
      const stopTimer = () => {
        setTimerActive(false);
      };
    
    // Format elapsed time to mm:ss
    const formatTime = () => {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    
    return (
        <SafeAreaView style={styles.contentContainer}>
            <ThemedView style={styles.headerContainer}>
                <ThemedText style={styles.title}>Record Session</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.mainContent}>
                <ThemedView style={styles.row}>
                <ThemedText style={styles.startButton}>{formatTime()}</ThemedText>


                </ThemedView>
                <ThemedView style={styles.row}>
                    <Pressable onPress={timerActive ? stopTimer : startTimer}>
                        <ThemedText style={styles.startButton}>
                            {timerActive ? "Stop" : "Start"}
                        </ThemedText>
                    </Pressable>
                </ThemedView>
                
                <ThemedView style={styles.categoryContainer}>
                    <ThemedText style={styles.categoryText}>category switch box</ThemedText>
                </ThemedView>
            </ThemedView>
        </SafeAreaView>
    );
}