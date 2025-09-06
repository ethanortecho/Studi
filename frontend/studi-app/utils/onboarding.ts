import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false; // Default to showing onboarding if we can't determine status
  }
};

/**
 * Mark onboarding as completed
 */
export const completeOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error marking onboarding as completed:', error);
    throw error;
  }
};

/**
 * Reset onboarding status (useful for testing or allowing users to replay)
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
    throw error;
  }
};