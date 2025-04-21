import React from 'react';
import { StyleSheet } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations } from '@/utils/parseDailyData';
import { format_Duration } from '@/utils/parseDailyData';
import CustomPieChart from '@/components/charts/CustomPieChart';
import SessionBreakdown from '@/components/charts/SessionBreakdown';
import { DailyInsightsResponse } from '@/types/api';
import { ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Insights from '@/app/Insights';
import TotalHours from '@/components/TotalHoursLayout';
import { Colors } from '@/constants/Colors';
import GoalChart from '@/components/charts/GoalChart';

export default function DailyDashboard() {
  const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);

  useEffect(() => {
    console.log('Starting fetch...');
    const fetchData = async () => {
      try {
        console.log('Making API request...');
        const response = await fetch('http://192.168.86.33:8000/api/insights/daily/?date=2025-01-21&username=testuser', {
          headers: {
            'Authorization': `Basic ${btoa('ethanortecho:Et8098d!')}`
          }
        });
        console.log('Response received:', response.status);
        const json = await response.json();
        console.log('API Response Structure:', JSON.stringify(json, null, 2));
        setDailyData(json);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const parsedDailyMetrics = useMemo(() => {
    if (!dailyData) return null;

    return {
      categoryDurations: parseCategoryDurations(dailyData),
      total_daily_hours: format_Duration(dailyData),
      timelineData: dailyData.timeline_data,
      categoryMetadata: dailyData.category_metadata
    };
  }, [dailyData]);

  return (
    <Insights>
      <ScrollView>
        <ThemedView style={styles.container}>
         

          {/* Main Dashboard Content */}
          <ThemedView style={styles.dashboardContainer}>
            {/* Summary Stats */}

            <ThemedView style = {styles.row} >
            <ThemedView style={[styles.summarySection, styles.box]}>
              {parsedDailyMetrics?.total_daily_hours && (
                <TotalHours
                  StudyTime={parsedDailyMetrics.total_daily_hours}
                />
              )}
            </ThemedView>
            <ThemedView style={styles.box}>
              <GoalChart/>
            </ThemedView>

            </ThemedView>
            

            {/* Session Breakdown */}
            <ThemedView style={styles.sessionSection}>
              {parsedDailyMetrics?.timelineData && (
                <SessionBreakdown 
                  timelineData={parsedDailyMetrics.timelineData}
                  categoryMetadata={parsedDailyMetrics.categoryMetadata}
                  width={300}
                />
              )}
            </ThemedView>

            {/* Subject Distribution */}
            <ThemedView style={styles.subjectSection}>
              {parsedDailyMetrics?.categoryDurations && (
                <CustomPieChart 
                  data={parsedDailyMetrics.categoryDurations}
                  size={150}
                />
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </Insights>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', // key to side-by-side
    justifyContent: 'space-between', // or 'center', 'flex-start'
    gap: 16, // optional spacing between items
  },
  box: {
    flex: 1, // optional, makes them evenly split
    
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 0,
  },
  timeframeSection: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 5,
    backgroundColor: Colors.light.surface,
  },
  dashboardContainer: {
    flex: 1,
    gap: 20,
  },
  summarySection: {
    width: '100%',
  },
  sessionSection: {
    width: '100%',
  },
  subjectSection: {
    width: '100%',
  },
});
