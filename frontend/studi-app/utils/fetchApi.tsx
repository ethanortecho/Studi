import React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// JWT authentication is now handled by apiClient

export default function useAggregateData(time_frame: string, 
    start_date: string, 
    end_date?: string
  ) {
    const [data, setData] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    
    // Get user ID from AsyncStorage to avoid circular dependency
    useEffect(() => {
        AsyncStorage.getItem('user').then(userStr => {
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserId(user.id?.toString() || null);
                } catch {
                    setUserId(null);
                }
            } else {
                setUserId(null);
            }
        });
    }, []);
    
    // Create cache key for this request - INCLUDING USER ID for data isolation
    const cacheKey = useMemo(() => {
        if (!userId) {
            // No user logged in, use temporary key that won't be cached
            return `temp-${time_frame}-${start_date}${end_date ? `-${end_date}` : ''}`;
        }
        
        // Include user ID in cache key to prevent data leaks between users
        const key = `user-${userId}-${time_frame}-${start_date}${end_date ? `-${end_date}` : ''}`;
        return key;
    }, [time_frame, start_date, end_date, userId]);

    useEffect(() => {
        const fetchData = async() => {
            // Check if authenticated via API client
            const isAuthenticated = await apiClient.isAuthenticated();
            
            if (!isAuthenticated) {
                console.log('⏸️ fetchApi: Skipping fetch - user not authenticated');
                setData(null);
                setError(null);
                setLoading(false);
                return;
            }
            
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

                    let endpoint;
                    if (time_frame === 'daily') {
                        endpoint = `/insights/${time_frame}/?date=${start_date}`;
                    } else { 
                        endpoint = `/insights/${time_frame}/?start_date=${start_date}&end_date=${end_date}`;
                    }

                    // Use the new API client with built-in retry and error handling
                    const response = await apiClient.get(endpoint);

                    const apiCallTime = performance.now() - apiCallStart;
                    // API response received
                    
                    if (response.error) {
                        // Handle API errors
                        if (response.error.code === 'AUTH_EXPIRED') {
                            throw new Error('Your session has expired. Please log in again.');
                        }
                        throw new Error(response.error.message);
                    }
                    
                    const json = response.data;
                    // Data retrieved from API
                    
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
    }, [cacheKey, userId]);
        
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