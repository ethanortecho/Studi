import React, { useEffect, useContext } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useStopwatch, StopwatchConfig } from '../../../hooks/timer';
import TimerScreen from '../../../components/timer/shared/TimerScreen';
import StopwatchDisplay from '../../../components/timer/displays/StopwatchDisplay';
import { StudySessionContext } from '../../../context/StudySessionContext';
import { TimerRecoveryService } from '../../../services/TimerRecoveryService';

export default function RecordSessionScreen() {
    const params = useLocalSearchParams();
    const { recoveredTimerState } = useContext(StudySessionContext);
    
    // Create config with category info
    const stopwatchConfig: StopwatchConfig = {
        selectedCategoryId: params.selectedCategoryId as string
    };
    
    const timerHook = useStopwatch(stopwatchConfig);
    
    // Handle recovery when component mounts
    useEffect(() => {
        if (params.recovered === 'true' && recoveredTimerState && recoveredTimerState.timerType === 'stopwatch') {
            console.log('Stopwatch: Recovering timer state', recoveredTimerState);
            
            // Calculate elapsed time from saved state
            const elapsedTime = TimerRecoveryService.calculateElapsedTime(recoveredTimerState);
            
            // Use the recoverFromState function from baseTimer
            if (timerHook.recoverFromState) {
                timerHook.recoverFromState(recoveredTimerState, elapsedTime);
            }
        }
    }, [params.recovered, recoveredTimerState]);
    
    return (
        <TimerScreen
            timerType="stopwatch"
            timerDisplayComponent={<StopwatchDisplay formatTime={timerHook.formatTime} />}
            timerHook={timerHook}
        />
    );
}