/**
 * Premium Features Configuration
 * Central configuration for all premium-locked features
 */

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  type: 'full_screen' | 'component' | 'data_limit' | 'chart';
}

export const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  MONTHLY_DASHBOARD: {
    id: 'monthly_dashboard',
    name: 'Monthly Dashboard',
    description: 'View your monthly study insights and trends',
    type: 'full_screen'
  },
  MAP_CHART_DAILY: {
    id: 'map_chart_daily',
    name: 'Daily Activity Map',
    description: 'See when you study throughout the day',
    type: 'chart'
  },
  MAP_CHART_WEEKLY: {
    id: 'map_chart_weekly', 
    name: 'Weekly Session Timeline',
    description: 'View your weekly study patterns',
    type: 'chart'
  },
  PRODUCTIVITY_CHART: {
    id: 'productivity_chart',
    name: 'Flow Score',
    description: 'Track your study quality and focus',
    type: 'component'
  },
  HISTORICAL_DATA: {
    id: 'historical_data_14plus',
    name: 'Historical Data',
    description: 'Access data older than 14 days',
    type: 'data_limit'
  }
};

// Helper to check if a feature requires premium
export function isPremiumFeature(featureId: string): boolean {
  return Object.values(PREMIUM_FEATURES).some(f => f.id === featureId);
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  HISTORICAL_DAYS: 14,  // Days of historical data accessible
  MAX_CATEGORIES: null,  // No limit on categories for now
  MAX_SESSIONS: null,    // No limit on sessions for now
};