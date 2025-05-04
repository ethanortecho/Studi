import React, { useState } from 'react';
import DailyDashboard from './Insights/DailyDashboard';
import WeeklyDashboard from './Insights/WeeklyDashboard';
import MonthlyDashboard from './Insights/MonthlyDashboard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Pressable, StyleSheet } from 'react-native';
import { dashboardStyles as styles } from '@/styles/dashboard';


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
    <ThemedView style={styles.tabContainer}>
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

