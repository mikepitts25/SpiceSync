import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { GameCard, GameCardType, getCardsByLanguage } from '../../data/gameCards';
import { useTranslation } from '../../lib/i18n';

const { width: SCREEN_W } = Dimensions.get('window');

const TYPE_COLORS: Record<GameCardType | 'all', string> = {
  all: COLORS.primary,
  truth: '#3498DB',
  dare: '#E74C3C',
  challenge: '#2ECC71',
  fantasy: '#9B59B6',
  roleplay: '#F39C12',
};

const TYPE_NAMES: Record<GameCardType, string> = {
  truth: 'TRUTH',
  dare: 'DARE',
  challenge: 'CHALLENGE',
  fantasy: 'FANTASY',
  roleplay: 'ROLEPLAY',
};

export default function CardDraw() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type, intensity, drinkingMode } = useLocalSearchParams<{ type: GameCardType | 'all'; intensity: string; drinkingMode: string }>();
  const unlocked = useSettingsStore((state) => state.unlocked);
  const language = useSettingsStore((state) => state.language);
  const { t } = useTranslation();
  
  const [card, setCard] = useState<GameCard | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerProgress, setTimerProgress] = useState(1);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const flipAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  // Parse estimated time to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    if (timeStr.includes('min')) {
      const mins = parseInt(timeStr);
      return isNaN(mins) ? 0 : mins * 60;
    } else if (timeStr.includes('sec')) {
      const secs = parseInt(timeStr);
      return isNaN(secs) ? 0 : secs;
    } else if (timeStr.includes('ongoing')) {
      return 300; // 5 minutes default for ongoing
    }
    return 60; // default 1 minute
  };

  // Play buzzer sound using vibration
  const playBuzzerSound = useCallback(async () => {
    try {
      // Use vibration as buzzer (cross-platform)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (error) {
      console.log('Buzzer not available');
    }
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    if (!card || timerSeconds === 0) return;
    setIsTimerRunning(true);
  }, [card, timerSeconds]);

  // Stop timer
  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    stopTimer();
    if (card) {
      const totalSeconds = parseTimeToSeconds(card.estimatedTime);
      setTimerSeconds(totalSeconds);
      setTimerProgress(1);
    }
  }, [card, stopTimer]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      const totalSeconds = card ? parseTimeToSeconds(card.estimatedTime) : 60;
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          const newValue = prev - 1;
          setTimerProgress(newValue / totalSeconds);
          if (newValue <= 0) {
            stopTimer();
            playBuzzerSound();
            return 0;
          }
          return newValue;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds, card, stopTimer, playBuzzerSound]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    drawCard();
  }, []);

  const drawCard = () => {
    const selectedType = type || 'all';
    const selectedIntensity = parseInt(intensity) || 3;
    
    // Get available cards based on language
    const availableCards = getCardsByLanguage(language, unlocked);
    
    // Filter by type if specified
    let filteredCards = selectedType === 'all' 
      ? availableCards 
      : availableCards.filter(c => c.type === selectedType);
    
    // Filter by intensity (exact match only)
    filteredCards = filteredCards.filter(c => c.intensity === selectedIntensity);
    
    // Pick random card
    if (filteredCards.length > 0) {
      const randomCard = filteredCards[Math.floor(Math.random() * filteredCards.length)];
      setCard(randomCard);
      setIsPremiumLocked(randomCard.isPremium && !unlocked);
      
      // Initialize timer based on card's estimated time
      const totalSeconds = parseTimeToSeconds(randomCard.estimatedTime);
      setTimerSeconds(totalSeconds);
      setTimerProgress(1);
      setIsTimerRunning(false);
      
      // Animate in
      setIsRevealed(false);
      scaleAnim.setValue(0.8);
      flipAnim.setValue(0);
      
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        // Flip animation
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setIsRevealed(true);
        });
      });
    }
  };

  const handleSkip = () => {
    drawCard();
  };

  const handleAccept = () => {
    if (isPremiumLocked) {
      router.push('/(unlock)');
      return;
    }
    // Mark as accepted/completed
    router.push('/(game)/complete');
  };

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Drawing card...</Text>
      </SafeAreaView>
    );
  }

  const cardColor = TYPE_COLORS[card.type];
  const isLocked = card.isPremium && !unlocked;
  const isDrinkingMode = drinkingMode === 'true';

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          🔥 Level {card.intensity}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Card */}
      <Animated.View 
        style={[
          styles.cardContainer,
          { 
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={[styles.card, { borderColor: cardColor }]}>
          {/* Card Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: cardColor }]}>
            <Text style={styles.typeText}>{TYPE_NAMES[card.type]}</Text>
          </View>

          {/* Drinking Mode Badge */}
          {isDrinkingMode && (
            <View style={styles.drinkingBadge}>
              <Text style={styles.drinkingText}>🍺 DRINKING MODE</Text>
            </View>
          )}

          {/* Premium Lock Overlay */}
          {isLocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockEmoji}>🔒</Text>
              <Text style={styles.lockText}>Premium Card</Text>
              <Text style={styles.lockSubtext}>
                Unlock to see this card
              </Text>
            </View>
          )}

          {/* Card Content */}
          <View style={[styles.content, isLocked && styles.blurredContent]}>
            <Text style={styles.cardText}>{card.content}</Text>
            {isDrinkingMode && (
              <Text style={styles.drinkingTextContent}>
                🍺 Or take a drink!
              </Text>
            )}
            
            {/* Timer Section */}
            {!isLocked && timerSeconds > 0 && (
              <View style={styles.timerContainer}>
                {/* Progress Bar */}
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${timerProgress * 100}%`,
                        backgroundColor: timerSeconds <= 10 ? '#E74C3C' : cardColor 
                      }
                    ]} 
                  />
                </View>
                
                {/* Timer Display */}
                <View style={styles.timerRow}>
                  <Text style={[
                    styles.timerText, 
                    timerSeconds <= 10 && styles.timerTextUrgent
                  ]}>
                    ⏱️ {formatTime(timerSeconds)}
                  </Text>
                  
                  {/* Timer Controls */}
                  <View style={styles.timerControls}>
                    {!isTimerRunning ? (
                      <Pressable style={styles.timerButton} onPress={startTimer}>
                        <Text style={styles.timerButtonText}>▶️ {t.game.startTimer}</Text>
                      </Pressable>
                    ) : (
                      <Pressable style={styles.timerButton} onPress={stopTimer}>
                        <Text style={styles.timerButtonText}>⏸️ {t.game.pauseTimer}</Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.timerButton} onPress={resetTimer}>
                      <Text style={styles.timerButtonText}>🔄 {t.game.resetTimer}</Text>
                    </Pressable>
                  </View>
                </View>
                
                {timerSeconds === 0 && (
                  <Text style={styles.timeUpText}>⏰ {t.game.timesUp}</Text>
                )}
              </View>
            )}
            
            {/* Safety Notes / Content Warning */}
            {card.safetyNotes && !isLocked && (
              <View style={styles.safetyContainer}>
                <Text style={styles.safetyText}>{card.safetyNotes}</Text>
              </View>
            )}
            
            <Text style={styles.timeEstimate}>{t.game.estimatedTime}: {card.estimatedTime}</Text>
          </View>

          {/* Intensity Dots */}
          <View style={styles.intensityRow}>
            {[1, 2, 3, 4, 5].map((dot) => (
              <View
                key={dot}
                style={[
                  styles.intensityDot,
                  dot <= card.intensity && { backgroundColor: cardColor },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{isDrinkingMode ? '🍺 Take Drink' : '🔄 Skip'}</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.acceptButton, isLocked && { backgroundColor: COLORS.secondary }]}
          onPress={handleAccept}
        >
          <Text style={styles.acceptText}>
            {isLocked ? '🔓 Unlock' : isDrinkingMode ? '🍺 Did It / Drink' : '✅ Accept'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    padding: SIZES.padding * 2,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text,
    width: 40,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  loading: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.text,
    fontSize: SIZES.body,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  card: {
    width: SCREEN_W - SIZES.padding * 4,
    minHeight: 400,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 3,
    padding: SIZES.padding * 2,
    position: 'relative',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 2,
  },
  typeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  blurredContent: {
    opacity: 0.1,
  },
  cardText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: SIZES.padding * 2,
  },
  timeEstimate: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SIZES.padding * 2,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 11, 14, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: SIZES.radiusLarge - 3,
  },
  lockEmoji: {
    fontSize: 48,
    marginBottom: SIZES.padding,
  },
  lockText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 8,
  },
  lockSubtext: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: SIZES.padding,
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  skipButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  drinkingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F39C12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  drinkingText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
  },
  drinkingTextContent: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#F39C12',
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  timerContainer: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  timerTextUrgent: {
    color: '#E74C3C',
  },
  timerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timerButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  timeUpText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 8,
  },
  safetyContainer: {
    marginTop: SIZES.padding,
    padding: SIZES.padding,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderRadius: SIZES.radius,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  safetyText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: '#E74C3C',
    lineHeight: 18,
  },
});
