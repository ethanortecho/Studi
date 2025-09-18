import AsyncStorage from '@react-native-async-storage/async-storage';
import { conversionTriggerManager } from '../services/ConversionTriggerManager';

// Debug utility to check conversion state
export const debugConversionState = async () => {
  try {
    // Get state from manager
    const state = await conversionTriggerManager.getState();

    console.log('=== CONVERSION DEBUG INFO ===');
    console.log('Session Count:', state?.sessionCount);
    console.log('Install Date:', state?.installDate);
    console.log('Last Trigger Shown:', state?.lastTriggerShown);
    console.log('Has Converted:', state?.hasConverted);
    console.log('Trigger History:', state?.triggerHistory);

    // Also check raw AsyncStorage values
    const rawSessionCount = await AsyncStorage.getItem('conversion_session_count');
    const rawInstallDate = await AsyncStorage.getItem('conversion_install_date');

    console.log('=== RAW ASYNCSTORAGE VALUES ===');
    console.log('Raw Session Count:', rawSessionCount);
    console.log('Raw Install Date:', rawInstallDate);

    return state;
  } catch (error) {
    console.error('Error debugging conversion state:', error);
  }
};

// Reset conversion state for testing
export const resetConversionState = async () => {
  try {
    await conversionTriggerManager.resetState();
    console.log('Conversion state reset successfully');
  } catch (error) {
    console.error('Error resetting conversion state:', error);
  }
};