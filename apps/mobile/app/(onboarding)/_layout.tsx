import React from 'react';
import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '../../lib/navigation/transitions';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="brand" />
      <Stack.Screen name="value" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}
