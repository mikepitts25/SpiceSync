import React, { useState } from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="brand" />
      <Stack.Screen name="value" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}
