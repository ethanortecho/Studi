import React from 'react';
import { View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';
import { formatDuration } from '@/utils/parseData';
import { Easing } from 'react-native-reanimated';


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
  /* Animation */
  /** Total time (ms) each animation should take. */
  animateDuration?: number;
  /** Easing curve name accepted by Victory (e.g. "quadInOut", "exp", "bounce"). */
  animateEasing?: string;
  /** Animate on initial mount? */
  animateOnLoad?: boolean;
  /** Animate on subsequent data updates? */
  animateOnUpdate?: boolean;
}

export default function CustomPieChart({ 
  data, 
  size = 175, 
  title = "Study Split",
  innerRadius = "55%",
  startAngle = 0,
  circleSweepDegrees = 360,
  showLabels = true,
  showAngularInsets = true,
  angularInsetWidth = 0,
  angularInsetColor = "white",
  /* Animation props with sensible defaults */
  animateDuration = 1000,
  animateEasing = "bounce",
  animateOnLoad = true,
  animateOnUpdate = true,
}: CustomPieChartProps) {
  const resolvedEasing = React.useMemo(() => {
    switch (animateEasing) {
      case 'linear':
        return Easing.linear;
      case 'quadInOut':
        return Easing.bezier(0.455, 0.03, 0.515, 0.955);
      case 'bounce':
        return Easing.bounce;
      case 'exp':
        return Easing.exp;
      default:
        return undefined;
    }
  }, [animateEasing]);

  const pathAnimateConfig = (animateOnLoad || animateOnUpdate)
    ? { type: 'timing' as const, duration: animateDuration, ...(resolvedEasing ? { easing: resolvedEasing } : {}) }
    : undefined;
  // Workaround for missing TS typings on Victory's animate prop
  const PieChartAny: any = Pie.Chart;

  // Trigger path animation by changing values from 0 → real.
  const zeroedData = data.map((d) => ({ ...d, value: 0 }));
  const [chartData, setChartData] = React.useState(zeroedData);

  React.useEffect(() => {
    setChartData(zeroedData); // reset when `data` array shape changes
    // next tick swap in real values so Skia can interpolate
    const id = setTimeout(() => setChartData(data), 16); // ~ one frame
    return () => clearTimeout(id);
  }, [data]);

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
                <Pie.Slice animate={pathAnimateConfig}>
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
                    animate={pathAnimateConfig}
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