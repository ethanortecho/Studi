/**
 * Premium Chart Mockup Images Registry
 * 
 * This file manages static mockup images for premium charts.
 * When you create mockup images, add them here for easy management.
 */

import { ImageSourcePropType } from 'react-native';

export interface ChartMockup {
  id: string;
  name: string;
  image: ImageSourcePropType;
  description: string;
  defaultStyle?: object;
}

// Mockup images for different chart types
export const CHART_MOCKUPS: Record<string, ChartMockup> = {
  // Productivity/Flow Score Charts
  productivity_chart: {
    id: 'productivity_chart',
    name: 'Flow Score Chart',
    image: require('../assets/mockups/productivity-chart-mockup.png'), // You'll add this
    description: 'Beautiful flow score visualization with rich data',
    defaultStyle: {
      width: '100%',
      height: 220,
    }
  },

  // Map Charts  
  map_chart_daily: {
    id: 'map_chart_daily',
    name: 'Daily Study Map',
    image: require('../assets/mockups/daily-map-mockup.png'), // You'll add this
    description: 'Detailed daily study patterns visualization',
    defaultStyle: {
      width: '100%',
      height: 250,
    }
  },

  map_chart_weekly: {
    id: 'map_chart_weekly', 
    name: 'Weekly Study Map',
    image: require('../assets/mockups/weekly-map-mockup.png'), // You'll add this
    description: 'Weekly study patterns and trends',
    defaultStyle: {
      width: '100%',
      height: 250,
    }
  },

  // Alternative naming patterns for chart registry compatibility
  'map_chart': {
    id: 'map_chart',
    name: 'Study Map Chart',
    image: require('../assets/mockups/daily-map-mockup.png'),
    description: 'Study patterns visualization',
    defaultStyle: {
      width: '100%',
      height: 210,
    }
  },

  // Monthly Dashboard
  monthly_dashboard: {
    id: 'monthly_dashboard',
    name: 'Monthly Dashboard',
    image: require('../assets/mockups/monthly-dashboard-mockup.png'), // You'll add this
    description: 'Comprehensive monthly analytics dashboard',
    defaultStyle: {
      width: '100%',
      height: 400, // Larger for dashboard view
    }
  },
};

/**
 * Get mockup image for a specific feature
 */
export const getMockupForFeature = (featureId: string): ChartMockup | null => {
  return CHART_MOCKUPS[featureId] || null;
};

/**
 * Get all available mockups
 */
export const getAllMockups = (): ChartMockup[] => {
  return Object.values(CHART_MOCKUPS);
};