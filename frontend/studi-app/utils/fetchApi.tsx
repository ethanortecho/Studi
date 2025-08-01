import React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

// Cache for storing API responses
const apiCache = new Map<string, any>();
// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<any>>();

// Cache management
const MAX_CACHE_SIZE = 50; // Keep last 50 API responses
const cacheAccessTimes = new Map<string, number>();

function manageCacheSize() {
    if (apiCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entries
        const sortedEntries = Array.from(cacheAccessTimes.entries())
            .sort(([,a], [,b]) => a - b);
        
        const entriesToRemove = sortedEntries.slice(0, 10); // Remove oldest 10
        entriesToRemove.forEach(([key]) => {
            apiCache.delete(key);
            cacheAccessTimes.delete(key);
        });
        
        // Cache cleaned
    }
}

// Export function to manually clear cache if needed
export function clearApiCache() {
    apiCache.clear();
    cacheAccessTimes.clear();
    ongoingRequests.clear();
    // API cache cleared
}

// Export cache stats for debugging
export function getCacheStats() {
    return {
        cacheSize: apiCache.size,
        ongoingRequests: ongoingRequests.size,
        cacheKeys: Array.from(apiCache.keys()),
        hitRate: cacheAccessTimes.size > 0 ? (apiCache.size / (apiCache.size + ongoingRequests.size)) : 0
    };
}

// Return cached response (if any) for a given key
export function getCachedResponse(cacheKey: string) {
    return apiCache.get(cacheKey);
}

// =============================================
// JWT AUTHENTICATION HELPERS
// =============================================

/**
 * EXPLANATION: getAuthHeaders()
 * 
 * This function handles the complex task of getting valid JWT tokens for API calls.
 * 
 * JWT tokens have two types:
 * - Access Token: Short-lived (24 hours), used for API requests
 * - Refresh Token: Long-lived (6 months), used to get new access tokens
 * 
 * When access token expires, we automatically get a new one using refresh token.
 * If refresh token is also expired, user needs to login again.
 */
async function getAuthHeaders(): Promise<{ [key: string]: string } | null> {
    try {
        // Get stored tokens from phone storage
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!accessToken) {
            console.log('❌ fetchApi: No access token found, user needs to login');
            return null;
        }

        // Try using current access token first
        // Using stored access token
        return {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

    } catch (error) {
        console.error('❌ fetchApi: Error getting auth headers:', error);
        return null;
    }
}

/**
 * EXPLANATION: refreshAccessToken()
 * 
 * When an API call returns 401 Unauthorized, it means our access token expired.
 * Instead of forcing user to login again, we automatically get a new access token
 * using the refresh token, then retry the original API call.
 * 
 * This creates a seamless user experience - they never get "logged out" 
 * while actively using the app.
 */
async function refreshAccessToken(): Promise<boolean> {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            console.log('❌ fetchApi: No refresh token available for token refresh');
            return false;
        }

        console.log('🔄 fetchApi: Access token expired, refreshing...');
        
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
            
            // Backend might also send new refresh token (token rotation)
            if (data.refresh) {
                await AsyncStorage.setItem('refreshToken', data.refresh);
            }
            
            // Token refresh successful
            return true;
        } else {
            console.log('❌ fetchApi: Refresh token expired, user needs to login again');
            // Clear all auth data since refresh token is invalid
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
            return false;
        }
    } catch (error) {
        console.error('❌ fetchApi: Token refresh failed:', error);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return false;
    }
}

/**
 * EXPLANATION: makeAuthenticatedRequest()
 * 
 * This is the smart API calling function that:
 * 1. Gets current JWT token
 * 2. Makes API request with token
 * 3. If token expired (401), automatically refreshes it and retries
 * 4. Returns response or handles authentication failure
 * 
 * This replaces the old hardcoded Basic auth system.
 */
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Get authentication headers
    let authHeaders = await getAuthHeaders();
    
    if (!authHeaders) {
        throw new Error('User not authenticated');
    }

    // Make first attempt with current token
    let response = await fetch(url, {
        ...options,
        headers: {
            ...authHeaders,
            ...options.headers,
        },
    });

    // If token expired, try to refresh and retry once
    if (response.status === 401) {
        console.log('🔄 fetchApi: Received 401, attempting token refresh...');
        
        const refreshSuccessful = await refreshAccessToken();
        
        if (refreshSuccessful) {
            console.log('🔄 fetchApi: Token refreshed, retrying original request...');
            
            // Get new auth headers and retry request
            authHeaders = await getAuthHeaders();
            if (authHeaders) {
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...authHeaders,
                        ...options.headers,
                    },
                });
            }
        } else {
            throw new Error('Authentication failed - please login again');
        }
    }

    return response;
}

