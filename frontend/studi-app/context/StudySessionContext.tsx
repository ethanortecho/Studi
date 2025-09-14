import { useState, useEffect, createContext, ReactNode, useCallback } from "react";
import { AppState } from 'react-native';
import { fetchCategories, Category, fetchBreakCategory } from '../utils/studySession';
import { createStudySession, endStudySession, createCategoryBlock, endCategoryBlock, cancelStudySession, updateSessionRating } from '../utils/studySession';
import SessionStatsModal from '../components/modals/SessionStatsModal';
import { detectUserTimezone } from '../utils/timezoneUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEffectiveApiUrl } from '../config/api';
import { TimerRecoveryService, TimerRecoveryState } from '../services/TimerRecoveryService';
import { router } from 'expo-router';


interface StudySessionContextType {
  sessionId: number | null;
  sessionStartTime: Date | null;
  currentCategoryBlockId: number | null;
  currentCategoryId: number | null;
  pausedCategoryId: number | null;
  breakCategory: Category | null; 
  categories: Category[];
  isSessionPaused: boolean;
  // Timezone support
  userTimezone: string;
  // Session stats modal state
  sessionStatsModal: {
    isVisible: boolean;
    sessionDuration: number; // in minutes
    completedSessionId?: string; // For updating rating after session is completed
  };
  // Recovery state
  recoveredTimerState: TimerRecoveryState | null;
  clearRecoveredState: () => void;
  startSession: () => Promise<{ id: number }>;
  stopSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  pauseCategoryBlock: (currentCategoryId: number, breakCategoryId: number) => Promise<void>;
  switchCategory: (newCategoryId: number, overrideSessionId?: number) => Promise<void>;
  cancelSession: () => Promise<void>;
  // Session stats modal functions
  showSessionStats: (durationMinutes: number) => void;
  hideSessionStats: () => void;
  // Category management functions
  refreshCategories: () => Promise<void>;
  // Utility functions
  getCurrentCategoryColor: () => string;
}

export const StudySessionContext = createContext<StudySessionContextType>({
  sessionId: null,
  sessionStartTime: null,
  currentCategoryBlockId: null,
  currentCategoryId: null,
  pausedCategoryId: null,
  breakCategory: null,
  categories: [],
  isSessionPaused: false,
  userTimezone: 'UTC', // Default fallback
  sessionStatsModal: {
    isVisible: false,
    sessionDuration: 0,
  },
  recoveredTimerState: null,
  clearRecoveredState: () => {},
  startSession: () => Promise.resolve({ id: 0 }),
  stopSession: () => Promise.resolve(),
  pauseSession: () => Promise.resolve(),
  resumeSession: () => Promise.resolve(),
  pauseCategoryBlock: () => Promise.resolve(),
  switchCategory: () => Promise.resolve(),
  cancelSession: () => Promise.resolve(),
  showSessionStats: () => {},
  hideSessionStats: () => {},
  refreshCategories: () => Promise.resolve(),
  getCurrentCategoryColor: () => '#E5E7EB', // Default gray color
});

