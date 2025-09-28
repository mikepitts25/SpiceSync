import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { useSettingsStore } from '../stores/settings';

export default function ResetAgeGateButton() {
  const resetAgeGate = useSettingsStore((state) => state.resetAgeGate);
  const router = useRouter();

  const handlePress = () => {
    resetAgeGate();
    router.replace('/welcome');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Reset the age verification"
    >
      <Text style={styles.label}>Reset Age Gate</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  label: { color: '#93c5fd', fontWeight: '700' },
});
