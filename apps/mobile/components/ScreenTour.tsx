import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  COLORS,
  GRADIENTS,
  RADII,
  SHADOWS,
  TYPOGRAPHY,
} from '../constants/theme';
import { type MainTourScreenId, type TourStep } from '../lib/main-screen-tours';
import { interpolate, useTranslation } from '../lib/i18n';
import { useScreenToursStore } from '../src/stores/screenTours';

type VisibleTourStep = {
  step: TourStep;
  index: number;
  progressLabel: string;
  primaryLabel: 'Next' | 'Done';
  isLastStep: boolean;
};

type ScreenTourProps = {
  screenId: MainTourScreenId;
  screenLabel: string;
  steps: TourStep[];
  style?: StyleProp<ViewStyle>;
};

export function getVisibleTourStep(
  steps: TourStep[],
  requestedIndex: number
): VisibleTourStep | null {
  const visibleSteps = steps.filter(
    (step) => step.title.trim() && step.body.trim()
  );

  if (!visibleSteps.length) {
    return null;
  }

  const index = Math.max(0, Math.min(requestedIndex, visibleSteps.length - 1));
  const step = visibleSteps[index];
  const isLastStep = index === visibleSteps.length - 1;

  return {
    step,
    index,
    progressLabel: `${index + 1} of ${visibleSteps.length}`,
    primaryLabel: isLastStep ? 'Done' : 'Next',
    isLastStep,
  };
}

export function ScreenTour({
  screenId,
  screenLabel,
  steps,
  style,
}: ScreenTourProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const isDismissed = useScreenToursStore((state) =>
    state.isTourDismissed(screenId)
  );
  const dismissTour = useScreenToursStore((state) => state.dismissTour);
  const visibleStep = getVisibleTourStep(steps, stepIndex);

  if (isDismissed || !visibleStep) {
    return null;
  }

  const handlePrimaryPress = () => {
    if (visibleStep.isLastStep) {
      dismissTour(screenId);
      return;
    }

    setStepIndex((index) => index + 1);
  };
  const progressLabel = interpolate(t.common.progressOf, {
    current: visibleStep.index + 1,
    total: steps.filter((step) => step.title.trim() && step.body.trim()).length,
  });
  const primaryLabel = visibleStep.isLastStep ? t.common.done : t.common.next;
  const closeLabel = `Close ${screenLabel} tour`;

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      statusBarTranslucent
      onRequestClose={() => dismissTour(screenId)}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, style]}>
          <LinearGradient
            colors={GRADIENTS.cardAccentBar}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.accent}
          />
          <View style={styles.inner}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={() => dismissTour(screenId)}
              style={styles.closeButton}
              hitSlop={8}
            >
              <Text style={styles.closeText}>X</Text>
            </Pressable>

            <View style={styles.topRow}>
              <Text style={styles.eyebrow}>
                {t.common.quickTour.toUpperCase()}
              </Text>
              <Text style={styles.progress}>{progressLabel}</Text>
            </View>

            <Text style={styles.title}>{visibleStep.step.title}</Text>
            <Text style={styles.body}>{visibleStep.step.body}</Text>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={interpolate(t.common.skipTourFor, {
                  screen: screenLabel,
                })}
                onPress={() => dismissTour(screenId)}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>{t.common.skipTour}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  visibleStep.isLastStep
                    ? interpolate(t.common.finishTour, { screen: screenLabel })
                    : interpolate(t.common.nextTourStep, { screen: screenLabel })
                }
                onPress={handlePrimaryPress}
                style={styles.primaryPress}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryText}>{primaryLabel}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: COLORS.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    borderRadius: RADII.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  accent: {
    height: 3,
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
  },
  closeText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingRight: 34,
  },
  eyebrow: {
    color: COLORS.pink,
    ...TYPOGRAPHY.label,
  },
  progress: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  body: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  skipButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  skipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryPress: {
    minWidth: 96,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});
