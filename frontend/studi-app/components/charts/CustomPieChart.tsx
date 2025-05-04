import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatDuration } from '@/utils/parseData';
import { dashboardStyles as styles } from '@/styles/dashboard';

interface CustomPieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title?: string;
}

export default function CustomPieChart({ 
  data, 
  size = 300, 
  title = "Study Split"
}: CustomPieChartProps) {
  const center = size / 2;
  const radius = size / 2;

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Generate pie chart segments
  let startAngle = 0;
  const segments = data.map((item) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const endAngle = startAngle + angle;

    // Calculate path for segment
    const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    startAngle = endAngle;

    return {
      path,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage: percentage
    };
  });

  return (
    <View style={[styles.section, { backgroundColor: Colors.light.surface }]}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G>
            {segments.map((segment, index) => (
              <Path
                key={index}
                d={segment.path}
                fill={segment.color}
                stroke={Colors.light.surface}
                strokeWidth={1}
              />
            ))}
          </G>
        </Svg>
      </View>
    </View>
  );
} 