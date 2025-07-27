import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * STUDY SESSION API UTILITIES - JWT AUTHENTICATION
 * 
 * This file contains all API calls related to study sessions, categories, and category blocks.
 * 
 * AUTHENTICATION UPGRADE:
 * - Old system: Hardcoded Basic auth with username/password
 * - New system: JWT Bearer tokens with automatic refresh
 * 
 * KEY IMPROVEMENTS:
 * - Automatic token refresh when expired
 * - No hardcoded credentials
 * - User identification through JWT payload (no username in URLs)
 * - Secure authentication flow
 */

export interface Category {
  id: string;
  name: string;
  color: string;
}

// =============================================
// JWT AUTHENTICATION HELPER
// =============================================

/**
 * EXPLANATION: makeAuthenticatedApiCall()
 * 
 * This is a smart wrapper around fetch() that:
 * 1. Automatically adds JWT Bearer token to requests
 * 2. Handles token refresh if access token expired (401 response)
 * 3. Retries the original request with new token
 * 4. Throws authentication error if refresh fails
 * 
 * This replaces the old AUTH_HEADER constant with dynamic JWT handling.
 */
async function makeAuthenticatedApiCall(url: string, options: RequestInit = {}): Promise<Response> {
  // Get current access token
  const accessToken = await AsyncStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('User not authenticated - please login');
  }

  // Make first attempt with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  // If token expired (401), try to refresh and retry
  if (response.status === 401) {
    console.log('🔄 studySession: Access token expired, attempting refresh...');
    
    const refreshSuccessful = await refreshToken();
    
    if (refreshSuccessful) {
      // Get new access token and retry
      const newAccessToken = await AsyncStorage.getItem('accessToken');
      if (newAccessToken) {
        console.log('🔄 studySession: Retrying request with new token...');
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`,
            ...options.headers,
          },
        });
      }
    } else {
      throw new Error('Authentication expired - please login again');
    }
  }

  return response;
}

/**
 * EXPLANATION: refreshToken()
 * 
 * When access token expires, use refresh token to get a new one.
 * This happens automatically behind the scenes.
 */
async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('❌ studySession: No refresh token available');
      return false;
    }

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
      
      // Store new refresh token if provided (token rotation)
      if (data.refresh) {
        await AsyncStorage.setItem('refreshToken', data.refresh);
      }
      
      console.log('✅ studySession: Token refresh successful');
      return true;
    } else {
      console.log('❌ studySession: Refresh token expired');
      // Clear all auth data
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return false;
    }
  } catch (error) {
    console.error('❌ studySession: Token refresh failed:', error);
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    return false;
  }
}

// =============================================
// CATEGORY MANAGEMENT FUNCTIONS
// =============================================

export const fetchCategories = async (): Promise<Category[]> => {
  console.log("API: fetchCategories called");
  
  // JWT tokens contain user identity - no need for username parameter
  const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/category-list/`);
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to fetch categories');
  }
  
  const data = await res.json();
  console.log("API: fetchCategories data:", data);
  return data;
};

export const createCategory = async (name: string, color: string): Promise<Category> => {
  console.log("API: createCategory called with", name, color);
  const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/category-list/`, {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to create category');
  }
  
  const data = await res.json();
  console.log("API: createCategory data:", data);
  return data;
};

export const updateCategory = async (id: string, name: string, color: string): Promise<Category> => {
  console.log("API: updateCategory called with", id, name, color);
  const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/categories/${id}/`, {
    method: "PUT",
    body: JSON.stringify({ name, color }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to update category');
  }
  
  const data = await res.json();
  console.log("API: updateCategory data:", data);
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  console.log("API: deleteCategory called with", id);
  const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/categories/${id}/`, {
    method: "DELETE",
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to delete category');
  }
  
  console.log("API: deleteCategory successful");
};

export const fetchBreakCategory = async (): Promise<Category> => {
  console.log("API: fetchBreakCategory called");
  const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/break-category/`);
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to fetch break category');
  }
  
  const data = await res.json();
  console.log("API: fetchBreakCategory data:", data);
  return data;
};

// =============================================
// STUDY SESSION FUNCTIONS
// =============================================

export const createStudySession = async (startTime: Date) => {
    console.log("API: createStudySession called with", startTime);
    console.log("API: Sending UTC time to server:", startTime.toISOString());
    
    const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/create-session/`, {
      method: "POST",
      body: JSON.stringify({ start_time: startTime }),
    });
    console.log("API: createStudySession response status:", res.status);
    const data = await res.json();
    console.log("API: createStudySession data:", data);
    return data;
  };
  
export const endStudySession = async (sessionId: string, endTime: Date, productivityRating?: number) => {
    console.log("API: endStudySession called with", sessionId, endTime, productivityRating);
    console.log("API: Sending UTC end time to server:", endTime.toISOString());
    
    const requestBody: any = {
      end_time: endTime,
      status: "completed"
    };
    
    // Add productivity rating if provided (1-5)
    if (productivityRating !== undefined && productivityRating >= 1 && productivityRating <= 5) {
      requestBody.productivity_rating = productivityRating.toString();
    }
    
    const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/end-session/${sessionId}/`, {
      method: "PUT",
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();
    return data;
  };

export const updateSessionRating = async (sessionId: string, productivityRating: number) => {
    console.log("API: updateSessionRating called with", sessionId, productivityRating);
    
    const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/update-session-rating/${sessionId}/`, {
      method: "PUT",
      body: JSON.stringify({
        productivity_rating: productivityRating
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || errorData.message || 'Failed to update session rating');
    }
    
    const data = await res.json();
    console.log("API: updateSessionRating response:", data);
    return data;
  };
  
// =============================================
// CATEGORY BLOCK FUNCTIONS
// =============================================

export const createCategoryBlock = async (sessionId: string, categoryId: string, startTime: Date) => {
    console.log("API: createCategoryBlock called with", categoryId, startTime);
    console.log("API: Sending UTC category block start time to server:", startTime.toISOString());
    
    const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/create-category-block/`, {
      method: "POST",
      body: JSON.stringify({ study_session: sessionId, category: categoryId, start_time: startTime }),
    });
    console.log("API: createCategoryBlock body:", JSON.stringify({ study_session: sessionId, category: categoryId, start_time: startTime }));
    console.log("API: createCategoryBlock response status:", res.status);
    const data = await res.json();
    return data;
  };
  
export const endCategoryBlock = async (categoryBlockId: string, endTime: Date) => {
    console.log("API: endCategoryBlock called with", categoryBlockId, endTime);
    console.log("API: Sending UTC category block end time to server:", endTime.toISOString());
    
    const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/end-category-block/${categoryBlockId}/`, {
      method: "PUT",
      body: JSON.stringify({ end_time: endTime }),
    });
    const data = await res.json();
    return data;
  };

export const cancelStudySession = async (sessionId: string, endTime?: Date) => {
  console.log("API: cancelStudySession called with", sessionId, endTime);
  
  const requestBody: any = {};
  
  // If endTime provided, send as UTC
  if (endTime) {
    console.log("API: Sending UTC cancel time to server:", endTime.toISOString());
    requestBody.end_time = endTime;
  }
  
  const res = await makeAuthenticatedApiCall(`${API_BASE_URL}/cancel-session/${sessionId}/`, {
    method: "PUT",
    body: JSON.stringify(requestBody),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.message || 'Failed to cancel session');
  }
  
  const data = await res.json();
  console.log("API: cancelStudySession data:", data);
  return data;
};