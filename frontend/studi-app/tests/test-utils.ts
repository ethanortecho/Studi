import { TimerRecoveryState } from '../services/TimerRecoveryService';
import { Category } from '../utils/studySession';

/**
 * Creates a mock timer state for testing
 * This is a factory function - a common pattern in testing to create test data
 */
export const createMockTimerState = (overrides?: Partial<TimerRecoveryState>): TimerRecoveryState => {
  const now = new Date('2024-01-15T10:00:00Z');
  
  return {
    startTime: now.toISOString(),
    pausedTime: 0,
    status: 'running',
    sessionId: 1,
    sessionStartTime: now.toISOString(),
    categoryId: 1,
    categoryBlockId: 1,
    categoryName: 'Mathematics',
    categoryColor: '#FF6B6B',
    timerType: 'stopwatch',
    lastSaved: now.toISOString(),
    ...overrides, // Allow overriding any property for specific test cases
  };
};

/**
 * Advances time by specified milliseconds
 * Useful for testing time-dependent logic
 */
export const advanceTime = (ms: number) => {
  const currentTime = Date.now();
  jest.setSystemTime(currentTime + ms);
};

/**
 * Sets up fake timers for a test
 * Returns cleanup function to restore real timers
 */
export const setupFakeTimers = () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));

  return () => {
    jest.useRealTimers();
  };
};

/**
 * Creates a mock category for testing
 */
export const createMockCategory = (overrides?: Partial<Category>): Category => {
  return {
    id: '1',
    name: 'Test Category',
    color: '#3B82F6',
    ...overrides,
  };
};