import React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

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
        
        console.log(`Cache cleaned: removed ${entriesToRemove.length} old entries`);
    }
}

// Export function to manually clear cache if needed
export function clearApiCache() {
    apiCache.clear();
    cacheAccessTimes.clear();
    ongoingRequests.clear();
    console.log('API cache cleared');
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

export default function useAggregateData(time_frame: string, 
    start_date: string, 
    end_date?: string
  ) {
    const [data, setData] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Create cache key for this request
    const cacheKey = useMemo(() => {
        const key = `${time_frame}-${start_date}${end_date ? `-${end_date}` : ''}`;
        console.log('🔑 fetchApi: Generated cache key:', key);
        return key;
    }, [time_frame, start_date, end_date]);

    useEffect(() => {
        const fetchData = async() => {
            console.log('🚀 fetchApi: Starting fetch process for:', cacheKey);
            const overallStart = performance.now();
            
            // Check cache first - but only for potentially final data
            // Use local date to match how sessions are stored
            const today = new Date();
            const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            const isCurrentDay = (time_frame === 'daily' && start_date === localToday) || 
                                 (time_frame === 'weekly' && start_date <= localToday && (!end_date || end_date >= localToday));
            
            console.log('📅 fetchApi: Date analysis:', {
                cacheKey,
                localToday,
                isCurrentDay,
                willUseCache: !isCurrentDay
            });
            
            // Only use cache for non-current periods (they should be final/immutable)
            if (!isCurrentDay && apiCache.has(cacheKey)) {
                console.log('💾 fetchApi: Cache HIT for:', cacheKey);
                const cacheRetrievalStart = performance.now();
                
                cacheAccessTimes.set(cacheKey, Date.now()); // Update access time
                setData(apiCache.get(cacheKey));
                setLoading(false);
                
                const cacheRetrievalTime = performance.now() - cacheRetrievalStart;
                console.log(`⚡ fetchApi: Cache retrieval took ${cacheRetrievalTime.toFixed(2)}ms for ${cacheKey}`);
                return;
            }

            console.log(`🔍 fetchApi: Cache MISS for ${cacheKey} (current day: ${isCurrentDay})`);

            // Check if this request is already ongoing
            if (ongoingRequests.has(cacheKey)) {
                console.log('⏳ fetchApi: Request already in progress for:', cacheKey);
                try {
                    const waitStart = performance.now();
                    const cachedResult = await ongoingRequests.get(cacheKey);
                    const waitTime = performance.now() - waitStart;
                    console.log(`⏱️ fetchApi: Waited ${waitTime.toFixed(2)}ms for ongoing request: ${cacheKey}`);
                    
                    setData(cachedResult);
                    setLoading(false);
                } catch (error) {
                    console.error('❌ fetchApi: Error in ongoing request:', error);
                    setError(error instanceof Error ? error.message : 'Unknown error occurred');
                    setLoading(false);
                }
                return;
            }

            const headers = {
                'Authorization': `Basic ${btoa('ethanortecho:EthanVer2010!')}`
            };

            // Create the request promise
            const requestPromise = (async () => {
                try {
                    const apiCallStart = performance.now();
                    console.log('🌐 fetchApi: Making API request for:', cacheKey, isCurrentDay ? '(LIVE - no cache)' : '(cacheable)', 'localToday:', localToday);

                    let response;
                    
                    if (time_frame === 'daily') {
                        response = await fetch(`${API_BASE_URL}/insights/${time_frame}/?date=${start_date}&username=ethanortecho`, {
                            headers: headers
                        });
                    } else { 
                        response = await fetch(`${API_BASE_URL}/insights/${time_frame}/?start_date=${start_date}&end_date=${end_date}&username=ethanortecho`, {
                            headers: headers
                        });
                    }

                    const apiCallTime = performance.now() - apiCallStart;
                    console.log(`🌐 fetchApi: API response received in ${apiCallTime.toFixed(2)}ms, status: ${response.status} for ${cacheKey}`);
                    
                    const jsonParseStart = performance.now();
                    const json = await response.json();
                    const jsonParseTime = performance.now() - jsonParseStart;
                    console.log(`📄 fetchApi: JSON parsing took ${jsonParseTime.toFixed(2)}ms for ${cacheKey}`);
                    
                    // Only cache final/historical data (not current day data)
                    if (!isCurrentDay && json.aggregate?.is_final !== false) {
                        const cacheStoreStart = performance.now();
                        apiCache.set(cacheKey, json);
                        cacheAccessTimes.set(cacheKey, Date.now());
                        manageCacheSize(); // Clean up old entries if needed
                        const cacheStoreTime = performance.now() - cacheStoreStart;
                        console.log(`💾 fetchApi: Data cached in ${cacheStoreTime.toFixed(2)}ms for ${cacheKey}`);
                    } else {
                        console.log('🚫 fetchApi: NOT caching (current/non-final data):', cacheKey);
                    }
                    
                    const totalTime = performance.now() - overallStart;
                    console.log(`✅ fetchApi: Complete request cycle took ${totalTime.toFixed(2)}ms for ${cacheKey}`);
                    
                    return json;
                } catch (error) {
                    const errorTime = performance.now() - overallStart;
                    console.error(`❌ fetchApi: Error after ${errorTime.toFixed(2)}ms for ${cacheKey}:`, error);
                    throw error;
                } finally {
                    // Remove from ongoing requests
                    ongoingRequests.delete(cacheKey);
                    console.log('🧹 fetchApi: Cleaned up ongoing request for:', cacheKey);
                }
            })();

            // Store the ongoing request
            ongoingRequests.set(cacheKey, requestPromise);
            console.log('📋 fetchApi: Added to ongoing requests:', cacheKey);

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