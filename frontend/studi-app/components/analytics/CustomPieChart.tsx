import React from 'react';
import { View, Text } from 'react-native';
import { Pie, PolarChart } from 'victory-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { formatDuration } from '@/utils/parseData';
import { dashboardStyles as styles } from '@/styles/dashboard';

interface CustomPieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  title?: string;
  innerRadius?: number | string;
  startAngle?: number;
  circleSweepDegrees?: number;
  showLabels?: boolean;
  showAngularInsets?: boolean;
  angularInsetWidth?: number;
  angularInsetColor?: string;
}

export default function CustomPieChart({ 
  data, 
  size = 300, 
  title = "Study Split",
  innerRadius = "30%",
  startAngle = 0,
  circleSweepDegrees = 360,
  showLabels = true,
  showAngularInsets = true,
  angularInsetWidth = 2,
  angularInsetColor = "white"
}: CustomPieChartProps) {
  return (
    <ThemedView className="w-full items-center justify-center rounded-xl bg-white p-2">
      <View style={{ 
        height: size, 
        width: size,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <View style={{
          width: size,
          height: size,
        }}>
          <PolarChart
            data={data}
            labelKey="label"
            valueKey="value"
            colorKey="color"
          >
            <Pie.Chart
              innerRadius={innerRadius}
              startAngle={startAngle}
              circleSweepDegrees={circleSweepDegrees}
            >
              {({ slice }) => (
                <>
                  <Pie.Slice>
                    {showLabels && (
                      <Pie.Label 
                        color="white" 
                        radiusOffset={0.8}
                        text={`${slice.label}\n${formatDuration(slice.value)}`}
                      />
                    )}
                  </Pie.Slice>
                  {showAngularInsets && (
                    <Pie.SliceAngularInset
                      angularInset={{
                        angularStrokeWidth: angularInsetWidth,
                        angularStrokeColor: angularInsetColor,
                      }}
                    />
                  )}
                </>
              )}
            </Pie.Chart>
          </PolarChart>
        </View>
      </View>
    </ThemedView>
  );
} 