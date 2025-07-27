import { useState, useEffect, createContext, ReactNode, useCallback } from "react";
import { AppState } from 'react-native';
import { fetchCategories, Category, fetchBreakCategory } from '@/utils/studySession';
import { createStudySession, endStudySession, createCategoryBlock, endCategoryBlock, cancelStudySession, updateSessionRating } from '../utils/studySession';
import SessionStatsModal from '@/components/modals/SessionStatsModal';
import { detectUserTimezone } from '@/utils/timezoneUtils';
import { clearDashboardCache } from '@/utils/fetchApi';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface StudySessionContextType {
  sessionId: number | null;
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
  
  // Background session management
  const [backgroundStartTime, setBackgroundStartTime] = useState<Date | null>(null);
  const [sessionPausedDueToBackground, setSessionPausedDueToBackground] = useState(false);

  // Session stats modal state
  const [sessionStatsModal, setSessionStatsModal] = useState({
    isVisible: false,
    sessionDuration: 0,
    completedSessionId: undefined,
  });

  // Computed property: session is paused if we have a paused category ID
  const isSessionPaused = pausedCategoryId !== null;

  // Helper function to get category name by id
  const getCategoryNameById = (id: number | string | null) => {
    if (id === null || id === undefined) return 'Unknown';
    const cat = categories.find(c => Number(c.id) === Number(id));
    return cat ? cat.name : 'Unknown';
  };

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
    refreshCategories();
    
    // Initialize timezone detection
    try {
      const timezone = detectUserTimezone();
      console.log('🕒 Detected user timezone:', timezone);
      setUserTimezone(timezone);
    } catch (error) {
      console.warn('⚠️ Failed to detect timezone:', error);
      setUserTimezone('UTC');
    }
  }, []);

  // Handle app state changes with smart background session management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('Hook: App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background
        if (sessionId && !sessionPausedDueToBackground) {
          console.log('Hook: App going to background with active session, starting background timer');
          setBackgroundStartTime(new Date());
        }
      } else if (nextAppState === 'active') {
        // App coming back to foreground
        if (backgroundStartTime && sessionId) {
          const backgroundDuration = new Date().getTime() - backgroundStartTime.getTime();
          const backgroundMinutes = backgroundDuration / (1000 * 60);
          
          console.log(`Hook: App returning to foreground after ${backgroundMinutes.toFixed(1)} minutes`);
          
          if (backgroundMinutes > 30 && !sessionPausedDueToBackground) {
            // Auto-pause session due to extended background time
            console.log('Hook: Auto-pausing session due to extended background time (>30 min)');
            setSessionPausedDueToBackground(true);
            // Pause the current category block but don't end the session
            if (currentCategoryBlockId && currentCategoryId) {
              pauseSession().catch(error => {
                console.error('Hook: Failed to auto-pause session:', error);
              });
            }
          }
        }
        
        // Clear background time when returning to active
        setBackgroundStartTime(null);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [sessionId, backgroundStartTime, sessionPausedDueToBackground, currentCategoryBlockId, currentCategoryId, pauseSession]);

  // Cleanup hanging sessions on app startup
  useEffect(() => {
    const checkForHangingSessions = async () => {
      try {
        console.log('Hook: Checking for hanging sessions on app startup...');
        
        // Call backend endpoint to check for and cleanup hanging sessions
        // Use JWT authentication like our other API calls
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        if (!accessToken) {
          console.log('Hook: No access token available, skipping hanging session cleanup');
          return;
        }

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/cleanup-hanging-sessions/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.cleaned_sessions > 0) {
            console.log(`Hook: Cleaned up ${result.cleaned_sessions} hanging session(s) on startup`);
          }
        } else {
          console.warn('Hook: Failed to check for hanging sessions:', response.status);
        }
      } catch (error) {
        console.error('Hook: Error checking for hanging sessions:', error);
        // Don't throw - this shouldn't break app startup
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
        
        // Clear dashboard cache to ensure fresh data after session completion
        console.log('🔄 Session ended, clearing dashboard cache...');
        clearDashboardCache();
        
        // Reset session state
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        setSessionStartTime(null);
        
        // Reset background tracking state
        setBackgroundStartTime(null);
        setSessionPausedDueToBackground(false);
        
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
        
        // Clear background pause state if resuming after background auto-pause
        if (sessionPausedDueToBackground) {
          setSessionPausedDueToBackground(false);
          console.log("Hook: Cleared background pause state on manual resume");
        }
        
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
        
        // Clear dashboard cache to ensure fresh data after session cancellation
        console.log('❌ Session cancelled, clearing dashboard cache...');
        clearDashboardCache();
        
        // Reset all session state
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        setSessionStartTime(null);
        
        // Reset background tracking state
        setBackgroundStartTime(null);
        setSessionPausedDueToBackground(false);
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

  return (
    <StudySessionContext.Provider value={{
      sessionId,
      currentCategoryBlockId,
      currentCategoryId,
      pausedCategoryId,
      breakCategory,
      categories,
      isSessionPaused,
      userTimezone,
      sessionStatsModal,
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