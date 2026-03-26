import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profiles/index" />
      <Stack.Screen name="profiles/new" />
      <Stack.Screen name="love-languages" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="export" />
      <Stack.Screen name="CustomActivitiesScreen" />
    </Stack>
  );
}
