import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

interface PrivacyScreenProps {
  onNext: () => void;
}

const PRIVACY_POINTS = [
  {
    icon: '📱',
    title: 'Local-First Storage',
    description: 'Your data lives on your device, not our servers.',
  },
  {
    icon: '🔐',
    title: 'PIN Protection',
    description: 'Optional PIN lock for extra discretion.',
  },
  {
    icon: '🚫',
    title: 'No Tracking',
    description: 'We don\'t track your activity or sell your data.',
  },
  {
    icon: '✅',
    title: 'Consent-First',
    description: 'Both partners must agree before any data is shared.',
  },
];

export default function PrivacyScreen({ onNext }: PrivacyScreenProps) {
  const insets = useSafeAreaInsets();
  const verifyAge = useSettingsStore((state) => state.verifyAge);
  const [accepted, setAccepted] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    verifyAge();
    onNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.header}>Your Privacy Matters</Text>
        <Text style={styles.subheader}>
          We built SpiceSync with privacy at its core
        </Text>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pointsList}>
            {PRIVACY_POINTS.map((point, index) => (
              <View key={index} style={styles.pointCard}>
                <Text style={styles.pointIcon}>{point.icon}</Text>
                <View style={styles.pointText}>
                  <Text style={styles.pointTitle}>{point.title}</Text>
                  <Text style={styles.pointDescription}>{point.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable 
            style={styles.checkboxRow}
            onPress={() => setAccepted(!accepted)}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I am 18 or older and accept the{' '}
              <Text style={styles.link}>Privacy Policy</Text>
              {' '}and{' '}
              <Text style={styles.link}>Terms of Service</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </Animated.View>

      <Animated.View 
        style={[
          styles.footer, 
          { 
            opacity: fadeAnim,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
        <Pressable 
          style={[styles.button, !accepted && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!accepted}
        >
          <Text style={styles.buttonText}>I Understand</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
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
    paddingTop: 40,
  },
  header: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  subheader: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  scrollView: {
    flex: 1,
  },
  pointsList: {
    gap: SIZES.padding,
    paddingBottom: SIZES.padding,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pointIcon: {
    fontSize: 24,
    marginRight: SIZES.padding,
    marginTop: 2,
  },
  pointText: {
    flex: 1,
  },
  pointTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  pointDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SIZES.padding * 2,
    marginBottom: SIZES.padding,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SIZES.padding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  link: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SIZES.padding * 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
