import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';  
import { Pressable, StyleSheet, View } from 'react-native';
import { useTimer } from '@/hooks/useTimer';
import { RecordScreenStyles as styles } from '@/styles/record';
import { useEffect } from 'react';

export function Timer() {
    const { startTimer, pauseTimer, resumeTimer, stopTimer, elapsed, status, formatTime } = useTimer();
    
    useEffect(() => {
        console.log("Timer component: status changed to", status);
    }, [status]);
    
    const handlePlayPause = async () => {
        console.log("Timer component: handlePlayPause called, current status:", status);
        if (status === 'running') {
            pauseTimer();
        } else if (status === 'paused') {
            resumeTimer();
        } else {
            try {
                await startTimer();
                console.log("Timer component: startTimer completed");
            } catch (error) {
                console.error("Timer component: startTimer error:", error);
            }
        }
    };
    
    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.row}>
                <ThemedText style={styles.startButton}>{formatTime()}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.row}>
                <Pressable 
                    onPress={handlePlayPause}
                    style={styles.button}
                >
                    <ThemedText style={styles.buttonText}>
                        {status === 'running' ? 'Pause' : (status === 'paused' ? 'Resume' : 'Start')}
                    </ThemedText>
                </Pressable>
            </ThemedView>
            
            {(status === 'running' || status === 'paused') && (
                <ThemedView style={styles.row}>
                    <Pressable 
                        onPress={stopTimer}
                        style={[styles.button, localStyles.endButton]}
                    >
                        <ThemedText style={styles.buttonText}>
                            End Session
                        </ThemedText>
                    </Pressable>
                </ThemedView>
            )}
        </ThemedView>
    );
}

const localStyles = StyleSheet.create({
    endButton: {
        backgroundColor: '#FF4545',  // Red color for end button
        marginTop: 20,
    }
});