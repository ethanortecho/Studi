import React from 'react';
import { View, Pressable } from 'react-native';
import { CATEGORY_COLORS } from '../../constants/Colors';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  usedColors?: string[];
}

export default function ColorPicker({ selectedColor, onColorSelect, usedColors = [] }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-3 justify-center">
      {CATEGORY_COLORS.map((color) => {
        const isSelected = selectedColor === color.value;
        const isUsed = usedColors.includes(color.value);
        const isDisabled = isUsed && !isSelected;
        
        return (
          <Pressable
            key={color.value}
            onPress={() => !isDisabled && onColorSelect(color.value)}
            className={`w-12 h-12 rounded-full border-2 ${
              isSelected ? 'border-primaryText' : 'border-border'
            } ${isDisabled ? 'opacity-50' : ''}`}
            style={{ backgroundColor: color.value }}
            disabled={isDisabled}
          />
        );
      })}
    </View>
  );
} 