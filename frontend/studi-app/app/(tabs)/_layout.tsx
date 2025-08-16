import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AuthGuard from '@/components/auth/AuthGuard';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#5D3EDA',
          tabBarInactiveTintColor: '#9BA1A6',
          tabBarStyle: {
            backgroundColor: '#212030',
            borderTopWidth: 1,
            borderTopColor: '#262748',
            paddingTop: 20,
          },
        }}>

          
          <Tabs.Screen
              name="home"
              options={{
                  title: 'Home',
                  tabBarIcon: ({ color, focused }) => (
                    <Ionicons
                      name="home"
                      size={30}
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
                name="options"
                size={30}
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
                name="settings"
                size={30}
                color={color}
              />
            ),
          }}
        />
        
      </Tabs>
    </AuthGuard>
  );
}
