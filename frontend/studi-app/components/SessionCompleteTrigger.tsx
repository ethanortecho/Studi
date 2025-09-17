import React, { useEffect, useContext, useState } from 'react';
import { useConversion } from '../contexts/ConversionContext';
import { StudySessionContext } from '../context/StudySessionContext';

// Component to watch for session completion and trigger conversion checks
export const SessionCompleteTrigger = ({ children }: { children: React.ReactNode }) => {
  const { onSessionComplete } = useConversion();
  const { sessionStatsModal } = useContext(StudySessionContext);

  // Track if we've already triggered for this session to avoid duplicates
  const [hasTriggeredForSession, setHasTriggeredForSession] = useState(false);

  // Watch for session stats modal to appear (indicates session completion)
  useEffect(() => {

    // Trigger when modal becomes visible (session just ended)
    // Don't require duration > 0 as it might not be set immediately
    if (sessionStatsModal.isVisible && !hasTriggeredForSession) {

      setHasTriggeredForSession(true);

      // Session just completed, check for triggers
      if (onSessionComplete) {
        onSessionComplete();
      } else {
        console.error('SessionCompleteTrigger: onSessionComplete is not available!');
      }
    }

    // Reset trigger flag when modal closes
    if (!sessionStatsModal.isVisible && hasTriggeredForSession) {
      setHasTriggeredForSession(false);
    }
  }, [sessionStatsModal.isVisible, hasTriggeredForSession, onSessionComplete]);

  return <>{children}</>;
};