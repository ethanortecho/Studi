import React, { useState } from 'react';
import DailyDashboard from './Insights/DailyDashboard';
import WeeklyDashboard from './Insights/WeeklyDashboard';
import MonthlyDashboard from './Insights/MonthlyDashboard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Pressable, StyleSheet } from 'react-native';

export default function DashboardLayout() {
  const [selectedTab, setSelectedTab] = useState('daily');

  const renderDashboard = () => {
    switch (selectedTab) {
      case 'daily':
        return <DailyDashboard />;
      case 'weekly':
        return <WeeklyDashboard />;
      case 'monthly':
        return <MonthlyDashboard />;
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.tabRow}>
        <Pressable onPress={() => setSelectedTab('daily')} style={[styles.tab, selectedTab === 'daily' && styles.activeTab]}>
          <ThemedText style={styles.tabText}>Daily</ThemedText>
        </Pressable>
        <Pressable onPress={() => setSelectedTab('weekly')} style={[styles.tab, selectedTab === 'weekly' && styles.activeTab]}>
          <ThemedText style={styles.tabText}>Weekly</ThemedText>
        </Pressable>
        <Pressable onPress={() => setSelectedTab('monthly')} style={[styles.tab, selectedTab === 'monthly' && styles.activeTab]}>
          <ThemedText style={styles.tabText}>Monthly</ThemedText>
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.dashboardContainer}>
        {renderDashboard()}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEE',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dashboardContainer: {
    flex: 1,
  },
});