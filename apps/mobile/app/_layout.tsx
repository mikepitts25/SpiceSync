// apps/mobile/app/_layout.tsx
// Must be first import for gesture handler initialization
import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { initializeNotifications } from '../lib/notifications';
import { useStreakStore } from '../lib/achievements';
import SettingsButton from '../src/components/SettingsButton';

// Screens where settings button should be hidden
const HIDE_SETTINGS_ON = [
  '/(onboarding)',
  '/(settings)',
  '/welcome',
];

function SettingsButtonWrapper() {
  const pathname = usePathname();
  
  // Hide settings button on certain screens
  const shouldHide = HIDE_SETTINGS_ON.some(path => pathname?.startsWith(path));
  
  if (shouldHide) return null;
  
  return <SettingsButton />;
}

export default function RootLayout() {
  // Initialize notifications and check streak on app start
  useEffect(() => {
    // Initialize notifications
    initializeNotifications().then((success) => {
      if (success) {
        console.log('[App] Notifications initialized');
      }
    });
    
    // Check and update streak
    const { checkAndUpdateStreak } = useStreakStore.getState();
    const result = checkAndUpdateStreak();
    if (result.streakUpdated) {
      console.log('[App] Streak updated:', result);
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.background}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(settings)" />
            <Stack.Screen name="(game)" />
            <Stack.Screen name="(insights)" />
            <Stack.Screen name="(unlock)" />
            <Stack.Screen name="(redeem)" />
            <Stack.Screen name="(conversation)" />
          </Stack>
          <SettingsButtonWrapper />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
