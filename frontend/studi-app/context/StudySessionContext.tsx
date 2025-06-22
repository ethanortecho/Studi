import { useState, useEffect, createContext, ReactNode } from "react";
import { fetchCategories, Category, fetchBreakCategory } from '@/utils/studySession';
import { createStudySession, endStudySession, createCategoryBlock, endCategoryBlock, cancelStudySession } from '../utils/studySession';
import SessionStatsModal from '@/components/modals/SessionStatsModal';


interface StudySessionContextType {
  sessionId: number | null;
  currentCategoryBlockId: number | null;
  currentCategoryId: number | null;
  pausedCategoryId: number | null;
  breakCategory: Category | null; 
  categories: Category[];
  isSessionPaused: boolean;
  // Session stats modal state
  sessionStatsModal: {
    isVisible: boolean;
    sessionDuration: number; // in minutes
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

  // Session stats modal state
  const [sessionStatsModal, setSessionStatsModal] = useState({
    isVisible: false,
    sessionDuration: 0,
  });

  // Computed property: session is paused if we have a paused category ID
  const isSessionPaused = pausedCategoryId !== null;

  // Helper function to get category name by id
  const getCategoryNameById = (id: number | string | null) => {
    if (id === null || id === undefined) return 'Unknown';
    const cat = categories.find(c => Number(c.id) === Number(id));
    return cat ? cat.name : 'Unknown';
  };

  useEffect(() => {
      fetchCategories()
          .then(setCategories)
          .catch(error => console.error('Error fetching categories:', error));
      
      fetchBreakCategory()
          .then(setBreakCategory)
          .catch(error => console.error('Error fetching break category:', error));
  }, []);

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

  const stopSession = async () => {
    console.log("Hook: stopSession called, sessionId:", sessionId);
    if (sessionId && sessionStartTime) {
      try {
        const sessionEndTime = new Date();
        const res = await endStudySession(String(sessionId), sessionEndTime);
        
        // Calculate total session duration (including breaks)
        const durationMs = sessionEndTime.getTime() - sessionStartTime.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        
        // Reset session state
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        setSessionStartTime(null);
        
        // Show session stats modal
        setSessionStatsModal({
          isVisible: true,
          sessionDuration: durationMinutes,
        });
        
        return res;
      } catch (error) {
        console.error("Hook error in stopSession:", error);
        throw error;
      }
    }
  };

  const pauseSession = async () => {
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
  };

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
        setCurrentCategoryId(newCategoryId);
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
        const res = await cancelStudySession(String(sessionId));
        // Reset all session state
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        setSessionStartTime(null);
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

  const hideSessionStats = () => {
    setSessionStatsModal({
      isVisible: false,
      sessionDuration: 0,
    });
  };

  const getCurrentCategoryColor = () => {
    if (currentCategoryId) {
      const category = categories.find(cat => Number(cat.id) === Number(currentCategoryId));
      return category?.color || '#E5E7EB';
    }
    return '#E5E7EB'; // Default gray if no category selected
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
      getCurrentCategoryColor,
    }}>
      {children}
      <SessionStatsModal
        visible={sessionStatsModal.isVisible}
        sessionDuration={sessionStatsModal.sessionDuration}
        onDismiss={hideSessionStats}
      />
    </StudySessionContext.Provider>
  );
};  