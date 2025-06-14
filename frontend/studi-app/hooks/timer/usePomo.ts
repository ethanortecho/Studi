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
    console.log('usePomo received config:', config);
    
    const { startSession, stopSession, pauseSession, resumeSession, cancelSession, switchCategory } = useStudySession();
    const { sessionId } = useContext(StudySessionContext);
    const [pomoBlocksRemaining, setPomoBlocksRemaining] = useState(config.pomodoroBlocks);
    const [pomoBlockStatus, setPomoBlockStatus] = useState<'work' | 'break'>('work');
    const pomoWorkDuration = config.pomodoroWorkDuration * 60;
    const pomoBreakDuration = config.pomodoroBreakDuration * 60;

    console.log('usePomo calculated durations:', { 
        pomoWorkDuration: `${pomoWorkDuration}s (${config.pomodoroWorkDuration}min)`, 
        pomoBreakDuration: `${pomoBreakDuration}s (${config.pomodoroBreakDuration}min)`,
        pomoBlocksRemaining
    });

    const baseTimer = useBaseTimer({
        onStart: async () => {
            console.log("Pomo: onStart callback - creating session and starting timer atomically");
            
            try {
                // Always create a new session when timer starts (atomic operation)
                const sessionResult = await startSession();
                console.log("Pomo: Session created with ID:", sessionResult.id);
                
                // If category is specified, switch to it immediately
                if (config.selectedCategoryId) {
                    await switchCategory(Number(config.selectedCategoryId), sessionResult.id);
                    console.log("Pomo: Switched to category:", config.selectedCategoryId);
                }
            } catch (error) {
                console.error("Pomo: Error creating session:", error);
                throw error; // This will prevent timer from starting
            }
        },
        onPause: async () => {
            console.log("Pomo: onPause callback, will call pauseSession");
            try {
                await pauseSession();
                console.log("Pomo: pauseSession completed");
            } catch (error) {
                console.error("Pomo: pauseSession error:", error);
            }
        },
        onResume: async () => {
            console.log("Pomo: onResume callback, will call resumeSession");
            try {
                await resumeSession();
                console.log("Pomo: resumeSession completed");
            } catch (error) {
                console.error("Pomo: resumeSession error:", error);
            }
        },
        onStop: async () => {
            console.log("Pomo: onStop callback, will call stopSession");
            try {
                await stopSession();
                console.log("Pomo: stopSession completed");
            } catch (error) {
                console.error("Pomo: stopSession error:", error);
            }
        },
        onTick: (elapsed: number) => {
            const currentPhaseDuration = pomoBlockStatus === 'work' ? pomoWorkDuration : pomoBreakDuration;
            
            if (elapsed >= currentPhaseDuration) {
                if (pomoBlockStatus === 'work') {
                    // Work phase done → switch to break
                    pauseSession();
                    setPomoBlockStatus('break');
                    baseTimer.resetElapsed(); // Reset display to 0:00
                    
                } else {
                    // Break phase done → check if more blocks needed
                    if (pomoBlocksRemaining <= 1) {
                        // All blocks done
                        baseTimer.stop();
                    } else {
                        // More blocks → switch to work
                        resumeSession();
                        setPomoBlocksRemaining(prev => prev - 1);
                        setPomoBlockStatus('work');
                        baseTimer.resetElapsed(); // Reset display to 0:00
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
        console.log("Pomo: startTimer called, current sessionId:", sessionId);
        console.log("Pomo: startTimer setting blocks to config.pomodoroBlocks:", config.pomodoroBlocks);
        console.log("Pomo: startTimer current pomoBlocksRemaining before reset:", pomoBlocksRemaining);
        setPomoBlockStatus('work');
        setPomoBlocksRemaining(config.pomodoroBlocks);
        baseTimer.start();
    };

    const pauseTimer = () => {
        console.log("Pomo: pauseTimer called");
        baseTimer.pause();
    };

    const resumeTimer = () => {
        console.log("Pomo: resumeTimer called");
        baseTimer.resume();
    };

    const stopTimer = () => {
        console.log("Pomo: stopTimer called");
        baseTimer.stop();
    };

    const cancelTimer = async () => {
        console.log("Pomo: cancelTimer called");
        try {
            await cancelSession();
            // Reset timer state without triggering onStop callback
            baseTimer.resetWithoutCallbacks();
            setPomoBlockStatus('work');
            setPomoBlocksRemaining(config.pomodoroBlocks);
            console.log("Pomo: cancelSession completed");
        } catch (error) {
            console.error("Pomo: cancelSession error:", error);
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