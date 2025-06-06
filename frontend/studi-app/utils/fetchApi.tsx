import React from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';

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
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Create cache key for this request
    const cacheKey = useMemo(() => {
        return `${time_frame}-${start_date}${end_date ? `-${end_date}` : ''}`;
    }, [time_frame, start_date, end_date]);

    useEffect(() => {
        const fetchData = async() => {
            // Check cache first - but only for potentially final data
            // Use local date to match how sessions are stored
            const today = new Date();
            const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            const isCurrentDay = (time_frame === 'daily' && start_date === localToday) || 
                                 (time_frame === 'weekly' && start_date <= localToday && (!end_date || end_date >= localToday));
            
            // Only use cache for non-current periods (they should be final/immutable)
            if (!isCurrentDay && apiCache.has(cacheKey)) {
                console.log('Using cached data for:', cacheKey);
                cacheAccessTimes.set(cacheKey, Date.now()); // Update access time
                setData(apiCache.get(cacheKey));
                setLoading(false);
                return;
            }

            // Check if this request is already ongoing
            if (ongoingRequests.has(cacheKey)) {
                console.log('Request already in progress for:', cacheKey);
                try {
                    const cachedResult = await ongoingRequests.get(cacheKey);
                    setData(cachedResult);
                    setLoading(false);
                } catch (error) {
                    console.error('Error in ongoing request:', error);
                    setError(error);
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
                    console.log('Making API request for:', cacheKey, isCurrentDay ? '(LIVE - no cache)' : '(cacheable)', 'localToday:', localToday);

                    let response;
                    
                    if (time_frame === 'daily') {
                        response = await fetch(`http://127.0.0.1:8000/api/insights/${time_frame}/?date=${start_date}&username=ethanortecho`, {
                            headers: headers
                        });
                    } else { 
                        response = await fetch(`http://127.0.0.1:8000/api/insights/${time_frame}/?start_date=${start_date}&end_date=${end_date}&username=ethanortecho`, {
                            headers: headers
                        });
                    }

                    console.log('Response received:', response.status);
                    const json = await response.json();
                    
                    // Only cache final/historical data (not current day data)
                    if (!isCurrentDay && json.aggregate?.is_final !== false) {
                        apiCache.set(cacheKey, json);
                        cacheAccessTimes.set(cacheKey, Date.now());
                        manageCacheSize(); // Clean up old entries if needed
                        console.log('Cached data for:', cacheKey);
                    } else {
                        console.log('NOT caching (current/non-final data):', cacheKey);
                    }
                    
                    return json;
                } catch (error) {
                    console.error('Error fetching data:', error);
                    throw error;
                } finally {
                    // Remove from ongoing requests
                    ongoingRequests.delete(cacheKey);
                }
            })();

            // Store the ongoing request
            ongoingRequests.set(cacheKey, requestPromise);

            try {
                const result = await requestPromise;
                setData(result);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchData();
    }, [cacheKey]);
        
    return { data, loading, error };
}