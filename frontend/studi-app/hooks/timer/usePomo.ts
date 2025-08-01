import { useBaseTimer } from "./useBaseTimer";
import { useStudySession } from "../useStudySession";
import { useContext, useEffect, useState } from "react";
import { StudySessionContext } from "@/context/StudySessionContext";

export interface PomoConfig {
    pomodoroBlocks: number;
    pomodoroWorkDuration: number;
    pomodoroBreakDuration: number;
    selectedCategoryId?: string;
}

export function usePomo(config: PomoConfig) {
    // Debug logs removed for production cleanliness
    
    const { startSession, stopSession, pauseSession, resumeSession, cancelSession, switchCategory } = useStudySession();
    const { sessionId } = useContext(StudySessionContext);
    const [pomoBlocksRemaining, setPomoBlocksRemaining] = useState(config.pomodoroBlocks);
    const [pomoBlockStatus, setPomoBlockStatus] = useState<'work' | 'break'>('work');
    const pomoWorkDuration = config.pomodoroWorkDuration * 60;
    const pomoBreakDuration = config.pomodoroBreakDuration * 60;

    const baseTimer = useBaseTimer({
        onStart: async () => {
            // Always create a new session when timer starts (atomic operation)
            const sessionResult = await startSession();
            
            // If category is specified, switch to it immediately
            if (config.selectedCategoryId) {
                await switchCategory(Number(config.selectedCategoryId), sessionResult.id);
            }
        },
        onPause: async () => {
            await pauseSession();
        },
        onResume: async () => {
            await resumeSession();
        },
        onStop: async () => {
            await stopSession();
        },
        onTick: (elapsed: number) => {
            const currentPhaseDuration = pomoBlockStatus === 'work' ? pomoWorkDuration : pomoBreakDuration;
            if (elapsed >= currentPhaseDuration) {
                if (pomoBlockStatus === 'work') {
                    pauseSession();
                    setPomoBlockStatus('break');
                    baseTimer.resetElapsed();
                } else {
                    if (pomoBlocksRemaining <= 1) {
                        baseTimer.stop();
                    } else {
                        resumeSession();
                        setPomoBlocksRemaining(prev => prev - 1);
                        setPomoBlockStatus('work');
                        baseTimer.resetElapsed();
                    }
                }
            }
        }
    });

    // Calculate current phase progress for display
    const currentPhaseDuration = pomoBlockStatus === 'work' ? pomoWorkDuration : pomoBreakDuration;
    const timeRemaining = Math.max(0, currentPhaseDuration - baseTimer.elapsed);
    const isFinished = pomoBlocksRemaining === 0 && baseTimer.status === 'idle';

    // Provide pomodoro-specific interface
    const startTimer = () => {
        setPomoBlockStatus('work');
        setPomoBlocksRemaining(config.pomodoroBlocks);
        baseTimer.start();
    };

    const pauseTimer = () => {
        baseTimer.pause();
    };

    const resumeTimer = () => {
        baseTimer.resume();
    };

    const stopTimer = () => {
        baseTimer.stop();
    };

    const cancelTimer = async () => {
        try {
            await cancelSession();
            // Reset timer state without triggering onStop callback
            baseTimer.resetWithoutCallbacks();
            setPomoBlockStatus('work');
            setPomoBlocksRemaining(config.pomodoroBlocks);
        } catch (error) {
            throw error;
        }
    };

    // Format time remaining to mm:ss
    const formatTime = () => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return {
        // State
        startTime: baseTimer.startTime,
        elapsed: baseTimer.elapsed,
        timeRemaining,
        isFinished,
        status: baseTimer.status,
        pomoBlocksRemaining,
        pomoBlockStatus,
        currentPhaseDuration,
        
        // Actions
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        cancelTimer,
        
        // Utilities
        formatTime,
    };
}