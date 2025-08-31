import { useEffect, useContext, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StudySessionContext } from '../../context/StudySessionContext';
import { TimerRecoveryService } from '../../services/TimerRecoveryService';

/**
 * Shared hook for handling timer recovery across all timer types
 * Follows DRY principle and single responsibility pattern
 * 
 * @param timerHook - The timer hook instance (useStopwatch, useCountdown, or usePomo)
 * @param timerType - The type of timer for validation
 */
export function useTimerRecovery(
    timerHook: { recoverFromState?: (state: any, elapsed: number) => void },
    timerType: 'stopwatch' | 'countdown' | 'pomodoro'
) {
    const params = useLocalSearchParams();
    const { recoveredTimerState, clearRecoveredState } = useContext(StudySessionContext);
    const hasRecovered = useRef(false);
    
    useEffect(() => {
        // Check if we're in recovery mode and haven't already recovered
        if (params.recovered === 'true' && recoveredTimerState && !hasRecovered.current) {
            // Validate timer type matches
            if (recoveredTimerState.timerType !== timerType) {
                console.warn(`Timer type mismatch: expected ${timerType}, got ${recoveredTimerState.timerType}`);
                return;
            }
            
            console.log(`${timerType}: Recovering timer state`, recoveredTimerState);
            
            // Calculate elapsed time from saved state
            const elapsedTime = TimerRecoveryService.calculateElapsedTime(recoveredTimerState);
            
            // Use the recoverFromState function from baseTimer
            if (timerHook.recoverFromState) {
                timerHook.recoverFromState(recoveredTimerState, elapsedTime);
                console.log(`${timerType}: Recovery complete, elapsed time: ${elapsedTime}s`);
                // Mark as recovered to prevent re-running
                hasRecovered.current = true;
                // Clear the recovered state from context to prevent further recovery attempts
                clearRecoveredState();
            } else {
                console.error(`${timerType}: recoverFromState function not available`);
            }
        }
    }, [params.recovered, recoveredTimerState, timerHook, timerType, clearRecoveredState]);
}