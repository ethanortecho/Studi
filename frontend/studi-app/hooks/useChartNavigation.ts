import { useState, useMemo, useCallback } from 'react';
import { ChartConfig, DashboardData } from '@/types/charts';

/**
 * Custom hook for managing chart navigation state
 * Handles active chart tracking and provides navigation methods
 */
export function useChartNavigation(
  charts: ChartConfig[],
  dashboardData: DashboardData
) {
  // Filter available charts based on data
  const availableCharts = useMemo(() => {
    return charts.filter(chart => chart.isAvailable(dashboardData));
  }, [charts, dashboardData]);

  // Track active chart index
  const [activeChartIndex, setActiveChartIndex] = useState(0);

  // Ensure active index is valid when available charts change
  const validActiveIndex = useMemo(() => {
    if (activeChartIndex >= availableCharts.length) {
      return 0;
    }
    return activeChartIndex;
  }, [activeChartIndex, availableCharts.length]);

  // Get current active chart
  const activeChart = useMemo(() => {
    return availableCharts[validActiveIndex] || null;
  }, [availableCharts, validActiveIndex]);

  // Navigation methods
  const setActiveChart = useCallback((index: number) => {
    if (index >= 0 && index < availableCharts.length) {
      setActiveChartIndex(index);
    }
  }, [availableCharts.length]);

  const nextChart = useCallback(() => {
    const nextIndex = (validActiveIndex + 1) % availableCharts.length;
    setActiveChartIndex(nextIndex);
  }, [validActiveIndex, availableCharts.length]);

  const previousChart = useCallback(() => {
    const prevIndex = validActiveIndex === 0 
      ? availableCharts.length - 1 
      : validActiveIndex - 1;
    setActiveChartIndex(prevIndex);
  }, [validActiveIndex, availableCharts.length]);

  return {
    availableCharts,
    activeChartIndex: validActiveIndex,
    activeChart,
    setActiveChart,
    nextChart,
    previousChart,
    hasMultipleCharts: availableCharts.length > 1,
  };
}