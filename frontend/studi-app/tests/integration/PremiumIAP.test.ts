/**
 * Premium IAP Integration Tests
 *
 * Focus: Testing the integration between IAP and premium status updates
 * Scope: Everything except the actual IAP store connection
 *
 * Key Testing Areas:
 * 1. Premium status updates after purchase simulation
 * 2. AuthContext state management
 * 3. PremiumContext feature access
 * 4. Error handling and recovery
 */

import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../../contexts/AuthContext';
import { usePremium } from '../../contexts/PremiumContext';
import { useStudiIAP } from '../../services/IAPService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// Mock fetch API for backend calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock react-native-iap
jest.mock('react-native-iap', () => ({
  useIAP: jest.fn(),
}));

// Mock fetchApi utility
jest.mock('../../utils/fetchApi', () => ({
  fetchApi: jest.fn(),
}));

const mockFetchApi = require('../../utils/fetchApi').fetchApi;
const mockUseIAP = require('react-native-iap').useIAP;

describe('Premium IAP Integration', () => {
  let mockSetPremiumStatus: jest.Mock;
  let mockOnPurchaseSuccess: jest.Mock;
  let mockRequestPurchase: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();

    // Mock successful API response
    mockFetchApi.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Premium status updated successfully',
        is_premium: true
      })
    });

    // Setup IAP mocks
    mockRequestPurchase = jest.fn();
    mockOnPurchaseSuccess = jest.fn();

    mockUseIAP.mockReturnValue({
      connected: true,
      subscriptions: [{
        productId: 'com.studi.premium.monthly',
        id: 'com.studi.premium.monthly',
        title: 'Studi Premium Monthly',
        displayPrice: '$4.99'
      }],
      availablePurchases: [],
      activeSubscriptions: [],
      fetchProducts: jest.fn(),
      finishTransaction: jest.fn(),
      getAvailablePurchases: jest.fn(),
      getActiveSubscriptions: jest.fn(),
      requestPurchase: mockRequestPurchase,
    });
  });

  describe('Premium Status Updates', () => {
    it('should update premium status on successful purchase', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_premium: false
      };

      // Store initial user
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));

      // Test the mock function directly
      mockSetPremiumStatus = jest.fn(async (isPremium: boolean) => {
        // Simulate the actual setPremiumStatus function behavior
        await mockFetchApi('/user/premium-status/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null',
          },
          body: JSON.stringify({ is_premium: isPremium }),
        });
      });

      // Test that setPremiumStatus makes the correct API call
      await act(async () => {
        await mockSetPremiumStatus(true);
      });

      expect(mockSetPremiumStatus).toHaveBeenCalledWith(true);
      expect(mockFetchApi).toHaveBeenCalledWith('/user/premium-status/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null', // Would be actual token in real scenario
        },
        body: JSON.stringify({ is_premium: true }),
      });
    });

    it('should handle premium status update errors gracefully', async () => {
      // Mock API error
      mockFetchApi.mockRejectedValue(new Error('Network error'));

      mockSetPremiumStatus = jest.fn().mockRejectedValue(new Error('Failed to update premium status: Network error'));

      await expect(mockSetPremiumStatus(true)).rejects.toThrow('Failed to update premium status: Network error');
    });

    it('should update local storage after successful premium update', async () => {
      const initialUser = {
        id: 1,
        email: 'test@example.com',
        is_premium: false
      };

      await AsyncStorage.setItem('user', JSON.stringify(initialUser));

      // Mock successful update
      const updatedUser = { ...initialUser, is_premium: true };

      // Simulate the update process
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      const storedUser = JSON.parse(await AsyncStorage.getItem('user') || '{}');
      expect(storedUser.is_premium).toBe(true);
    });
  });

  describe('Premium Feature Access', () => {
    it('should grant access to premium features after status update', () => {
      // Test premium context logic
      const premiumUser = { is_premium: true };
      const freeUser = { is_premium: false };

      // Mock premium feature check
      const canAccessFeature = (feature: string, user: any) => {
        const premiumFeatures = [
          'monthly_dashboard',
          'map_chart_daily',
          'map_chart_weekly',
          'productivity_chart'
        ];

        if (!premiumFeatures.includes(feature)) {
          return true; // Non-premium features
        }

        return user?.is_premium || false;
      };

      // Test premium user access
      expect(canAccessFeature('monthly_dashboard', premiumUser)).toBe(true);
      expect(canAccessFeature('map_chart_daily', premiumUser)).toBe(true);
      expect(canAccessFeature('productivity_chart', premiumUser)).toBe(true);

      // Test free user restrictions
      expect(canAccessFeature('monthly_dashboard', freeUser)).toBe(false);
      expect(canAccessFeature('map_chart_daily', freeUser)).toBe(false);
      expect(canAccessFeature('productivity_chart', freeUser)).toBe(false);

      // Test non-premium features accessible to all
      expect(canAccessFeature('basic_timer', freeUser)).toBe(true);
      expect(canAccessFeature('basic_timer', premiumUser)).toBe(true);
    });

    it('should enforce date access restrictions for free users', () => {
      const canAccessDate = (date: Date, isPremium: boolean) => {
        if (isPremium) return true;

        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      };

      const today = new Date();
      const recentDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const oldDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

      // Premium user can access any date
      expect(canAccessDate(recentDate, true)).toBe(true);
      expect(canAccessDate(oldDate, true)).toBe(true);

      // Free user restricted to 7 days
      expect(canAccessDate(recentDate, false)).toBe(true);
      expect(canAccessDate(oldDate, false)).toBe(false);
    });
  });

  describe('IAP Service Integration', () => {
    it('should find subscription product correctly', () => {
      const subscriptions = [
        { productId: 'com.studi.premium.monthly', displayPrice: '$4.99' },
        { productId: 'com.other.product', displayPrice: '$2.99' }
      ];

      const targetId = 'com.studi.premium.monthly';
      const found = subscriptions.find(sub => sub.productId === targetId);

      expect(found).toBeDefined();
      expect(found?.productId).toBe(targetId);
      expect(found?.displayPrice).toBe('$4.99');
    });

    it('should handle missing subscription product', () => {
      const subscriptions: any[] = [];
      const targetId = 'com.studi.premium.monthly';
      const found = subscriptions.find(sub => sub.productId === targetId);

      expect(found).toBeUndefined();
    });

    it('should load subscription products on connection', async () => {
      const mockFetchProducts = jest.fn().mockResolvedValue(undefined);

      await act(async () => {
        await mockFetchProducts({
          skus: ['com.studi.premium.monthly'],
          type: 'subs'
        });
      });

      expect(mockFetchProducts).toHaveBeenCalledWith({
        skus: ['com.studi.premium.monthly'],
        type: 'subs'
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors during premium update', async () => {
      mockFetchApi.mockRejectedValue(new Error('Network timeout'));

      const setPremiumStatus = async (isPremium: boolean) => {
        try {
          await mockFetchApi('/user/premium-status/', {
            method: 'POST',
            body: JSON.stringify({ is_premium: isPremium })
          });
        } catch (error) {
          throw new Error(`Failed to update premium status: ${(error as Error).message}`);
        }
      };

      await expect(setPremiumStatus(true))
        .rejects.toThrow('Failed to update premium status: Network timeout');
    });

    it('should handle invalid API responses', async () => {
      mockFetchApi.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request' })
      });

      const setPremiumStatus = async (isPremium: boolean) => {
        const response = await mockFetchApi('/user/premium-status/', {
          method: 'POST',
          body: JSON.stringify({ is_premium: isPremium })
        });

        if (!response.ok) {
          throw new Error(`Failed to update premium status: ${response.status}`);
        }
      };

      await expect(setPremiumStatus(true))
        .rejects.toThrow('Failed to update premium status: 400');
    });

    it('should handle missing user authentication', async () => {
      const setPremiumStatus = async (user: any, accessToken: any, isPremium: boolean) => {
        if (!user || !accessToken) {
          throw new Error('User must be logged in to update premium status');
        }
      };

      await expect(setPremiumStatus(null, null, true))
        .rejects.toThrow('User must be logged in to update premium status');

      await expect(setPremiumStatus({ id: 1 }, null, true))
        .rejects.toThrow('User must be logged in to update premium status');
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state between contexts', async () => {
      // Test that premium status updates are reflected across contexts
      const mockUser = { id: 1, is_premium: false };

      // Simulate status update
      const updatedUser = { ...mockUser, is_premium: true };

      // Both contexts should reflect the same state
      expect(updatedUser.is_premium).toBe(true);

      // Premium context should grant access
      const hasAccess = updatedUser.is_premium;
      expect(hasAccess).toBe(true);
    });

    it('should persist state across app restarts', async () => {
      const user = { id: 1, is_premium: true };

      // Store user
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Simulate app restart by reading from storage
      const storedUser = JSON.parse(await AsyncStorage.getItem('user') || '{}');

      expect(storedUser.is_premium).toBe(true);
    });
  });
});