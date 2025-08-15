import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, Line, Circle } from 'react-native-svg';

interface ProductivityGaugeProps {
  score: number | null; // 0-100 percentage or null for no data
  allTimeAverage: number | null; // 0-100 percentage or null if no history
  size?: number; // Width/height of the gauge
}

export default function ProductivityGauge({ 
  score, 
  allTimeAverage,
  size = 200 
}: ProductivityGaugeProps) {
  // Constants for gauge geometry
  const strokeWidth = size * 0.08; // 8% of size
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Gauge spans from -225° to -45° (180° total) - rotated to be horizontal
  const startAngle = -170;
  const endAngle = -10;
  const angleRange = endAngle - startAngle;
  
  // Helper function to convert angle to radians
  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  
  // Helper function to calculate point on arc
  const getPointOnArc = (angle: number, r: number = radius) => {
    const radians = toRadians(angle);
    return {
      x: centerX + r * Math.cos(radians),
      y: centerY + r * Math.sin(radians)
    };
  };
  
  // Create arc path
  const createArcPath = (startDeg: number, endDeg: number, r: number = radius) => {
    const start = getPointOnArc(startDeg, r);
    const end = getPointOnArc(endDeg, r);
    const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;
    
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };
  
  // Calculate angle for current score
  const scoreAngle = score !== null 
    ? startAngle + (score / 100) * angleRange
    : startAngle;
  
  // Calculate angle for all-time average
  const avgAngle = allTimeAverage !== null
    ? startAngle + (allTimeAverage / 100) * angleRange
    : null;
  
  // Determine color based on score (purple gradient)
  const getGaugeColor = (value: number) => {
    // From light purple to deep purple (tailwind purple-300 to purple-600)
    const colors = [
      '#c084fc', // purple-400 (0-25%)
      '#a855f7', // purple-500 (25-50%)
      '#9333ea', // purple-600 (50-75%)
      '#7e22ce', // purple-700 (75-100%)
    ];
    
    if (value < 25) return colors[0];
    if (value < 50) return colors[1];
    if (value < 75) return colors[2];
    return colors[3];
  };
  
  const gaugeColor = score !== null ? getGaugeColor(score) : '#e5e7eb';
  
  // Handle no data state
  if (score === null) {
    return (
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <Text className="text-secondaryText text-base">No productivity data</Text>
        <Text className="text-secondaryText text-sm mt-1">Complete a session to start tracking</Text>
      </View>
    );
  }
  
  return (
    <View className="items-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Gradient definition for filled gauge */}
          <LinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gaugeColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={gaugeColor} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        
        <G>
          {/* Background arc (gray) */}
          <Path
            d={createArcPath(startAngle, endAngle)}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Filled arc (score) */}
          <Path
            d={createArcPath(startAngle, scoreAngle)}
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          
          {/* All-time average marker */}
          {avgAngle !== null && (
            <>
              {/* Dark gray line marker for visibility */}
              <G>
                {(() => {
                  const markerStart = getPointOnArc(avgAngle, radius - strokeWidth / 2);
                  const markerEnd = getPointOnArc(avgAngle, radius + strokeWidth / 2);
                  return (
                    <Line
                      x1={markerStart.x}
                      y1={markerStart.y}
                      x2={markerEnd.x}
                      y2={markerEnd.y}
                      stroke="#374151"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  );
                })()}
              </G>
              
              {/* Small circle at the tip for visibility */}
              <Circle
                cx={getPointOnArc(avgAngle, radius).x}
                cy={getPointOnArc(avgAngle, radius).y}
                r={4}
                fill="#374151"
              />
            </>
          )}
          
          {/* End cap circles for polish */}
          <Circle
            cx={getPointOnArc(startAngle).x}
            cy={getPointOnArc(startAngle).y}
            r={strokeWidth / 2}
            fill="#e5e7eb"
          />
          {score > 0 && (
            <Circle
              cx={getPointOnArc(scoreAngle).x}
              cy={getPointOnArc(scoreAngle).y}
              r={strokeWidth / 2}
              fill={gaugeColor}
            />
          )}
        </G>
      </Svg>
      
      {/* Center text */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-4xl font-bold text-primaryText">
          {Math.round(score)}%
        </Text>
        <Text className="text-sm text-secondaryText mt-1">Productivity</Text>
        {allTimeAverage !== null && (
          <Text className="text-xs text-secondaryText opacity-70 mt-1">
            Avg: {Math.round(allTimeAverage)}%
          </Text>
        )}
      </View>
    </View>
  );
}