import React, { useEffect } from 'react';
import { useConversion } from '../contexts/ConversionContext';

// Hook to connect StudySessionContext events to ConversionContext
export const useSessionConversionTriggers = (
  sessionId: number | null,
  onStopSession: () => Promise<void>
) => {
  const { onSessionComplete } = useConversion();

  // Create a wrapped stopSession that includes conversion trigger check
  const stopSessionWithTriggers = async () => {
    // Call original stopSession
    await onStopSession();

    // Check for conversion triggers after session ends
    if (sessionId) {
      await onSessionComplete();
    }
  };

  return {
    stopSessionWithTriggers,
  };
};