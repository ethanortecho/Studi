import { renderHook, act } from '@testing-library/react-native';
import { usePomo } from '../../hooks/timer/usePomo';
import { TimerRecoveryService } from '../../services/TimerRecoveryService';
import { calculatePomodoroRecovery } from '../../services/PomodoroRecoveryService';
import { setupFakeTimers } from '../test-utils';
import React from 'react';
import { StudySessionContext } from '../../context/StudySessionContext';

// Mock dependencies
jest.mock('../../hooks/useStudySession', () => ({
  useStudySession: () => ({
    startSession: jest.fn().mockResolvedValue({ id: 1 }),
    stopSession: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    cancelSession: jest.fn(),
    switchCategory: jest.fn(),
  }),
}));

jest.mock('../../services/TimerRecoveryService');

describe('usePomo Integration with Recovery', () => {
  let cleanupTimers: () => void;

  beforeEach(() => {
    cleanupTimers = setupFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTimers();
  });

  const mockContext = {
    sessionId: null,
    sessionStartTime: null,
    currentCategoryId: null,
    currentCategoryBlockId: null,
    categories: [],
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      StudySessionContext.Provider,
      { value: mockContext as any },
      children
    );

  describe('Recovery Scenarios', () => {
    it('recovers to break phase when work is complete', async () => {
      const config = {
        pomodoroBlocks: 4,
        pomodoroWorkDuration: 25, // minutes
        pomodoroBreakDuration: 5,  // minutes
      };

      const { result } = renderHook(() => usePomo(config), { wrapper });

      // Simulate recovery with work phase complete
      const savedState = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500, // 25 min in seconds
        pomoBreakDuration: 300,  // 5 min in seconds
        pomoBlocksRemaining: 3,
        status: 'running',
      };

      // 26 minutes elapsed (work complete, should jump to break start)
      const elapsedSeconds = 1560;

      act(() => {
        result.current.recoverFromState(savedState, elapsedSeconds);
      });

      // Should be in break phase with blocks remaining unchanged
      expect(result.current.pomoBlockStatus).toBe('break');
      expect(result.current.pomoBlocksRemaining).toBe(3);
    });

    it('recovers to next work block when full cycle complete', async () => {
      const config = {
        pomodoroBlocks: 4,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
      };

      const { result } = renderHook(() => usePomo(config), { wrapper });

      const savedState = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 3,
        status: 'running',
      };

      // 35 minutes elapsed (full cycle + extra time)
      const elapsedSeconds = 2100;

      act(() => {
        result.current.recoverFromState(savedState, elapsedSeconds);
      });

      // Should be in work phase with one less block
      expect(result.current.pomoBlockStatus).toBe('work');
      expect(result.current.pomoBlocksRemaining).toBe(2);
    });

    it('completes session when last block is done', async () => {
      const config = {
        pomodoroBlocks: 1,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
      };

      const { result } = renderHook(() => usePomo(config), { wrapper });

      const savedState = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 1,
        status: 'running',
      };

      // 30 minutes elapsed (work complete on last block)
      const elapsedSeconds = 1800;

      act(() => {
        result.current.recoverFromState(savedState, elapsedSeconds);
      });

      // Should mark session as complete
      expect(result.current.pomoBlocksRemaining).toBe(0);
      expect(result.current.isFinished).toBe(true);
    });

    it('handles extended absence gracefully', async () => {
      const config = {
        pomodoroBlocks: 4,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
      };

      const { result } = renderHook(() => usePomo(config), { wrapper });

      const savedState = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 4,
        status: 'running',
      };

      // 2 hours elapsed (extended absence)
      const elapsedSeconds = 7200;

      // Spy on console.log to verify recovery message
      const consoleSpy = jest.spyOn(console, 'log');

      act(() => {
        result.current.recoverFromState(savedState, elapsedSeconds);
      });

      // Should cap at next logical phase (break)
      expect(result.current.pomoBlockStatus).toBe('break');
      expect(result.current.pomoBlocksRemaining).toBe(4);

      // Should log the extended absence
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Recovery Message:'),
        expect.stringContaining('extended focus session')
      );

      consoleSpy.mockRestore();
    });

    it('resumes mid-phase correctly', async () => {
      const config = {
        pomodoroBlocks: 4,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
      };

      const { result } = renderHook(() => usePomo(config), { wrapper });

      const savedState = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 3,
        status: 'running',
      };

      // 10 minutes elapsed (mid-work phase)
      const elapsedSeconds = 600;

      act(() => {
        result.current.recoverFromState(savedState, elapsedSeconds);
      });

      // Should remain in work phase with correct time elapsed
      expect(result.current.pomoBlockStatus).toBe('work');
      expect(result.current.pomoBlocksRemaining).toBe(3);
      expect(result.current.elapsed).toBe(600);
    });
  });

  describe('Timer Operations After Recovery', () => {
    it('can start, pause, and resume after recovery', async () => {
      const config = {
        pomodoroBlocks: 4,
        pomodoroWorkDuration: 25,
        pomodoroBreakDuration: 5,
      };

      const { result } = renderHook(() => usePomo(config), { wrapper });

      // Recover to a mid-work state
      const savedState = {
        pomoStatus: 'work',
        pomoWorkDuration: 1500,
        pomoBreakDuration: 300,
        pomoBlocksRemaining: 3,
        status: 'running',
      };

      act(() => {
        result.current.recoverFromState(savedState, 600); // 10 minutes in
      });

      // Should be able to pause
      act(() => {
        result.current.pauseTimer();
      });
      expect(result.current.status).toBe('paused');

      // Should be able to resume
      act(() => {
        result.current.resumeTimer();
      });
      expect(result.current.status).toBe('running');

      // Should be able to stop
      act(() => {
        result.current.stopTimer();
      });
      expect(result.current.status).toBe('idle');
    });
  });
});