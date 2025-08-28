import { useEffect } from 'react';
import { useToast } from '../components/error/ToastProvider';

/**
 * Hook to show toast notifications for API errors
 * Use this in screens that fetch data
 */
export function useApiWithToast(error: string | null | undefined, loading: boolean = false) {
  const { showToast } = useToast();

  useEffect(() => {
    if (error && !loading) {
      // Don't show toast for auth errors (user will be redirected to login)
      if (!error.includes('session has expired')) {
        showToast(error, 'error');
      }
    }
  }, [error, loading, showToast]);
}