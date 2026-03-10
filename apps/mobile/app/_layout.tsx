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
import AppMenu from '../src/components/AppMenu';

// Screens where menu button should be hidden
const HIDE_MENU_ON = [
  '/(onboarding)',
  '/welcome',
  'onboarding',
];

function AppMenuWrapper() {
  const pathname = usePathname();
  
  // Hide menu button on certain screens
  const shouldHide = HIDE_MENU_ON.some(path => 
    pathname?.includes(path) || pathname?.startsWith(path)
  );
  
  if (shouldHide) return null;
  
  return <AppMenu />;
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
          <AppMenuWrapper />
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
    position: 'relative',
  },
});
