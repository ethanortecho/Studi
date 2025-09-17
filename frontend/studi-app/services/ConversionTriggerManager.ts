import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for persistent state
const STORAGE_KEYS = {
  INSTALL_DATE: 'conversion_install_date',
  SESSION_COUNT: 'conversion_session_count',
  LAST_TRIGGER_SHOWN: 'conversion_last_trigger_shown',
  TRIGGER_HISTORY: 'conversion_trigger_history',
  HAS_CONVERTED: 'conversion_has_converted',
};

// Trigger types
export enum TriggerType {
  FIRST_SESSION_COMPLETE = 'first_session_complete',
  THREE_SESSIONS_COMPLETE = 'three_sessions_complete',
  DAY_7_NON_CONVERTER = 'day_7_non_converter',
  UPGRADE_BUTTON_CLICK = 'upgrade_button_click',
}

// Trigger configuration
interface TriggerConfig {
  type: TriggerType;
  priority: number; // Lower number = higher priority
  cooldownHours?: number; // Hours before this trigger can show again
  condition: (state: TriggerState) => boolean;
}

// User state for triggers
export interface TriggerState {
  installDate: Date | null;
  sessionCount: number;
  lastTriggerShown: Date | null;
  triggerHistory: Array<{
    type: TriggerType;
    timestamp: Date;
    dismissed: boolean;
  }>;
  hasConverted: boolean;
}

class ConversionTriggerManager {
  private state: TriggerState | null = null;
  private isInitialized = false;

  // Define trigger configurations
  private triggers: TriggerConfig[] = [
    {
      type: TriggerType.FIRST_SESSION_COMPLETE,
      priority: 1,
      condition: (state) => state.sessionCount === 1,
    },
    {
      type: TriggerType.THREE_SESSIONS_COMPLETE,
      priority: 2,
      condition: (state) => state.sessionCount === 3,
    },
    {
      type: TriggerType.DAY_7_NON_CONVERTER,
      priority: 3,
      cooldownHours: 72, // Show again after 3 days if dismissed
      condition: (state) => {
        if (!state.installDate) return false;
        const daysSinceInstall = this.getDaysSinceInstall(state.installDate);
        return daysSinceInstall >= 7 && !state.hasConverted;
      },
    },
    {
      type: TriggerType.UPGRADE_BUTTON_CLICK,
      priority: 0, // Highest priority - immediate user intent
      condition: () => true, // Always valid when explicitly clicked
    },
  ];

  // Initialize state from AsyncStorage
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [installDate, sessionCount, lastTriggerShown, triggerHistory, hasConverted] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE),
          AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_TRIGGER_SHOWN),
          AsyncStorage.getItem(STORAGE_KEYS.TRIGGER_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_CONVERTED),
        ]);

      this.state = {
        installDate: installDate ? new Date(installDate) : new Date(),
        sessionCount: sessionCount ? parseInt(sessionCount, 10) : 0,
        lastTriggerShown: lastTriggerShown ? new Date(lastTriggerShown) : null,
        triggerHistory: triggerHistory ? JSON.parse(triggerHistory) : [],
        hasConverted: hasConverted === 'true',
      };

      // Save install date if it's new
      if (!installDate) {
        await this.saveState();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ConversionTriggerManager:', error);
      // Initialize with defaults on error
      this.state = {
        installDate: new Date(),
        sessionCount: 0,
        lastTriggerShown: null,
        triggerHistory: [],
        hasConverted: false,
      };
      this.isInitialized = true;
    }
  }

  // Save current state to AsyncStorage
  private async saveState(): Promise<void> {
    if (!this.state) return;

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, this.state.installDate?.toISOString() || ''),
        AsyncStorage.setItem(STORAGE_KEYS.SESSION_COUNT, this.state.sessionCount.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_TRIGGER_SHOWN, this.state.lastTriggerShown?.toISOString() || ''),
        AsyncStorage.setItem(STORAGE_KEYS.TRIGGER_HISTORY, JSON.stringify(this.state.triggerHistory)),
        AsyncStorage.setItem(STORAGE_KEYS.HAS_CONVERTED, this.state.hasConverted.toString()),
      ]);
    } catch (error) {
      console.error('Failed to save trigger state:', error);
    }
  }

  // Increment session count
  async incrementSessionCount(): Promise<void> {
    console.log('TriggerManager: incrementSessionCount called');
    await this.initialize();
    if (!this.state) {
      console.log('TriggerManager: No state to increment');
      return;
    }

    const oldCount = this.state.sessionCount;
    this.state.sessionCount += 1;
    console.log(`TriggerManager: Session count incremented from ${oldCount} to ${this.state.sessionCount}`);
    await this.saveState();
    console.log('TriggerManager: State saved successfully');
  }

  // Check which trigger should fire (if any)
  async checkTriggers(isPremium: boolean): Promise<TriggerType | null> {
    await this.initialize();
    if (!this.state) {
      console.log('TriggerManager: No state available');
      return null;
    }

    console.log('TriggerManager: Checking triggers with state:', {
      sessionCount: this.state.sessionCount,
      isPremium,
      hasConverted: this.state.hasConverted,
      lastTriggerShown: this.state.lastTriggerShown
    });

    // Never show triggers to premium users
    if (isPremium || this.state.hasConverted) {
      console.log('TriggerManager: User is premium or converted, skipping');
      return null;
    }

    // Check if we're in cooldown period from last trigger
    if (this.state.lastTriggerShown) {
      const hoursSinceLastTrigger =
        (Date.now() - this.state.lastTriggerShown.getTime()) / (1000 * 60 * 60);

      // Global minimum cooldown of 1 hour between any triggers
      if (hoursSinceLastTrigger < 1) {
        return null;
      }
    }

    // Find eligible triggers
    const eligibleTriggers = this.triggers
      .filter(trigger => {
        // Check condition
        const conditionMet = trigger.condition(this.state!);
        console.log(`TriggerManager: Checking ${trigger.type} - condition met: ${conditionMet}`);
        if (!conditionMet) return false;

        // Check specific cooldown if defined
        if (trigger.cooldownHours && this.state!.lastTriggerShown) {
          const lastShown = this.state!.triggerHistory
            .filter(h => h.type === trigger.type)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          if (lastShown) {
            const hoursSinceLastShown =
              (Date.now() - new Date(lastShown.timestamp).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastShown < trigger.cooldownHours) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => a.priority - b.priority);

    return eligibleTriggers.length > 0 ? eligibleTriggers[0].type : null;
  }

  // Record that a trigger was shown
  async recordTriggerShown(type: TriggerType, dismissed: boolean = false): Promise<void> {
    await this.initialize();
    if (!this.state) return;

    this.state.lastTriggerShown = new Date();
    this.state.triggerHistory.push({
      type,
      timestamp: new Date(),
      dismissed,
    });

    await this.saveState();
  }

  // Mark user as converted
  async markAsConverted(): Promise<void> {
    await this.initialize();
    if (!this.state) return;

    this.state.hasConverted = true;
    await this.saveState();
  }

  // Force trigger for explicit user action (upgrade button click)
  async forceTrigger(type: TriggerType): Promise<void> {
    await this.recordTriggerShown(type, false);
  }

  // Helper methods
  private getDaysSinceInstall(installDate: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - installDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Get current state (for debugging)
  async getState(): Promise<TriggerState | null> {
    await this.initialize();
    return this.state;
  }

  // Reset state (for testing)
  async resetState(): Promise<void> {
    await Promise.all(
      Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key))
    );
    this.state = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const conversionTriggerManager = new ConversionTriggerManager();