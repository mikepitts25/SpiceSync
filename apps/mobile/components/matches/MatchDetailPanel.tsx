import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  CalendarClock,
  CheckCircle,
  Circle,
  Heart,
  MessageCircle,
  Share2,
  Star,
  X,
} from 'lucide-react-native';

import type { MatchExplanation } from '../../lib/match/actionBuckets';
import type { MatchPlan } from '../../lib/state/matchPlans';
import { interpolate, type useTranslation } from '../../lib/i18n';
import { COLORS, SHADOWS } from '../../constants/theme';
import {
  formatMatchMeta,
  voteLabel,
  type MatchItem,
} from './matchPresentation';

export function MatchDetailPanel({
  item,
  explanation,
  plan,
  completedSteps,
  onToggleStep,
  onToggleFavorite,
  onToggleNextSession,
  onMarkCompleted,
  onNoteChange,
  onShareProposal,
  onClose,
  t,
}: {
  item: MatchItem;
  explanation: MatchExplanation;
  plan?: MatchPlan;
  completedSteps: Record<string, true>;
  onToggleStep: (stepId: string) => void;
  onToggleFavorite: () => void;
  onToggleNextSession: () => void;
  onMarkCompleted: () => void;
  onNoteChange: (note: string) => void;
  onShareProposal: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [noteDraft, setNoteDraft] = useState(plan?.note ?? '');

  useEffect(() => {
    setNoteDraft(plan?.note ?? '');
    // Reset the draft only when switching activities, not on every keystroke
    // round-trip through the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const completedCount = plan?.completedAt.length ?? 0;

  return (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleCopy}>
          <Text style={styles.detailEyebrow}>
            {formatMatchMeta(item).toUpperCase()}
          </Text>
          <Text style={styles.detailTitle}>{item.title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close match details"
          onPress={onClose}
          style={styles.detailClose}
        >
          <X size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={styles.votePillRow}>
        <View style={styles.votePill}>
          <Text style={styles.votePillLabel}>You</Text>
          <Text style={styles.votePillValue}>{voteLabel(item.myVote)}</Text>
        </View>
        <View style={styles.votePill}>
          <Text style={styles.votePillLabel}>Partner</Text>
          <Text style={styles.votePillValue}>
            {voteLabel(item.partnerVote)}
          </Text>
        </View>
      </View>

      <View style={styles.explanationCard}>
        <Text style={styles.explanationLabel}>
          {t.matches.whyThisMatch.toUpperCase()}
        </Text>
        <Text style={styles.explanationHeadline}>{explanation.headline}</Text>
        <Text style={styles.explanationNote}>
          {explanation.intensityRiskNote}
        </Text>
      </View>

      <View style={styles.roleCallout}>
        <Heart size={15} color={COLORS.pink} fill={COLORS.pink} />
        <Text style={styles.roleCalloutText}>{explanation.roleNote}</Text>
      </View>

      {item.description ? (
        <Text style={styles.detailDescription}>{item.description}</Text>
      ) : null}

      <View style={styles.starterCard}>
        <MessageCircle size={15} color={COLORS.accent} />
        <View style={styles.starterCopy}>
          <Text style={styles.starterLabel}>
            {t.matches.conversationStarter.toUpperCase()}
          </Text>
          <Text style={styles.starterText}>
            {explanation.conversationStarter}
          </Text>
        </View>
      </View>

      <ChecklistCard
        title={t.matches.prepChecklist}
        steps={explanation.prep}
        idPrefix="prep"
        completedSteps={completedSteps}
        onToggleStep={onToggleStep}
      />

      {explanation.safetyNotes.length ? (
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>
            {t.matches.safetyNotes.toUpperCase()}
          </Text>
          {explanation.safetyNotes.map((note, index) => (
            <Text key={index} style={styles.safetyNote}>
              {`• ${note}`}
            </Text>
          ))}
        </View>
      ) : null}

      <ChecklistCard
        title={t.matches.aftercareChecklist}
        steps={explanation.aftercare}
        idPrefix="aftercare"
        completedSteps={completedSteps}
        onToggleStep={onToggleStep}
      />

      <View style={styles.planCard}>
        <Text style={styles.planTitle}>
          {t.matches.planActions.toUpperCase()}
        </Text>
        <View style={styles.planActionRow}>
          <PlanActionButton
            icon={Star}
            label={plan?.favorite ? t.matches.favorited : t.matches.favorite}
            active={Boolean(plan?.favorite)}
            onPress={onToggleFavorite}
          />
          <PlanActionButton
            icon={CalendarClock}
            label={
              plan?.nextSession ? t.matches.planned : t.matches.nextSession
            }
            active={Boolean(plan?.nextSession)}
            onPress={onToggleNextSession}
          />
          <PlanActionButton
            icon={CheckCircle}
            label={
              completedCount
                ? interpolate(t.matches.completedTimes, {
                    count: completedCount,
                  })
                : t.matches.markCompleted
            }
            active={completedCount > 0}
            onPress={onMarkCompleted}
          />
        </View>

        <Text style={styles.noteLabel}>
          {t.matches.privateNote.toUpperCase()}
        </Text>
        <TextInput
          value={noteDraft}
          onChangeText={setNoteDraft}
          onEndEditing={() => onNoteChange(noteDraft)}
          placeholder={t.matches.privateNotePlaceholder}
          placeholderTextColor={COLORS.textMuted}
          multiline
          style={styles.noteInput}
          accessibilityLabel={t.matches.privateNote}
        />

        <Pressable
          accessibilityRole="button"
          onPress={onShareProposal}
          style={styles.proposalButton}
        >
          <Share2 size={15} color={COLORS.textPrimary} />
          <Text style={styles.proposalButtonText}>
            {t.matches.shareProposal.toUpperCase()}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ChecklistCard({
  title,
  steps,
  idPrefix,
  completedSteps,
  onToggleStep,
}: {
  title: string;
  steps: string[];
  idPrefix: string;
  completedSteps: Record<string, true>;
  onToggleStep: (stepId: string) => void;
}) {
  if (!steps.length) return null;
  return (
    <View style={styles.planCard}>
      <Text style={styles.planTitle}>{title.toUpperCase()}</Text>
      {steps.map((body, index) => {
        const stepId = `${idPrefix}-${index}`;
        const checked = Boolean(completedSteps[stepId]);
        return (
          <Pressable
            key={stepId}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => onToggleStep(stepId)}
            style={styles.planStep}
          >
            {checked ? (
              <CheckCircle size={18} color={COLORS.yes} />
            ) : (
              <Circle size={18} color={COLORS.textMuted} />
            )}
            <View style={styles.planStepCopy}>
              <Text style={styles.planStepBody}>{body}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function PlanActionButton({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: typeof Star;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? COLORS.pink : COLORS.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.planActionButton, active && styles.planActionButtonActive]}
    >
      <Icon size={16} color={color} fill={active ? COLORS.pink : 'none'} />
      <Text style={[styles.planActionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  detailPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.24)',
    backgroundColor: COLORS.card,
    padding: 16,
    gap: 14,
    ...SHADOWS.card,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  detailEyebrow: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  detailClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  votePillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  votePill: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
    gap: 3,
  },
  votePillLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  votePillValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  roleCallout: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,45,146,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleCalloutText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  detailDescription: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 12,
    gap: 10,
  },
  planTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: 10,
  },
  planStepCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  planStepBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  explanationCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
    backgroundColor: 'rgba(139,92,246,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  explanationLabel: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  explanationHeadline: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  explanationNote: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  starterCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.28)',
    backgroundColor: 'rgba(167,139,250,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  starterCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  starterLabel: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  starterText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  safetyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.24)',
    backgroundColor: 'rgba(239,68,68,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  safetyTitle: {
    color: COLORS.no,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  safetyNote: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  planActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  planActionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  planActionButtonActive: {
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.12)',
  },
  planActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  noteLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  noteInput: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(0,0,0,0.18)',
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  proposalButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  proposalButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
