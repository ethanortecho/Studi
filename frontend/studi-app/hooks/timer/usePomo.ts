import { useBaseTimer } from "./useBaseTimer";
import { useStudySession } from "../useStudySession";
import { useContext, useEffect, useState } from "react";
import { StudySessionContext } from '../../context/StudySessionContext';
import { calculatePomodoroRecovery } from '../../services/PomodoroRecoveryService';

export interface PomoConfig {
    pomodoroBlocks: number;
    pomodoroWorkDuration: number;
    pomodoroBreakDuration: number;
    selectedCategoryId?: string;
}

export function usePomo(config: PomoConfig) {
    // Debug logs removed for production cleanliness
    
    const { startSession, stopSession, pauseSession, resumeSession, cancelSession, switchCategory } = useStudySession();
    const { sessionId, sessionStartTime, currentCategoryId, currentCategoryBlockId, categories } = useContext(StudySessionContext);
    const [pomoBlocksRemaining, setPomoBlocksRemaining] = useState(config.pomodoroBlocks);
    const [pomoBlockStatus, setPomoBlockStatus] = useState<'work' | 'break'>('work');
    const pomoWorkDuration = config.pomodoroWorkDuration * 60;
    const pomoBreakDuration = config.pomodoroBreakDuration * 60;

    // Get current category info for recovery
    const currentCategory = categories.find(c => Number(c.id) === Number(currentCategoryId || config.selectedCategoryId));

    const baseTimer = useBaseTimer({
        enableRecovery: false, // TEMPORARILY DISABLED FOR PERFORMANCE TESTING
        sessionId: sessionId || undefined,
        sessionStartTime: sessionStartTime || undefined,
        categoryId: currentCategoryId || (config.selectedCategoryId ? Number(config.selectedCategoryId) : null),
        categoryBlockId: currentCategoryBlockId || undefined,
        categoryName: currentCategory?.name,
        categoryColor: currentCategory?.color,
        timerType: 'pomodoro',
        pomoBlocks: config.pomodoroBlocks,
        pomoBlocksRemaining,
        pomoStatus: pomoBlockStatus,
        pomoWorkDuration,
        pomoBreakDuration,
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

    // Custom recovery handler that restores pomodoro-specific state
    const recoverFromState = (state: any, elapsed: number) => {
        // Use our Honest Recovery logic to determine the correct state
        const recoveryResult = calculatePomodoroRecovery(state, elapsed);

        // Update pomodoro-specific state based on recovery result
        setPomoBlocksRemaining(recoveryResult.pomoBlocksRemaining);
        setPomoBlockStatus(recoveryResult.pomoStatus);

        // If session is complete, handle appropriately
        if (recoveryResult.sessionComplete) {
            baseTimer.stop();
            return;
        }

        // Recover base timer with adjusted elapsed time for current phase
        baseTimer.recoverFromState(state, recoveryResult.currentPhaseElapsed);

        // Log recovery details for debugging
        console.log('Pomodoro Recovery:', {
            blocksRemaining: recoveryResult.pomoBlocksRemaining,
            status: recoveryResult.pomoStatus,
            phaseElapsed: recoveryResult.currentPhaseElapsed,
            shouldStartFresh: recoveryResult.shouldStartAtPhaseBeginning,
            wasExtendedAbsence: recoveryResult.wasExtendedAbsence,
            message: recoveryResult.recoveryMessage
        });

        // Show recovery message if available
        if (recoveryResult.recoveryMessage) {
            // TODO: Show this message to the user via toast or alert
            console.log('Recovery Message:', recoveryResult.recoveryMessage);
        }
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
        recoverFromState,
    };
}