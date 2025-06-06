import { useState, useEffect } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface BaseTimerConfig {
    onStart?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onStop?: () => void;
    onTick?: (elapsed: number) => void;
}

export function useBaseTimer(config?: BaseTimerConfig) {
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [pausedTime, setPausedTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState<number>(0); // in seconds
    const [status, setStatus] = useState<TimerStatus>('idle');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'running' && startTime) {
            interval = setInterval(() => {
                const now = new Date();
                const currentElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) + pausedTime;
                setElapsed(currentElapsed);
                config?.onTick?.(currentElapsed);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, startTime, pausedTime, config]);

    const start = () => {
        console.log("BaseTimer: start called");
        setStartTime(new Date());
        setPausedTime(0);
        setElapsed(0);
        setStatus('running');
        config?.onStart?.();
    };

    const pause = () => {
        console.log("BaseTimer: pause called");
        setPausedTime(elapsed);
        setStatus('paused');
        config?.onPause?.();
    };

    const resume = () => {
        console.log("BaseTimer: resume called");
        setStartTime(new Date());
        setStatus('running');
        config?.onResume?.();
    };

    const stop = () => {
        console.log("BaseTimer: stop called");
        setStatus('idle');
        setElapsed(0);
        setPausedTime(0);
        setStartTime(null);
        config?.onStop?.();
    };

    const reset = () => {
        console.log("BaseTimer: reset called");
        setElapsed(0);
        setPausedTime(0);
        if (status === 'running') {
            setStartTime(new Date());
        }
    };

    const resetWithoutCallbacks = () => {
        console.log("BaseTimer: resetWithoutCallbacks called");
        setStatus('idle');
        setElapsed(0);
        setPausedTime(0);
        setStartTime(null);
        // Note: No callback is triggered here
    };

    // Format elapsed time to mm:ss
    const formatTime = () => {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

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
        resetWithoutCallbacks,
        
        // Utilities
        formatTime
    };
} 