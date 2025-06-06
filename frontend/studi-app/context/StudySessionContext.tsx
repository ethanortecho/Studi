import { useState, useEffect, createContext, ReactNode } from "react";
import { fetchCategories, Category, fetchBreakCategory } from '@/utils/studySession';
import { createStudySession, endStudySession, createCategoryBlock, endCategoryBlock } from '../utils/studySession';


interface StudySessionContextType {
  sessionId: number | null;
  currentCategoryBlockId: number | null;
  currentCategoryId: number | null;
  pausedCategoryId: number | null;
  breakCategory: Category | null;
  categories: Category[];
  isSessionPaused: boolean;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  pauseCategoryBlock: (currentCategoryId: number, breakCategoryId: number) => Promise<void>;
  switchCategory: (newCategoryId: number) => Promise<void>;
}

export const StudySessionContext = createContext<StudySessionContextType>({
  sessionId: null,
  currentCategoryBlockId: null,
  currentCategoryId: null,
  pausedCategoryId: null,
  breakCategory: null,
  categories: [],
  isSessionPaused: false,
  startSession: () => Promise.resolve(),
  stopSession: () => Promise.resolve(),
  pauseSession: () => Promise.resolve(),
  resumeSession: () => Promise.resolve(),
  pauseCategoryBlock: () => Promise.resolve(),
  switchCategory: () => Promise.resolve(),
});

export const StudySessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentCategoryBlockId, setCurrentCategoryBlockId] = useState<number | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);
  const [pausedCategoryId, setPausedCategoryId] = useState<number | null>(null);
  const [breakCategory, setBreakCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Computed property: session is paused if we have a paused category ID
  const isSessionPaused = pausedCategoryId !== null;

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
      const res = await createStudySession(new Date());
      console.log("Hook: setSessionId to", res.id);
      setSessionId(res.id);
      return res;
    } catch (error) {
      console.error("Hook error in startSession:", error);
      throw error;
    }
  };

  const stopSession = async () => {
    console.log("Hook: stopSession called, sessionId:", sessionId);
    if (sessionId) {
      try {
        const res = await endStudySession(String(sessionId), new Date());
        setSessionId(null);
        setCurrentCategoryBlockId(null);
        setCurrentCategoryId(null);
        setPausedCategoryId(null);
        return res;
      } catch (error) {
        console.error("Hook error in stopSession:", error);
        throw error;
      }
    }
  };

  const pauseSession = async () => {
    console.log("Hook: pauseSession called, currentCategoryId:", currentCategoryId);
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
    console.log("Hook: resumeSession called, pausedCategoryId:", pausedCategoryId);
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
    console.log("Hook: pauseCategoryBlock called", currentCategoryId, breakCategoryId);
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

  const switchCategory = async (newCategoryId: number) => {
    console.log("Hook: switchCategory called", newCategoryId, "isSessionPaused:", isSessionPaused);
    
    // Prevent category switching when session is paused
    if (isSessionPaused) {
      console.warn("Hook: Cannot switch categories while session is paused");
      throw new Error("Cannot switch categories while session is paused. Please resume the session first.");
    }
    
    console.log("Hook: SessionID when switchCategory is called", sessionId);
    if (!sessionId) {
      console.error("Hook: switchCategory called but sessionId is null");
      throw new Error("Session not running");
    }
    try {
      if (currentCategoryBlockId) {
        console.log("Hook: endCategoryBlock called", currentCategoryBlockId);
        await endCategoryBlock(String(currentCategoryBlockId), new Date());
      }
      //if session is running, create a new category block
      if (sessionId) {
        const res = await createCategoryBlock(String(sessionId), String(newCategoryId), new Date());
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

  return (
    <StudySessionContext.Provider value={{
      sessionId,
      currentCategoryBlockId,
      currentCategoryId,
      pausedCategoryId,
      breakCategory,
      categories,
      isSessionPaused,
      startSession,
      stopSession,
      pauseSession,
      resumeSession,
      pauseCategoryBlock,
      switchCategory
    }}>
      {children}
    </StudySessionContext.Provider>
  );
};  