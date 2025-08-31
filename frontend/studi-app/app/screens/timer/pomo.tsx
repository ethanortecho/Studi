import React from 'react';
import { usePomo, PomoConfig, useTimerRecovery } from '../../../hooks/timer';
import { useLocalSearchParams } from 'expo-router';
import TimerScreen from '../../../components/timer/shared/TimerScreen';
import PomoDisplay from '../../../components/timer/displays/PomoDisplay';

export default function PomoSessionScreen() {
    // Get pomodoro config from route params (passed from modal)
    const { pomodoroBlocks, pomodoroWorkDuration, pomodoroBreakDuration, selectedCategoryId } = useLocalSearchParams();
    
    const pomoConfig: PomoConfig = {
        pomodoroBlocks: pomodoroBlocks ? parseInt(pomodoroBlocks as string) : 4, // Default to 4 blocks
        pomodoroWorkDuration: pomodoroWorkDuration ? parseInt(pomodoroWorkDuration as string) : 25, // Default to 25 minutes
        pomodoroBreakDuration: pomodoroBreakDuration ? parseInt(pomodoroBreakDuration as string) : 5, // Default to 5 minutes
        selectedCategoryId: selectedCategoryId as string
    };
    
    const timerHook = usePomo(pomoConfig);
    
    // Handle recovery using shared hook
    useTimerRecovery(timerHook, 'pomodoro');

    return (
        <TimerScreen
            timerType="pomo"
            timerDisplayComponent={
                <PomoDisplay 
                    formatTime={timerHook.formatTime} 
                    pomoBlockStatus={timerHook.pomoBlockStatus}
                    pomoBlocksRemaining={timerHook.pomoBlocksRemaining}
                />
            }
            timerHook={timerHook}
        />
    );
}
