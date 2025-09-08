import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
  canAccessDate: (date: Date) => boolean;
  canAccessWeek: (weekStartDate: Date) => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const isPremium = useMemo(() => {
    return user?.is_premium || false;
  }, [user]);

  const canAccessFeature = (feature: string): boolean => {
    // Define premium-only features
    const premiumFeatures = [
      'monthly_dashboard',
      'map_chart_daily',
      'map_chart_weekly', 
      'productivity_chart',
      'historical_data_14plus',
      'historical_daily_dashboard',
      'historical_weekly_dashboard'
    ];
    
    // If not a premium feature, everyone can access
    if (!premiumFeatures.includes(feature)) {
      return true;
    }
    
    // Otherwise, only premium users can access
    return isPremium;
  };

  const canAccessDate = (date: Date): boolean => {
    // Premium users can access any date
    if (isPremium) return true;
    
    // Free users limited to 7 days
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 7;
  };

  const canAccessWeek = (weekStartDate: Date): boolean => {
    // Premium users can access any week
    if (isPremium) return true;
    
    // For free users, check if ANY day in the week is within 7-day limit
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for comparison
    
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - 7);
    cutoffDate.setHours(0, 0, 0, 0); // Set to start of cutoff day
    
    // Generate all 7 days of the week (Monday through Sunday)
    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStartDate);
      day.setDate(weekStartDate.getDate() + i);
      day.setHours(12, 0, 0, 0); // Set to noon for comparison
      weekDays.push(day);
    }
    
    // If ANY day in the week is within the 7-day limit, allow full week access
    return weekDays.some(day => day >= cutoffDate);
  };

  const value = {
    isPremium,
    canAccessFeature,
    canAccessDate,
    canAccessWeek
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};