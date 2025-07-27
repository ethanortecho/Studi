import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AUTH GUARD COMPONENT EXPLANATION
 * 
 * This component acts like a security guard for your app routes.
 * It checks if the user is authenticated before allowing access to protected screens.
 * 
 * HOW IT WORKS:
 * 1. Wraps protected components/screens
 * 2. Checks authentication state from AuthContext
 * 3. Shows loading spinner while checking
 * 4. Redirects to login if not authenticated
 * 5. Shows protected content if authenticated
 * 
 * USAGE:
 * <AuthGuard>
 *   <ProtectedComponent />
 * </AuthGuard>
 */

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // Custom loading component
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading, accessToken } = useAuth();

  useEffect(() => {
    // If loading is complete and user is not authenticated, redirect to login
    if (!isLoading && (!user || !accessToken)) {
      console.log('🚫 AuthGuard: User not authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [user, accessToken, isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('⏳ AuthGuard: Still checking authentication...');
    return fallback || <AuthLoadingScreen />;
  }

  // If user is not authenticated, show loading while redirect happens
  if (!user || !accessToken) {
    console.log('🚫 AuthGuard: User not authenticated, redirecting...');
    return fallback || <AuthLoadingScreen />;
  }

  // User is authenticated, show protected content
  console.log('✅ AuthGuard: User authenticated, showing protected content');
  return <>{children}</>;
}

/**
 * EXPLANATION: AuthLoadingScreen
 * 
 * This is shown while the app checks if user is logged in.
 * It appears briefly when app starts up.
 */
function AuthLoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-lg text-gray-600">
        Checking authentication...
      </Text>
    </View>
  );
}

/**
 * EXPLANATION: Higher-Order Component Pattern
 * 
 * This is a convenience function for quickly protecting entire screens.
 * Instead of wrapping every screen manually, you can use this pattern.
 */
export function withAuthGuard<T extends object>(
  Component: React.ComponentType<T>,
  loadingComponent?: React.ReactNode
) {
  return function AuthGuardedComponent(props: T) {
    return (
      <AuthGuard fallback={loadingComponent}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}