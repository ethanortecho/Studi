import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

// =============================================
// TYPE DEFINITIONS - What our data looks like
// =============================================

// User information returned from backend
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string;
}

// Registration form data
interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  timezone?: string;
}

// What our AuthContext provides to components
interface AuthContextType {
  // Current state
  user: User | null;              // null = not logged in, User object = logged in
  accessToken: string | null;     // JWT token for API calls
  refreshToken: string | null;    // Token to get new access tokens
  isLoading: boolean;             // Are we still checking if user is logged in?
  
  // Actions users can take
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

// Create the context (initially undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API configuration
import { API_BASE_URL } from '../config/api';

// =============================================
// AUTH PROVIDER - The main authentication logic
// =============================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ==================
  // STATE VARIABLES
  // ==================
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  // ==================
  // INITIALIZATION
  // ==================
  // When app starts, check if user was previously logged in
  useEffect(() => {
    loadStoredAuth();
  }, []);

  /**
   * EXPLANATION: loadStoredAuth()
   * 
   * When the app starts, we need to check if the user was previously logged in.
   * In mobile apps, users expect to stay logged in even after closing the app.
   * 
   * AsyncStorage is like a permanent storage box on the user's phone.
   * We stored the user's tokens there when they logged in.
   */
  const loadStoredAuth = async () => {
    try {
      // Get all stored auth data at once (faster than individual calls)
      const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
        AsyncStorage.getItem('user')
      ]);

      // If we have all three pieces, user was previously logged in
      if (storedAccessToken && storedRefreshToken && storedUser) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser)); // Convert JSON string back to object
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to load stored auth:', error);
    } finally {
      setIsLoading(false); // Done checking, show the app
    }
  };

  // ==================
  // STORAGE HELPERS
  // ==================
  
  /**
   * EXPLANATION: storeAuth()
   * 
   * When user logs in successfully, we need to save their information
   * so they stay logged in when they close and reopen the app.
   */
  const storeAuth = async (tokens: { access: string; refresh: string }, userData: User) => {
    try {
      // Save all auth data to phone's storage
      await Promise.all([
        AsyncStorage.setItem('accessToken', tokens.access),
        AsyncStorage.setItem('refreshToken', tokens.refresh),
        AsyncStorage.setItem('user', JSON.stringify(userData)) // Convert object to JSON string
      ]);
      
      // Update our app's state
      setAccessToken(tokens.access);
      setRefreshToken(tokens.refresh);
      setUser(userData);
      
      // Clear API cache when user changes to prevent data leaks
      apiClient.clearCache();
    } catch (error) {
      console.error('❌ AuthContext: Failed to store auth:', error);
      throw error;
    }
  };

  /**
   * EXPLANATION: clearAuth()
   * 
   * When user logs out, we need to clear all their data
   * from both the app's memory and the phone's storage.
   */
  const clearAuth = async () => {
    try {
      // Remove all auth data from phone's storage
      await Promise.all([
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('user')
      ]);
      
      // Clear app's state
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      
      // Clear API cache when user logs out to prevent data leaks
      apiClient.clearCache();
    } catch (error) {
      console.error('❌ AuthContext: Failed to clear auth:', error);
    }
  };

  // ==================
  // AUTHENTICATION ACTIONS
  // ==================

  /**
   * EXPLANATION: login()
   * 
   * This is what happens when user enters email/password and taps "Login":
   * 1. Send credentials to your backend API
   * 2. Backend validates and returns JWT tokens + user info
   * 3. Store everything locally so user stays logged in
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthContext: Attempting login for:', email);
      
      // Call your backend's login endpoint
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ AuthContext: Login successful');
        
        // Store the tokens and user data
        await storeAuth(
          { access: data.access, refresh: data.refresh },
          data.user
        );
        
        return { success: true };
      } else {
        console.log('❌ AuthContext: Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login network error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  /**
   * EXPLANATION: register()
   * 
   * Similar to login, but creates a new user account first.
   * Your backend automatically logs them in after successful registration.
   */
  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 AuthContext: Attempting registration for:', userData.email);
      
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ AuthContext: Registration successful');
        
        // User is automatically logged in after registration
        await storeAuth(
          { access: data.access, refresh: data.refresh },
          data.user
        );
        
        return { success: true };
      } else {
        console.log('❌ AuthContext: Registration failed:', data.error);
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration network error:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  /**
   * EXPLANATION: refreshAccessToken()
   * 
   * JWT access tokens expire after 24 hours (you set this in backend).
   * Instead of forcing user to login again, we use the refresh token
   * to get a new access token automatically.
   * 
   * This happens behind the scenes when API calls fail with 401 Unauthorized.
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) {
      console.log('❌ AuthContext: No refresh token available');
      return false;
    }

    try {
      console.log('🔄 AuthContext: Refreshing access token');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store new access token
        await AsyncStorage.setItem('accessToken', data.access);
        setAccessToken(data.access);
        
        // Backend might also send new refresh token (token rotation)
        if (data.refresh) {
          await AsyncStorage.setItem('refreshToken', data.refresh);
          setRefreshToken(data.refresh);
        }
        
        console.log('✅ AuthContext: Token refresh successful');
        return true;
      } else {
        console.log('❌ AuthContext: Refresh token expired, logging out');
        // Refresh token is invalid/expired, user needs to login again
        await logout();
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Token refresh failed:', error);
      await logout();
      return false;
    }
  };

  /**
   * EXPLANATION: logout()
   * 
   * When user logs out:
   * 1. Tell backend to blacklist their refresh token (security)
   * 2. Clear all local data
   * 3. User gets redirected to login screen
   */
  const logout = async () => {
    try {
      console.log('👋 AuthContext: Logging out user');
      
      // Tell backend to blacklist the refresh token
      if (refreshToken && accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, // Need this to prove it's really us
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error('❌ AuthContext: Server logout failed:', error);
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local data
      await clearAuth();
      console.log('✅ AuthContext: Logout completed');
    }
  };

  // ==================
  // PROVIDE TO APP
  // ==================
  
  // Package everything up for components to use
  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =============================================
// CUSTOM HOOK - Easy way for components to use auth
// =============================================

/**
 * EXPLANATION: useAuth()
 * 
 * This is a "custom hook" that makes it easy for any component
 * to access authentication features.
 * 
 * Instead of writing complex context code in every component,
 * they just call: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};