import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 50,
          borderRadius: 50,
          marginHorizontal: 50,
          height: 60,
          backgroundColor: Colors[colorScheme].accent,
          borderColor: 'rgba(140, 69, 69, 0.1)',
        },
      }}>

        
        <Tabs.Screen
            name="home"
            options={{
                title: 'Home',
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons
                    name={focused ? 'home' : 'home-outline'}
                    size={28}
                    color={color}
                  />
                ),
            }}
          />
      
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'options' : 'options-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      
    </Tabs>
  );
}
