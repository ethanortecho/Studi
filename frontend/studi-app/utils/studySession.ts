import { apiClient } from './apiClient';

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
// All API calls now use apiClient which handles:
// - JWT Bearer token authentication
// - Automatic token refresh on 401
// - Retry logic with exponential backoff
// - Request deduplication for GET requests
// - Comprehensive error handling
// =============================================

// =============================================
// CATEGORY MANAGEMENT FUNCTIONS
// =============================================

export const fetchCategories = async (): Promise<Category[]> => {
  console.log("API: fetchCategories called");
  
  const response = await apiClient.get('/category-list/');
  
  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch categories');
  }
  
  console.log("API: fetchCategories data:", response.data);
  return response.data;
};

export const createCategory = async (name: string, color: string): Promise<Category> => {
  console.log("API: createCategory called with", name, color);
  
  const response = await apiClient.post('/category-list/', { name, color });
  
  if (response.error) {
    throw new Error(response.error.message || 'Failed to create category');
  }
  
  console.log("API: createCategory data:", response.data);
  return response.data;
};

export const updateCategory = async (id: string, name: string, color: string): Promise<Category> => {
  console.log("API: updateCategory called with", id, name, color);
  
  const response = await apiClient.put(`/categories/${id}/`, { name, color });
  
  if (response.error) {
    throw new Error(response.error.message || 'Failed to update category');
  }
  
  console.log("API: updateCategory data:", response.data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  console.log("API: deleteCategory called with", id);
  
  const response = await apiClient.delete(`/categories/${id}/`);
  
  if (response.error) {
    throw new Error(response.error.message || 'Failed to delete category');
  }
  
  console.log("API: deleteCategory successful");
};

export const fetchBreakCategory = async (): Promise<Category> => {
  console.log("API: fetchBreakCategory called");
  
  const response = await apiClient.get('/break-category/');
  
  if (response.error) {
    throw new Error(response.error.message || 'Failed to fetch break category');
  }
  
  console.log("API: fetchBreakCategory data:", response.data);
  return response.data;
};

// =============================================
// STUDY SESSION FUNCTIONS
// =============================================

export const createStudySession = async (startTime: Date) => {
    console.log("API: createStudySession called with", startTime);
    console.log("API: Sending UTC time to server:", startTime.toISOString());
    
    const response = await apiClient.post('/create-session/', { start_time: startTime });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to create study session');
    }
    
    console.log("API: createStudySession data:", response.data);
    return response.data;
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
    
    const response = await apiClient.put(`/end-session/${sessionId}/`, requestBody);
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to end study session');
    }
    
    return response.data;
  };

export const updateSessionRating = async (sessionId: string, productivityRating: number) => {
    console.log("API: updateSessionRating called with", sessionId, productivityRating);
    
    const response = await apiClient.put(`/update-session-rating/${sessionId}/`, {
      productivity_rating: productivityRating
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to update session rating');
    }
    
    console.log("API: updateSessionRating response:", response.data);
    return response.data;
  };
  
// =============================================
// CATEGORY BLOCK FUNCTIONS
// =============================================

export const createCategoryBlock = async (sessionId: string, categoryId: string, startTime: Date) => {
    console.log("API: createCategoryBlock called with", categoryId, startTime);
    console.log("API: Sending UTC category block start time to server:", startTime.toISOString());
    
    const response = await apiClient.post('/create-category-block/', {
      study_session: sessionId,
      category: categoryId,
      start_time: startTime
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to create category block');
    }
    
    console.log("API: createCategoryBlock data:", response.data);
    return response.data;
  };
  
export const endCategoryBlock = async (categoryBlockId: string, endTime: Date) => {
    console.log("API: endCategoryBlock called with", categoryBlockId, endTime);
    console.log("API: Sending UTC category block end time to server:", endTime.toISOString());
    
    const response = await apiClient.put(`/end-category-block/${categoryBlockId}/`, {
      end_time: endTime
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to end category block');
    }
    
    return response.data;
  };

export const cancelStudySession = async (sessionId: string, endTime?: Date) => {
  console.log("API: cancelStudySession called with", sessionId, endTime);
  
  const requestBody: any = {};
  
  // If endTime provided, send as UTC
  if (endTime) {
    console.log("API: Sending UTC cancel time to server:", endTime.toISOString());
    requestBody.end_time = endTime;
  }
  
  const response = await apiClient.put(`/cancel-session/${sessionId}/`, requestBody);
  
  if (response.error) {
    throw new Error(response.error.message || 'Failed to cancel session');
  }
  
  console.log("API: cancelStudySession data:", response.data);
  return response.data;
};