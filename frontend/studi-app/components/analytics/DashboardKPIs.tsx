import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

interface DashboardKPIsProps {
  totalTime?: { hours: number; minutes: number };
  percentGoal?: number | null;
  flowScore?: number;
}

export default function DashboardKPIs({ 
  totalTime,
  percentGoal,
  flowScore
}: DashboardKPIsProps) {
  // Calculate the circle progress for goal percentage
  const radius = 32;  // Scaled down from 35
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = percentGoal ? Math.min(Math.max(percentGoal, 0), 100) / 100 : 0;
  const strokeDashoffset = circumference - (circumference * progressPercentage);

  return (
    <View className="flex-row justify-between items-center mb-6 px-6">
      {/* Flow Score */}
      {flowScore !== undefined && (
        <View className="flex-1">
          <Text className="text-primaryText text-2xl font-bold text-center">
            {Math.round(flowScore)}
          </Text>
          <Text className="text-secondaryText text-base mt-1 text-center">Flow Score</Text>
        </View>
      )}

      {/* Total Study Time */}
      {totalTime && (
        <View className="flex-1 items-center">
          <View className="flex-row items-baseline">
            <Text className="text-primaryText text-2xl font-bold">{totalTime.hours}</Text>
            <Text className="text-primaryText text-2xl font-bold">h</Text>
            <Text className="text-primaryText text-2xl font-bold ml-1">{totalTime.minutes}</Text>
            <Text className="text-primaryText text-2xl font-bold">m</Text>
          </View>
          <Text className="text-secondaryText text-base mt-1">Study Time</Text>
        </View>
      )}

      {/* Goal Progress */}
      {percentGoal !== null && percentGoal !== undefined && (
        <View className="flex-1">
          <View className="items-center">
            <View className="relative">
              <Svg width={74} height={74}>
                {/* Background circle */}
                <Circle
                  cx={37}
                  cy={37}
                  r={radius}
                  stroke="#3A3D4D"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={37}
                  cy={37}
                  r={radius}
                  stroke="#5A4FCF"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 37 37)`}
                />
              </Svg>
              {/* Percentage and Goal text overlay - positioned outside SVG */}
              <View className="absolute inset-0 justify-center items-center">
                <Text className="text-primaryText text-base font-bold">
                  {Math.round(percentGoal)}%
                </Text>
                <Text className="text-secondaryText" style={{ fontSize: 11 }}>Goal</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}