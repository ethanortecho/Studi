import React from 'react';
import { View, Text } from 'react-native';

export function SkeletonBox({ width, height, className = '' }: { 
  width?: number | string; 
  height?: number | string; 
  className?: string;
}) {
  return (
    <View 
      style={{ width, height }}
      className={`bg-gray-300 rounded-lg animate-pulse ${className}`}
    />
  );
}

export function DashboardSkeleton({ type }: { type: 'daily' | 'weekly' }) {
  if (type === 'daily') {
    return (
      <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-3 py-4">
        {/* Legend Skeleton */}
        <View className="p-4 pb-0">
          <View className="bg-white rounded-lg p-4 mb-4">
            <SkeletonBox width="40%" height={20} className="mb-3" />
            <View className="flex-row gap-4">
              <SkeletonBox width={60} height={16} />
              <SkeletonBox width={80} height={16} />
              <SkeletonBox width={70} height={16} />
            </View>
          </View>
        </View>

        {/* Main Content Row */}
        <View className="flex-row gap-4 px-4">
          {/* Pie Chart */}
          <View className="flex-1">
            <View className="bg-white rounded-lg p-4">
              <SkeletonBox width="60%" height={16} className="mb-3" />
              <SkeletonBox width={120} height={120} className="self-center rounded-full" />
            </View>
          </View>

          {/* Right Column */}
          <View className="flex-1">
            {/* Total Hours */}
            <View className="bg-layout-grey-blue rounded-lg p-4 mb-2.5">
              <SkeletonBox width="50%" height={16} className="mb-2" />
              <SkeletonBox width="30%" height={24} />
            </View>
            
            {/* Placeholder */}
            <SkeletonBox width="100%" height={72} />
          </View>
        </View>

        {/* Bottom Chart */}
        <View className="px-4 pb-4 pt-4">
          <View className="bg-white rounded-lg p-4">
            <SkeletonBox width="40%" height={16} className="mb-3" />
            <SkeletonBox width="100%" height={120} />
          </View>
        </View>
      </View>
    );
  } else {
    return (
      <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-3 py-4">
        {/* Legend Skeleton */}
        <View className="p-4 pb-0">
          <View className="bg-white rounded-lg p-4 mb-4">
            <SkeletonBox width="40%" height={20} className="mb-3" />
            <View className="flex-row gap-4">
              <SkeletonBox width={60} height={16} />
              <SkeletonBox width={80} height={16} />
            </View>
          </View>
        </View>

        {/* Top Row */}
        <View className="flex-row gap-4 px-4 mb-4">
          {/* Pie Chart */}
          <View className="flex-1">
            <View className="bg-white rounded-lg p-4">
              <SkeletonBox width="60%" height={16} className="mb-3" />
              <SkeletonBox width={100} height={100} className="self-center rounded-full" />
            </View>
          </View>

          {/* Total Hours */}
          <View className="flex-1">
            <View className="bg-layout-grey-blue rounded-lg p-4">
              <SkeletonBox width="50%" height={16} className="mb-2" />
              <SkeletonBox width="30%" height={24} />
            </View>
          </View>
        </View>

        {/* Charts Row */}
        <View className="px-4 pb-4">
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-white rounded-lg p-4">
              <SkeletonBox width="50%" height={16} className="mb-3" />
              <SkeletonBox width="100%" height={100} />
            </View>
            <View className="flex-1 bg-white rounded-lg p-4">
              <SkeletonBox width="40%" height={16} className="mb-3" />
              <SkeletonBox width="100%" height={100} />
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export function EmptyState({ message = "No study sessions recorded" }: { message?: string }) {
  return (
    <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-3 py-4">
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-layout-faded-grey text-lg text-center">
          {message}
        </Text>
      </View>
    </View>
  );
} 