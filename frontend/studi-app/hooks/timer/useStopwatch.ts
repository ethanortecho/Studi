import { useBaseTimer } from './useBaseTimer';
import { useStudySession } from '../useStudySession';
import { useContext } from 'react';
import { StudySessionContext } from '../../context/StudySessionContext';

export interface StopwatchConfig {
    selectedCategoryId?: string; // Category to start with
}

export function useStopwatch(config?: StopwatchConfig) {
    const { startSession, stopSession, pauseSession, resumeSession, cancelSession, switchCategory } = useStudySession();
    const { sessionId, sessionStartTime, currentCategoryId, currentCategoryBlockId, categories } = useContext(StudySessionContext);
    
    // Get current category info for recovery
    const currentCategory = categories.find(c => Number(c.id) === Number(currentCategoryId || config?.selectedCategoryId));
    
    const baseTimer = useBaseTimer({
        enableRecovery: false, // TEMPORARILY DISABLED FOR PERFORMANCE TESTING
        sessionId: sessionId || undefined,
        sessionStartTime: sessionStartTime || undefined,
        categoryId: currentCategoryId || (config?.selectedCategoryId ? Number(config.selectedCategoryId) : null),
        categoryBlockId: currentCategoryBlockId || undefined,
        categoryName: currentCategory?.name,
        categoryColor: currentCategory?.color,
        timerType: 'stopwatch',
        onStart: async () => {
            console.log("Stopwatch: onStart callback - creating session and starting timer atomically");
            
            try {
                // Always create a new session when timer starts (atomic operation)
                const sessionResult = await startSession();
                console.log("Stopwatch: Session created with ID:", sessionResult.id);
                
                // If category is specified, switch to it immediately
                if (config?.selectedCategoryId) {
                    await switchCategory(Number(config.selectedCategoryId), sessionResult.id);
                    console.log("Stopwatch: Switched to category:", config.selectedCategoryId);
                }
            } catch (error) {
                console.error("Stopwatch: Error creating session:", error);
                throw error; // This will prevent timer from starting
            }
        },
        onPause: async () => {
            console.log("Stopwatch: onPause callback, will call pauseSession");
            try {
                await pauseSession();
                console.log("Stopwatch: pauseSession completed");
            } catch (error) {
                console.error("Stopwatch: pauseSession error:", error);
            }
        },
        onResume: async () => {
            console.log("Stopwatch: onResume callback, will call resumeSession");
            try {
                await resumeSession();
                console.log("Stopwatch: resumeSession completed");
            } catch (error) {
                console.error("Stopwatch: resumeSession error:", error);
            }
        },
        onStop: async () => {
            console.log("Stopwatch: onStop callback, will call stopSession");
            try {
                await stopSession();
                console.log("Stopwatch: stopSession completed");
            } catch (error) {
                console.error("Stopwatch: stopSession error:", error);
            }
        }
    });

    // Provide the same interface as the original useTimer for backward compatibility
    const startTimer = () => {
        console.log("Stopwatch: startTimer called, current sessionId:", sessionId);
        baseTimer.start();
    };

    const pauseTimer = () => {
        console.log("Stopwatch: pauseTimer called");
        baseTimer.pause();
    };

    const resumeTimer = () => {
        console.log("Stopwatch: resumeTimer called");
        baseTimer.resume();
    };

    const stopTimer = () => {
        console.log("Stopwatch: stopTimer called");
        baseTimer.stop();
    };

    const cancelTimer = async () => {
        console.log("Stopwatch: cancelTimer called");
        try {
            await cancelSession();
            // Reset timer state without triggering onStop callback
            baseTimer.resetWithoutCallbacks();
            console.log("Stopwatch: cancelSession completed");
        } catch (error) {
            console.error("Stopwatch: cancelSession error:", error);
            throw error;
        }
    };

    return {
        // State (same as original useTimer)
        startTime: baseTimer.startTime,
        elapsed: baseTimer.elapsed,
        status: baseTimer.status,
        
        // Actions (same interface as original useTimer)
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        
        // Utilities
        formatTime: baseTimer.formatTime,
        cancelTimer,
        recoverFromState: baseTimer.recoverFromState,
    };
} 