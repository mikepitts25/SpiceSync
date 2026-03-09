// Notification Settings Screen
// Configure daily card push notifications

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { 
  initializeNotifications,
  getNotificationSettings,
  toggleNotifications,
  updateNotificationTime,
  sendTestNotification,
} from '../../lib/notifications';
import AnimatedButton from '../../components/AnimatedButton';
import { useRouter } from 'expo-router';
import { useHaptics } from '../../hooks/useHaptics';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { success, error: hapticError } = useHaptics();
  
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Load settings on mount
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
  
  // Handle toggle
  const handleToggle = async (value: boolean) => {
    setLoading(true);
    
    if (value) {
      // Initialize and request permissions
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
  
  // Handle time change
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    
    if (selectedDate) {
      setTime(selectedDate);
      updateNotificationTime(selectedDate.getHours(), selectedDate.getMinutes());
      success();
    }
  };
  
  // Send test notification
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          Get daily inspiration delivered to you
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Enable Toggle */}
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Daily Activity Card</Text>
              <Text style={styles.settingDescription}>
                Receive a new activity suggestion every day
              </Text>
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
        
        {/* Time Setting */}
        {enabled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏰ Notification Time</Text>
            
            <Pressable style={styles.timeButton} onPress={() => setShowPicker(true)}>
              <Text style={styles.timeText}>{formatTime(time)}</Text>
              <Text style={styles.timeHint}>Tap to change</Text>
            </Pressable>
            
            {showPicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
            )}
            
            <Text style={styles.timeDescription}>
              We'll send you a fun new activity idea at this time every day.
              Default is 8:00 PM.
            </Text>
          </View>
        )}
        
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>📱 Preview</Text>
          <View style={styles.notificationPreview}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationIcon}>
                <Text style={styles.notificationIconText}>💡</Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Daily Spice Idea</Text>
                <Text style={styles.notificationBody}>
                  Today's idea: Try something new together
                </Text>
              </View>
            </View>
          </View>
          
          {enabled && (
            <AnimatedButton
              title="Send Test Notification"
              variant="outline"
              onPress={handleTest}
              style={styles.testButton}
            />
          )}
        </View>
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tips</Text>
          <Text style={styles.infoText}>
            • Notifications help you discover new activities{'\n'}
            • Each day brings a new surprise suggestion{'\n'}
            • Tap the notification to open the app directly{'\n'}
            • You can change the time or turn off anytime
          </Text>
        </View>
        
        {/* Back Button */}
        <AnimatedButton
          title="Back to Settings"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// Pressable component for time button
import { Pressable } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 1.5,
    margin: SIZES.padding * 2,
    marginBottom: 0,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: SIZES.padding,
  },
  settingTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  settingDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  timeButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
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
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 1.5,
    margin: SIZES.padding * 2,
    marginBottom: 0,
    ...SHADOWS.sm,
  },
  previewTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconText: {
    fontSize: 20,
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
  },
  infoCard: {
    backgroundColor: `${COLORS.secondary}10`,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 1.5,
    margin: SIZES.padding * 2,
    marginBottom: 0,
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
  backButton: {
    margin: SIZES.padding * 2,
    marginTop: SIZES.padding,
  },
});
