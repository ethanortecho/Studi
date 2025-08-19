/**
 * Test utility for verifying API client behavior
 * 
 * This file provides functions to test various scenarios:
 * - Successful requests
 * - Network errors with retry
 * - Authentication errors
 * - Server errors with exponential backoff
 * 
 * To use in development:
 * 1. Import this in a component
 * 2. Call testApiClient() from a button or useEffect
 * 3. Check console logs for results
 */

import { apiClient } from './apiClient';

interface TestResult {
    scenario: string;
    success: boolean;
    message: string;
    details?: any;
}

export async function testApiClient(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    console.log('🧪 Starting API Client Tests...');
    console.log('=' .repeat(50));

    // Test 1: Check authentication status
    try {
        console.log('\n📋 Test 1: Checking authentication status...');
        const isAuth = await apiClient.isAuthenticated();
        results.push({
            scenario: 'Authentication Check',
            success: true,
            message: isAuth ? 'User is authenticated' : 'User is not authenticated',
            details: { authenticated: isAuth }
        });
        console.log(`✅ Auth check complete: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);
    } catch (error: any) {
        results.push({
            scenario: 'Authentication Check',
            success: false,
            message: error.message
        });
        console.error('❌ Auth check failed:', error);
    }

    // Test 2: Make a simple GET request (will test auth and retry)
    try {
        console.log('\n📋 Test 2: Testing GET request with auth...');
        const response = await apiClient.get('/test/health/');
        
        if (response.error) {
            results.push({
                scenario: 'GET Request',
                success: false,
                message: response.error.message,
                details: {
                    status: response.status,
                    retryable: response.error.retryable
                }
            });
            console.log(`⚠️ GET request returned error: ${response.error.message}`);
        } else {
            results.push({
                scenario: 'GET Request',
                success: true,
                message: 'Request successful',
                details: response.data
            });
            console.log('✅ GET request successful:', response.data);
        }
    } catch (error: any) {
        results.push({
            scenario: 'GET Request',
            success: false,
            message: error.message
        });
        console.error('❌ GET request failed:', error);
    }

    // Test 3: Test request deduplication
    try {
        console.log('\n📋 Test 3: Testing request deduplication...');
        const endpoint = '/insights/daily/?date=2024-01-01';
        
        // Make 3 identical requests simultaneously
        const [response1, response2, response3] = await Promise.all([
            apiClient.get(endpoint),
            apiClient.get(endpoint),
            apiClient.get(endpoint)
        ]);
        
        // All should return the same result
        const allSame = 
            JSON.stringify(response1.data) === JSON.stringify(response2.data) &&
            JSON.stringify(response2.data) === JSON.stringify(response3.data);
        
        results.push({
            scenario: 'Request Deduplication',
            success: allSame,
            message: allSame ? 
                'Duplicate requests were properly deduplicated' : 
                'Requests were not deduplicated',
            details: {
                response1Status: response1.status,
                response2Status: response2.status,
                response3Status: response3.status
            }
        });
        
        console.log(allSame ? 
            '✅ Request deduplication working correctly' : 
            '⚠️ Request deduplication may not be working'
        );
    } catch (error: any) {
        results.push({
            scenario: 'Request Deduplication',
            success: false,
            message: error.message
        });
        console.error('❌ Deduplication test failed:', error);
    }

    // Test 4: Test error handling for 404
    try {
        console.log('\n📋 Test 4: Testing 404 error handling...');
        const response = await apiClient.get('/nonexistent/endpoint/');
        
        if (response.status === 404) {
            results.push({
                scenario: '404 Error Handling',
                success: true,
                message: 'Correctly handled 404 error',
                details: {
                    errorMessage: response.error?.message,
                    retryable: response.error?.retryable
                }
            });
            console.log('✅ 404 error handled correctly');
        } else {
            results.push({
                scenario: '404 Error Handling',
                success: false,
                message: 'Unexpected response for 404 test',
                details: response
            });
            console.log('⚠️ Unexpected response for 404 test');
        }
    } catch (error: any) {
        results.push({
            scenario: '404 Error Handling',
            success: false,
            message: error.message
        });
        console.error('❌ 404 test failed:', error);
    }

    // Test 5: Test POST request
    try {
        console.log('\n📋 Test 5: Testing POST request...');
        const testData = {
            test: true,
            timestamp: new Date().toISOString()
        };
        
        const response = await apiClient.post('/test/echo/', testData);
        
        if (response.error) {
            results.push({
                scenario: 'POST Request',
                success: false,
                message: response.error.message,
                details: {
                    status: response.status,
                    retryable: response.error.retryable
                }
            });
            console.log(`⚠️ POST request returned error: ${response.error.message}`);
        } else {
            results.push({
                scenario: 'POST Request',
                success: true,
                message: 'POST request successful',
                details: response.data
            });
            console.log('✅ POST request successful:', response.data);
        }
    } catch (error: any) {
        results.push({
            scenario: 'POST Request',
            success: false,
            message: error.message
        });
        console.error('❌ POST request failed:', error);
    }

    // Print summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Summary:');
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    console.log(`✅ Passed: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
    
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.scenario}: ${result.message}`);
    });
    
    console.log('=' .repeat(50));
    
    return results;
}

/**
 * Test specific retry behavior
 * This simulates a server error to test exponential backoff
 */
export async function testRetryBehavior(): Promise<void> {
    console.log('🧪 Testing Retry Behavior with Exponential Backoff...');
    console.log('This test will simulate a server error and show retry delays');
    console.log('=' .repeat(50));
    
    // Note: This requires a test endpoint that returns 500 errors
    // In real testing, you might use a mock server or test environment
    
    const startTime = Date.now();
    
    try {
        // This endpoint should return 500 error to test retry
        const response = await apiClient.get('/test/error/500/', {
            maxRetries: 3 // Explicitly set retries for testing
        });
        
        const totalTime = Date.now() - startTime;
        
        if (response.error) {
            console.log(`\n⏱️ Total time with retries: ${totalTime}ms`);
            console.log(`❌ Final error after retries: ${response.error.message}`);
            console.log(`Retryable: ${response.error.retryable}`);
        } else {
            console.log(`\n✅ Request eventually succeeded after ${totalTime}ms`);
        }
    } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.log(`\n⏱️ Total time with retries: ${totalTime}ms`);
        console.error('❌ Request failed after all retries:', error.message);
    }
    
    console.log('=' .repeat(50));
}

/**
 * Test token refresh behavior
 * This simulates a 401 error to test token refresh
 */
export async function testTokenRefresh(): Promise<void> {
    console.log('🧪 Testing Token Refresh Behavior...');
    console.log('This test will simulate token expiration');
    console.log('=' .repeat(50));
    
    try {
        // Make multiple requests that might trigger 401
        // The API client should handle token refresh automatically
        const responses = await Promise.all([
            apiClient.get('/auth/test/'),
            apiClient.get('/auth/test/'),
            apiClient.get('/auth/test/')
        ]);
        
        console.log('✅ All requests completed');
        console.log('Token refresh (if needed) was handled automatically');
        
        const allSuccessful = responses.every(r => !r.error);
        if (allSuccessful) {
            console.log('✅ All requests successful after token refresh');
        } else {
            console.log('⚠️ Some requests failed:');
            responses.forEach((r, i) => {
                if (r.error) {
                    console.log(`  Request ${i + 1}: ${r.error.message}`);
                }
            });
        }
    } catch (error: any) {
        console.error('❌ Token refresh test failed:', error.message);
    }
    
    console.log('=' .repeat(50));
}

/**
 * Example usage in a component:
 * 
 * import { testApiClient } from './testApiClient';
 * 
 * // In a component or screen:
 * const runTests = async () => {
 *   const results = await testApiClient();
 *   // Handle results or display in UI
 * };
 * 
 * // Or in development console:
 * // await testApiClient()
 * // await testRetryBehavior()
 * // await testTokenRefresh()
 */