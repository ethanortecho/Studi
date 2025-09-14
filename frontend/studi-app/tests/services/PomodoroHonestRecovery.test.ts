import { TimerRecoveryState } from '../../services/TimerRecoveryService';
import { calculatePomodoroRecovery } from '../../services/PomodoroRecoveryService';
import { setupFakeTimers } from '../test-utils';

/**
 * Tests for "Honest Recovery" - the simplest, most user-friendly approach
 *
 * Business Logic:
 * - If user returns mid-phase: resume where they were
 * - If phase would be complete: jump to start of next phase
 * - No phantom cycles - don't pretend breaks happened
 */
describe('Pomodoro Honest Recovery', () => {
  let cleanupTimers: () => void;

  beforeEach(() => {
    cleanupTimers = setupFakeTimers();
  });

  afterEach(() => {
    cleanupTimers();
  });

  describe('Work Block Recovery', () => {
    it('resumes mid-work block if time elapsed is less than work duration', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 min
        pomoBreakDuration: 300, // 5 min
        pomoBlocksRemaining: 3,
      };

      // User was 10 min into work, gone for 5 more minutes (15 total)
      const elapsedSeconds = 900; // 15 minutes

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('work');
      expect(result.pomoBlocksRemaining).toBe(3);
      expect(result.currentPhaseElapsed).toBe(900);
      expect(result.shouldStartAtPhaseBeginning).toBe(false);
    });

    it('jumps to break if work block would be complete', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 min
        pomoBreakDuration: 300, // 5 min
        pomoBlocksRemaining: 3,
      };

      // User was away for 30 minutes (work block is done, would be 5 min into break)
      const elapsedSeconds = 1800;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('break');
      expect(result.pomoBlocksRemaining).toBe(3); // Same block, just in break now
      expect(result.currentPhaseElapsed).toBe(0);
      expect(result.shouldStartAtPhaseBeginning).toBe(true);
    });

    it('jumps to next work block if gone for full cycle', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 min
        pomoBreakDuration: 300, // 5 min
        pomoBlocksRemaining: 3,
      };

      // User was away for 35 minutes (full work + break)
      const elapsedSeconds = 2100;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('work');
      expect(result.pomoBlocksRemaining).toBe(2); // Moved to next block
      expect(result.currentPhaseElapsed).toBe(0);
      expect(result.shouldStartAtPhaseBeginning).toBe(true);
    });

    it('caps at next logical phase for very long absences', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 min
        pomoBreakDuration: 300, // 5 min
        pomoBlocksRemaining: 3,
      };

      // User was away for 2 hours (would be 4 cycles)
      const elapsedSeconds = 7200;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      // Don't simulate 4 cycles, just move to next logical point
      expect(result.pomoStatus).toBe('break');
      expect(result.pomoBlocksRemaining).toBe(3); // Only consumed current work
      expect(result.currentPhaseElapsed).toBe(0);
      expect(result.shouldStartAtPhaseBeginning).toBe(true);
      expect(result.wasExtendedAbsence).toBe(true);
    });
  });

  describe('Break Block Recovery', () => {
    it('resumes mid-break if time elapsed is less than break duration', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'break',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300, // 5 min
        pomoBlocksRemaining: 3,
      };

      // User was 2 min into break, gone for 1 more minute
      const elapsedSeconds = 180; // 3 minutes

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('break');
      expect(result.pomoBlocksRemaining).toBe(3);
      expect(result.currentPhaseElapsed).toBe(180);
      expect(result.shouldStartAtPhaseBeginning).toBe(false);
    });

    it('jumps to next work block if break would be complete', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'break',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300, // 5 min
        pomoBlocksRemaining: 3,
      };

      // User was away for 10 minutes (break is done)
      const elapsedSeconds = 600;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('work');
      expect(result.pomoBlocksRemaining).toBe(2); // Moved to next block
      expect(result.currentPhaseElapsed).toBe(0);
      expect(result.shouldStartAtPhaseBeginning).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles last block completion', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 1, // Last block
      };

      // User was away long enough to complete last work block
      const elapsedSeconds = 1800;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('work');
      expect(result.pomoBlocksRemaining).toBe(0);
      expect(result.sessionComplete).toBe(true);
    });

    it('handles custom duration configurations', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 2700, // 45 min
        pomoBreakDuration: 900, // 15 min
        pomoBlocksRemaining: 2,
      };

      // User was away for 50 minutes (work done, into break)
      const elapsedSeconds = 3000;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.pomoStatus).toBe('break');
      expect(result.pomoBlocksRemaining).toBe(2);
      expect(result.currentPhaseElapsed).toBe(0);
    });

    it('handles paused state (no progression)', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 3,
        status: 'paused',
      };

      // Time passed but timer was paused
      const elapsedSeconds = 3600;

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      // No progression when paused
      expect(result.pomoStatus).toBe('work');
      expect(result.pomoBlocksRemaining).toBe(3);
      expect(result.currentPhaseElapsed).toBe(0);
      expect(result.shouldStartAtPhaseBeginning).toBe(false);
    });
  });

  describe('User Experience', () => {
    it('provides helpful recovery message for extended absence', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 3,
      };

      const elapsedSeconds = 7200; // 2 hours

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.wasExtendedAbsence).toBe(true);
      expect(result.recoveryMessage).toContain('extended focus session');
    });

    it('no special message for normal progression', () => {
      const savedState: Partial<TimerRecoveryState> = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 3,
      };

      const elapsedSeconds = 900; // 15 min

      const result = calculatePomodoroRecovery(savedState, elapsedSeconds);

      expect(result.wasExtendedAbsence).toBe(false);
      expect(result.recoveryMessage).toBeUndefined();
    });
  });
});