export default function useAggregateData(time_frame: string, 
    start_date: string, 
    end_date?: string
  ) {
    const [data, setData] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Get current user for cache isolation
    const { user } = useAuth();
    
    // Create cache key for this request - INCLUDING USER ID for data isolation
    const cacheKey = useMemo(() => {
        if (!user?.id) {
            // No user logged in, use temporary key that won't be cached
            return `temp-${time_frame}-${start_date}${end_date ? `-${end_date}` : ''}`;
        }
        
        // Include user ID in cache key to prevent data leaks between users
        const key = `user-${user.id}-${time_frame}-${start_date}${end_date ? `-${end_date}` : ''}`;
        return key;
    }, [time_frame, start_date, end_date, user?.id]);

    useEffect(() => {
        const fetchData = async() => {
            // console.log('🚀 fetchApi: Starting fetch process for:', cacheKey);
            const overallStart = performance.now();
            
            // Check cache first
            // Use local date to match how sessions are stored
            const today = new Date();
            const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            const isCurrentDay = (time_frame === 'daily' && start_date === localToday) || 
                                 (time_frame === 'weekly' && start_date <= localToday && (!end_date || end_date >= localToday));
            
            // console.log('📅 fetchApi: Date analysis:', {
            //     cacheKey,
            //     localToday,
            //     isCurrentDay,
            //     willUseCache: true
            // });
            
            // Check cache for all data
            if (apiCache.has(cacheKey)) {
                // For current day, check if cache is recent (within 30 seconds for snappy navigation)
                if (isCurrentDay) {
                    const cacheTime = cacheAccessTimes.get(cacheKey) || 0;
                    const cacheAge = Date.now() - cacheTime;
                    const maxCurrentDayAge = 30 * 1000; // 30 seconds
                    
                    if (cacheAge > maxCurrentDayAge) {
                        // Cache expired, let it fall through to fresh fetch
                    } else {
                        // Use recent cache
                        cacheAccessTimes.set(cacheKey, Date.now());
                        setData(apiCache.get(cacheKey));
                        setLoading(false);
                        return;
                    }
                } else {
                    // Historical data - use cache without time limit
                    cacheAccessTimes.set(cacheKey, Date.now()); // Update access time
                    setData(apiCache.get(cacheKey));
                    setLoading(false);
                    return;
                }
            }

            // Cache miss - fetch from API

            // Check if this request is already ongoing
            if (ongoingRequests.has(cacheKey)) {
                try {
                    const cachedResult = await ongoingRequests.get(cacheKey);
                    setData(cachedResult);
                    setLoading(false);
                } catch (error) {
                    console.error('❌ fetchApi: Error in ongoing request:', error);
                    setError(error instanceof Error ? error.message : 'Unknown error occurred');
                    setLoading(false);
                }
                return;
            }

            // Create the request promise
            const requestPromise = (async () => {
                try {
                    const apiCallStart = performance.now();
                    // Making API request

                    /**
                     * EXPLANATION: JWT Authentication Integration
                     * 
                     * Old system: Used hardcoded username and Basic auth
                     * New system: JWT tokens automatically identify the user
                     * 
                     * Benefits:
                     * - No more hardcoded credentials
                     * - Automatic token refresh when expired
                     * - Secure user identification through JWT payload
                     * - No need to pass username in URL parameters
                     */

                    let response;
                    
                    if (time_frame === 'daily') {
                        // JWT tokens contain user identity, no need for username parameter
                        response = await makeAuthenticatedRequest(`${API_BASE_URL}/insights/${time_frame}/?date=${start_date}`);
                    } else { 
                        response = await makeAuthenticatedRequest(`${API_BASE_URL}/insights/${time_frame}/?start_date=${start_date}&end_date=${end_date}`);
                    }

                    const apiCallTime = performance.now() - apiCallStart;
                    // API response received
                    
                    const jsonParseStart = performance.now();
                    const json = await response.json();
                    const jsonParseTime = performance.now() - jsonParseStart;
                    // JSON parsing complete
                    
                    // Debug timezone data if needed
                    
                    // Cache all data - current day with short expiry, historical data permanently
                    const cacheStoreStart = performance.now();
                    apiCache.set(cacheKey, json);
                    cacheAccessTimes.set(cacheKey, Date.now());
                    manageCacheSize(); // Clean up old entries if needed
                    const cacheStoreTime = performance.now() - cacheStoreStart;
                    
                    if (isCurrentDay) {
                        // Current day data cached (30s expiry)
                    } else {
                        // Historical data cached permanently
                    }
                    
                    const totalTime = performance.now() - overallStart;
                    // Request cycle complete
                    
                    return json;
                } catch (error) {
                    const errorTime = performance.now() - overallStart;
                    console.error(`❌ fetchApi: Error after ${errorTime.toFixed(2)}ms for ${cacheKey}:`, error);
                    throw error;
                } finally {
                    // Remove from ongoing requests
                    ongoingRequests.delete(cacheKey);
                    // Cleaned up ongoing request
                }
            })();

            // Store the ongoing request
            ongoingRequests.set(cacheKey, requestPromise);
            // Added to ongoing requests

            try {
                const result = await requestPromise;
                setData(result);
                setLoading(false);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error occurred');
                setLoading(false);
            }
        };

        fetchData();
    }, [cacheKey]);
        
    return { data, loading, error };
}

