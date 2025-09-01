import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G, Line } from 'react-native-svg';

interface ProductivityGaugeProps {
  score: number | null; // 0-1000 flow score or null for no data
  allTimeAverage: number | null; // 0-1000 flow score or null if no history
  size?: number; // Width/height of the gauge
}

export default function ProductivityGauge({ 
  score, 
  allTimeAverage,
  size = 200 
}: ProductivityGaugeProps) {
  // Constants for gauge geometry
  const strokeWidthBackground = size * 0.06; // 6% for thinner background
  const strokeWidthFilled = size * 0.10; // 10% for thicker purple arc
  const strokeWidth = strokeWidthFilled; // Use the larger one for radius calculation
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
  
  // Calculate angle for current score (convert from 0-1000 to 0-100)
  const scorePercentage = score !== null ? (score / 1000) * 100 : null;
  const scoreAngle = scorePercentage !== null 
    ? startAngle + (scorePercentage / 100) * angleRange
    : startAngle;
  
  // Calculate angle for all-time average (convert from 0-1000 to 0-100)
  const avgPercentage = allTimeAverage !== null ? (allTimeAverage / 1000) * 100 : null;
  const avgAngle = avgPercentage !== null
    ? startAngle + (avgPercentage / 100) * angleRange
    : null;
  
  // Use solid accent purple color from theme
  const gaugeColor = '#5D3EDA'; // accent purple from theme
  
  // Handle no data state
  if (score === null) {
    return (
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <Text className="text-secondaryText text-base">No flow score data</Text>
        <Text className="text-secondaryText text-sm mt-1">Complete a session to start tracking</Text>
      </View>
    );
  }
  
  return (
    <View className="items-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {/* Background arc (surface color, thinner) */}
          <Path
            d={createArcPath(startAngle, endAngle)}
            stroke="#262748"
            strokeWidth={strokeWidthBackground}
            fill="none"
            strokeLinecap="butt"
          />
          
          {/* Filled arc (score, thicker) */}
          <Path
            d={createArcPath(startAngle, scoreAngle)}
            stroke={gaugeColor}
            strokeWidth={strokeWidthFilled}
            fill="none"
            strokeLinecap="butt"
          />
          
          {/* All-time average marker */}
          {avgAngle !== null && (
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
                    stroke="#B0B0B0"
                    strokeWidth={3}
                    strokeLinecap="butt"
                  />
                );
              })()}
            </G>
          )}
          
        </G>
      </Svg>
      
      {/* Center text */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-4xl font-bold text-primaryText">
          {Math.round(score)}
        </Text>
        <Text className="text-sm text-secondaryText mt-1">Flow Score</Text>
        {allTimeAverage !== null && (
          <Text className="text-xs text-secondaryText opacity-70 mt-1">
            Avg: {Math.round(allTimeAverage)}
          </Text>
        )}
      </View>
    </View>
  );
}