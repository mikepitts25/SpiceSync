import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { StatusBar } from 'expo-status-bar';
import { Bell, Heart, Sparkles, Trophy } from 'lucide-react-native';

import { BackHeader, SectionRow, Toggle } from '../../components/app-chrome';
import {
  getConversationNotificationSettings,
  getMatchAlertSettings,
  getNotificationFrequency,
  getNotificationSettings,
  getStreakReminderSettings,
  initializeNotifications,
  toggleConversationNotifications,
  toggleMatchAlerts,
  toggleNotifications,
  toggleStreakReminders,
  updateNotificationFrequency,
} from '../../lib/notifications';
import {
  FREQUENCY_OPTIONS,
  NotificationFrequency,
} from '../../lib/notifications/schedule';
import { useHaptics } from '../../hooks/useHaptics';
import { COLORS } from '../../constants/theme';

import { ui } from '../../lib/i18n/uiLiteral';

const FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  daily: 'Daily',
  every_other_day: 'Every other day',
  weekly: 'Weekly',
};

export default function NotificationSettingsScreen() {
  const { success, error } = useHaptics();
  const [dailyReminder, setDailyReminder] = useState(false);
  const [frequency, setFrequency] = useState<NotificationFrequency>('daily');
  const [partnerActivity, setPartnerActivity] = useState(false);
  const [matchAlerts, setMatchAlerts] = useState(false);
  const [streakReminders, setStreakReminders] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Hydrate every toggle from what's actually scheduled, so the UI reflects
    // real state instead of optimistic defaults.
    Promise.all([
      getNotificationSettings(),
      getNotificationFrequency(),
      getConversationNotificationSettings(),
      getMatchAlertSettings(),
      getStreakReminderSettings(),
    ]).then(([daily, freq, conversation, match, streak]) => {
      setDailyReminder(daily.enabled);
      setFrequency(freq);
      setPartnerActivity(conversation.enabled);
      setMatchAlerts(match.enabled);
      setStreakReminders(streak.enabled);
    });
  }, []);

  /**
   * Every toggle needs the same shape: ask for permission before turning on,
   * persist, and only move the switch if the scheduler actually succeeded.
   */
  const runToggle = useCallback(
    async (
      value: boolean,
      persist: (enabled: boolean) => Promise<boolean>,
      apply: (enabled: boolean) => void
    ) => {
      if (loading) return;
      setLoading(true);

      if (value) {
        const initialized = await initializeNotifications();
        if (!initialized) {
          error();
          setLoading(false);
          return;
        }
      }

      const ok = await persist(value);
      if (ok) {
        apply(value);
        success();
      } else {
        error();
      }
      setLoading(false);
    },
    [loading, success, error]
  );

  const handleFrequencyChange = async (next: NotificationFrequency) => {
    if (loading || next === frequency) return;
    setLoading(true);

    const ok = await updateNotificationFrequency(next);
    if (ok) {
      setFrequency(next);
      success();
    } else {
      error();
    }
    setLoading(false);
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title={ui('Notifications')} />
      <View style={styles.content}>
        <View style={styles.sectionCard}>
          <SectionRow
            icon={Sparkles}
            label={ui('Daily Reminder')}
            tint={COLORS.pink}
            badgeBg="rgba(194,24,91,0.15)"
            toggle={
              <Toggle
                value={dailyReminder}
                onValueChange={(value) =>
                  runToggle(value, toggleNotifications, setDailyReminder)
                }
              />
            }
          />
          <SectionRow
            icon={Heart}
            label={ui('Conversation Starters')}
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.15)"
            toggle={
              <Toggle
                value={partnerActivity}
                onValueChange={(value) =>
                  runToggle(
                    value,
                    toggleConversationNotifications,
                    setPartnerActivity
                  )
                }
              />
            }
          />
          <SectionRow
            icon={Bell}
            label={ui('Match Alerts')}
            tint={COLORS.maybe}
            badgeBg="rgba(245,158,11,0.1)"
            toggle={
              <Toggle
                value={matchAlerts}
                onValueChange={(value) =>
                  runToggle(value, toggleMatchAlerts, setMatchAlerts)
                }
              />
            }
          />
          <SectionRow
            icon={Trophy}
            label={ui('Streak Reminders')}
            tint={COLORS.yes}
            badgeBg="rgba(34,197,94,0.1)"
            toggle={
              <Toggle
                value={streakReminders}
                onValueChange={(value) =>
                  runToggle(value, toggleStreakReminders, setStreakReminders)
                }
              />
            }
            last
          />
        </View>

        {dailyReminder ? (
          <View style={styles.frequencyCard}>
            <Text style={styles.frequencyTitle}>
              {ui('Reminder Frequency')}
            </Text>
            <Text style={styles.frequencyHint}>
              {ui(' How often your daily reminder arrives. ')}
            </Text>
            <View style={styles.frequencyRow}>
              {FREQUENCY_OPTIONS.map((option) => {
                const selected = option === frequency;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={FREQUENCY_LABELS[option]}
                    onPress={() => handleFrequencyChange(option)}
                    style={[
                      styles.frequencyOption,
                      selected && styles.frequencyOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.frequencyLabel,
                        selected && styles.frequencyLabelActive,
                      ]}
                    >
                      {FREQUENCY_LABELS[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <Text style={styles.helperText}>
          {ui(' Notification preferences stay on this device. ')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    overflow: 'hidden',
  },
  frequencyCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    padding: 16,
    gap: 6,
  },
  frequencyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  frequencyHint: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginBottom: 6,
  },
  // Stacked rather than side-by-side: at the 16px readability floor, a label
  // like "Every other day" can't fit three-across on a narrow phone without
  // truncating.
  frequencyRow: {
    gap: 8,
  },
  frequencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  frequencyOptionActive: {
    backgroundColor: 'rgba(255,45,146,0.18)',
    borderColor: COLORS.pink,
  },
  frequencyLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  frequencyLabelActive: {
    color: COLORS.textPrimary,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