/**
 * Clear dashboard cache entries for current day/week/month
 * Used when session ends to ensure fresh data is fetched
 */
export function clearDashboardCache() {
    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
        .toISOString().split('T')[0];
    
    // Clearing dashboard cache for current period
    
    // Clear daily cache for today
    const dailyKey = `daily-${localToday}`;
    if (apiCache.has(dailyKey)) {
        apiCache.delete(dailyKey);
        cacheAccessTimes.delete(dailyKey);
        console.log(`  ✅ Cleared daily cache: ${dailyKey}`);
    }
    
    // Clear weekly cache - find current week cache entry
    // Weekly cache key format: weekly-{week_start}-{week_end}
    for (const [key, value] of apiCache.entries()) {
        if (key.startsWith('weekly-')) {
            const parts = key.split('-');
            if (parts.length >= 3) {
                const weekStart = parts[1];
                const weekEnd = parts[2];
                
                // Check if today falls within this week range
                if (weekStart <= localToday && localToday <= weekEnd) {
                    apiCache.delete(key);
                    cacheAccessTimes.delete(key);
                    console.log(`  ✅ Cleared weekly cache: ${key}`);
                }
            }
        }
    }
    
    // Clear monthly cache - find current month cache entry
    // Monthly cache key format: monthly-{month_start}-{month_end}
    for (const [key, value] of apiCache.entries()) {
        if (key.startsWith('monthly-')) {
            const parts = key.split('-');
            if (parts.length >= 3) {
                const monthStart = parts[1];
                const monthEnd = parts[2];
                
                // Check if today falls within this month range
                if (monthStart <= localToday && localToday <= monthEnd) {
                    apiCache.delete(key);
                    cacheAccessTimes.delete(key);
                    console.log(`  ✅ Cleared monthly cache: ${key}`);
                }
            }
        }
    }
    
    console.log('🎉 Dashboard cache clearing completed');
}

/**
 * Clear all API cache entries (nuclear option)
 */
export function clearAllCache() {
    console.log('💥 Clearing ALL API cache...');
    apiCache.clear();
    cacheAccessTimes.clear();
    ongoingRequests.clear();
    console.log('✅ All cache cleared');
}