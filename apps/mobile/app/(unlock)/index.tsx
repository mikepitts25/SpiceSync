import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

const FEATURES = [
  { icon: '👥', text: 'Unlimited profiles', free: false },
  { icon: '✨', text: 'Custom activities', free: false },
  { icon: '📊', text: 'Advanced insights', free: false },
  { icon: '📤', text: 'Export matches', free: false },
  { icon: '🎨', text: 'Premium themes', free: false },
  { icon: '⭐', text: 'Priority support', free: false },
  { icon: '💕', text: 'Core matching', free: true },
  { icon: '🔒', text: 'Privacy features', free: true },
];

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setUnlocked = useSettingsStore((state) => state.setUnlocked);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [visible, setVisible] = useState(true);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    
    // Simulate purchase flow
    // In production, this would use RevenueCat
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUnlocked(true);
    setIsPurchasing(false);
    setVisible(false);
    
    Alert.alert(
      'Welcome to Premium!',
      'You now have lifetime access to all premium features.',
      [{ text: 'Start Exploring', onPress: () => router.back() }]
    );
  };

  const handleRestore = async () => {
    // Simulate restore
    Alert.alert('Restore Purchases', 'No previous purchases found.');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setVisible(false)}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* Close Button */}
          <Pressable 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🔓</Text>
            <Text style={styles.title}>Go Deeper Together</Text>
            <Text style={styles.subtitle}>
              Unlock lifetime access to premium features
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceCard}>
            <Text style={styles.price}>$34.99</Text>
            <Text style={styles.priceNote}>One-time payment. No subscription.</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Best Value</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Premium Features</Text>
            {FEATURES.filter(f => !f.free).map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            ))}
          </View>

          {/* Free Features */}
          <View style={styles.freeSection}>
            <Text style={styles.freeTitle}>Always Free</Text>
            {FEATURES.filter(f => f.free).map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={[styles.featureText, styles.freeFeatureText]}>
                  {feature.text}
                </Text>
                <Text style={styles.freeCheckmark}>✓</Text>
              </View>
            ))}
          </View>

          {/* Guarantee */}
          <View style={styles.guarantee}>
            <Text style={styles.guaranteeEmoji}>🛡️</Text>
            <Text style={styles.guaranteeText}>
              30-day money-back guarantee
            </Text>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable 
            style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
            onPress={handlePurchase}
            disabled={isPurchasing}
          >
            <Text style={styles.ctaText}>
              {isPurchasing ? 'Processing...' : 'Unlock Lifetime Access'}
            </Text>
          </Pressable>
          
          <Pressable style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </Pressable>

          <Text style={styles.terms}>
            By purchasing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 24,
    color: COLORS.text,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SIZES.padding * 2,
    marginBottom: SIZES.padding * 2,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    position: 'relative',
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    color: COLORS.text,
    marginBottom: 4,
  },
  priceNote: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  badge: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#fff',
  },
  featuresSection: {
    marginTop: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding * 2,
  },
  featuresTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  featureText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  freeSection: {
    marginTop: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding * 2,
    paddingTop: SIZES.padding * 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  freeTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  freeFeatureText: {
    color: COLORS.textMuted,
  },
  freeCheckmark: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding * 2,
  },
  guaranteeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  guaranteeText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
    backgroundColor: COLORS.background,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  ctaButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  ctaText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  restoreButton: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  restoreText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  terms: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
