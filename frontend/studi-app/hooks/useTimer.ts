import { useState, useEffect } from 'react';
import { useStudySession } from './useStudySession';

export function useTimer() {
    const { startSession, stopSession } = useStudySession();
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [pausedTime, setPausedTime] = useState<number>(0);
    const [elapsed, setElapsed] = useState<number>(0); // in seconds
    const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'running' && startTime) {
            interval = setInterval(() => {
                const now = new Date();
                setElapsed(Math.floor((now.getTime() - startTime.getTime()) / 1000) + pausedTime);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, startTime, pausedTime]);

    const startTimer = async () => {
        console.log("Timer: startTimer called, will call startSession");
        try {
            const res = await startSession();
            console.log("Timer: startSession result:", res);
        } catch (error) {
            console.error("Timer: startSession error:", error);
        }

        setStartTime(new Date());
        setPausedTime(0);
        setElapsed(0);
        setStatus('running');
    };
      
    const pauseTimer = () => {
        console.log("Timer: pauseTimer called");
        setPausedTime(elapsed);
        setStatus('paused');
    };

    const resumeTimer = () => {
        console.log("Timer: resumeTimer called");
        setStartTime(new Date());
        setStatus('running');
    };

    const stopTimer = async () => {
        console.log("Timer: stopTimer called, will call stopSession");
        setStatus('idle');
        setElapsed(0);
        setPausedTime(0);
        setStartTime(null);
        
        try {
            await stopSession();
            console.log("Timer: stopSession completed");
        } catch (error) {
            console.error("Timer: stopSession error:", error);
        }
    };
    
    // Format elapsed time to mm:ss
    const formatTime = () => {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return {
        startTime,
        elapsed,
        status,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        formatTime
    };
}