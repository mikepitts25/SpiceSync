import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { usePremiumStore, FEATURES } from '../src/stores/premium';
import { PRICING, PACKS, formatPrice, PRODUCT_SKUS } from '../lib/pricing';
import { useRouter } from 'expo-router';

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showPaywall, closePaywall, paywallFeature, isPremium, hasPack } = usePremiumStore();
  
  const isUserPremium = isPremium();
  
  const handleUpgrade = () => {
    closePaywall();
    router.push('/(unlock)');
  };
  
  const feature = paywallFeature ? FEATURES.find(f => f.id === paywallFeature) : null;
  
  // If user is already premium, don't show modal
  if (isUserPremium && showPaywall) {
    closePaywall();
    return null;
  }
  
  return (
    <Modal
      visible={showPaywall}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closePaywall}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={closePaywall} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Upgrade</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView 
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Feature Context */}
          {feature && (
            <View style={styles.featureContext}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureTitle}>{feature.name}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}. Upgrade to unlock this feature.
              </Text>
            </View>
          )}
          
          {/* New Pricing Highlight */}
          <View style={styles.pricingHighlight}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>NEW LOW PRICE</Text>
            </View>
            <Text style={styles.price}>{formatPrice(PRICING.BASE_PREMIUM)}</Text>
            <Text style={styles.priceNote}>One-time unlock • All features • All packs</Text>
          </View>
          
          {/* Pack Options */}
          <View style={styles.packsSection}>
            <Text style={styles.packsTitle}>Or Unlock Individual Packs</Text>
            <Text style={styles.packsSubtitle}>À la carte options at {formatPrice(PRICING.PACK_PRICE)} each</Text>
            
            <View style={styles.packsGrid}>
              {PACKS.map((pack) => (
                <View key={pack.id} style={[styles.packItem, { borderColor: pack.color }]}>
                  <Text style={styles.packEmoji}>{pack.emoji}</Text>
                  <Text style={[styles.packName, { color: pack.color }]}>{pack.name}</Text>
                  <Text style={styles.packPrice}>{formatPrice(pack.price)}</Text>
                  {hasPack(pack.id) && (
                    <View style={styles.packOwnedBadge}>
                      <Text style={styles.packOwnedText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
          
          {/* Gift Option */}
          <View style={styles.giftSection}>
            <Text style={styles.giftEmoji}>🎁</Text>
            <Text style={styles.giftTitle}>Gift SpiceSync Premium</Text>
            <Text style={styles.giftDescription}>
              Know a couple who'd love this? Gift them Premium access!
            </Text>
          </View>
          
          {/* Free Features Reminder */}
          <View style={styles.freeSection}>
            <Text style={styles.freeTitle}>Free Forever</Text>
            <View style={styles.freeFeatures}>
              {FEATURES.filter(f => f.free).map((f) => (
                <View key={f.id} style={styles.freeFeatureRow}>
                  <Text style={styles.freeCheck}>✓</Text>
                  <Text style={styles.freeFeatureName}>{f.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        {/* CTA Button */}
        <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            style={styles.ctaButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.ctaText}>
              See All Options
            </Text>
          </Pressable>
          
          <Pressable onPress={closePaywall} style={styles.maybeLater}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  featureContext: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.card,
    margin: SIZES.padding * 1.5,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: SIZES.padding,
  },
  featureTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: SIZES.padding / 2,
  },
  featureDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pricingHighlight: {
    backgroundColor: COLORS.card,
    margin: SIZES.padding * 1.5,
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#fff',
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    color: COLORS.text,
    marginBottom: 4,
  },
  priceNote: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  packsSection: {
    padding: SIZES.padding * 1.5,
  },
  packsTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  packsSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 1.5,
  },
  packsGrid: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  packItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    padding: SIZES.padding,
    alignItems: 'center',
    position: 'relative',
  },
  packEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  packName: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  packPrice: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  packOwnedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packOwnedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  giftSection: {
    margin: SIZES.padding * 1.5,
    padding: SIZES.padding * 1.5,
    backgroundColor: `${COLORS.secondary}15`,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 32,
    marginBottom: SIZES.padding / 2,
  },
  giftTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  giftDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  freeSection: {
    padding: SIZES.padding * 1.5,
  },
  freeTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  freeFeatures: {
    gap: 8,
  },
  freeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeCheck: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  freeFeatureName: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    padding: SIZES.padding * 1.5,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  ctaText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: '#fff',
  },
  maybeLater: {
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  maybeLaterText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
});
