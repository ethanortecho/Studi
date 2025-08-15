import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { generateGradientShades, hexToRgb } from '@/utils/colorUtils';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedGradientBackgroundProps {
  color: string | null;
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  angle?: number;
}

export default function AnimatedGradientBackground({
  color,
  children,
  style,
  duration = 800,
  angle = 135,
}: AnimatedGradientBackgroundProps) {
  // Default gradient colors (dark theme neutral)
  const defaultColors = ['#1a1a2e', '#16213e', '#0f3460'];
  
  // State to track current and previous colors
  const [currentColors, setCurrentColors] = useState(defaultColors);
  const [previousColors, setPreviousColors] = useState(defaultColors);
  
  // Animation progress
  const progress = useSharedValue(0);
  
  // Subtle breathing animation for gradient movement
  const breathingAnimation = useSharedValue(0);
  
  // Start breathing animation on mount
  useEffect(() => {
    breathingAnimation.value = withTiming(1, {
      duration: 4000,
      easing: Easing.inOut(Easing.sin),
    });
    
    // Create infinite loop
    const interval = setInterval(() => {
      breathingAnimation.value = breathingAnimation.value === 0 
        ? withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) })
        : withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) });
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate gradient shades when color changes
  const targetColors = useMemo(() => {
    if (!color) return defaultColors;
    return generateGradientShades(color);
  }, [color]);

  // Update colors and trigger animation when target changes
  useEffect(() => {
    setPreviousColors(currentColors);
    setCurrentColors(targetColors);
    
    // Reset and animate progress
    progress.value = 0;
    progress.value = withTiming(1, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [targetColors]);

  // Animated props for gradient
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    
    // Interpolate each color
    const colors = [
      interpolateColor(
        progress.value,
        [0, 1],
        [previousColors[0], currentColors[0]]
      ),
      interpolateColor(
        progress.value,
        [0, 1],
        [previousColors[1], currentColors[1]]
      ),
      interpolateColor(
        progress.value,
        [0, 1],
        [previousColors[2], currentColors[2]]
      ),
    ];
    
    // Subtle breathing effect on gradient positions
    const breathOffset = breathingAnimation.value * 0.05; // Max 5% shift
    const locations = [
      0 + breathOffset,
      0.5,
      1 - breathOffset
    ];

    return {
      colors,
      locations,
    };
  });

  // Calculate gradient angle for LinearGradient
  const gradientPoints = useMemo(() => {
    const angleRad = (angle * Math.PI) / 180;
    const x = Math.cos(angleRad);
    const y = Math.sin(angleRad);
    
    return {
      start: { x: 0.5 - x * 0.5, y: 0.5 - y * 0.5 },
      end: { x: 0.5 + x * 0.5, y: 0.5 + y * 0.5 },
    };
  }, [angle]);

  return (
    <View style={[styles.container, style]}>
      <AnimatedLinearGradient
        style={StyleSheet.absoluteFillObject}
        animatedProps={animatedProps}
        start={gradientPoints.start}
        end={gradientPoints.end}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});