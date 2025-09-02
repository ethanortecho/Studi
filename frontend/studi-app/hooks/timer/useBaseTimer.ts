import { useState, useEffect, useCallback } from 'react';
import { TimerRecoveryService, TimerRecoveryState } from '../../services/TimerRecoveryService';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface BaseTimerConfig {
    onStart?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
    onTick?: (elapsed: number) => void;
    // Recovery configuration
    enableRecovery?: boolean;
    sessionId?: number;
    sessionStartTime?: Date; // When the session was created
    categoryId?: number | null;
    categoryBlockId?: number | null; // Current active category block
    categoryName?: string;
    categoryColor?: string;
    timerType?: 'stopwatch' | 'countdown' | 'pomodoro';
    totalDuration?: number; // for countdown
    pomoBlocks?: number; // for pomodoro
    pomoBlocksRemaining?: number;
    pomoStatus?: 'work' | 'break';
    pomoWorkDuration?: number; // for pomodoro
    pomoBreakDuration?: number; // for pomodoro
}

export function useBaseTimer(config?: BaseTimerConfig) {
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [pausedTime, setPausedTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState<number>(0); // in seconds
    const [status, setStatus] = useState<TimerStatus>('idle');
    const [lastSaveTime, setLastSaveTime] = useState<number>(0);

    // Helper to get current recovery state
    const getRecoveryState = useCallback((): Partial<TimerRecoveryState> => {
        if (!startTime || !config?.enableRecovery || !config?.sessionId) {
            return {};
        }

        return {
            startTime: startTime.toISOString(),
            pausedTime,
            status: status as 'running' | 'paused',
            sessionId: config.sessionId,
            sessionStartTime: config.sessionStartTime?.toISOString(), // Save session start time
            categoryId: config.categoryId || null,
            categoryBlockId: config.categoryBlockId || null, // Save category block ID
            categoryName: config.categoryName,
            categoryColor: config.categoryColor,
            timerType: config.timerType || 'stopwatch',
            totalDuration: config.totalDuration,
            pomoBlocks: config.pomoBlocks,
            pomoBlocksRemaining: config.pomoBlocksRemaining,
            pomoStatus: config.pomoStatus,
            pomoWorkDuration: config.pomoWorkDuration,
            pomoBreakDuration: config.pomoBreakDuration,
        };
    }, [startTime, pausedTime, status, config]);
   

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (status === 'running' && startTime) {
            interval = setInterval(() => {
                const now = new Date();
                const currentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) + pausedTime;
                setElapsed(currentElapsed);
                config?.onTick?.(currentElapsed);
                
                // Save state every 30 seconds if recovery is enabled
                if (config?.enableRecovery && config?.sessionId && currentElapsed - lastSaveTime >= 30) {
                    TimerRecoveryService.saveTimerState(getRecoveryState());
                    setLastSaveTime(currentElapsed);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, startTime, pausedTime, config, lastSaveTime, getRecoveryState]);

    const start = () => {
        console.log("BaseTimer: start called");
        const newStartTime = new Date();
        setStartTime(newStartTime);
        setPausedTime(0);
        setElapsed(0);
        setStatus('running');
        setLastSaveTime(0);
        config?.onStart?.();
        
        // Start recovery saving if enabled
        if (config?.enableRecovery && config?.sessionId) {
            TimerRecoveryService.startPeriodicSave(() => getRecoveryState());
        }
    };

    const pause = () => {
        console.log("BaseTimer: pause called");
        setPausedTime(elapsed);
        setStatus('paused');
        config?.onPause?.();
        
        // Save state when paused
        if (config?.enableRecovery && config?.sessionId) {
            TimerRecoveryService.saveTimerState(getRecoveryState());
            TimerRecoveryService.stopPeriodicSave();
        }
    };

    const resume = () => {
        console.log("BaseTimer: resume called");
        setStartTime(new Date());
        setStatus('running');
        config?.onResume?.();
        
        // Resume recovery saving
        if (config?.enableRecovery && config?.sessionId) {
            TimerRecoveryService.startPeriodicSave(() => getRecoveryState());
        }
    };

    const stop = () => {
        console.log("BaseTimer: stop called");
        setStatus('idle');
        setElapsed(0);
        setPausedTime(0);
        setStartTime(null);
        setLastSaveTime(0);
        config?.onStop?.();
        
        // Clear recovery state when stopped
        if (config?.enableRecovery) {
            TimerRecoveryService.clearTimerState();
        }
    };

    const reset = () => {
        console.log("BaseTimer: reset called");
        setElapsed(0);
        setPausedTime(0);
        if (status === 'running') {
            setStartTime(new Date());
        }
    };

    const resetElapsed = () => {
        console.log("BaseTimer: resetElapsed called");
        setElapsed(0);
        setPausedTime(0);
        setLastSaveTime(0);
        if (status === 'running') {
            setStartTime(new Date()); // Reset the start time to now
            // Save new state
            if (config?.enableRecovery && config?.sessionId) {
                TimerRecoveryService.saveTimerState(getRecoveryState());
            }
        }
    };

    const resetWithoutCallbacks = () => {
        console.log("BaseTimer: resetWithoutCallbacks called");
        setStatus('idle');
        setElapsed(0);
        setPausedTime(0);
        setStartTime(null);
        setLastSaveTime(0);
        // Note: No callback is triggered here
        
        // Clear recovery state
        if (config?.enableRecovery) {
            TimerRecoveryService.clearTimerState();
        }
    };

    // Format elapsed time to mm:ss
    const formatTime = () => {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Recovery function to restore timer from saved state
    const recoverFromState = useCallback((savedState: TimerRecoveryState, newElapsed: number) => {
        console.log("BaseTimer: Recovering from saved state", { 
            elapsed: newElapsed, 
            status: savedState.status 
        });
        
        if (savedState.status === 'running') {
            // Calculate new start time based on elapsed time
            const now = new Date();
            const adjustedStartTime = new Date(now.getTime() - (newElapsed - savedState.pausedTime) * 1000);
            setStartTime(adjustedStartTime);
            setPausedTime(savedState.pausedTime);
            setStatus('running');
        } else {
            // Timer was paused
            setStartTime(new Date(savedState.startTime));
            setPausedTime(newElapsed);
            setStatus('paused');
        }
        
        setElapsed(newElapsed);
        setLastSaveTime(newElapsed);
        
        // Resume periodic saving if running
        if (savedState.status === 'running' && config?.enableRecovery) {
            TimerRecoveryService.startPeriodicSave(() => getRecoveryState());
        }
    }, [config, getRecoveryState]);

    return {
        // State
        startTime,
        elapsed,
        status,
        
        // Actions
        start,
        pause,
        resume,
        stop,
        reset,
        resetElapsed,
        resetWithoutCallbacks,
        recoverFromState,
        
        // Utilities
        formatTime
    };
} 