import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SettingsButton() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { top: insets.top + 8 }]}>
      <Pressable
        onPress={() => router.navigate('/settings')}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={styles.button}
      >
        <Text style={styles.icon}>☰</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 12,
    zIndex: 1000,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  icon: {
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
  },
});
