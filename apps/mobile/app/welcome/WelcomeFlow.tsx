import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '../../lib/state/useStore';
import { useProfilesStore } from '../../lib/state/profiles';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Screen types for our welcome flow
type ScreenType = 'brand' | 'value1' | 'value2' | 'value3' | 'privacy' | 'agegate';

export default function WelcomeFlow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAgeConfirmed = useSettings((state) => state.setAgeConfirmed);
  const { hydrated, hasActiveProfile } = useProfilesStore((state) => ({
    hydrated: state.isHydrated(),
    hasActiveProfile: state.hasActiveProfile(),
  }));
  
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('brand');
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Fade transition between screens
  const transitionTo = (nextScreen: ScreenType) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => setCurrentScreen(nextScreen), 200);
  };
  
  const handleAgeGateAccept = () => {
    setAgeConfirmed(true);
    if (hydrated && hasActiveProfile) {
      router.replace('/(tabs)/categories');
      return;
    }
    router.replace({
      pathname: '/settings/profiles/new',
      params: { from: 'welcome' },
    });
  };
  
  // Progress dots
  const screens: ScreenType[] = ['brand', 'value1', 'value2', 'value3', 'privacy', 'agegate'];
  const currentIndex = screens.indexOf(currentScreen);
  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'brand':
        return <BrandScreen onContinue={() => transitionTo('value1')} />;
      case 'value1':
        return (
          <ValuePropScreen
            icon="🔍"
            title="Browse Privately"
            description="Explore 329+ activities in your own time. Your choices stay on your device."
            onContinue={() => transitionTo('value2')}
            onBack={() => transitionTo('brand')}
          />
        );
      case 'value2':
        return (
          <ValuePropScreen
            icon="💑"
            title="Find Matches"
            description="Discover what you both want—without awkward conversations."
            onContinue={() => transitionTo('value3')}
            onBack={() => transitionTo('value1')}
          />
        );
      case 'value3':
        return (
          <ValuePropScreen
            icon="🔒"
            title="100% Private"
            description="End-to-end encrypted. No cloud storage. Your data never leaves your devices."
            onContinue={() => transitionTo('privacy')}
            onBack={() => transitionTo('value2')}
          />
        );
      case 'privacy':
        return <PrivacyScreen onContinue={() => transitionTo('agegate')} onBack={() => transitionTo('value3')} />;
      case 'agegate':
        return <AgeGateScreen onAccept={handleAgeGateAccept} onBack={() => transitionTo('privacy')} />;
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, paddingTop: insets.top }]}>
        {renderScreen()}
      </Animated.View>
      
      {/* Progress Indicator */}
      <View style={[styles.progressContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {screens.map((screen, index) => (
            <View
              key={screen}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
                index < currentIndex && styles.dotCompleted,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {screens.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Screen 1: Brand Moment
function BrandScreen({ onContinue }: { onContinue: () => void }) {
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <View style={styles.screenContainer}>
      <Animated.View style={[styles.brandContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {/* Logo placeholder - would use actual logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>🔥</Text>
        </View>
        
        <Text style={styles.brandTitle}>SpiceSync</Text>
        <Text style={styles.brandTagline}>Discover what you both want</Text>
        <Text style={styles.brandSubtitle}>A private space for couples to explore</Text>
      </Animated.View>
      
      <Pressable
        style={[styles.primaryButton, styles.standalonePrimaryButton]}
        onPress={onContinue}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

// Screen 2-4: Value Propositions
function ValuePropScreen({
  icon,
  title,
  description,
  onContinue,
  onBack,
}: {
  icon: string;
  title: string;
  description: string;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [slideAnim] = useState(new Animated.Value(50));
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <View style={styles.screenContainer}>
      <Animated.View style={[styles.valueContainer, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.valueIcon}>{icon}</Text>
        <Text style={styles.valueTitle}>{title}</Text>
        <Text style={styles.valueDescription}>{description}</Text>
      </Animated.View>
      
      <View style={styles.buttonGroup}>
        <Pressable style={styles.secondaryButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, styles.groupButton]}
          onPress={onContinue}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Screen 5: Privacy Promise
function PrivacyScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.privacyContainer}>
        <Text style={styles.privacyIcon}>🛡️</Text>
        <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
        
        <View style={styles.privacyFeatures}>
          <PrivacyFeature icon="📱" text="Data stays on your device" />
          <PrivacyFeature icon="🔐" text="End-to-end encrypted matching" />
          <PrivacyFeature icon="👻" text="No email or signup required" />
          <PrivacyFeature icon="🚫" text="No tracking, no analytics" />
        </View>
      </View>
      
      <View style={styles.buttonGroup}>
        <Pressable style={styles.secondaryButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, styles.groupButton]}
          onPress={onContinue}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>I Understand</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PrivacyFeature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.privacyFeature}>
      <Text style={styles.privacyFeatureIcon}>{icon}</Text>
      <Text style={styles.privacyFeatureText}>{text}</Text>
    </View>
  );
}

// Screen 6: Age Gate
function AgeGateScreen({ onAccept, onBack }: { onAccept: () => void; onBack: () => void }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.ageGateContainer}>
        <Text style={styles.ageGateIcon}>🔞</Text>
        <Text style={styles.ageGateTitle}>Adults Only</Text>
        <Text style={styles.ageGateDescription}>
          SpiceSync is designed for consenting adults. By continuing, you confirm you are at least 18 years old.
        </Text>
      </View>
      
      <View style={styles.buttonGroup}>
        <Pressable style={styles.secondaryButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.ageGateButton} onPress={onAccept} accessibilityRole="button">
          <Text style={styles.ageGateButtonText}>I'm 18 or Older</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding * 2,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Brand Screen
  brandContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 4,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
    ...SHADOWS.medium,
  },
  logoText: {
    fontSize: 60,
  },
  brandTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  brandTagline: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.h3,
    color: COLORS.primary,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Value Prop Screen
  valueContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 4,
  },
  valueIcon: {
    fontSize: 80,
    marginBottom: SIZES.padding * 2,
  },
  valueTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  valueDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.padding,
  },
  
  // Privacy Screen
  privacyContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 4,
  },
  privacyIcon: {
    fontSize: 60,
    marginBottom: SIZES.padding * 2,
  },
  privacyTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding * 2,
  },
  privacyFeatures: {
    width: '100%',
    gap: SIZES.padding,
  },
  privacyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privacyFeatureIcon: {
    fontSize: 24,
    marginRight: SIZES.padding,
  },
  privacyFeatureText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
    flex: 1,
  },
  
  // Age Gate Screen
  ageGateContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 4,
  },
  ageGateIcon: {
    fontSize: 80,
    marginBottom: SIZES.padding * 2,
  },
  ageGateTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  ageGateDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SIZES.padding,
  },
  
  // Buttons
  buttonGroup: {
    flexDirection: 'row',
    gap: SIZES.padding,
    width: '100%',
  },
  groupButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  standalonePrimaryButton: {
    width: '100%',
    maxWidth: SIZES.maxWidth,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.background,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  ageGateButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  ageGateButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.background,
  },
  
  // Progress Indicator
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SIZES.padding,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
});
