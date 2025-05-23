import { useContext } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';

export function useStudySession() {
  return useContext(StudySessionContext);
}