import React from 'react';
import { Stack } from 'expo-router';

import { STACK_SCREEN_OPTIONS } from '../../lib/navigation/transitions';

export default function AuthLayout() {
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="restore" />
      <Stack.Screen name="confirm-profile" />
    </Stack>
  );
}
