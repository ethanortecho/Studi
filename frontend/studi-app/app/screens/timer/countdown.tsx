import React from 'react';
import { useCountdown, CountdownConfig } from '@/hooks/timer';
import { useLocalSearchParams } from 'expo-router';
import TimerScreen from '@/components/timer/shared/TimerScreen';
import CountdownDisplay from '@/components/timer/displays/CountdownDisplay';

export default function CountdownSessionScreen() {
    // Get countdown duration from route params (passed from modal)
    const { duration, selectedCategoryId } = useLocalSearchParams();
    const countdownDuration = duration ? parseInt(duration as string) : 25; // Default to 25 minutes

    // Create config with category info
    const countdownConfig: CountdownConfig = {
        duration: countdownDuration,
        selectedCategoryId: selectedCategoryId as string
    };
    
    const timerHook = useCountdown(countdownConfig);

    return (
        <TimerScreen
            timerType="countdown"
            timerDisplayComponent={<CountdownDisplay formatTime={timerHook.formatTime} />}
            timerHook={timerHook}
        />
    );
} 