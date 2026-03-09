import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { usePremiumStore } from '../../src/stores/premium';
import { PRICING, PACKS, formatPrice, PRODUCT_SKUS, GIFT_CONSTANTS, PackSku } from '../../lib/pricing';
import { getPackCards } from '../../lib/packActivities';

interface PackCardProps {
  pack: typeof PACKS[0];
  isOwned: boolean;
  onPurchase: () => void;
}

function PackCard({ pack, isOwned, onPurchase }: PackCardProps) {
  const previewCards = getPackCards(pack.id).slice(0, 3);
  
  return (
    <View style={[styles.packCard, { borderColor: pack.color }]}>
      <View style={[styles.packHeader, { backgroundColor: `${pack.color}15` }]}>
        <Text style={styles.packEmoji}>{pack.emoji}</Text>
        <View style={styles.packTitleContainer}>
          <Text style={[styles.packName, { color: pack.color }]}>{pack.name}</Text>
          <Text style={styles.packPrice}>{formatPrice(pack.price)}</Text>
        </View>
        {isOwned && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>✓ Owned</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.packDescription}>{pack.description}</Text>
      
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Preview:</Text>
        {previewCards.map((card, idx) => (
          <View key={idx} style={styles.previewItem}>
            <Text style={styles.previewBullet}>•</Text>
            <Text style={styles.previewText} numberOfLines={1}>
              {card.content.substring(0, 50)}...
            </Text>
          </View>
        ))}
        <Text style={styles.moreActivities}>+{getPackCards(pack.id).length - 3} more activities</Text>
      </View>
      
      {!isOwned && (
        <Pressable 
          style={[styles.packButton, { backgroundColor: pack.color }]}
          onPress={onPurchase}
        >
          <Text style={styles.packButtonText}>Unlock Pack</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function UnlockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { 
    upgrade, 
    hasPack, 
    isPremium, 
    purchasePack, 
    generateGiftCode,
    subscription 
  } = usePremiumStore();
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'premium' | 'packs' | 'gift'>('premium');

  const handlePurchasePremium = async () => {
    setIsPurchasing(true);
    
    // Simulate purchase flow
    // In production, this would use RevenueCat or expo-in-app-purchases
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    upgrade('premium', PRODUCT_SKUS.PREMIUM_LIFETIME, 'mock_receipt_premium');
    setIsPurchasing(false);
    
    Alert.alert(
      'Welcome to Premium!',
      'You now have lifetime access to all premium features and packs.',
      [{ text: 'Start Exploring', onPress: () => router.back() }]
    );
  };

  const handlePurchasePack = async (packId: PackSku) => {
    setIsPurchasing(true);
    
    // Simulate purchase flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    purchasePack(packId, packId, `mock_receipt_${packId}`);
    setIsPurchasing(false);
    
    const pack = PACKS.find(p => p.id === packId);
    Alert.alert(
      'Pack Unlocked!',
      `You now have access to the ${pack?.name}.`,
      [{ text: 'Great!', onPress: () => {} }]
    );
  };

  const handleRestore = async () => {
    // Simulate restore
    Alert.alert('Restore Purchases', 'No previous purchases found.');
  };

  const handleGenerateGift = async () => {
    setIsPurchasing(true);
    
    // Simulate purchase and code generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const code = await generateGiftCode();
    setGeneratedCode(code);
    setIsPurchasing(false);
  };

  const handleShareGift = async () => {
    if (!generatedCode) return;
    
    try {
      await Share.share({
        message: `🎁 I got you SpiceSync Premium! Use code ${generatedCode} to unlock lifetime access. Download the app and redeem at spicesync.app/redeem`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share gift code');
    }
  };

  const copyToClipboard = () => {
    // In real implementation, use Clipboard API
    Alert.alert('Copied!', 'Gift code copied to clipboard');
  };

  const isUserPremium = isPremium();

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => router.back()}
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
              Choose how you want to unlock
            </Text>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable 
              style={[styles.tab, activeTab === 'premium' && styles.tabActive]}
              onPress={() => setActiveTab('premium')}
            >
              <Text style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}>
                Premium
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'packs' && styles.tabActive]}
              onPress={() => setActiveTab('packs')}
            >
              <Text style={[styles.tabText, activeTab === 'packs' && styles.tabTextActive]}>
                Packs
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'gift' && styles.tabActive]}
              onPress={() => setActiveTab('gift')}
            >
              <Text style={[styles.tabText, activeTab === 'gift' && styles.tabTextActive]}>
                Gift
              </Text>
            </Pressable>
          </View>

          {/* Premium Tab */}
          {activeTab === 'premium' && (
            <View style={styles.tabContent}>
              <View style={styles.priceCard}>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={styles.price}>{formatPrice(PRICING.BASE_PREMIUM)}</Text>
                <Text style={styles.priceNote}>One-time payment. No subscription.</Text>
                <Text style={styles.priceSubnote}>Unlocks everything forever</Text>
              </View>

              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>Premium Includes:</Text>
                {[
                  { icon: '✨', text: 'All 200+ premium activities' },
                  { icon: '🎲', text: 'Spice Dice couples game' },
                  { icon: '👥', text: 'Unlimited profiles' },
                  { icon: '📊', text: 'Advanced insights & analytics' },
                  { icon: '🎨', text: 'Custom activities' },
                  { icon: '📤', text: 'Export your matches' },
                  { icon: '🏖️', text: 'All 3 activity packs' },
                  { icon: '⭐', text: 'Priority support' },
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureText}>{feature.text}</Text>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                ))}
              </View>

              {!isUserPremium && (
                <Pressable 
                  style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
                  onPress={handlePurchasePremium}
                  disabled={isPurchasing}
                >
                  <Text style={styles.ctaText}>
                    {isPurchasing ? 'Processing...' : `Unlock Premium ${formatPrice(PRICING.BASE_PREMIUM)}`}
                  </Text>
                </Pressable>
              )}

              {isUserPremium && (
                <View style={styles.ownedBanner}>
                  <Text style={styles.ownedBannerText}>✓ You have Premium</Text>
                </View>
              )}
            </View>
          )}

          {/* Packs Tab */}
          {activeTab === 'packs' && (
            <View style={styles.tabContent}>
              <Text style={styles.packsIntro}>
                Or unlock individual packs à la carte. Each pack contains 15+ unique activities.
              </Text>
              
              {PACKS.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  isOwned={isUserPremium || hasPack(pack.id)}
                  onPurchase={() => handlePurchasePack(pack.id)}
                />
              ))}

              <View style={styles.packsNote}>
                <Text style={styles.packsNoteText}>
                  💡 Tip: Premium includes all packs at a discount!
                </Text>
              </View>
            </View>
          )}

          {/* Gift Tab */}
          {activeTab === 'gift' && (
            <View style={styles.tabContent}>
              <View style={styles.giftHeader}>
                <Text style={styles.giftEmoji}>🎁</Text>
                <Text style={styles.giftTitle}>Gift SpiceSync Premium</Text>
                <Text style={styles.giftSubtitle}>
                  Give the gift of deeper connection to a couple you care about
                </Text>
              </View>

              {!generatedCode ? (
                <>
                  <View style={styles.giftFeatures}>
                    <Text style={styles.giftFeaturesTitle}>They'll receive:</Text>
                    {[
                      'Lifetime Premium access',
                      'All premium activities',
                      'All 3 activity packs',
                      'Future updates included',
                    ].map((item, idx) => (
                      <View key={idx} style={styles.giftFeatureRow}>
                        <Text style={styles.giftFeatureCheck}>✓</Text>
                        <Text style={styles.giftFeatureText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.giftPriceCard}>
                    <Text style={styles.giftPrice}>{formatPrice(PRICING.GIFT_PRICE)}</Text>
                    <Text style={styles.giftPriceNote}>One-time gift purchase</Text>
                  </View>

                  <Pressable 
                    style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
                    onPress={handleGenerateGift}
                    disabled={isPurchasing}
                  >
                    <Text style={styles.ctaText}>
                      {isPurchasing ? 'Processing...' : 'Buy Gift Code'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Gift Code Generated!</Text>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{generatedCode}</Text>
                  </View>
                  <Text style={styles.codeInstructions}>
                    Share this code with the recipient. They can redeem it in the app or at:
                  </Text>
                  <Text style={styles.codeUrl}>spicesync.app{GIFT_CONSTANTS.REDEEM_PATH}</Text>
                  
                  <View style={styles.codeButtons}>
                    <Pressable style={styles.codeButton} onPress={handleShareGift}>
                      <Text style={styles.codeButtonText}>📤 Share</Text>
                    </Pressable>
                    <Pressable style={styles.codeButton} onPress={copyToClipboard}>
                      <Text style={styles.codeButtonText}>📋 Copy</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Restore & Terms */}
          <View style={styles.footer}>
            <Pressable style={styles.restoreButton} onPress={handleRestore}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>

            <Text style={styles.terms}>
              By purchasing, you agree to our Terms of Service and Privacy Policy.{'\n'}
              All purchases are final. Subscription auto-renews unless cancelled.
            </Text>
          </View>
        </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding * 2,
    marginBottom: SIZES.padding * 2,
    gap: SIZES.padding,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  tabTextActive: {
    color: '#fff',
    fontFamily: FONTS.bold,
  },
  tabContent: {
    paddingHorizontal: SIZES.padding * 2,
  },
  priceCard: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    position: 'relative',
    marginBottom: SIZES.padding * 2,
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
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceSubnote: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  featuresSection: {
    marginBottom: SIZES.padding * 2,
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
  ownedBanner: {
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  ownedBannerText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  packsIntro: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  packCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    marginBottom: SIZES.padding * 1.5,
    overflow: 'hidden',
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding * 1.5,
  },
  packEmoji: {
    fontSize: 32,
    marginRight: SIZES.padding,
  },
  packTitleContainer: {
    flex: 1,
  },
  packName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
  },
  packPrice: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  ownedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownedText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#fff',
  },
  packDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.padding * 1.5,
    marginBottom: SIZES.padding,
  },
  previewSection: {
    paddingHorizontal: SIZES.padding * 1.5,
    marginBottom: SIZES.padding,
  },
  previewTitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewBullet: {
    color: COLORS.textMuted,
    marginRight: 8,
  },
  previewText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  moreActivities: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginTop: 4,
  },
  packButton: {
    margin: SIZES.padding * 1.5,
    marginTop: 0,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  packButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  packsNote: {
    backgroundColor: `${COLORS.primary}15`,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.padding,
  },
  packsNoteText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.primary,
    textAlign: 'center',
  },
  giftHeader: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  giftEmoji: {
    fontSize: 48,
    marginBottom: SIZES.padding,
  },
  giftTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
  },
  giftSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  giftFeatures: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radiusLarge,
    marginBottom: SIZES.padding * 2,
  },
  giftFeaturesTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  giftFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  giftFeatureCheck: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: 'bold',
    marginRight: 12,
  },
  giftFeatureText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  giftPriceCard: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  giftPrice: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: COLORS.text,
    marginBottom: 4,
  },
  giftPriceNote: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  codeContainer: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  codeBox: {
    backgroundColor: COLORS.background,
    paddingVertical: SIZES.padding * 1.5,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SIZES.padding,
  },
  codeText: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  codeInstructions: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  codeUrl: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginBottom: SIZES.padding * 2,
  },
  codeButtons: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  codeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
  },
  codeButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: SIZES.padding * 3,
    alignItems: 'center',
  },
  restoreButton: {
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
    lineHeight: 18,
  },
});
