import React, { useState, useEffect } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Check,
  EyeOff,
  Heart,
  HelpCircle,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react-native';
import { useSettings } from '../../lib/state/useStore';
import { useProfilesStore } from '../../lib/state/profiles';
import {
  COLORS,
  FONTS,
  GRADIENTS,
  SIZES,
  SHADOWS,
} from '../../constants/theme';
import { SpiceSyncLogo } from '../../components/app-chrome';
import {
  WELCOME_SCREEN_ORDER,
  WELCOME_VALUE_SCREEN_BY_ID,
  type WelcomeIllustration,
  type WelcomeScreenId,
  type WelcomeValueScreen,
} from './content';
import { getWelcomeCompletionDestination } from './routing';

export default function WelcomeFlow() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAgeConfirmed = useSettings((state) => state.setAgeConfirmed);
  const { hydrated, hasActiveProfile } = useProfilesStore((state) => ({
    hydrated: state.isHydrated(),
    hasActiveProfile: state.hasActiveProfile(),
  }));

  const [currentScreen, setCurrentScreen] = useState<WelcomeScreenId>('brand');
  const [fadeAnim] = useState(new Animated.Value(1));

  // Fade transition between screens
  const transitionTo = (nextScreen: WelcomeScreenId) => {
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
    router.replace(getWelcomeCompletionDestination(hydrated, hasActiveProfile));
  };

  // Progress dots
  const screens = WELCOME_SCREEN_ORDER;
  const currentIndex = screens.indexOf(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'brand':
        return <BrandScreen onContinue={() => transitionTo('explore')} />;
      case 'explore':
        return (
          <ValuePropScreen
            screen={WELCOME_VALUE_SCREEN_BY_ID.explore}
            onContinue={() => transitionTo('answer')}
            onBack={() => transitionTo('brand')}
          />
        );
      case 'answer':
        return (
          <ValuePropScreen
            screen={WELCOME_VALUE_SCREEN_BY_ID.answer}
            onContinue={() => transitionTo('overlap')}
            onBack={() => transitionTo('explore')}
          />
        );
      case 'overlap':
        return (
          <ValuePropScreen
            screen={WELCOME_VALUE_SCREEN_BY_ID.overlap}
            onContinue={() => transitionTo('agegate')}
            onBack={() => transitionTo('answer')}
          />
        );
      case 'agegate':
        return (
          <AgeGateScreen
            onAccept={handleAgeGateAccept}
            onBack={() => transitionTo('overlap')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, paddingTop: insets.top }]}
      >
        {renderScreen()}
      </Animated.View>

      {/* Progress Indicator */}
      <View
        style={[
          styles.progressContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
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
      <Animated.View
        style={[
          styles.brandContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <SpiceSyncLogo width={320} height={120} />
        <Text style={styles.brandTagline}>Discover what you both want</Text>
        <Text style={styles.brandSubtitle}>
          A private space for couples to explore
        </Text>
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
  screen,
  onContinue,
  onBack,
}: {
  screen: WelcomeValueScreen;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [slideAnim] = useState(new Animated.Value(50));
  const isOrbHero = screen.illustration === 'cards';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View
      style={[
        styles.screenContainer,
        isOrbHero && styles.screenContainerTop,
      ]}
    >
      <Animated.View
        style={[
          isOrbHero ? styles.valueContainerTop : styles.valueContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <WelcomeIllustrationView illustration={screen.illustration} />
        <Text style={styles.valueTitle}>{screen.title}</Text>
        <Text style={styles.valueDescription}>{screen.description}</Text>
      </Animated.View>

      {isOrbHero && <View style={{ flex: 1 }} />}

      <View style={styles.buttonGroup}>
        <Pressable
          style={styles.secondaryButton}
          onPress={onBack}
          accessibilityRole="button"
        >
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

function WelcomeIllustrationView({
  illustration,
}: {
  illustration: WelcomeIllustration;
}) {
  switch (illustration) {
    case 'cards':
      return <ExploreIllustration />;
    case 'privateVotes':
      return <PrivateVotesIllustration />;
    case 'overlap':
      return <OverlapIllustration />;
    default:
      return null;
  }
}

function IllustrationFrame({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={['rgba(255,45,146,0.18)', 'rgba(139,92,246,0.12)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.illustrationFrame}
    >
      {children}
    </LinearGradient>
  );
}

function ExploreIllustration() {
  const { width: screenWidth } = useWindowDimensions();
  return (
    <View
      style={[
        styles.orbHero,
        { width: screenWidth, marginLeft: -(SIZES.padding * 2) },
      ]}
    >
      <View style={[styles.orb, styles.orbPink]} />
      <View style={[styles.orb, styles.orbPurple]} />
      <View style={[styles.orb, styles.orbCyan]} />
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.orbCenterArea}>
        <View style={styles.orbDark}>
          <ShieldCheck size={56} color="#FFFFFF" strokeWidth={1.5} />
        </View>
      </View>
      <LinearGradient
        colors={['rgba(13,0,6,0)', COLORS.background]}
        style={styles.orbFade}
      />
    </View>
  );
}

function ActivityCard({
  title,
  subtitle,
  highlighted,
  style,
}: {
  title: string;
  subtitle: string;
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <>
      <Text
        style={[
          styles.activityCardTitle,
          highlighted && styles.activityCardTitleHighlighted,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.activityCardSubtitle,
          highlighted && styles.activityCardSubtitleHighlighted,
        ]}
      >
        {subtitle}
      </Text>
    </>
  );

  if (highlighted) {
    return (
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={style}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={style}>{content}</View>;
}

function PrivateVotesIllustration() {
  return (
    <IllustrationFrame>
      <View style={styles.pvProfileRow}>
        <View style={styles.pvProfileWrap}>
          <View style={styles.pvCircleRelative}>
            <View style={[styles.pvCircle, styles.pvCircleActive]}>
              <UserRound size={34} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <View style={styles.pvActiveDot} />
          </View>
          <Text style={[styles.pvLabel, styles.pvLabelActive]}>YOU</Text>
        </View>

        <View style={styles.pvConnector}>
          <View style={styles.pvLine} />
          <View style={styles.pvEyeBadge}>
            <EyeOff size={20} color={COLORS.secondary} strokeWidth={1.8} />
          </View>
          <View style={styles.pvLine} />
        </View>

        <View style={styles.pvProfileWrap}>
          <View style={styles.pvCircle}>
            <UserRound size={34} color={COLORS.textSecondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.pvLabel}>PARTNER</Text>
        </View>
      </View>

      <View style={styles.pvVoteRow}>
        <View style={[styles.pvVoteBtn, styles.pvVoteBtnNo]}>
          <X size={20} color={COLORS.no} strokeWidth={2.5} />
        </View>
        <View style={[styles.pvVoteBtn, styles.pvVoteBtnMaybe]}>
          <HelpCircle size={20} color={COLORS.maybe} strokeWidth={2.5} />
        </View>
        <View style={[styles.pvVoteBtn, styles.pvVoteBtnYes]}>
          <Check size={20} color={COLORS.yes} strokeWidth={2.5} />
        </View>
      </View>
    </IllustrationFrame>
  );
}

function OverlapIllustration() {
  return (
    <IllustrationFrame>
      <View style={styles.vennCircleLeft} />
      <View style={styles.vennCircleRight} />
      <View style={styles.vennIntersection} />
      <Text style={styles.vennLabelLeft}>YOU</Text>
      <Text style={styles.vennLabelRight}>PARTNER</Text>
      <View style={styles.vennHeartWrap}>
        <Heart size={32} color={COLORS.primary} fill={COLORS.primary} />
      </View>
      <View style={styles.vennSparkleA} />
      <View style={styles.vennSparkleB} />
      <View style={styles.vennMatchBadge}>
        <Check size={12} color={COLORS.primary} strokeWidth={2.5} />
        <Text style={styles.vennMatchText}>MATCH</Text>
      </View>
    </IllustrationFrame>
  );
}

// Screen 5: Age Gate
function AgeGateScreen({
  onAccept,
  onBack,
}: {
  onAccept: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.ageGateContainer}>
        <LinearGradient
          colors={['rgba(255,45,146,0.18)', 'rgba(139,92,246,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ageGateIllustration}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ageSeal}
          >
            <Text style={styles.ageSealText}>18+</Text>
          </LinearGradient>
          <View style={styles.consentBadge}>
            <ShieldCheck size={28} color={COLORS.pink} strokeWidth={2.2} />
          </View>
        </LinearGradient>

        <Text style={styles.ageGateTitle}>For consenting adults</Text>
        <Text style={styles.ageGateDescription}>
          SpiceSync is for adults exploring together with mutual respect. By
          continuing, you confirm you are at least 18 years old.
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <Pressable
          style={styles.secondaryButton}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={styles.ageGateButton}
          onPress={onAccept}
          accessibilityRole="button"
        >
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
    width: '100%',
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

  // Welcome illustrations
  illustrationFrame: {
    width: '100%',
    maxWidth: 330,
    height: 246,
    borderRadius: SIZES.radiusXL,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SIZES.padding * 2,
    position: 'relative',
    ...SHADOWS.card,
  },
  searchPill: {
    position: 'absolute',
    top: 22,
    left: 24,
    right: 24,
    height: 42,
    borderRadius: SIZES.radiusFull,
    backgroundColor: 'rgba(13,0,6,0.72)',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    gap: 10,
  },
  searchPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  activityCard: {
    position: 'absolute',
    left: 48,
    right: 48,
    height: 104,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.padding,
    justifyContent: 'flex-end',
  },
  activityCardBack: {
    top: 88,
    transform: [{ rotate: '-10deg' }],
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  activityCardMiddle: {
    top: 96,
    transform: [{ rotate: '7deg' }],
    backgroundColor: 'rgba(139,92,246,0.16)',
  },
  activityCardFront: {
    top: 106,
    ...SHADOWS.small,
  },
  activityCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  activityCardTitleHighlighted: {
    color: COLORS.textPrimary,
  },
  activityCardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  activityCardSubtitleHighlighted: {
    color: 'rgba(255,255,255,0.82)',
  },
  pvProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  pvProfileWrap: {
    alignItems: 'center',
    gap: 6,
  },
  pvCircleRelative: {
    position: 'relative',
  },
  pvCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(13,0,6,0.7)',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pvCircleActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  pvActiveDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.yes,
    borderWidth: 2.5,
    borderColor: COLORS.background,
    right: 2,
    bottom: 2,
  },
  pvLabel: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
  },
  pvLabelActive: {
    color: COLORS.primary,
  },
  pvConnector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pvLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  pvEyeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22,22,42,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pvVoteRow: {
    flexDirection: 'row',
    gap: 22,
    justifyContent: 'center',
    marginTop: 22,
  },
  pvVoteBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pvVoteBtnNo: {
    borderColor: COLORS.no,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  pvVoteBtnMaybe: {
    borderColor: COLORS.maybe,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  pvVoteBtnYes: {
    borderColor: COLORS.yes,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  vennCircleLeft: {
    position: 'absolute',
    width: 165,
    height: 165,
    borderRadius: 82.5,
    left: 5,
    top: 22,
    backgroundColor: 'rgba(255,45,146,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,45,146,0.38)',
  },
  vennCircleRight: {
    position: 'absolute',
    width: 165,
    height: 165,
    borderRadius: 82.5,
    left: 160,
    top: 22,
    backgroundColor: 'rgba(139,92,246,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.38)',
  },
  vennIntersection: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    left: 121,
    top: 64,
    backgroundColor: 'rgba(255,45,146,0.20)',
  },
  vennHeartWrap: {
    position: 'absolute',
    left: 149,
    top: 90,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vennLabelLeft: {
    position: 'absolute',
    left: 20,
    top: 102,
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: 'rgba(255,45,146,0.55)',
    letterSpacing: 2,
  },
  vennLabelRight: {
    position: 'absolute',
    right: 10,
    top: 102,
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: 'rgba(139,92,246,0.55)',
    letterSpacing: 1.5,
  },
  vennSparkleA: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    left: 155,
    top: 14,
    backgroundColor: COLORS.primary,
  },
  vennSparkleB: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    left: 182,
    top: 10,
    backgroundColor: 'rgba(139,92,246,0.8)',
  },
  vennMatchBadge: {
    position: 'absolute',
    bottom: 20,
    left: 90,
    right: 90,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,45,146,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.40)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  vennMatchText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 1,
  },

  // Age Gate Screen
  ageGateContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 4,
  },
  ageGateIllustration: {
    width: 206,
    height: 206,
    borderRadius: SIZES.radiusXL,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding * 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  ageSeal: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageSealText: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: COLORS.textPrimary,
  },
  consentBadge: {
    position: 'absolute',
    right: 34,
    bottom: 34,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(13,0,6,0.76)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Orb Hero — V1 redesign for the 'explore' screen
  screenContainerTop: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  valueContainerTop: {
    width: '100%',
    marginBottom: SIZES.padding * 2,
  },
  orbHero: {
    height: 320,
    overflow: 'hidden',
    marginBottom: SIZES.padding * 2,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbPink: {
    width: 260,
    height: 260,
    left: -30,
    top: 0,
    backgroundColor: 'rgba(255,45,146,0.78)',
  },
  orbPurple: {
    width: 240,
    height: 240,
    right: -20,
    top: 30,
    backgroundColor: 'rgba(139,92,246,0.75)',
  },
  orbCyan: {
    width: 230,
    height: 230,
    left: 55,
    top: 110,
    backgroundColor: 'rgba(0,217,255,0.70)',
  },
  orbCenterArea: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  orbDark: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(13,0,6,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
});
