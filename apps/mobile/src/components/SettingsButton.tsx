import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function SettingsButton() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <Pressable
        onPress={() => router.navigate('/(settings)')}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={styles.buttonContainer}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint="light"
            style={styles.blurBackground}
          >
            <Text style={styles.icon}>☰</Text>
          </BlurView>
        ) : (
          <View style={styles.solidBackground}>
            <Text style={styles.icon}>☰</Text>
          </View>
        )}
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
  buttonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  blurBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  solidBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
  },
  icon: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
