import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Crown, X } from 'lucide-react-native';

import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';
import { usePurchases } from '../../lib/purchases/purchaseService';
import { usePremiumStore } from '../../src/stores/premium';

import { ui } from '../../lib/i18n/uiLiteral';

const PREMIUM_FEATURES = [
  'The full Spice Deck library, including every themed pack',
  'Match Missions, Know Me Better, and Couple Dice',
  'Create your own game cards',
  'Advanced Insights',
  'Unlimited local profiles',
  'Future premium content updates',
];

export default function UnlockScreen() {
  const router = useRouter();
  const isPremium = usePremiumStore((state) => state.isPremium());
  const { product, loading, error, initialize, purchase, restore } =
    usePurchases();

  useEffect(() => {
    initialize().catch(() => undefined);
  }, [initialize]);

  const buyPremium = async () => {
    const result = await purchase();
    if (!result.success && result.error) {
      Alert.alert(ui('Purchase unavailable'), result.error);
    }
  };

  const restorePremium = async () => {
    const restored = await restore();
    Alert.alert(
      restored ? ui('Premium restored') : ui('Nothing to restore'),
      restored
        ? ui('Your lifetime Premium access is active on this device.')
        : ui('No lifetime Premium purchase was found for this store account.')
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ui('Close')}
        onPress={() => router.back()}
        style={styles.close}
      >
        <X color={COLORS.textPrimary} size={24} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroIcon}>
          <Crown color={COLORS.pink} size={38} />
        </View>
        <Text style={styles.eyebrow}>{ui('ONE-TIME PURCHASE')}</Text>
        <Text style={styles.title}>{ui('Unlock SpiceSync Premium')}</Text>
        <Text style={styles.subtitle}>
          {ui(
            ' More ways to play and explore together. Core matching, privacy, and partner features always stay free. '
          )}
        </Text>

        <View style={styles.priceCard}>
          <Text style={styles.price}>
            {product?.displayPrice ?? ui('One-time purchase')}
          </Text>
          <Text style={styles.priceNote}>
            {ui(' Lifetime access · no subscription ')}
          </Text>
        </View>

        <View style={styles.featureCard}>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Check color={COLORS.textPrimary} size={14} strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{ui(feature)}</Text>
            </View>
          ))}
        </View>

        {isPremium ? (
          <View style={styles.ownedBanner}>
            <Check color={COLORS.yes} size={20} strokeWidth={3} />
            <Text style={styles.ownedText}>{ui('Premium is unlocked')}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={loading || !product}
            onPress={buyPremium}
            style={({ pressed }) => [
              styles.buyButton,
              (pressed || loading || !product) && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.buyText}>
                {product
                  ? `${ui('Unlock for')} ${product.displayPrice}`
                  : ui('Store product unavailable')}
              </Text>
            )}
          </Pressable>
        )}

        {error && !loading ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={restorePremium}
          style={styles.restoreButton}
        >
          <Text style={styles.restoreText}>{ui('Restore Purchases')}</Text>
        </Pressable>

        <View style={styles.legalRow}>
          <Pressable onPress={() => router.push('/(settings)/privacy-policy')}>
            <Text style={styles.legalLink}>{ui('Privacy Policy')}</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable
            onPress={() => router.push('/(settings)/terms-of-service')}
          >
            <Text style={styles.legalLink}>{ui('Terms of Service')}</Text>
          </Pressable>
        </View>
        <Text style={styles.legalCopy}>
          {ui(
            ' Payment is charged to your App Store or Google Play account. This is a non-consumable purchase and can be restored on devices using the same store account. '
          )}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  close: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 58,
    paddingBottom: 36,
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,45,146,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.28)',
    marginBottom: 18,
  },
  eyebrow: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 31,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 10,
  },
  priceCard: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    borderRadius: 22,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  price: { color: COLORS.textPrimary, fontSize: 40, fontWeight: '900' },
  priceNote: { color: COLORS.textSub, fontSize: 16, fontWeight: '700' },
  featureCard: {
    width: '100%',
    gap: 14,
    marginTop: 16,
    borderRadius: 22,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.pink,
  },
  featureText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
  },
  buyButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: GRADIENTS.primary[0],
  },
  buttonPressed: { opacity: 0.68 },
  buyText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  ownedBanner: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  ownedText: { color: COLORS.yes, fontSize: 16, fontWeight: '800' },
  error: {
    color: COLORS.no,
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  restoreButton: { paddingHorizontal: 20, paddingVertical: 14, marginTop: 4 },
  restoreText: { color: COLORS.pink, fontSize: 16, fontWeight: '800' },
  legalRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  legalLink: {
    color: COLORS.textSub,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  legalDot: { color: COLORS.textMuted },
  legalCopy: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
});
