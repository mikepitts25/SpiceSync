import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS, SIZES } from '../../constants/theme';
import { SpiceSyncLogo } from '../../components/app-chrome';

interface BrandMomentScreenProps {
  onComplete: () => void;
}

export default function BrandMomentScreen({
  onComplete,
}: BrandMomentScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 3 seconds
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <SpiceSyncLogo width={310} height={118} />
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: SIZES.padding * 2,
    right: SIZES.padding * 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '20%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
