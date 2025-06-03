import React from 'react';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import DashboardCard from '@/components/insights/DashboardContainer';
import { CategoryMetadata } from '@/types/api';

interface MonthlyDashboardProps {
  totalHours: string;
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  rawData?: any;
  loading: boolean;
}

export default function MonthlyDashboard({
  totalHours,
  categoryDurations,
  categoryMetadata,
  rawData,
  loading
}: MonthlyDashboardProps) {
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Off-white container for dashboard content */}
        <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-3 py-4">
          
          {/* Legend */}
          <View className="p-4 pb-0">
            <DashboardCard>
              {categoryDurations && categoryMetadata && (
                <Legend
                  category_durations={categoryDurations}
                  category_metadata={categoryMetadata}
                />
              )}
            </DashboardCard>
          </View>

          {/* Total Hours */}
          <View className="px-4 pb-4">
            <View className="bg-layout-grey-blue rounded-lg p-4">
              <TotalHours totalHours={totalHours} />
            </View>
          </View>

          {/* Placeholder for additional monthly content */}
          <View className="px-4 pb-4">
            <ThemedView style={styles.messageContainer}>
              <ThemedText style={styles.messageText}>
                Additional monthly analytics coming soon...
              </ThemedText>
            </ThemedView>
          </View>
        </View>
        
        {/* Debug Data Viewer */}
        <View style={styles.debugContainer}>
          {rawData && (
            <DebugDataViewer 
              data={rawData} 
              label="Monthly Dashboard Raw Data" 
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        backgroundColor: Colors.light.surface,
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageText: {
        fontSize: 16,
        fontWeight: '500',
    },
    debugContainer: {
        marginTop: 10,
        marginBottom: 20,
        width: '100%',
    }
});