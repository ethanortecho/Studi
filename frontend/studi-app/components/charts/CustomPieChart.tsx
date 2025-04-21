import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Text } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface CustomPieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title?: string;
}

export default function CustomPieChart({ 
  data, 
  size = 300, 
  title = "Breakdown By Subject"
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

    // Calculate label position
    const midAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = center + labelRadius * Math.cos((midAngle * Math.PI) / 180);
    const labelY = center + labelRadius * Math.sin((midAngle * Math.PI) / 180);

    startAngle = endAngle;

    return {
      path,
      color: item.color,
      label: item.label,
      percentage: percentage,
      labelX,
      labelY
    };
  });

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <View style={styles.contentContainer}>
        <View style={styles.chartContainer}>
          <Svg width={size} height={size}>
            <G>
              {segments.map((segment, index) => (
                <React.Fragment key={index}>
                  <Path
                    d={segment.path}
                    fill={segment.color}
                    stroke={Colors.light.surface}
                    strokeWidth={1}
                  />
                  <Text
                    x={segment.labelX}
                    y={segment.labelY}
                    textAnchor="middle"
                    fontSize="12"
                    fill={Colors.light.text}
                  >
                    {`${(segment.percentage * 100).toFixed(0)}%`}
                  </Text>
                </React.Fragment>
              ))}
            </G>
          </Svg>
        </View>
        
        <View style={styles.legendContainer}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
              <ThemedText style={[styles.legendText, { color: Colors.light.text }]}>
                {segment.label}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderRadius: 15,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.light.text,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    flex: 2,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
}); 