export const StudySessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentCategoryBlockId, setCurrentCategoryBlockId] = useState<number | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);
  const [pausedCategoryId, setPausedCategoryId] = useState<number | null>(null);
  const [breakCategory, setBreakCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Timezone state
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  
  // Background session management - track for analytics only
  const [backgroundStartTime, setBackgroundStartTime] = useState<Date | null>(null);

  // Session stats modal state
  const [sessionStatsModal, setSessionStatsModal] = useState({
    isVisible: false,
    sessionDuration: 0,
    completedSessionId: undefined,
  });

  // Store recovered timer state for timer components to use
  const [recoveredTimerState, setRecoveredTimerState] = useState<TimerRecoveryState | null>(null);

  // Computed property: session is paused if we have a paused category ID
  const isSessionPaused = pausedCategoryId !== null;

  // Helper function to get category name by id
  const getCategoryNameById = (id: number | string | null) => {
    if (id === null || id === undefined) return 'Unknown';
    const cat = categories.find(c => Number(c.id) === Number(id));
    return cat ? cat.name : 'Unknown';
  };

  // Check for recoverable session on app launch
  const checkForRecoverableSession = async () => {
    try {
      const recovery = await TimerRecoveryService.checkRecoveryNeeded();
      
      if (recovery.needed && recovery.state) {
        console.log('📱 Found recoverable session, auto-resuming:', {
          sessionId: recovery.state.sessionId,
          elapsed: recovery.elapsedTime,
          timerType: recovery.state.timerType,
        });
        
        // Auto-resume without modal
        await handleAutoRecovery(recovery.state, recovery.elapsedTime || 0);
      }
    } catch (error) {
      console.error('Failed to check for recoverable session:', error);
    }
  };

  // Auto-recovery without modal
  const handleAutoRecovery = async (state: TimerRecoveryState, elapsedTime: number) => {
    try {
      console.log('🔄 Recovering session:', state.sessionId);
      
      // Restore all session state from the saved recovery data
      // The backend already has these entities, we're just reconnecting to them
      setSessionId(state.sessionId);
      setCurrentCategoryId(state.categoryId);
      
      // Restore the session start time if available
      if (state.sessionStartTime) {
        setSessionStartTime(new Date(state.sessionStartTime));
        console.log('🔄 Restored session start time:', state.sessionStartTime);
      }
      
      // Restore the existing category block ID
      // No need to create a new block - the backend already has one
      if (state.categoryBlockId) {
        setCurrentCategoryBlockId(state.categoryBlockId);
        console.log('🔄 Restored existing category block ID:', state.categoryBlockId);
      }
      
      // Store the recovered state for timer component to use
      setRecoveredTimerState(state);
      
      // Refresh categories to ensure we have latest data
      await refreshCategories();
      
      // Navigate to appropriate timer screen based on timer type
      const timerType = state.timerType;
      const categoryId = state.categoryId;
      
      // Small delay to ensure context is ready
      setTimeout(() => {
        switch (timerType) {
          case 'countdown':
            router.push({
              pathname: '/screens/timer/countdown',
              params: {
                duration: String(Math.floor((state.totalDuration || 300) / 60)),
                selectedCategoryId: String(categoryId || ''),
                recovered: 'true'
              }
            });
            break;
          case 'pomodoro':
            router.push({
              pathname: '/screens/timer/pomo',
              params: {
                pomodoroBlocks: String(state.pomoBlocks || 4),
                pomodoroWorkDuration: String(Math.floor((state.pomoWorkDuration || 1500) / 60)),
                pomodoroBreakDuration: String(Math.floor((state.pomoBreakDuration || 300) / 60)),
                selectedCategoryId: String(categoryId || ''),
                recovered: 'true'
              }
            });
            break;
          case 'stopwatch':
          default:
            router.push({
              pathname: '/screens/timer/stopwatch',
              params: {
                selectedCategoryId: String(categoryId || ''),
                recovered: 'true'
              }
            });
            break;
        }
      }, 100);
    } catch (error) {
      console.error('Failed to auto-recover session:', error);
    }
  };

  // Handle recovery modal actions

  const refreshCategories = async () => {
    try {
      const [categoriesData, breakCategoryData] = await Promise.all([
        fetchCategories(),
        fetchBreakCategory()
      ]);
      setCategories(categoriesData);
      setBreakCategory(breakCategoryData);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  };

  useEffect(() => {
    // Don't fetch categories on mount - they'll be fetched when needed
    // This prevents "User not authenticated" errors on app startup
    
    // Initialize timezone detection
    try {
      const timezone = detectUserTimezone();
      console.log('🕒 Detected user timezone:', timezone);
      setUserTimezone(timezone);
    } catch (error) {
      console.warn('⚠️ Failed to detect timezone:', error);
      setUserTimezone('UTC');
    }

    // Check for recoverable timer state
    checkForRecoverableSession();
  }, []);

  // Handle app state changes - track background time for analytics only
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('Hook: App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background
        if (sessionId) {
          console.log('Hook: App going to background with active session, tracking time for analytics');
          setBackgroundStartTime(new Date());
        }
      } else if (nextAppState === 'active') {
        // App coming back to foreground
        if (backgroundStartTime && sessionId) {
          const backgroundDuration = new Date().getTime() - backgroundStartTime.getTime();
          const backgroundMinutes = backgroundDuration / (1000 * 60);
          
          console.log(`Hook: App returning to foreground after ${backgroundMinutes.toFixed(1)} minutes`);
          // Just log it, don't auto-pause
        }
        
        // Clear background time when returning to active
        setBackgroundStartTime(null);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [sessionId, backgroundStartTime]);

  // Cleanup hanging sessions on app startup
  useEffect(() => {
    const checkForHangingSessions = async () => {
      try {
        console.log('Hook: Checking for hanging sessions on app startup...');
        
        // Import apiClient dynamically to avoid circular dependency
        const { apiClient } = await import('../utils/apiClient');
        
        // Check if authenticated first
        const isAuthenticated = await apiClient.isAuthenticated();
        if (!isAuthenticated) {
          console.log('Hook: Not authenticated, skipping hanging session cleanup');
          return;
        }
        
        const response = await apiClient.post('/cleanup-hanging-sessions/');
        
        if (!response.error && response.data) {
          if (response.data.cleaned_sessions > 0) {
            console.log(`Hook: Cleaned up ${response.data.cleaned_sessions} hanging session(s) on startup`);
          }
        } else if (response.error) {
          // Don't log network errors, they'll be handled by the toast system
          if (response.error.code !== 'NETWORK_ERROR' && response.error.code !== 'BACKOFF') {
            console.warn('Hook: Failed to check for hanging sessions:', response.error.message);
          }
        }
      } catch (error) {
        // Silently fail - this is not critical functionality
        console.log('Hook: Could not check for hanging sessions');
      }
    };
    
    // Run hanging session check on app startup (only once)
    checkForHangingSessions();
  }, []); // Empty dependency array - only run once on mount

  const startSession = async () => {
    console.log("Hook: startSession called");
    try {
      const sessionStartTime = new Date();
      const res = await createStudySession(sessionStartTime);
      console.log("Hook: setSessionId to", res.id);
      setSessionId(res.id);
      setSessionStartTime(sessionStartTime);
      return res;
    } catch (error) {
      console.error("Hook error in startSession:", error);
      throw error;
    }
  };

  const stopSession = useCallback(async () => {
    console.log("Hook: stopSession called, sessionId:", sessionId);
    if (sessionId && sessionStartTime) {
      try {
        const sessionEndTime = new Date();
        
        // Calculate total session duration (including breaks)
        const durationMs = sessionEndTime.getTime() - sessionStartTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        
        // Store session ID before resetting
        const currentSessionId = String(sessionId);
        
        // End session immediately (without rating) to ensure data is saved
        const res = await endStudySession(currentSessionId, sessionEndTime);
        
        // Dashboard will refresh naturally when navigating to it
        
        // Reset session state
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        setSessionStartTime(null);
        
        // Reset background tracking state
        setBackgroundStartTime(null);
        
        // Show session stats modal for rating
        setSessionStatsModal({
          isVisible: true,
          sessionDuration: durationMinutes,
          completedSessionId: currentSessionId, // Store completed session ID for rating update
        });
        
        return res;
      } catch (error) {
        console.error("Hook error in stopSession:", error);
        throw error;
      }
    }
  }, [sessionId, sessionStartTime]);

  const pauseSession = useCallback(async () => {
    console.log(`Hook: pauseSession called, currentCategory: ${getCategoryNameById(currentCategoryId)} (ID: ${currentCategoryId})`);
    if (!breakCategory) {
      console.error("Hook: breakCategory not available");
      throw new Error("Break category not available");
    }
    
    if (currentCategoryBlockId && currentCategoryId) {
      try {
        // Store the current category as paused before switching to break
        setPausedCategoryId(currentCategoryId);
        console.log("Hook: Set pausedCategoryId to", currentCategoryId);
        
        // End current category block and switch to break category
        await endCategoryBlock(String(currentCategoryBlockId), new Date());
        const res = await createCategoryBlock(String(sessionId), String(breakCategory.id), new Date());
        setCurrentCategoryBlockId(res.id);
        setCurrentCategoryId(Number(breakCategory.id));
        console.log("Hook: pauseSession completed, switched to break category");
        return res;
      } catch (error) {
        console.error("Hook error in pauseSession:", error);
        throw error;
      }
    }
  }, [currentCategoryBlockId, currentCategoryId, breakCategory, sessionId]);

  const resumeSession = async () => {
    console.log(`Hook: resumeSession called, pausedCategory: ${getCategoryNameById(pausedCategoryId)} (ID: ${pausedCategoryId})`);
    if (pausedCategoryId && currentCategoryBlockId) {
      try {
        // End break category block and switch back to paused category
        await endCategoryBlock(String(currentCategoryBlockId), new Date());
        const res = await createCategoryBlock(String(sessionId), String(pausedCategoryId), new Date());
        setCurrentCategoryBlockId(res.id);
        setCurrentCategoryId(pausedCategoryId);
        setPausedCategoryId(null);
        
        // Session resumed successfully
        
        console.log("Hook: resumeSession completed, switched back to study category");
        return res;
      } catch (error) {
        console.error("Hook error in resumeSession:", error);
        throw error;
      }
    }
  };

  const pauseCategoryBlock = async (currentCategoryId: number, breakCategoryId: number) => {
    console.log(`Hook: pauseCategoryBlock called from ${getCategoryNameById(currentCategoryId)} (ID: ${currentCategoryId}) to break category (ID: ${breakCategoryId})`);
    if (currentCategoryBlockId) {
      try {
        await endCategoryBlock(String(currentCategoryBlockId), new Date());
        const res = await createCategoryBlock(String(sessionId), String(breakCategoryId), new Date());
        setPausedCategoryId(currentCategoryId);
        setCurrentCategoryBlockId(res.id);
        return res;
      } catch (error) {
        console.error("Hook error in pauseCategoryBlock:", error);
        throw error;
      }
    }
  };

  const switchCategory = async (newCategoryId: number, overrideSessionId?: number) => {
    console.log(`Hook: switchCategory called to ${getCategoryNameById(newCategoryId)} (ID: ${newCategoryId}), isSessionPaused: ${isSessionPaused}`);
    
    // Prevent category switching when session is paused
    if (isSessionPaused) {
      console.warn("Hook: Cannot switch categories while session is paused");
      throw new Error("Cannot switch categories while session is paused. Please resume the session first.");
    }
    
    // Use override sessionId if provided, otherwise use context sessionId
    const activeSessionId = overrideSessionId || sessionId;
    console.log("Hook: SessionID when switchCategory is called", activeSessionId, "(override:", overrideSessionId, "context:", sessionId, ")");
    
    if (!activeSessionId) {
      console.error("Hook: switchCategory called but no active session");
      throw new Error("Session not running");
    }
    try {
      if (currentCategoryBlockId) {
        console.log("Hook: endCategoryBlock called", currentCategoryBlockId);
        await endCategoryBlock(String(currentCategoryBlockId), new Date());
      }
      //if session is running, create a new category block
      if (activeSessionId) {
        const res = await createCategoryBlock(String(activeSessionId), String(newCategoryId), new Date());
        setCurrentCategoryBlockId(res.id);
        setCurrentCategoryId(Number(newCategoryId));
        // Clear paused category when switching to a new category
        setPausedCategoryId(null);
        return res;
      }
    } catch (error) {
      console.error("Hook error in switchCategory:", error);
      throw error;
    }
  };

  const cancelSession = async () => {
    console.log("Hook: cancelSession called, sessionId:", sessionId);
    if (sessionId) {
      try {
        const cancelTime = new Date(); // Use local time when cancelling
        const res = await cancelStudySession(String(sessionId), cancelTime);
        
        // Dashboard will refresh naturally when navigating to it
        
        // Reset all session state
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        setSessionStartTime(null);
        
        // Reset background tracking state
        setBackgroundStartTime(null);
        console.log("Hook: cancelSession completed");
        return res;
      } catch (error) {
        console.error("Hook error in cancelSession:", error);
        throw error;
      }
    }
  };

  const showSessionStats = (durationMinutes: number) => {
    setSessionStatsModal({
      isVisible: true,
      sessionDuration: durationMinutes,
    });
  };

  const handleRatingSubmit = async (rating: number) => {
    console.log("Hook: handleRatingSubmit called with rating:", rating);
    
    const { completedSessionId } = sessionStatsModal;
    if (!completedSessionId) {
      throw new Error("No completed session ID found");
    }
    
    try {
      const res = await updateSessionRating(completedSessionId, rating);
      console.log("Hook: Session rating updated successfully:", rating);
      return res;
    } catch (error) {
      console.error("Hook: Failed to update session rating:", error);
      throw error;
    }
  };

  const hideSessionStats = () => {
    setSessionStatsModal({
      isVisible: false,
      sessionDuration: 0,
      completedSessionId: undefined,
    });
  };

  const getCurrentCategoryColor = () => {
    if (currentCategoryId) {
      const category = categories.find(cat => Number(cat.id) === Number(currentCategoryId));
      return category?.color || null;
    }
    return null; // Return null to let TimerScreen use theme background
  };

  const clearRecoveredState = () => {
    setRecoveredTimerState(null);
  };

  return (
    <StudySessionContext.Provider value={{
      sessionId,
      sessionStartTime,
      currentCategoryBlockId,
      currentCategoryId,
      pausedCategoryId,
      breakCategory,
      categories,
      isSessionPaused,
      userTimezone,
      sessionStatsModal,
      recoveredTimerState,
      clearRecoveredState,
      startSession,
      stopSession,
      pauseSession,
      resumeSession,
      pauseCategoryBlock,
      switchCategory,
      cancelSession,
      showSessionStats,
      hideSessionStats,
      refreshCategories,
      getCurrentCategoryColor,
    }}>
      {children}
      <SessionStatsModal
        visible={sessionStatsModal.isVisible}
        sessionDuration={sessionStatsModal.sessionDuration}
        onDismiss={hideSessionStats}
        onRatingSubmit={handleRatingSubmit}
      />
    </StudySessionContext.Provider>
  );
};  