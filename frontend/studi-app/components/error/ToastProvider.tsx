import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'error' | 'success' | 'info', duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ 
  toast: Toast; 
  onHide: () => void;
  index: number;
}> = ({ toast, onHide, index }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after duration
    const timer = setTimeout(() => {
      handleHide();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  const getToastStyle = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-red-500/90';
      case 'success':
        return 'bg-green-500/90';
      default:
        return 'bg-purple-600/90';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
        marginTop: index > 0 ? 8 : 0,
      }}
    >
      <Pressable
        onPress={handleHide}
        className={`mx-4 px-4 py-3 rounded-2xl flex-row items-center ${getToastStyle()}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Text className="text-lg mr-3">{getIcon()}</Text>
        <Text className="text-white font-medium flex-1" numberOfLines={2}>
          {toast.message}
        </Text>
        <Pressable onPress={handleHide} className="ml-2 p-1">
          <Text className="text-white/70 text-xs">✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const recentMessages = useRef(new Set<string>());
  const insets = useSafeAreaInsets();

  const showToast = useCallback((
    message: string, 
    type: 'error' | 'success' | 'info' = 'info',
    duration?: number
  ) => {
    // Check if this message was shown recently (within 2 seconds)
    if (recentMessages.current.has(message)) {
      return; // Skip duplicate
    }
    
    // Add to recent messages
    recentMessages.current.add(message);
    
    // Clear from recent after 2 seconds
    setTimeout(() => {
      recentMessages.current.delete(message);
    }, 2000);
    
    // Create unique ID using counter to prevent duplicate keys
    const id = `${Date.now()}_${toastCounter.current}`;
    toastCounter.current += 1;
    
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => {
      // Limit to 3 toasts max
      const updated = [newToast, ...prev];
      return updated.slice(0, 3);
    });
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toasts.length > 0 && (
        <View 
          className="absolute top-0 left-0 right-0"
          style={{ paddingTop: insets.top + 10 }}
          pointerEvents="box-none"
        >
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onHide={() => hideToast(toast.id)}
              index={index}
            />
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
};