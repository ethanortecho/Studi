import { useState, useEffect, createContext, ReactNode } from "react";
import { fetchCategories, Category } from '@/utils/studySession';
import { createStudySession, endStudySession, createCategoryBlock, endCategoryBlock } from '../utils/studySession';


interface StudySessionContextType {
  sessionId: number | null;
  currentCategoryBlockId: number | null;
  pausedCategoryId: number | null;
  categories: Category[];
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  pauseCategoryBlock: (currentCategoryId: number, breakCategoryId: number) => Promise<void>;
  switchCategory: (newCategoryId: number) => Promise<void>;
}

export const StudySessionContext = createContext<StudySessionContextType>({
  sessionId: null,
  currentCategoryBlockId: null,
  pausedCategoryId: null,
  categories: [],
  startSession: () => Promise.resolve(),
  stopSession: () => Promise.resolve(),
  pauseCategoryBlock: () => Promise.resolve(),
  switchCategory: () => Promise.resolve(),
});

export const StudySessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentCategoryBlockId, setCurrentCategoryBlockId] = useState<number | null>(null);
  const [pausedCategoryId, setPausedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
      fetchCategories()
          .then(setCategories)
          .catch(error => console.error('Error fetching categories:', error));
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
        return res;
      } catch (error) {
        console.error("Hook error in stopSession:", error);
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
    console.log("Hook: switchCategory called", newCategoryId);
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
      pausedCategoryId,
      categories,
      startSession,
      stopSession,
      pauseCategoryBlock,
      switchCategory
    }}>
      {children}
    </StudySessionContext.Provider>
  );
};  