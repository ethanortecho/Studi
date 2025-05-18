import { useState, useEffect } from 'react';

// Types for study session
interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
}

export function useStudySession() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Start a new study session
  const startSession = () => {
    const newSession = {
      id: generateTempId(), // In a real app, this would come from the API
      startTime: new Date(),
      status: 'active' as const,
    };
    setSession(newSession);
    setTimerActive(true);
    setElapsed(0);
    
    // In a real implementation, you would make an API call here
    // to create the session on the backend
    // Example: api.post('/study-sessions', { start_time: newSession.startTime })
  };

  // Pause the current session
  const pauseSession = () => {
    if (session) {
      setTimerActive(false);
      setSession({
        ...session,
        status: 'paused',
      });
      
      // In a real implementation, update the session status in the backend
    }
  };

  // Resume a paused session
  const resumeSession = () => {
    if (session && session.status === 'paused') {
      setTimerActive(true);
      setSession({
        ...session,
        status: 'active',
      });
      
      // In a real implementation, update the session status in the backend
    }
  };

  // End the current session
  const endSession = () => {
    if (session) {
      const endTime = new Date();
      setTimerActive(false);
      setSession({
        ...session,
        endTime,
        status: 'completed',
      });
      
      // In a real implementation, update the session in the backend
      // Example: api.put(`/study-sessions/${session.id}`, { 
      //   end_time: endTime,
      //   status: 'completed'
      // })
    }
  };

  // Timer logic to update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && session) {
      interval = setInterval(() => {
        const now = new Date();
        const start = session.startTime;
        setElapsed(Math.floor((now.getTime() - start.getTime()) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [timerActive, session]);

  // Utility function to generate a temporary ID
  const generateTempId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  return {
    session,
    elapsed,
    timerActive,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
  };
} 