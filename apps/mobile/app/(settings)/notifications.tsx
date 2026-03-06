import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  emoji: string;
  enabled: boolean;
}

export default function NotificationSettings() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'daily_suggestion',
      title: 'Daily Suggestions',
      description: 'Get a personalized activity recommendation each day',
      emoji: '💡',
      enabled: true,
    },
    {
      id: 'new_matches',
      title: 'New Matches',
      description: 'When you and your partner both like something',
      emoji: '💕',
      enabled: true,
    },
    {
      id: 'partner_activity',
      title: 'Partner Activity',
      description: 'When your partner votes on activities',
      emoji: '👀',
      enabled: false,
    },
    {
      id: 'streak_reminders',
      title: 'Streak Reminders',
      description: 'Daily reminders to maintain your streak',
      emoji: '🔥',
      enabled: true,
    },
    {
      id: 'achievements',
      title: 'Achievement Unlocks',
      description: 'When you earn a new badge',
      emoji: '🏆',
      enabled: true,
    },
    {
      id: 'game_reminders',
      title: 'Game Reminders',
      description: 'Reminders to play Spice Dice',
      emoji: '🎲',
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleTestNotification = (setting: NotificationSetting) => {
    Alert.alert(
      'Test Notification',
      `This would send a test ${setting.title.toLowerCase()} notification.`,
      [{ text: 'OK' }]
    );
  };

  const allEnabled = settings.every((s) => s.enabled);
  const someEnabled = settings.some((s) => s.enabled) && !allEnabled;

  const toggleAll = () => {
    const newValue = !allEnabled;
    setSettings((prev) => prev.map((s) => ({ ...s, enabled: newValue })));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Notifications</Text>
        <Text style={styles.subtitle}>
          Manage what notifications you receive
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Master Toggle */}
        <View style={styles.masterToggle}>
          <View style={styles.masterToggleLeft}>
            <Text style={styles.masterToggleEmoji}>🔔</Text>
            <View>
              <Text style={styles.masterToggleTitle}>All Notifications</Text>
              <Text style={styles.masterToggleStatus}>
                {allEnabled ? 'On' : someEnabled ? 'Some on' : 'Off'}
              </Text>
            </View>
          </View>
          <Switch
            value={allEnabled}
            onValueChange={toggleAll}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Individual Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          {settings.map((setting) => (
            <View key={setting.id} style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingEmoji}>{setting.emoji}</Text>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>
                    {setting.description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.settingRight}>
                <Pressable
                  style={styles.testButton}
                  onPress={() => handleTestNotification(setting)}
                >
                  <Text style={styles.testButtonText}>Test</Text>
                </Pressable>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Quiet Hours */}
        <View style={styles.quietHoursCard}>
          <Text style={styles.quietHoursEmoji}>🌙</Text>
          <View style={styles.quietHoursInfo}>
            <Text style={styles.quietHoursTitle}>Quiet Hours</Text>
            <Text style={styles.quietHoursDescription}>
              Notifications paused from 10 PM to 8 AM
            </Text>
          </View>
          <Switch
            value={true}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>ℹ️</Text>
          <Text style={styles.infoText}>
            You can also manage notifications in your device settings. 
            Some notifications may still appear even if disabled here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    margin: SIZES.padding * 2,
    marginTop: SIZES.padding,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  masterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterToggleEmoji: {
    fontSize: 28,
    marginRight: SIZES.padding,
  },
  masterToggleTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  masterToggleStatus: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  settingsSection: {
    paddingHorizontal: SIZES.padding * 2,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingEmoji: {
    fontSize: 24,
    marginRight: SIZES.padding,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    marginRight: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testButtonText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  quietHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: SIZES.padding * 2,
    marginTop: SIZES.padding,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quietHoursEmoji: {
    fontSize: 28,
    marginRight: SIZES.padding,
  },
  quietHoursInfo: {
    flex: 1,
  },
  quietHoursTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  quietHoursDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.info}15`,
    margin: SIZES.padding * 2,
    marginTop: 0,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: SIZES.padding,
  },
  infoText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
