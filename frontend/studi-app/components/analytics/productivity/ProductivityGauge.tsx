import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, G, Line, Circle } from 'react-native-svg';

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
          {/* Background arc (gray, thinner) */}
          <Path
            d={createArcPath(startAngle, endAngle)}
            stroke="#e5e7eb"
            strokeWidth={strokeWidthBackground}
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Filled arc (score, thicker) */}
          <Path
            d={createArcPath(startAngle, scoreAngle)}
            stroke={gaugeColor}
            strokeWidth={strokeWidthFilled}
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