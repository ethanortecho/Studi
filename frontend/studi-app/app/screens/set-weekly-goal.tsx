import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WEEKLY_GOAL_OPTIONS } from '../../constants/goalOptions';
import { useWeeklyGoal } from '../../hooks/useWeeklyGoal';
import { apiClient } from '../../utils/apiClient';

export default function SetWeeklyGoalScreen() {
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEdit = params.edit !== undefined;

  // Fetch current goal when editing so we can pre-select
  const { goal, refetch } = useWeeklyGoal();

  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [carryOverEnabled, setCarryOverEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 0=Mon, 1=Tue, etc. (backend indexing)
  const [saving, setSaving] = useState(false);

  // Preselect when editing and once goal data arrives
  useEffect(() => {
    if (isEdit && goal && selectedMinutes === null) {
      setSelectedMinutes(goal.total_minutes);
      setCarryOverEnabled(goal.carry_over_enabled);
      setSelectedDays(goal.active_weekdays || [0, 1, 2, 3, 4, 5, 6]);
    }
  }, [isEdit, goal, selectedMinutes]);

  const headerText = isEdit
    ? 'Manage your weekly study goal'
    : 'How much time do you want to study each week?';

  async function handleSave() {
    if (selectedMinutes == null || selectedDays.length === 0) return;
    setSaving(true);

    try {
      const body = {
        total_minutes: selectedMinutes,
        carry_over_enabled: carryOverEnabled,
        active_weekdays: selectedDays,
      };

      // Use API client for consistent authentication
      const response = await apiClient.post('/goals/weekly/', body);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Goal setup completion is now automatically detected via API
      // when the user creates their first goal

      await refetch(); // refresh guard state - wait for this to complete

      // Add a small delay to ensure the layout re-renders with the new goal state
      setTimeout(() => {
        if (isEdit && router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/home' as any);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to save weekly goal', error);
      // TODO: show user-facing error toast
    } finally {
      setSaving(false);
    }
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // 0=Mon, 1=Tue, etc.
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort();
      
      // Ensure at least one day is selected
      return newDays.length > 0 ? newDays : prev;
    });
  };

  function renderOption({ item }: { item: (typeof WEEKLY_GOAL_OPTIONS)[number] }) {
    const isSelected = selectedMinutes === item.minutes;
    return (
      <Pressable
        key={item.minutes}
        onPress={() => setSelectedMinutes(item.minutes)}
        className={`flex-row items-center justify-between px-4 py-3 border-b border-surface ${isSelected ? 'bg-accent/20' : ''}`}
      >
        <Text className="text-lg text-primaryText font-medium">{item.label}</Text>
        <Text className="text-sm text-secondaryText">{item.description}</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 p-6">
        <Text className="text-center text-2xl font-bold text-primaryText mb-8">
          {headerText}
        </Text>

        {/* Goal options table */}
        <View className="rounded-lg overflow-hidden border border-surface mb-8">
          <FlatList
            data={WEEKLY_GOAL_OPTIONS}
            renderItem={renderOption}
            keyExtractor={(item) => String(item.minutes)}
          />
        </View>

        {/* Carry-over toggle - Temporarily disabled for MVP */}
        {/*
        <View className="flex-row items-center justify-between mb-8 px-1">
          <Text className="text-primaryText text-lg">Carry over overtime</Text>
          <Switch
            value={carryOverEnabled}
            onValueChange={setCarryOverEnabled}
            trackColor={{ false: '#555', true: '#5D3EDA' }}
            thumbColor="#fff"
          />
        </View>
        */}

        {/* Study Days Selection */}
        <View className="mb-8">
          <Text className="text-primaryText text-lg font-medium mb-4">Study Days</Text>
          <Text className="text-secondaryText text-sm mb-4">
            Choose which days count toward your daily study goal
          </Text>
          
          <View className="flex-row justify-between mb-4">
            {dayLabels.map((label, index) => {
              const isSelected = selectedDays.includes(index);
              
              return (
                <Pressable
                  key={index}
                  onPress={() => toggleDay(index)}
                  className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                    isSelected 
                      ? 'bg-accent border-accent' 
                      : 'border-surface bg-background'
                  }`}
                >
                  <Text className={`font-semibold ${
                    isSelected ? 'text-white' : 'text-secondaryText'
                  }`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          
          <Text className="text-secondaryText text-xs text-center">
            {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected
            {selectedMinutes && selectedDays.length > 0 &&
              ` • ${Math.round(selectedMinutes / selectedDays.length)} min/day`
            }
          </Text>
        </View>

        {/* When changes take effect notice */}
        {isEdit && (
          <View className="mb-4 p-3 bg-surface/50 rounded-lg">
            <Text className="text-secondaryText text-sm text-center">
              ℹ️ Changes will take effect starting next Monday
            </Text>
          </View>
        )}

        {/* Continue button */}
        <Pressable
          disabled={selectedMinutes == null || selectedDays.length === 0 || saving}
          onPress={handleSave}
          className={`py-4 rounded-lg ${(selectedMinutes && selectedDays.length > 0) ? 'bg-accent' : 'bg-surface'}`}
        >
          <Text className="text-center text-lg font-semibold text-white">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
} 