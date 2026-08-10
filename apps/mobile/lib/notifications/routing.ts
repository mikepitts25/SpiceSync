import type { NotificationFrequency } from './schedule';

const TYPE_DESTINATIONS: Record<string, string> = {
  daily_card: '/(tabs)/deck',
  test: '/(tabs)/deck',
  match_alert: '/(tabs)/matches',
  streak_reminder: '/(tabs)/deck',
  daily_conversation: '/(conversation)',
  test_conversation: '/(conversation)',
};

const APPROVED_DESTINATIONS = new Set(Object.values(TYPE_DESTINATIONS));

export function getNotificationDestination(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (!data) return null;
  const byType =
    typeof data.type === 'string' ? TYPE_DESTINATIONS[data.type] : undefined;
  if (byType) return byType;

  return typeof data.screen === 'string' &&
    APPROVED_DESTINATIONS.has(
      data.screen.startsWith('/') ? data.screen : `/${data.screen}`
    )
    ? data.screen.startsWith('/')
      ? data.screen
      : `/${data.screen}`
    : null;
}

export function getNotificationSummaryLabel({
  dailyEnabled,
  frequency,
  otherEnabled,
}: {
  dailyEnabled: boolean;
  frequency: NotificationFrequency;
  otherEnabled: boolean;
}): string {
  if (dailyEnabled) {
    if (frequency === 'weekly') return 'Weekly';
    if (frequency === 'every_other_day') return 'Every other day';
    return 'Daily';
  }
  return otherEnabled ? 'On' : 'Off';
}
