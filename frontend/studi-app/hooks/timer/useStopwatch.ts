import { useBaseTimer } from './useBaseTimer';
import { useStudySession } from '../useStudySession';
import { useContext } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';

export function useStopwatch() {
    const { startSession, stopSession, pauseSession, resumeSession, cancelSession } = useStudySession();
    const { sessionId } = useContext(StudySessionContext);
    
    const baseTimer = useBaseTimer({
        onStart: async () => {
            console.log("Stopwatch: onStart callback, sessionId:", sessionId);
            
            // Only start a new session if one doesn't already exist
            if (!sessionId) {
                console.log("Stopwatch: No existing session, will call startSession");
                try {
                    const res = await startSession();
                    console.log("Stopwatch: startSession result:", res);
                } catch (error) {
                    console.error("Stopwatch: startSession error:", error);
                }
            } else {
                console.log("Stopwatch: Session already exists, timer starting without creating new session");
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
    };
} 