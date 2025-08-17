import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

interface AnimatedGradientBackgroundProps {
  color: string | null;
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

export default function AnimatedGradientBackground({
  color,
  children,
  style,
  duration = 800,
}: AnimatedGradientBackgroundProps) {
  // Default background color (dark theme)
  const defaultColor = '#1a1a2e';
  
  // State to track current and previous colors
  const [currentColor, setCurrentColor] = useState(defaultColor);
  const [previousColor, setPreviousColor] = useState(defaultColor);
  
  // Animation progress
  const progress = useSharedValue(1);

  // Target color
  const targetColor = useMemo(() => {
    return color || defaultColor;
  }, [color]);

  // Update colors and trigger animation when target changes
  useEffect(() => {
    if (targetColor !== currentColor) {
      setPreviousColor(currentColor);
      setCurrentColor(targetColor);
      
      // Reset and animate progress
      progress.value = 0;
      progress.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.cubic),
      });
    }
  }, [targetColor, currentColor]);

  // Animated background color style
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [previousColor, currentColor]
    );

    return {
      backgroundColor,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});