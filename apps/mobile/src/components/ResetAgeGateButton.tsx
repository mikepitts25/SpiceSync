import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { useSettings } from '../../lib/state/useStore';

export default function ResetAgeGateButton() {
  const setAgeConfirmed = useSettings((state) => state.setAgeConfirmed);
  const router = useRouter();

  const handlePress = () => {
    setAgeConfirmed(false);
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
