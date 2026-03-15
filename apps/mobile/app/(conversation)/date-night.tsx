// apps/mobile/app/(conversation)/date-night.tsx
// Date Night Mode - Full-screen immersive conversation experience
// Beautiful backgrounds, one question at a time, optional timer

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Settings,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Moon,
} from 'lucide-react-native';

import { COLORS, GRADIENTS, SIZES, SHADOWS } from '../../constants/theme';
import {
  ConversationStarter,
  categoryInfo,
  INTENSITY_LABELS,
  createDateNightDeckByLanguage,
} from '../../lib/conversationStarters';
import { useConversationTranslation } from '../../lib/i18n';
import { useConversationStore } from '../../lib/state/conversationStore';

const { width, height } = Dimensions.get('window');

// Background themes
const BACKGROUND_THEMES = {
  dark: {
    colors: ['#0D0D15', '#1A1A2E', '#0D0D15'] as [string, string, string],
  },
  romantic: {
    colors: ['#1a0a1a', '#2d1b2d', '#1a0a1a'] as [string, string, string],
  },
  cozy: {
    colors: ['#1a1510', '#2d241b', '#1a1510'] as [string, string, string],
  },
};

type BackgroundTheme = keyof typeof BACKGROUND_THEMES;

// Timer component
const ConversationTimer = ({
  minutes,
  isRunning,
  onToggle,
  onReset,
}: {
  minutes: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(minutes * 60);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setSecondsRemaining(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          const newValue = prev - 1;
          Animated.timing(progressAnim, {
            toValue: newValue / (minutes * 60),
            duration: 1000,
            useNativeDriver: false,
          }).start();
          return newValue;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, minutes, progressAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerRow}>
        <Clock size={18} color={COLORS.textSecondary} />
        <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
        <View style={styles.timerControls}>
          <TouchableOpacity onPress={onToggle} style={styles.timerButton}>
            {isRunning ? (
              <Pause size={18} color={COLORS.text} />
            ) : (
              <Play size={18} color={COLORS.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onReset} style={styles.timerButton}>
            <RotateCcw size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.timerBar}>
        <Animated.View
          style={[
            styles.timerProgress,
            {
              width: progressWidth,
              backgroundColor:
                secondsRemaining < 60 ? COLORS.danger : secondsRemaining < 120 ? COLORS.warning : COLORS.yes,
            },
          ]}
        />
      </View>
    </View>
  );
};

// Main card component with swipe
const DateNightCard = ({
  starter,
  onSwipeLeft,
  onSwipeRight,
  onFavorite,
  isFavorite,
}: {
  starter: ConversationStarter;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onFavorite: () => void;
  isFavorite: boolean;
}) => {
  const [showFollowUps, setShowFollowUps] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 120) {
          Animated.spring(translateX, {
            toValue: width,
            useNativeDriver: true,
          }).start(() => {
            onSwipeRight();
            translateX.setValue(0);
          });
        } else if (gestureState.dx < -120) {
          Animated.spring(translateX, {
            toValue: -width,
            useNativeDriver: true,
          }).start(() => {
            onSwipeLeft();
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const category = categoryInfo.find((c) => c.id === starter.category);
  const intensity = INTENSITY_LABELS[starter.intensity];

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ translateX }, { rotate }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.card}>
        {/* Category & Intensity */}
        <View style={styles.cardHeader}>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: `${category.color}30` }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.subtitle}
              </Text>
            </View>
          )}
          <View style={[styles.intensityBadge, { backgroundColor: `${intensity.color}30` }]}>
            <View style={[styles.intensityDot, { backgroundColor: intensity.color }]} />
            <Text style={[styles.intensityText, { color: intensity.color }]}>
              {intensity.label}
            </Text>
          </View>
        </View>

        {/* Main Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{starter.question}</Text>
        </View>

        {/* Context */}
        {starter.context && (
          <View style={styles.contextContainer}>
            <Sparkles size={16} color={COLORS.accent} style={styles.contextIcon} />
            <Text style={styles.contextText}>{starter.context}</Text>
          </View>
        )}

        {/* Follow-ups */}
        {starter.followUps && starter.followUps.length > 0 && (
          <TouchableOpacity
            style={styles.followUpsToggle}
            onPress={() => setShowFollowUps(!showFollowUps)}
          >
            <Text style={styles.followUpsToggleText}>
              {showFollowUps ? 'Hide follow-ups' : 'Show follow-ups'}
            </Text>
            <ChevronRight
              size={20}
              color={COLORS.primary}
              style={{ transform: [{ rotate: showFollowUps ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        )}

        {showFollowUps && starter.followUps && (
          <View style={styles.followUpsContainer}>
            {starter.followUps.map((followUp, index) => (
              <View key={index} style={styles.followUpItem}>
                <View style={styles.followUpNumber}>
                  <Text style={styles.followUpNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.followUpText}>{followUp}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Swipe hint */}
        <View style={styles.swipeHint}>
          <View style={styles.swipeHintItem}>
            <ChevronLeft size={20} color={COLORS.textMuted} />
            <Text style={styles.swipeHintText}>Swipe for next</Text>
          </View>
          <View style={styles.swipeHintDivider} />
          <View style={styles.swipeHintItem}>
            <Text style={styles.swipeHintText}>Swipe to save</Text>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </View>
        </View>
      </View>

      {/* Favorite button overlay */}
      <TouchableOpacity style={styles.favoriteOverlay} onPress={onFavorite}>
        <Heart
          size={28}
          color={isFavorite ? '#FF2D92' : 'rgba(255,255,255,0.3)'}
          fill={isFavorite ? '#FF2D92' : 'transparent'}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Settings modal
const SettingsModal = ({
  visible,
  onClose,
  settings,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  settings: {
    timerEnabled: boolean;
    timerMinutes: number;
    includeSpicy: boolean;
    backgroundTheme: BackgroundTheme;
  };
  onUpdate: (settings: Partial<typeof settings>) => void;
}) => {
  if (!visible) return null;

  const timerOptions = [3, 5, 10, 15];
  const themeOptions: BackgroundTheme[] = ['dark', 'romantic', 'cozy'];

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Date Night Settings</Text>

        {/* Timer Settings */}
        <View style={styles.settingSection}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Timer</Text>
            <TouchableOpacity
              style={[
                styles.toggle,
                settings.timerEnabled && styles.toggleActive,
              ]}
              onPress={() => onUpdate({ timerEnabled: !settings.timerEnabled })}
            >
              <View
                style={[
                  styles.toggleKnob,
                  settings.timerEnabled && styles.toggleKnobActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {settings.timerEnabled && (
            <View style={styles.timerOptions}>
              <Text style={styles.settingSublabel}>Minutes per topic</Text>
              <View style={styles.timerButtons}>
                {timerOptions.map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.timerOption,
                      settings.timerMinutes === mins && styles.timerOptionActive,
                    ]}
                    onPress={() => onUpdate({ timerMinutes: mins })}
                  >
                    <Text
                      style={[
                        styles.timerOptionText,
                        settings.timerMinutes === mins && styles.timerOptionTextActive,
                      ]}
                    >
                      {mins}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Include Spicy */}
        <View style={styles.settingSection}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Include Intimate Topics</Text>
              <Text style={styles.settingDescription}>Adds spicy conversation starters</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                settings.includeSpicy && styles.toggleActive,
              ]}
              onPress={() => onUpdate({ includeSpicy: !settings.includeSpicy })}
            >
              <View
                style={[
                  styles.toggleKnob,
                  settings.includeSpicy && styles.toggleKnobActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Background Theme */}
        <View style={styles.settingSection}>
          <Text style={styles.settingLabel}>Background Theme</Text>
          <View style={styles.themeOptions}>
            {themeOptions.map((theme) => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeOption,
                  settings.backgroundTheme === theme && styles.themeOptionActive,
                ]}
                onPress={() => onUpdate({ backgroundTheme: theme })}
              >
                <LinearGradient
                  colors={BACKGROUND_THEMES[theme].colors}
                  style={styles.themePreview}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    settings.backgroundTheme === theme && styles.themeOptionTextActive,
                  ]}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Text style={styles.modalCloseText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function DateNightScreen() {
  const router = useRouter();
  const [deck, setDeck] = useState<ConversationStarter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  const { favorites, toggleFavorite, dateNightSettings, updateDateNightSettings } =
    useConversationStore();
  const { language } = useConversationTranslation();

  // Initialize deck
  useEffect(() => {
    const newDeck = createDateNightDeckByLanguage(language, dateNightSettings.includeSpicy, 20);
    setDeck(newDeck);
  }, [dateNightSettings.includeSpicy, language]);

  const currentStarter = deck[currentIndex];

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimerRunning(!!dateNightSettings.timerEnabled);
    } else {
      // End of deck - create new one
      const newDeck = createDateNightDeckByLanguage(language, dateNightSettings.includeSpicy, 20);
      setDeck(newDeck);
      setCurrentIndex(0);
    }
  }, [currentIndex, deck.length, dateNightSettings.includeSpicy, dateNightSettings.timerEnabled]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleFavorite = useCallback(() => {
    if (currentStarter) {
      toggleFavorite(currentStarter.id);
    }
  }, [currentStarter, toggleFavorite]);

  // Background based on theme
  const backgroundColors = BACKGROUND_THEMES[dateNightSettings.backgroundTheme].colors;

  if (!currentStarter) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={backgroundColors} style={styles.background}>
          <View style={styles.loadingContainer}>
            <Sparkles size={48} color={COLORS.primary} />
            <Text style={styles.loadingText}>Preparing your date night...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <LinearGradient colors={backgroundColors} style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Moon size={20} color={COLORS.accent} />
            <Text style={styles.headerTitle}>Date Night</Text>
          </View>

          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
            <Settings size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / deck.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {deck.length}
          </Text>
        </View>

        {/* Timer */}
        {dateNightSettings.timerEnabled && (
          <ConversationTimer
            minutes={dateNightSettings.timerMinutes}
            isRunning={timerRunning}
            onToggle={() => setTimerRunning(!timerRunning)}
            onReset={() => setTimerRunning(false)}
          />
        )}

        {/* Card */}
        <View style={styles.cardContainer}>
          <DateNightCard
            starter={currentStarter}
            onSwipeLeft={handleNext}
            onSwipeRight={handleFavorite}
            onFavorite={handleFavorite}
            isFavorite={favorites.includes(currentStarter.id)}
          />
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={28} color={currentIndex === 0 ? COLORS.textMuted : COLORS.text} />
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text style={styles.navHint}>Swipe or tap arrows</Text>
          </View>

          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <ChevronRight size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          settings={dateNightSettings}
          onUpdate={updateDateNightSettings}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Timer
  timerContainer: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timerText: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    borderRadius: 2,
  },

  // Card
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding,
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    backgroundColor: 'rgba(30, 30, 46, 0.95)',
    borderRadius: SIZES.radiusXL,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.large,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 38,
    textAlign: 'center',
  },
  contextContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 20,
    gap: 12,
  },
  contextIcon: {
    marginTop: 2,
  },
  contextText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  followUpsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  followUpsToggleText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  followUpsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: SIZES.radius,
    marginBottom: 20,
  },
  followUpItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  followUpNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  followUpNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  followUpText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  swipeHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swipeHintText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  swipeHintDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  favoriteOverlay: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.medium,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navCenter: {
    alignItems: 'center',
  },
  navHint: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: SIZES.radiusXL,
    borderTopRightRadius: SIZES.radiusXL,
    padding: SIZES.paddingLarge,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  settingSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingSublabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 12,
  },
  settingDescription: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 4,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    marginLeft: 20,
  },
  timerOptions: {
    marginTop: 16,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timerOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  timerOptionActive: {
    backgroundColor: `${COLORS.primary}30`,
  },
  timerOptionText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timerOptionTextActive: {
    color: COLORS.primary,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: COLORS.primary,
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  themeOptionText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  themeOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#fff',
  },
});
