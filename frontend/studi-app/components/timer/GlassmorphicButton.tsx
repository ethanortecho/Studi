import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle } from 'react-native';

interface GlassmorphicButtonProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export default function GlassmorphicButton({ 
  onPress, 
  icon, 
  label, 
  size = 'large',
  style,
  labelStyle
}: GlassmorphicButtonProps) {
  const buttonSize = size === 'large' ? 'h-20 w-20' : 'h-16 w-16';
  const iconSize = size === 'large' ? 'text-2xl' : 'text-xl';
  
  return (
    <View className="items-center">
      <Pressable 
        onPress={onPress}
        className={`${buttonSize} rounded-full items-center justify-center`}
        style={[
          { 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.15, 
            shadowRadius: 8,
            elevation: 4
          },
          style
        ]}
      >
        {icon && (
          <Text className={`text-white font-medium ${iconSize}`}>
            {icon}
          </Text>
        )}
      </Pressable>
      {label && (
        <Text 
          className="text-white/70 text-xs mt-2" 
          style={labelStyle}
        >
          {label}
        </Text>
      )}
    </View>
  );
}