import { useBaseTimer } from './useBaseTimer';
import { useStudySession } from '../useStudySession';
import { useContext, useEffect } from 'react';
import { StudySessionContext } from '../../context/StudySessionContext';

export interface CountdownConfig {
    duration: number; // in minutes
    selectedCategoryId?: string; // Category to start with
}

export function useCountdown(config: CountdownConfig) {
    const { startSession, stopSession, pauseSession, resumeSession, cancelSession, switchCategory } = useStudySession();
    const { sessionId } = useContext(StudySessionContext);
    
    // Convert duration from minutes to seconds for internal timer
    const totalSeconds = config.duration * 60;
    
    const baseTimer = useBaseTimer({
        onStart: async () => {
            console.log("Countdown: onStart callback - creating session and starting timer atomically");
            
            try {
                // Always create a new session when timer starts (atomic operation)
                const sessionResult = await startSession();
                console.log("Countdown: Session created with ID:", sessionResult.id);
                
                // If category is specified, switch to it immediately
                if (config.selectedCategoryId) {
                    await switchCategory(Number(config.selectedCategoryId), sessionResult.id);
                    console.log("Countdown: Switched to category:", config.selectedCategoryId);
                }
            } catch (error) {
                console.error("Countdown: Error creating session:", error);
                throw error; // This will prevent timer from starting
            }
        },
        onPause: async () => {
            console.log("Countdown: onPause callback, will call pauseSession");
            try {
                await pauseSession();
                console.log("Countdown: pauseSession completed");
            } catch (error) {
                console.error("Countdown: pauseSession error:", error);
            }
        },
        onResume: async () => {
            console.log("Countdown: onResume callback, will call resumeSession");
            try {
                await resumeSession();
                console.log("Countdown: resumeSession completed");
            } catch (error) {
                console.error("Countdown: resumeSession error:", error);
            }
        },
        onStop: async () => {
            console.log("Countdown: onStop callback, will call stopSession");
            try {
                await stopSession();
                console.log("Countdown: stopSession completed");
            } catch (error) {
                console.error("Countdown: stopSession error:", error);
            }
        },
        onTick: (elapsed: number) => {
            // Auto-stop when countdown reaches zero (silent)
            if (elapsed >= totalSeconds) {
                baseTimer.stop();
            }
        }
    });

    // Calculate time remaining (countdown logic)
    const timeRemaining = Math.max(0, totalSeconds - baseTimer.elapsed);
    const isFinished = timeRemaining === 0;

    // Provide countdown-specific interface
    const startTimer = () => {
        console.log("Countdown: startTimer called, current sessionId:", sessionId);
        baseTimer.start();
    };

    const pauseTimer = () => {
        console.log("Countdown: pauseTimer called");
        baseTimer.pause();
    };

    const resumeTimer = () => {
        console.log("Countdown: resumeTimer called");
        baseTimer.resume();
    };

    const stopTimer = () => {
        console.log("Countdown: stopTimer called");
        baseTimer.stop();
    };

    const cancelTimer = async () => {
        console.log("Countdown: cancelTimer called");
        try {
            await cancelSession();
            // Reset timer state without triggering onStop callback
            baseTimer.resetWithoutCallbacks();
            console.log("Countdown: cancelSession completed");
        } catch (error) {
            console.error("Countdown: cancelSession error:", error);
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
        
        // Actions
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        
        // Utilities
        formatTime,
        cancelTimer,
    };
} 