import { StyleSheet } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations } from '@/utils/parseDailyData';
import { format_Duration } from '@/utils/parseDailyData';
import FocusPieChart from '@/components/charts/FocusPieChart';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [dailyData, setDailyData] = useState(null);


  useEffect(() => {
    console.log('Starting fetch...');
    const fetchData = async () => {
      try {
        console.log('Making API request...');
        const response = await fetch('http://127.0.0.1:8000/api/insights/daily/?date=2025-01-21&username=testuser', {
          headers: {
            'Authorization': `Basic ${btoa('ethanortecho:Et8098d!')}`
          }
        });
        console.log('Response received:', response.status);
        const json = await response.json();
        console.log('Fetched data:', json);
        setDailyData(json);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, []);

  // Add debug logs
  const parsedDailyMetrics = useMemo(() => {
    if (!dailyData) return null;

    return {
      categoryDurations: parseCategoryDurations(dailyData),
      total_daily_hours: format_Duration(dailyData) 
    };
  }, [dailyData]);

  return (
    <ThemedView style={styles.container}>
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Your Insights</ThemedText>
      </ThemedView>

      {/* Timeframe Selection */}
      <ThemedView style={styles.timeframeSection}>
        <ThemedText>TimeFrame selection box</ThemedText>
      </ThemedView>

      {/* Main Dashboard Content */}
      <ThemedView style={styles.dashboardContainer}>
        {/* Summary Stats */}
        <ThemedView style={styles.summarySection}>
          <ThemedText>Header insights: Total hours, longest session</ThemedText>
          <ThemedText>{parsedDailyMetrics?.total_daily_hours}</ThemedText>
        </ThemedView>

        {/* Session Breakdown */}
        <ThemedView style={styles.sessionSection}>
          <ThemedText>Session breakdown box</ThemedText>
        </ThemedView>

        {/* Focus Metrics */}
        <ThemedView style={styles.metricsSection}>
          <ThemedText>Focus Ratio</ThemedText>
        </ThemedView>

        {/* Subject Distribution */}
        <ThemedView style={styles.subjectSection}>
          <ThemedText>subject breakdown pie chart</ThemedText>
          {parsedDailyMetrics?.categoryDurations && (
            <FocusPieChart data={parsedDailyMetrics.categoryDurations} />
          )}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  timeframeSection: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  dashboardContainer: {
    flex: 1,
    gap: 20,
  },
  summarySection: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
  },
  sessionSection: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
  },
  metricsSection: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
  },
  subjectSection: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 5,
  },
});
