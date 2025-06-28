import React from 'react';
import { View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';
import { formatDuration } from '@/utils/parseData';

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
  size = 165, 
  title = "Study Split",
  innerRadius = "55%",
  startAngle = 0,
  circleSweepDegrees = 360,
  showLabels = true,
  showAngularInsets = true,
  angularInsetWidth = 0,
  angularInsetColor = "white",
}: CustomPieChartProps) {
  // Workaround for missing TS typings on Victory's animate prop
  const PieChartAny: any = Pie.Chart;

  // Use data directly (no animation)
  const chartData = data;

  return (
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
          data={chartData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <PieChartAny
            innerRadius={innerRadius}
            startAngle={startAngle}
            circleSweepDegrees={circleSweepDegrees}
          >
            {({ slice }: { slice: any }) => (
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
          </PieChartAny>
        </PolarChart>
      </View>
    </View>
  );
} 