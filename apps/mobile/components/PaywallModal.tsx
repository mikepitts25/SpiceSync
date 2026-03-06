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
import { usePremiumStore, FEATURES, PRICING } from '../src/stores/premium';

const TIERS = [
  {
    id: 'premium' as const,
    name: 'Premium',
    emoji: '⭐',
    color: COLORS.primary,
    monthlyPrice: PRICING.premium.monthly,
    yearlyPrice: PRICING.premium.yearly,
    lifetimePrice: PRICING.premium.lifetime,
    features: FEATURES.filter(f => f.premium && !f.free).map(f => f.name),
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    emoji: '💎',
    color: COLORS.secondary,
    monthlyPrice: PRICING.pro.monthly,
    yearlyPrice: PRICING.pro.yearly,
    lifetimePrice: PRICING.pro.lifetime,
    features: FEATURES.filter(f => f.pro && !f.premium).map(f => f.name),
    popular: true,
  },
];

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { showPaywall, closePaywall, paywallFeature, upgrade } = usePremiumStore();
  const [selectedTier, setSelectedTier] = React.useState<'premium' | 'pro'>('premium');
  const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const handleUpgrade = async () => {
    setIsProcessing(true);
    // Simulate purchase - in real app, this would use RevenueCat or StoreKit
    await new Promise(resolve => setTimeout(resolve, 1500));
    upgrade(selectedTier, `${selectedTier}_${billingPeriod}`, 'mock_receipt');
    setIsProcessing(false);
    closePaywall();
  };
  
  const feature = paywallFeature ? FEATURES.find(f => f.id === paywallFeature) : null;
  
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
          
          {/* Tier Selection */}
          <View style={styles.tiersContainer}>
            {TIERS.map((tier) => (
              <Pressable
                key={tier.id}
                style={[
                  styles.tierCard,
                  selectedTier === tier.id && [styles.tierCardSelected, { borderColor: tier.color }],
                  tier.popular && styles.tierCardPopular,
                ]}
                onPress={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: tier.color }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.tierHeader}>
                  <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                  <View>
                    <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                    <Text style={styles.tierPrice}>
                      ${billingPeriod === 'monthly' ? tier.monthlyPrice : 
                        billingPeriod === 'yearly' ? tier.yearlyPrice : tier.lifetimePrice}
                      <Text style={styles.tierPeriod}>
                        {billingPeriod === 'monthly' ? '/mo' : 
                         billingPeriod === 'yearly' ? '/yr' : ' one-time'}
                      </Text>
                    </Text>
                  </View>
                </View>
                
                <View style={styles.featuresList}>
                  {tier.features.slice(0, 4).map((featureName, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Text style={[styles.checkmark, { color: tier.color }]}>✓</Text>
                      <Text style={styles.featureName}>{featureName}</Text>
                    </View>
                  ))}
                  {tier.features.length > 4 && (
                    <Text style={styles.moreFeatures}>+{tier.features.length - 4} more</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
          
          {/* Billing Period */}
          <View style={styles.billingSection}>
            <Text style={styles.billingTitle}>Billing Period</Text>
            <View style={styles.billingOptions}>
              {(['monthly', 'yearly', 'lifetime'] as const).map((period) => (
                <Pressable
                  key={period}
                  style={[
                    styles.billingOption,
                    billingPeriod === period && styles.billingOptionSelected,
                  ]}
                  onPress={() => setBillingPeriod(period)}
                >
                  <Text style={[
                    styles.billingOptionText,
                    billingPeriod === period && styles.billingOptionTextSelected,
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                  {period === 'yearly' && (
                    <Text style={styles.savingsBadge}>Save 50%</Text>
                  )}
                </Pressable>
              ))}
            </View>
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
            style={[styles.ctaButton, { backgroundColor: TIERS.find(t => t.id === selectedTier)?.color }]}
            onPress={handleUpgrade}
            disabled={isProcessing}
          >
            <Text style={styles.ctaText}>
              {isProcessing ? 'Processing...' : `Upgrade to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
            </Text>
          </Pressable>
          
          <Pressable onPress={closePaywall} style={styles.maybeLater}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </Pressable>
          
          <Text style={styles.terms}>
            Subscriptions auto-renew. Cancel anytime.{'\n'}
            No refunds for partial periods.
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
  tiersContainer: {
    padding: SIZES.padding * 1.5,
    gap: SIZES.padding,
  },
  tierCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SIZES.padding * 1.5,
    position: 'relative',
  },
  tierCardSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  tierCardPopular: {
    paddingTop: SIZES.padding * 2.5,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    borderTopLeftRadius: SIZES.radiusLarge - 2,
    borderTopRightRadius: SIZES.radiusLarge - 2,
  },
  popularText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  tierEmoji: {
    fontSize: 40,
  },
  tierName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
  },
  tierPrice: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.text,
  },
  tierPeriod: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  featuresList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  featureName: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  moreFeatures: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginLeft: 24,
  },
  billingSection: {
    padding: SIZES.padding * 1.5,
  },
  billingTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  billingOptions: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  billingOption: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
  },
  billingOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  billingOptionText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  billingOptionTextSelected: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#fff',
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
  terms: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
