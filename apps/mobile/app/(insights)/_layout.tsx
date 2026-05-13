import { Stack } from 'expo-router';
import { STACK_SCREEN_OPTIONS } from '../../lib/navigation/transitions';

export default function InsightsLayout() {
  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
