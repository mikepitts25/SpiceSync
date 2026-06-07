import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bell, Heart, Sparkles, Trophy } from 'lucide-react-native';

import { BackHeader, SectionRow, Toggle } from '../../components/app-chrome';
import {
  getNotificationSettings,
  initializeNotifications,
  toggleNotifications,
} from '../../lib/notifications';
import { useHaptics } from '../../hooks/useHaptics';
import { COLORS } from '../../constants/theme';

export default function NotificationSettingsScreen() {
  const { success, error } = useHaptics();
  const [dailyReminder, setDailyReminder] = useState(false);
  const [partnerActivity, setPartnerActivity] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [streakReminders, setStreakReminders] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getNotificationSettings().then((settings) => {
      setDailyReminder(settings.enabled);
    });
  }, []);

  const handleDailyToggle = async (value: boolean) => {
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

    const toggled = await toggleNotifications(value);
    if (toggled) {
      setDailyReminder(value);
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
      <BackHeader title="Notifications" />

      <View style={styles.content}>
        <View style={styles.sectionCard}>
          <SectionRow
            icon={Sparkles}
            label="Daily Reminder"
            tint={COLORS.pink}
            badgeBg="rgba(194,24,91,0.15)"
            toggle={
              <Toggle value={dailyReminder} onValueChange={handleDailyToggle} />
            }
          />
          <SectionRow
            icon={Heart}
            label="Partner Activity"
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.15)"
            toggle={
              <Toggle
                value={partnerActivity}
                onValueChange={setPartnerActivity}
              />
            }
          />
          <SectionRow
            icon={Bell}
            label="Match Alerts"
            tint={COLORS.maybe}
            badgeBg="rgba(245,158,11,0.1)"
            toggle={
              <Toggle value={matchAlerts} onValueChange={setMatchAlerts} />
            }
          />
          <SectionRow
            icon={Trophy}
            label="Streak Reminders"
            tint={COLORS.yes}
            badgeBg="rgba(34,197,94,0.1)"
            toggle={
              <Toggle
                value={streakReminders}
                onValueChange={setStreakReminders}
              />
            }
            last
          />
        </View>

        <Text style={styles.helperText}>
          Notification preferences stay on this device.
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
  helperText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
