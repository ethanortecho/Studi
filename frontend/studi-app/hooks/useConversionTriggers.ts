import { useEffect } from 'react';
import { useConversion } from '../contexts/ConversionContext';

// Hook to be used inside StudySessionProvider
export const useConversionTriggers = (sessionId: number | null) => {
  const conversionContext = useConversion ? useConversion() : null;

  // Trigger conversion check after session ends
  const checkSessionCompleteTrigger = async () => {
    if (conversionContext && sessionId) {
      await conversionContext.onSessionComplete();
    }
  };

  return {
    checkSessionCompleteTrigger,
  };
};