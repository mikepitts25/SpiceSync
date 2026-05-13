import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '../../lib/navigation/transitions';

export default function GameLayout() {
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="draw" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
