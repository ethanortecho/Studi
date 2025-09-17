import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { conversionTriggerManager, TriggerType, TriggerState } from '../services/ConversionTriggerManager';
import { usePremium } from './PremiumContext';

interface ConversionContextType {
  // Trigger management
  checkForTriggers: () => Promise<void>;
  showUpgradeScreen: (source?: TriggerType) => void;
  dismissTrigger: () => void;

  // Session tracking
  onSessionComplete: () => Promise<void>;

  // State
  currentTrigger: TriggerType | null;
  triggerState: TriggerState | null;
}

const ConversionContext = createContext<ConversionContextType | undefined>(undefined);

export const ConversionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPremium } = usePremium();
  const [currentTrigger, setCurrentTrigger] = useState<TriggerType | null>(null);
  const [triggerState, setTriggerState] = useState<TriggerState | null>(null);


  // Initialize trigger manager on mount
  useEffect(() => {
    const initializeTriggers = async () => {
      await conversionTriggerManager.initialize();
      const state = await conversionTriggerManager.getState();
      setTriggerState(state);
    };

    initializeTriggers();
  }, []);

  // Check for triggers
  const checkForTriggers = useCallback(async () => {
    if (isPremium) return;

    const trigger = await conversionTriggerManager.checkTriggers(isPremium);

    if (trigger) {
      setCurrentTrigger(trigger);
      await conversionTriggerManager.recordTriggerShown(trigger);

      // Navigate to upgrade screen with trigger context
      // Small delay to ensure smooth transition
      setTimeout(() => {
        router.push({
          pathname: '/screens/upgrade',
          params: { trigger },
        });
      }, 500);
    }

    // Update state for debugging
    const state = await conversionTriggerManager.getState();
    setTriggerState(state);
  }, [isPremium]);

  // Show upgrade screen (for explicit user action)
  const showUpgradeScreen = useCallback((source: TriggerType = TriggerType.UPGRADE_BUTTON_CLICK) => {
    setCurrentTrigger(source);
    conversionTriggerManager.forceTrigger(source);

    router.push({
      pathname: '/screens/upgrade',
      params: { trigger: source },
    });
  }, []);

  // Dismiss current trigger
  const dismissTrigger = useCallback(() => {
    setCurrentTrigger(null);
  }, []);

  // Handle session completion
  const onSessionComplete = useCallback(async () => {
    if (isPremium) return;

    await conversionTriggerManager.incrementSessionCount();

    // Check for session-based triggers after a delay to allow navigation to complete
    // and session stats modal to appear
    setTimeout(async () => {
      await checkForTriggers();
    }, 2000); // 2 second delay to ensure smooth transition
  }, [isPremium, checkForTriggers]);

  // Check for Day 7 trigger on app launch
  useEffect(() => {
    const checkDay7Trigger = async () => {
      if (isPremium) return;

      const state = await conversionTriggerManager.getState();
      if (!state) return;

      // Check if it's been 7 days since install
      if (state.installDate) {
        const daysSinceInstall = Math.floor(
          (Date.now() - new Date(state.installDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceInstall >= 7 && !state.hasConverted) {
          await checkForTriggers();
        }
      }
    };

    // Check after a delay to avoid interfering with app launch
    const timer = setTimeout(checkDay7Trigger, 5000);
    return () => clearTimeout(timer);
  }, [isPremium, checkForTriggers]);

  const value = {
    checkForTriggers,
    showUpgradeScreen,
    dismissTrigger,
    onSessionComplete,
    currentTrigger,
    triggerState,
  };

  return (
    <ConversionContext.Provider value={value}>
      {children}
    </ConversionContext.Provider>
  );
};

export const useConversion = () => {
  const context = useContext(ConversionContext);
  if (context === undefined) {
    throw new Error('useConversion must be used within a ConversionProvider');
  }
  return context;
};