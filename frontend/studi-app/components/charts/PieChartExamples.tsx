import React from 'react';
import { View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CustomPieChart from './CustomPieChart';

// Sample data
const sampleData = [
  { label: "Mathematics", value: 7200, color: "#FF6B6B" },
  { label: "Physics", value: 5400, color: "#4ECDC4" },
  { label: "Chemistry", value: 3600, color: "#45B7D1" },
  { label: "Biology", value: 2700, color: "#96CEB4" }
];

export default function PieChartExamples() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <ThemedView className="p-4">
        <ThemedText className="text-2xl font-bold mb-6 text-center">
          Victory Native Pie Chart Styling Options
        </ThemedText>

        {/* Basic Pie Chart */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">1. Basic Pie Chart</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={250}
            title="Basic Pie"
          />
        </View>

        {/* Donut Chart */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">2. Donut Chart</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={250}
            innerRadius={60}
            title="Donut Chart"
          />
        </View>

        {/* Donut with Percentage Inner Radius */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">3. Donut Chart (50% Inner Radius)</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={250}
            innerRadius="50%"
            title="50% Inner Radius"
          />
        </View>

        {/* Rotated Chart */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">4. Rotated Chart (45°)</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={250}
            startAngle={45}
            title="Rotated 45°"
          />
        </View>

        {/* Partial Circle */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">5. Partial Circle (270°)</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={250}
            circleSweepDegrees={270}
            startAngle={-135}
            title="Partial Circle"
          />
        </View>

        {/* With Labels */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">6. With Labels</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={300}
            showLabels={true}
            title="With Labels"
          />
        </View>

        {/* With Angular Insets */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">7. With Angular Insets (Gaps)</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={250}
            showAngularInsets={true}
            angularInsetWidth={4}
            angularInsetColor="#f0f0f0"
            title="With Gaps"
          />
        </View>

        {/* Combined Styling */}
        <View className="mb-8">
          <ThemedText className="text-lg font-semibold mb-2">8. Combined Styling</ThemedText>
          <CustomPieChart 
            data={sampleData}
            size={300}
            innerRadius="40%"
            startAngle={-90}
            showLabels={true}
            showAngularInsets={true}
            angularInsetWidth={3}
            angularInsetColor="white"
            title="All Features Combined"
          />
        </View>

        {/* Styling Notes */}
        <ThemedView className="mt-6 p-4 bg-blue-50 rounded-lg">
          <ThemedText className="text-lg font-semibold mb-2">Additional Styling Options:</ThemedText>
          <ThemedText className="mb-1">• **Linear Gradients**: Apply gradients to individual slices</ThemedText>
          <ThemedText className="mb-1">• **Custom Fonts**: Use custom fonts for labels</ThemedText>
          <ThemedText className="mb-1">• **Animation**: Built-in smooth animations</ThemedText>
          <ThemedText className="mb-1">• **Touch Events**: Add onPress handlers to slices</ThemedText>
          <ThemedText className="mb-1">• **Container Styling**: Style the chart container and canvas</ThemedText>
          <ThemedText className="mb-1">• **Custom Render Functions**: Complete control over slice rendering</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
} 