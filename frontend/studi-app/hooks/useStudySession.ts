import { useState } from 'react';
import { createStudySession, endStudySession, createCategoryBlock, endCategoryBlock } from '../utils/studySession';

export function useStudySession() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentCategoryBlockId, setCategoryBlockId] = useState<number | null>(null);
  const [pausedCategoryId, setPausedCategoryId] = useState<number | null>(null);
  

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
        setCategoryBlockId(res.id);
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
    try {
      if (currentCategoryBlockId) {
        console.log("Hook: endCategoryBlock called", currentCategoryBlockId);

        await endCategoryBlock(String(currentCategoryBlockId), new Date());
      }
      //if session is running, create a new category block
      if (sessionId) {
        
        const res = await createCategoryBlock(String(sessionId), String(newCategoryId), new Date());
        setCategoryBlockId(res.id);

        return res;
      }
    } catch (error) {
      console.error("Hook error in switchCategory:", error);
      throw error;
    }
  };

  return {
    sessionId,
    startSession,
    stopSession,
    switchCategory,
    pauseCategoryBlock,
  };
}