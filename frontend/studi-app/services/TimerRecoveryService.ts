import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STATE_KEY = '@timer_recovery_state';
const SAVE_INTERVAL = 30000; // 30 seconds

export interface TimerRecoveryState {
  // Core timer state
  startTime: string; // ISO timestamp (when timer started/resumed)
  pausedTime: number; // seconds
  status: 'running' | 'paused';
  
  // Session info
  sessionId: number;
  sessionStartTime?: string; // ISO timestamp (when session was created)
  categoryId: number | null;
  categoryBlockId?: number | null; // Current active category block
  categoryName?: string;
  categoryColor?: string;
  
  // Timer type specific
  timerType: 'stopwatch' | 'countdown' | 'pomodoro';
  totalDuration?: number; // for countdown (in seconds)
  pomoBlocks?: number; // for pomodoro - total blocks
  pomoBlocksRemaining?: number; // current blocks left
  pomoStatus?: 'work' | 'break'; // current phase
  pomoWorkDuration?: number; // work phase duration in seconds
  pomoBreakDuration?: number; // break phase duration in seconds
  
  // Metadata
  lastSaved: string; // ISO timestamp
  appVersion?: string;
}

export class TimerRecoveryService {
  private static saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Save current timer state to AsyncStorage
   */
  static async saveTimerState(state: Partial<TimerRecoveryState>): Promise<void> {
    try {
      const fullState: TimerRecoveryState = {
        ...state,
        lastSaved: new Date().toISOString(),
      } as TimerRecoveryState;
      
      await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(fullState));
    } catch (error) {
      console.error('TimerRecovery: Failed to save state', error);
    }
  }

  /**
   * Load saved timer state from AsyncStorage
   */
  static async loadTimerState(): Promise<TimerRecoveryState | null> {
    try {
      const savedState = await AsyncStorage.getItem(TIMER_STATE_KEY);
      if (!savedState) {
        return null;
      }

      const state = JSON.parse(savedState) as TimerRecoveryState;
      
      // Validate the saved state is still relevant
      const lastSavedTime = new Date(state.lastSaved).getTime();
      const now = Date.now();
      const hoursSinceLastSave = (now - lastSavedTime) / (1000 * 60 * 60);
      
      // If saved more than 24 hours ago, consider it stale
      if (hoursSinceLastSave > 24) {
        await this.clearTimerState();
        return null;
      }


      return state;
    } catch (error) {
      console.error('TimerRecovery: Failed to load state', error);
      return null;
    }
  }

  /**
   * Clear saved timer state
   */
  static async clearTimerState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TIMER_STATE_KEY);
      this.stopPeriodicSave();
    } catch (error) {
      console.error('TimerRecovery: Failed to clear state', error);
    }
  }

  /**
   * Calculate elapsed time from saved state
   */
  static calculateElapsedTime(state: TimerRecoveryState): number {
    const startTime = new Date(state.startTime).getTime();
    const now = Date.now();
    
    if (state.status === 'paused') {
      // If paused, return the paused time
      return state.pausedTime;
    } else {
      // If running, calculate time since start plus any paused time
      const elapsedSinceStart = Math.floor((now - startTime) / 1000);
      return elapsedSinceStart + state.pausedTime;
    }
  }

  /**
   * Start periodic saving while timer is running
   */
  static startPeriodicSave(getState: () => Partial<TimerRecoveryState>): void {
    this.stopPeriodicSave(); // Clear any existing interval
    
    // Save immediately
    this.saveTimerState(getState());
    
    // Then save every 30 seconds
    this.saveTimeout = setInterval(() => {
      const state = getState();
      if (state.status === 'running') {
        this.saveTimerState(state);
      }
    }, SAVE_INTERVAL);
    
  }

  /**
   * Stop periodic saving
   */
  static stopPeriodicSave(): void {
    if (this.saveTimeout) {
      clearInterval(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Check if recovery is needed and get recovery info
   */
  static async checkRecoveryNeeded(): Promise<{
    needed: boolean;
    state?: TimerRecoveryState;
    elapsedTime?: number;
    timeSinceLastSave?: number;
  }> {
    const state = await this.loadTimerState();
    
    if (!state) {
      return { needed: false };
    }

    const elapsedTime = this.calculateElapsedTime(state);
    const timeSinceLastSave = (Date.now() - new Date(state.lastSaved).getTime()) / 1000;

    return {
      needed: true,
      state,
      elapsedTime,
      timeSinceLastSave,
    };
  }

  /**
   * Format recovery info for display
   */
  static formatRecoveryInfo(state: TimerRecoveryState, elapsedTime: number): {
    title: string;
    message: string;
    timeDisplay: string;
  } {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const lastSaveTime = new Date(state.lastSaved);
    const timeSinceLastSave = Date.now() - lastSaveTime.getTime();
    const minutesSinceLastSave = Math.floor(timeSinceLastSave / (1000 * 60));

    let title = 'Active Session Detected';
    let message = `You have a ${state.timerType} session`;

    if (state.status === 'paused') {
      message += ' (paused)';
    }

    if (state.categoryName) {
      message += ` for ${state.categoryName}`;
    }

    if (minutesSinceLastSave > 1) {
      message += ` from ${minutesSinceLastSave} minutes ago`;
    }

    return {
      title,
      message,
      timeDisplay,
    };
  }
}