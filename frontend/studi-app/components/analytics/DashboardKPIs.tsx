import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

interface DashboardKPIsProps {
  totalTime?: { hours: number; minutes: number };
  percentGoal?: number | null;
  flowScore?: number;
  flowScoreTotal?: number;
}

export default function DashboardKPIs({ 
  totalTime,
  percentGoal,
  flowScore,
  flowScoreTotal = 10
}: DashboardKPIsProps) {
  // Calculate the circle progress for goal percentage
  const radius = 30;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = percentGoal ? (percentGoal / 100) : 0;
  const strokeDashoffset = circumference - (circumference * progressPercentage);

  return (
    <View className="flex-row justify-between items-center mb-6 px-6">
      {/* Flow Score */}
      {flowScore !== undefined && (
        <View className="flex-1">
          <Text className="text-primaryText text-2xl font-bold text-center">
            {flowScore}/{flowScoreTotal}
          </Text>
          <Text className="text-secondaryText text-base mt-1 text-center">Flow score</Text>
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
        <View className="flex-1 items-end">
          <View className="relative">
            <Text className="text-secondaryText text-base absolute top-2 left-1/2 transform -translate-x-1/2">Goal</Text>
            <Svg width={70} height={70}>
              {/* Background circle */}
              <Circle
                cx={35}
                cy={35}
                r={radius}
                stroke="#3A3D4D"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <Circle
                cx={35}
                cy={35}
                r={radius}
                stroke="#5A4FCF"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 35 35)`}
              />
              {/* Percentage text */}
              <Text
                x={35}
                y={40}
                textAnchor="middle"
                className="text-primaryText text-lg font-bold"
                fill="white"
              >
                {percentGoal}%
              </Text>
            </Svg>
          </View>
        </View>
      )}
    </View>
  );
}