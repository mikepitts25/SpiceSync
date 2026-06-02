import React from 'react';
import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '../../lib/navigation/transitions';

export default function SettingsStackLayout() {
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profiles/index" />
      <Stack.Screen name="profiles/new" />
      <Stack.Screen name="profiles/manage" />
      <Stack.Screen name="profiles/edit" />
      <Stack.Screen name="profiles/pin" />
      <Stack.Screen name="profiles/comfort" />
      <Stack.Screen name="love-languages" />
      <Stack.Screen name="language" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="about" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="privacy-safety" />
      <Stack.Screen name="terms-of-service" />
      <Stack.Screen name="my-votes" />
      <Stack.Screen name="export" />
      <Stack.Screen name="CustomActivitiesScreen" />
    </Stack>
  );
}
