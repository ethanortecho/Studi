import React, { useState, useRef } from 'react';
import { View, Text, Pressable, SafeAreaView, Dimensions, FlatList } from 'react-native';
import { router } from 'expo-router';
import { completeOnboarding } from '../../utils/onboarding';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface OnboardingScreen {
  id: string;
  title: string;
  subtitle: string;
  content: string;
}

const onboardingScreens: OnboardingScreen[] = [
  {
    id: 'welcome',
    title: 'Welcome to Studi',
    subtitle: 'Track your study sessions with precision',
    content: 'Build better study habits with timers, insights, and flow tracking'
  },
  {
    id: 'timers',
    title: 'Three Ways to Focus',
    subtitle: 'Choose your perfect study method',
    content: '• Stopwatch - Open-ended sessions\n• Countdown - Set goals and stay accountable\n• Pomodoro - Work in focused blocks with breaks'
  },
  {
    id: 'insights',
    title: 'Track Your Progress',
    subtitle: 'See your study patterns',
    content: 'View daily, weekly, and monthly insights to understand your study habits and improve over time'
  },
  {
    id: 'flow',
    title: 'Discover Your Flow State',
    subtitle: 'Measure your focus quality',
    content: 'Study for 15+ minutes to get your flow score and track your consistency and improvement over time'
  }
];

export default function Onboarding() {
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLastScreen = currentPage === onboardingScreens.length - 1;

  const handleNext = async () => {
    if (isLastScreen) {
      await finishOnboarding();
    } else {
      // Navigate to next screen
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      flatListRef.current?.scrollToOffset({
        offset: nextPage * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    try {
      await completeOnboarding();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      // Still navigate even if storage fails
      router.replace('/auth/login');
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentPage(pageIndex);
  };

  const renderOnboardingItem = ({ item }: { item: OnboardingScreen }) => (
    <View className="flex-1 justify-center items-center px-8" style={{ width: SCREEN_WIDTH }}>
      <View className="flex-1 justify-center items-center">
        <Text className="text-4xl font-bold text-primaryText text-center mb-4">
          {item.title}
        </Text>
        <Text className="text-xl text-secondaryText text-center mb-8">
          {item.subtitle}
        </Text>
        <Text className="text-base text-secondaryText text-center leading-6">
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={onboardingScreens}
          renderItem={renderOnboardingItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        />
        
        {/* Fixed navigation buttons at bottom */}
        <View className="w-full pb-8 px-8">
          <View className="flex-row justify-between items-center mb-6">
            {/* Skip button */}
            {!isLastScreen && (
              <Pressable onPress={handleSkip} className="py-3 px-6">
                <Text className="text-secondaryText">Skip</Text>
              </Pressable>
            )}
            
            {/* Page indicators */}
            <View className="flex-row space-x-2 flex-1 justify-center">
              {onboardingScreens.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPage ? 'bg-accent' : 'bg-surface'
                  }`}
                />
              ))}
            </View>
            
            {/* Next/Get Started button */}
            <Pressable 
              onPress={handleNext}
              className="bg-accent py-3 px-6 rounded-lg"
            >
              <Text className="text-primaryText font-semibold">
                {isLastScreen ? 'Get Started' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}