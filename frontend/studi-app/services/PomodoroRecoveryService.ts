import { TimerRecoveryState } from './TimerRecoveryService';

export interface PomodoroRecoveryResult {
  pomoStatus: 'work' | 'break';
  pomoBlocksRemaining: number;
  currentPhaseElapsed: number;
  shouldStartAtPhaseBeginning: boolean;
  sessionComplete: boolean;
  wasExtendedAbsence: boolean;
  recoveryMessage?: string;
}

/**
 * Implements "Honest Recovery" for Pomodoro timers
 *
 * Philosophy: Don't pretend the user took breaks they didn't take.
 * If they were gone a long time, just move to the next logical phase.
 *
 * @param state - The saved Pomodoro state
 * @param elapsedSeconds - How many seconds have elapsed since timer started
 * @returns Updated state reflecting where the timer should be
 */
export function calculatePomodoroRecovery(
  state: Partial<TimerRecoveryState>,
  elapsedSeconds: number
): PomodoroRecoveryResult {
  const {
    pomoStatus = 'work',
    pomoWorkDuration = 1500,
    pomoBreakDuration = 300,
    pomoBlocksRemaining = 1,
    status = 'running'
  } = state;

  // If timer was paused, no progression happens
  if (status === 'paused') {
    return {
      pomoStatus,
      pomoBlocksRemaining,
      currentPhaseElapsed: 0,
      shouldStartAtPhaseBeginning: false,
      sessionComplete: false,
      wasExtendedAbsence: false,
    };
  }

  const cycleLength = pomoWorkDuration + pomoBreakDuration;
  const currentPhaseDuration = pomoStatus === 'work' ? pomoWorkDuration : pomoBreakDuration;

  // Check for extended absence (more than 2 full cycles)
  const wasExtendedAbsence = elapsedSeconds > cycleLength * 2;

  // For extended absences, cap at one phase transition
  if (wasExtendedAbsence) {
    if (pomoStatus === 'work') {
      // They worked for a long time, suggest a break
      return {
        pomoStatus: 'break',
        pomoBlocksRemaining,
        currentPhaseElapsed: 0,
        shouldStartAtPhaseBeginning: true,
        sessionComplete: false,
        wasExtendedAbsence: true,
        recoveryMessage: 'Welcome back! You had an extended focus session. Time for a break!',
      };
    } else {
      // They were on break and gone long, move to next work
      const newBlocksRemaining = Math.max(0, pomoBlocksRemaining - 1);
      return {
        pomoStatus: 'work',
        pomoBlocksRemaining: newBlocksRemaining,
        currentPhaseElapsed: 0,
        shouldStartAtPhaseBeginning: true,
        sessionComplete: newBlocksRemaining === 0,
        wasExtendedAbsence: true,
        recoveryMessage: newBlocksRemaining > 0
          ? 'Welcome back! Ready to continue with the next work block?'
          : 'Session complete!',
      };
    }
  }

  // Normal progression logic
  if (elapsedSeconds < currentPhaseDuration) {
    // Still in the same phase
    return {
      pomoStatus,
      pomoBlocksRemaining,
      currentPhaseElapsed: elapsedSeconds,
      shouldStartAtPhaseBeginning: false,
      sessionComplete: false,
      wasExtendedAbsence: false,
    };
  }

  // Phase is complete, determine next state
  if (pomoStatus === 'work') {
    // Work phase complete
    const remainingAfterWork = elapsedSeconds - pomoWorkDuration;

    // Check if this was the last block
    if (pomoBlocksRemaining === 1) {
      // Last block completed, session is done
      return {
        pomoStatus: 'work',
        pomoBlocksRemaining: 0,
        currentPhaseElapsed: 0,
        shouldStartAtPhaseBeginning: true,
        sessionComplete: true,
        wasExtendedAbsence: false,
      };
    }

    if (remainingAfterWork <= pomoBreakDuration) {
      // They were gone long enough to complete work, start fresh at break
      return {
        pomoStatus: 'break',
        pomoBlocksRemaining,
        currentPhaseElapsed: 0,
        shouldStartAtPhaseBeginning: true,
        sessionComplete: false,
        wasExtendedAbsence: false,
      };
    } else {
      // Completed full cycle (work + break), move to next work
      const newBlocksRemaining = Math.max(0, pomoBlocksRemaining - 1);
      return {
        pomoStatus: 'work',
        pomoBlocksRemaining: newBlocksRemaining,
        currentPhaseElapsed: 0,
        shouldStartAtPhaseBeginning: true,
        sessionComplete: newBlocksRemaining === 0,
        wasExtendedAbsence: false,
      };
    }
  } else {
    // Break phase complete, move to next work block
    const newBlocksRemaining = Math.max(0, pomoBlocksRemaining - 1);
    return {
      pomoStatus: 'work',
      pomoBlocksRemaining: newBlocksRemaining,
      currentPhaseElapsed: 0,
      shouldStartAtPhaseBeginning: true,
      sessionComplete: newBlocksRemaining === 0,
      wasExtendedAbsence: false,
    };
  }
}