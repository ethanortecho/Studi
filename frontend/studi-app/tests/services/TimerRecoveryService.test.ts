import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerRecoveryService, TimerRecoveryState } from '../../services/TimerRecoveryService';
import { createMockTimerState, setupFakeTimers } from '../test-utils';

describe('TimerRecoveryService', () => {
  let cleanupTimers: () => void;

  beforeEach(() => {
    cleanupTimers = setupFakeTimers();
    AsyncStorage.clear();
  });

  afterEach(() => {
    cleanupTimers();
  });

  describe('saveTimerState', () => {
    it('saves timer state to AsyncStorage', async () => {
      const mockState = createMockTimerState();

      await TimerRecoveryService.saveTimerState(mockState);

      const savedData = await AsyncStorage.getItem('@timer_recovery_state');
      expect(savedData).not.toBeNull();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData.sessionId).toBe(mockState.sessionId);
      expect(parsedData.status).toBe(mockState.status);
      expect(parsedData.timerType).toBe(mockState.timerType);
    });

    it('adds lastSaved timestamp when saving', async () => {
      const mockState = createMockTimerState({ lastSaved: undefined });

      await TimerRecoveryService.saveTimerState(mockState);

      const savedData = await AsyncStorage.getItem('@timer_recovery_state');
      const parsedData = JSON.parse(savedData!);

      expect(parsedData.lastSaved).toBeDefined();
      expect(new Date(parsedData.lastSaved).toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('handles AsyncStorage errors gracefully', async () => {
      const mockError = new Error('Storage error');
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(mockError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockState = createMockTimerState();

      await expect(TimerRecoveryService.saveTimerState(mockState)).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('TimerRecovery: Failed to save state', mockError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadTimerState', () => {
    it('loads saved timer state from AsyncStorage', async () => {
      const mockState = createMockTimerState();
      await AsyncStorage.setItem('@timer_recovery_state', JSON.stringify(mockState));

      const loadedState = await TimerRecoveryService.loadTimerState();

      expect(loadedState).toEqual(mockState);
    });

    it('returns null when no state is saved', async () => {
      const loadedState = await TimerRecoveryService.loadTimerState();

      expect(loadedState).toBeNull();
    });

    it('discards state older than 24 hours', async () => {
      const oldState = createMockTimerState({
        lastSaved: new Date('2024-01-14T08:00:00Z').toISOString(),
      });

      await AsyncStorage.setItem('@timer_recovery_state', JSON.stringify(oldState));

      const loadedState = await TimerRecoveryService.loadTimerState();

      expect(loadedState).toBeNull();
      const storedData = await AsyncStorage.getItem('@timer_recovery_state');
      expect(storedData).toBeNull();
    });

    it('accepts state from 23 hours ago', async () => {
      const recentState = createMockTimerState({
        lastSaved: new Date('2024-01-14T11:00:00Z').toISOString(),
      });

      await AsyncStorage.setItem('@timer_recovery_state', JSON.stringify(recentState));

      const loadedState = await TimerRecoveryService.loadTimerState();

      expect(loadedState).toEqual(recentState);
    });

    it('handles corrupted data gracefully', async () => {
      await AsyncStorage.setItem('@timer_recovery_state', 'invalid json');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const loadedState = await TimerRecoveryService.loadTimerState();

      expect(loadedState).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('calculateElapsedTime', () => {
    it('calculates elapsed time for running timer', () => {
      const fiveMinutesAgo = new Date('2024-01-15T09:55:00Z').toISOString();
      const runningState = createMockTimerState({
        startTime: fiveMinutesAgo,
        pausedTime: 0,
        status: 'running',
      });

      const elapsed = TimerRecoveryService.calculateElapsedTime(runningState);

      expect(elapsed).toBe(300); // 5 minutes = 300 seconds
    });

    it('returns paused time when timer is paused', () => {
      const pausedState = createMockTimerState({
        startTime: new Date('2024-01-15T09:50:00Z').toISOString(),
        pausedTime: 180, // 3 minutes paused
        status: 'paused',
      });

      const elapsed = TimerRecoveryService.calculateElapsedTime(pausedState);

      expect(elapsed).toBe(180); // Should return pausedTime, not calculate from startTime
    });

    it('includes paused time in running timer calculation', () => {
      const fiveMinutesAgo = new Date('2024-01-15T09:55:00Z').toISOString();
      const runningState = createMockTimerState({
        startTime: fiveMinutesAgo,
        pausedTime: 120, // 2 minutes were paused
        status: 'running',
      });

      const elapsed = TimerRecoveryService.calculateElapsedTime(runningState);

      expect(elapsed).toBe(420); // 5 minutes running + 2 minutes paused = 7 minutes total
    });
  });

  describe('clearTimerState', () => {
    it('removes saved state from AsyncStorage', async () => {
      const mockState = createMockTimerState();
      await AsyncStorage.setItem('@timer_recovery_state', JSON.stringify(mockState));

      await TimerRecoveryService.clearTimerState();

      const storedData = await AsyncStorage.getItem('@timer_recovery_state');
      expect(storedData).toBeNull();
    });

    it('stops periodic save when clearing', async () => {
      const stopPeriodicSaveSpy = jest.spyOn(TimerRecoveryService as any, 'stopPeriodicSave');

      await TimerRecoveryService.clearTimerState();

      expect(stopPeriodicSaveSpy).toHaveBeenCalled();
    });
  });

  describe('periodic save', () => {
    it('saves state every 30 seconds when timer is running', () => {
      const getStateMock = jest.fn(() => createMockTimerState({ status: 'running' }));
      const saveStateSpy = jest.spyOn(TimerRecoveryService, 'saveTimerState');

      TimerRecoveryService.startPeriodicSave(getStateMock);

      // Should save immediately
      expect(saveStateSpy).toHaveBeenCalledTimes(1);

      // Advance time by 30 seconds
      jest.advanceTimersByTime(30000);
      expect(saveStateSpy).toHaveBeenCalledTimes(2);

      // Advance another 30 seconds
      jest.advanceTimersByTime(30000);
      expect(saveStateSpy).toHaveBeenCalledTimes(3);

      TimerRecoveryService.stopPeriodicSave();
    });

    it('does not save when timer is paused', () => {
      const getStateMock = jest.fn(() => createMockTimerState({ status: 'paused' }));
      const saveStateSpy = jest.spyOn(TimerRecoveryService, 'saveTimerState');

      TimerRecoveryService.startPeriodicSave(getStateMock);

      // Should save immediately
      expect(saveStateSpy).toHaveBeenCalledTimes(1);

      // Advance time - should not save because status is 'paused'
      jest.advanceTimersByTime(30000);
      expect(saveStateSpy).toHaveBeenCalledTimes(1); // Still only 1

      TimerRecoveryService.stopPeriodicSave();
    });
  });
});