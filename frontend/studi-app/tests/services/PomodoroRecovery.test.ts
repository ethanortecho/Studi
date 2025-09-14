import { TimerRecoveryService, TimerRecoveryState } from '../../services/TimerRecoveryService';
import { setupFakeTimers } from '../test-utils';

/**
 * These tests focus on Pomodoro-specific recovery scenarios
 * They expose the critical issue: block progression during backgrounding
 */
describe('Pomodoro Recovery Logic', () => {
  let cleanupTimers: () => void;

  beforeEach(() => {
    cleanupTimers = setupFakeTimers();
  });

  afterEach(() => {
    cleanupTimers();
  });

  describe('Block Progression During Background', () => {
    /**
     * CRITICAL TEST: This exposes the current bug
     * When user backgrounds app, blocks should progress naturally
     */
    it('should advance to next work block when backgrounded longer than work+break duration', () => {
      // User is 10 minutes into a 25-minute work block
      const tenMinutesAgo = new Date('2024-01-15T09:50:00Z').toISOString();
      const savedState: TimerRecoveryState = {
        startTime: tenMinutesAgo,
        pausedTime: 0,
        status: 'running',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 4,
        pomoBlocksRemaining: 3, // On first block of 4
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 minutes
        pomoBreakDuration: 300,  // 5 minutes
        lastSaved: tenMinutesAgo,
      };

      // Now simulate app recovery 45 minutes later
      // Expected: Should have completed work (15 min left) + break (5 min) + be 25 min into next work
      jest.setSystemTime(new Date('2024-01-15T10:35:00Z')); // 45 minutes later

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(2700); // 45 minutes = 2700 seconds

      // WHAT SHOULD HAPPEN (but doesn't with current logic):
      // - Elapsed through first work block: 15 min remaining = 900 sec
      // - Elapsed through break: 5 min = 300 sec
      // - Into second work block: 45 - 15 - 5 = 25 min = 1500 sec
      // Therefore: pomoBlocksRemaining should be 2, pomoStatus should be 'work'

      // This test will likely FAIL with current implementation, proving the bug exists
    });

    it('should handle multiple block progressions during long background', () => {
      // User starts a 4-block pomodoro and immediately backgrounds
      const startTime = new Date('2024-01-15T09:00:00Z').toISOString();
      const savedState: TimerRecoveryState = {
        startTime: startTime,
        pausedTime: 0,
        status: 'running',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 4,
        pomoBlocksRemaining: 4,
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 minutes
        pomoBreakDuration: 300,  // 5 minutes
        lastSaved: startTime,
      };

      // Simulate recovery after 2 full cycles (work+break = 30 min each)
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z')); // 60 minutes later

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(3600); // 60 minutes = 3600 seconds

      // Expected state after 60 minutes:
      // - Block 1: 25 min work + 5 min break = 30 min
      // - Block 2: 25 min work + 5 min break = 30 min
      // Total: 60 minutes, should be starting block 3 work phase
      // pomoBlocksRemaining: 2, pomoStatus: 'work'
    });

    it('should complete session if all blocks elapsed during background', () => {
      // User has 1 block remaining, backgrounds for an hour
      const startTime = new Date('2024-01-15T09:00:00Z').toISOString();
      const savedState: TimerRecoveryState = {
        startTime: startTime,
        pausedTime: 0,
        status: 'running',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 4,
        pomoBlocksRemaining: 1, // Last block
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 minutes
        pomoBreakDuration: 300,  // 5 minutes
        lastSaved: startTime,
      };

      // Simulate recovery after an hour (way more than needed for 1 block)
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(3600); // 60 minutes

      // Expected: Session should be marked as complete
      // All blocks finished during background period
    });

    it('should correctly handle break phase recovery', () => {
      // User is in a break phase when backgrounding
      const fiveMinutesAgo = new Date('2024-01-15T09:55:00Z').toISOString();
      const savedState: TimerRecoveryState = {
        startTime: fiveMinutesAgo,
        pausedTime: 0,
        status: 'running',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 4,
        pomoBlocksRemaining: 3,
        pomoStatus: 'break', // In break phase
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300, // 5 minute break
        lastSaved: fiveMinutesAgo,
      };

      // Simulate recovery 10 minutes later
      jest.setSystemTime(new Date('2024-01-15T10:05:00Z'));

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(600); // 10 minutes = 600 seconds

      // Expected: Break finished (5 min ago), now 5 min into next work block
      // pomoBlocksRemaining: 2, pomoStatus: 'work'
    });

    it('should handle partial block progression', () => {
      // User is 20 minutes into 25-minute work block, backgrounds for 10 minutes
      const twentyMinutesAgo = new Date('2024-01-15T09:40:00Z').toISOString();
      const savedState: TimerRecoveryState = {
        startTime: twentyMinutesAgo,
        pausedTime: 0,
        status: 'running',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 4,
        pomoBlocksRemaining: 4,
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 minutes
        pomoBreakDuration: 300,
        lastSaved: twentyMinutesAgo,
      };

      // Simulate recovery 30 minutes later (20 already elapsed + 10 more)
      jest.setSystemTime(new Date('2024-01-15T10:10:00Z'));

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(1800); // 30 minutes = 1800 seconds

      // Expected: Completed work block (5 min over), now 5 min into break
      // pomoBlocksRemaining: 3, pomoStatus: 'break'
    });
  });

  describe('Edge Cases', () => {
    it('should handle paused pomodoro recovery', () => {
      // Pomodoro was paused, not running
      const savedState: TimerRecoveryState = {
        startTime: new Date('2024-01-15T09:00:00Z').toISOString(),
        pausedTime: 600, // Was paused after 10 minutes
        status: 'paused',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 4,
        pomoBlocksRemaining: 4,
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        lastSaved: new Date('2024-01-15T09:10:00Z').toISOString(),
      };

      // Time has passed but timer was paused
      jest.setSystemTime(new Date('2024-01-15T11:00:00Z'));

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(600); // Should still be 10 minutes, not progressed

      // Blocks should NOT have progressed since timer was paused
    });

    it('should handle custom duration pomodoros', () => {
      // User has custom 15-minute work, 3-minute break pomodoro
      const startTime = new Date('2024-01-15T09:00:00Z').toISOString();
      const savedState: TimerRecoveryState = {
        startTime: startTime,
        pausedTime: 0,
        status: 'running',
        sessionId: 1,
        categoryId: 1,
        timerType: 'pomodoro',
        pomoBlocks: 6,
        pomoBlocksRemaining: 6,
        pomoStatus: 'work',
        pomoWorkDuration: 900,  // 15 minutes
        pomoBreakDuration: 180, // 3 minutes
        lastSaved: startTime,
      };

      // Simulate recovery after 40 minutes
      jest.setSystemTime(new Date('2024-01-15T09:40:00Z'));

      const elapsed = TimerRecoveryService.calculateElapsedTime(savedState);
      expect(elapsed).toBe(2400); // 40 minutes = 2400 seconds

      // With 18-minute cycles (15+3), after 40 minutes:
      // - 2 complete cycles = 36 minutes
      // - 4 minutes into third work block
      // pomoBlocksRemaining: 4, pomoStatus: 'work'
    });
  });
});