import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface BrandMomentScreenProps {
  onComplete: () => void;
}

export default function BrandMomentScreen({ onComplete }: BrandMomentScreenProps) {
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
        <Text style={styles.logo}>💑</Text>
        <Text style={styles.brandName}>SpiceSync</Text>
        <Text style={styles.tagline}>Discover together</Text>
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
  logo: {
    fontSize: 80,
    marginBottom: SIZES.padding * 2,
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
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
