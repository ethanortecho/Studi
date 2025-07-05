import { useState } from 'react';

interface UseTimerBackgroundProps {
  selectedCategoryId: string | string[] | undefined;
  categories: any[];
  getCurrentCategoryColor: () => string;
}

export function useTimerBackground({ 
  selectedCategoryId, 
  categories, 
  getCurrentCategoryColor 
}: UseTimerBackgroundProps) {
  // Add immediate color state for zero-delay updates
  const [selectedPreviewColor, setSelectedPreviewColor] = useState<string | null>(null);

  // Synchronous color lookup function
  const getCategoryColorById = (categoryId: string | number) => {
    const category = categories.find(cat => Number(cat.id) === Number(categoryId));
    return category?.color || '#E5E7EB'; // Keep gray as fallback for now
  };

  // Updated background color logic with instant preview priority
  const getBackgroundColor = () => {
    // 1. Use instant preview color if available
    if (selectedPreviewColor) {
      return selectedPreviewColor;
    }
    
    // 2. Use current session category color
    const currentColor = getCurrentCategoryColor();
    if (currentColor && currentColor !== '#E5E7EB') {
      return currentColor;
    }
    
    // 3. Fallback: use selected category color from route params
    if (selectedCategoryId) {
      const selectedCategory = categories.find(cat => Number(cat.id) === Number(selectedCategoryId));
      return selectedCategory?.color || null;
    }
    
    return null; // Return null to indicate use default theme background
  };

  const categoryColor = getBackgroundColor();

  // Instant color change handler (will be passed to carousel)
  const handleInstantColorChange = (categoryId: string | number) => {
    if (categoryId === '' || categoryId === null || categoryId === undefined) {
      // Reset preview color
      setSelectedPreviewColor(null);
    } else {
      const newColor = getCategoryColorById(categoryId);
      setSelectedPreviewColor(newColor);
    }
  };

  // Reset preview color function
  const resetPreviewColor = () => {
    setSelectedPreviewColor(null);
  };

  return {
    categoryColor,
    handleInstantColorChange,
    resetPreviewColor,
    selectedPreviewColor
  };
} 