// apps/mobile/app/_layout.tsx
// Must be first import for gesture handler initialization
import 'react-native-gesture-handler';

import React from 'react';
import { Stack } from 'expo-router';
// This is intentionally imported separately after the side-effect import above
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0b0f14' }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="welcome/index" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
