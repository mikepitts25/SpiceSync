// Notification Settings Screen
// Configure daily card push notifications

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Bell, ChevronLeft, Clock, Sparkles } from 'lucide-react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { 
  initializeNotifications,
  getNotificationSettings,
  toggleNotifications,
  updateNotificationTime,
  sendTestNotification,
} from '../../lib/notifications';
import { useRouter } from 'expo-router';
import { useHaptics } from '../../hooks/useHaptics';
import { useTranslation } from '../../lib/i18n';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { success, error: hapticError } = useHaptics();
  const { t } = useTranslation();
  const tn = t.notifications;
  
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    const settings = await getNotificationSettings();
    setEnabled(settings.enabled);
    const newTime = new Date();
    newTime.setHours(settings.hour);
    newTime.setMinutes(settings.minute);
    setTime(newTime);
  };
  
  const handleToggle = async (value: boolean) => {
    setLoading(true);
    
    if (value) {
      const initialized = await initializeNotifications();
      if (!initialized) {
        hapticError();
        setLoading(false);
        return;
      }
    }
    
    const success_toggle = await toggleNotifications(value);
    if (success_toggle) {
      setEnabled(value);
      success();
    } else {
      hapticError();
    }
    
    setLoading(false);
  };
  
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    
    if (selectedDate) {
      setTime(selectedDate);
      updateNotificationTime(selectedDate.getHours(), selectedDate.getMinutes());
      success();
    }
  };
  
  const handleTest = async () => {
    await sendTestNotification();
    success();
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Bell size={24} color={COLORS.success} />
          </View>
          <Text style={styles.headerTitle}>{tn.title}</Text>
          <Text style={styles.headerSubtitle}>{tn.subtitle}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Enable Toggle */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconContainer}>
                <Sparkles size={24} color={COLORS.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{tn.dailyActivityCard}</Text>
                <Text style={styles.settingDescription}>{tn.dailyActivityCardDesc}</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                disabled={loading}
                trackColor={{ false: COLORS.border, true: `${COLORS.primary}50` }}
                thumbColor={enabled ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          </View>
        </Animated.View>
        
        {/* Time Setting */}
        {enabled && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: `${COLORS.accent}20` }]}>
                  <Clock size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.cardTitle}>{tn.notificationTime}</Text>
              </View>
              
              <Pressable style={styles.timeButton} onPress={() => setShowPicker(true)}>
                <Text style={styles.timeText}>{formatTime(time)}</Text>
                <Text style={styles.timeHint}>{tn.tapToChange}</Text>
              </Pressable>
              
              {showPicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              )}
              
              <Text style={styles.timeDescription}>{tn.timeDescription}</Text>
            </View>
          </Animated.View>
        )}
        
        {/* Preview Card */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{tn.preview}</Text>
            <View style={styles.notificationPreview}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationIconText}>💡</Text>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{tn.dailySpiceIdea}</Text>
                  <Text style={styles.notificationBody}>{tn.todayIdea}</Text>
                </View>
              </View>
            </View>
            
            {enabled && (
              <Pressable style={styles.testButton} onPress={handleTest}>
                <Text style={styles.testButtonText}>{tn.sendTest}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
        
        {/* Info Card */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{tn.tipsTitle}</Text>
            <Text style={styles.infoText}>{tn.tipsText}</Text>
          </View>
        </Animated.View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${COLORS.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  
  scrollContent: {
    padding: SIZES.paddingLarge,
    paddingTop: 0,
  },
  
  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  
  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
  
  // Time
  timeButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.primary,
  },
  timeHint: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  timeDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SIZES.padding,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Preview
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  previewTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  notificationPreview: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconText: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  notificationBody: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testButton: {
    marginTop: SIZES.padding,
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  
  // Info
  infoCard: {
    backgroundColor: `${COLORS.secondary}10`,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}30`,
  },
  infoTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
