import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useStopwatch, StopwatchConfig, useTimerRecovery } from '../../../hooks/timer';
import TimerScreen from '../../../components/timer/shared/TimerScreen';
import StopwatchDisplay from '../../../components/timer/displays/StopwatchDisplay';

export default function RecordSessionScreen() {
    const params = useLocalSearchParams();
    
    // Create config with category info
    const stopwatchConfig: StopwatchConfig = {
        selectedCategoryId: params.selectedCategoryId as string
    };
    
    const timerHook = useStopwatch(stopwatchConfig);
    
    // Handle recovery using shared hook
    useTimerRecovery(timerHook, 'stopwatch');
    
    return (
        <TimerScreen
            timerType="stopwatch"
            timerDisplayComponent={<StopwatchDisplay formatTime={timerHook.formatTime} />}
            timerHook={timerHook}
        />
    );
}