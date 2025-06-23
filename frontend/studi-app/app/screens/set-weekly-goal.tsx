import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WEEKLY_GOAL_OPTIONS } from '@/constants/goalOptions';
import { getApiUrl } from '@/config/api';
import { useWeeklyGoal } from '@/hooks/useWeeklyGoal';

export default function SetWeeklyGoalScreen() {
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEdit = params.edit !== undefined;

  // Fetch current goal when editing so we can pre-select
  const { goal, refetch } = useWeeklyGoal();

  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [carryOverEnabled, setCarryOverEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preselect when editing and once goal data arrives
  useEffect(() => {
    if (isEdit && goal && selectedMinutes === null) {
      setSelectedMinutes(goal.total_minutes);
      setCarryOverEnabled(goal.carry_over_enabled);
    }
  }, [isEdit, goal, selectedMinutes]);

  const headerText = isEdit
    ? 'Manage your weekly study goal'
    : 'How much time do you want to study each week?';

  async function handleSave() {
    if (selectedMinutes == null) return;
    setSaving(true);

    try {
      const body = {
        total_minutes: selectedMinutes,
        carry_over_enabled: carryOverEnabled,
      };

      const res = await fetch(getApiUrl('/goals/weekly/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa('ethanortecho:EthanVer2010!')}` },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok && res.status !== 201) {
        const text = await res.text();
        throw new Error(text);
      }
      await refetch(); // refresh guard state
      if (isEdit && router.canGoBack()) {
        router.back();
      } else {
        router.replace('/' as any);
      }
    } catch (error) {
      console.error('Failed to save weekly goal', error);
      // TODO: show user-facing error toast
    } finally {
      setSaving(false);
    }
  }

  function renderOption({ item }: { item: (typeof WEEKLY_GOAL_OPTIONS)[number] }) {
    const isSelected = selectedMinutes === item.minutes;
    return (
      <Pressable
        key={item.minutes}
        onPress={() => setSelectedMinutes(item.minutes)}
        className={`flex-row items-center justify-between px-4 py-3 border-b border-gray-700 ${isSelected ? 'bg-purple-600/20' : ''}`}
      >
        <Text className="text-lg text-gray-100 font-medium">{item.label}</Text>
        <Text className="text-sm text-gray-400">{item.description}</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 p-6">
        <Text className="text-center text-2xl font-bold text-gray-100 mb-8">
          {headerText}
        </Text>

        {/* Goal options table */}
        <View className="rounded-lg overflow-hidden border border-gray-700 mb-8">
          <FlatList
            data={WEEKLY_GOAL_OPTIONS}
            renderItem={renderOption}
            keyExtractor={(item) => String(item.minutes)}
          />
        </View>

        {/* Carry-over toggle */}
        <View className="flex-row items-center justify-between mb-10 px-1">
          <Text className="text-gray-100 text-lg">Carry over overtime</Text>
          <Switch
            value={carryOverEnabled}
            onValueChange={setCarryOverEnabled}
            trackColor={{ false: '#555', true: '#7c3aed' }}
            thumbColor="#fff"
          />
        </View>

        {/* Continue button */}
        <Pressable
          disabled={selectedMinutes == null || saving}
          onPress={handleSave}
          className={`py-4 rounded-lg ${selectedMinutes ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          <Text className="text-center text-lg font-semibold text-white">
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
} 