import React, { useEffect, useContext, useState } from 'react';
import { useConversion } from '../contexts/ConversionContext';
import { StudySessionContext } from '../context/StudySessionContext';

// Component to watch for session completion and trigger conversion checks
export const SessionCompleteTrigger = ({ children }: { children: React.ReactNode }) => {
  const conversionContext = useConversion();
  console.log('SessionCompleteTrigger: ConversionContext value:', conversionContext);
  console.log('SessionCompleteTrigger: onSessionComplete type:', typeof conversionContext?.onSessionComplete);

  const { onSessionComplete } = conversionContext || {};
  const { sessionStatsModal } = useContext(StudySessionContext);

  // Track if we've already triggered for this session to avoid duplicates
  const [hasTriggeredForSession, setHasTriggeredForSession] = useState(false);

  // Watch for session stats modal to appear (indicates session completion)
  useEffect(() => {
    console.log('SessionCompleteTrigger: Modal state changed', {
      isVisible: sessionStatsModal.isVisible,
      duration: sessionStatsModal.sessionDuration,
      hasTriggered: hasTriggeredForSession
    });

    // Trigger when modal becomes visible (session just ended)
    // Don't require duration > 0 as it might not be set immediately
    if (sessionStatsModal.isVisible && !hasTriggeredForSession) {
      console.log('SessionCompleteTrigger: Session completed, calling onSessionComplete');
      console.log('SessionCompleteTrigger: onSessionComplete exists?', !!onSessionComplete);

      setHasTriggeredForSession(true);

      // Session just completed, check for triggers
      if (onSessionComplete) {
        console.log('SessionCompleteTrigger: Calling onSessionComplete function');
        try {
          const result = onSessionComplete();
          console.log('SessionCompleteTrigger: onSessionComplete call result:', result);
          if (result && result.then) {
            result.then(() => {
              console.log('SessionCompleteTrigger: onSessionComplete promise resolved');
            }).catch((error: any) => {
              console.error('SessionCompleteTrigger: onSessionComplete promise rejected:', error);
            });
          }
        } catch (error) {
          console.error('SessionCompleteTrigger: Error calling onSessionComplete:', error);
        }
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