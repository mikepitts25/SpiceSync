// Pure scheduling helpers. Kept free of expo-notifications so they stay
// unit-testable without native module mocks.

/** How often a notification queue fires. */
export type NotificationFrequency = 'daily' | 'every_other_day' | 'weekly';

export const FREQUENCY_OPTIONS: NotificationFrequency[] = [
  'daily',
  'every_other_day',
  'weekly',
];

/** Days between consecutive fires for a given frequency. */
export function frequencyStrideDays(frequency: NotificationFrequency): number {
  switch (frequency) {
    case 'every_other_day':
      return 2;
    case 'weekly':
      return 7;
    case 'daily':
    default:
      return 1;
  }
}

/**
 * The next `count` fire dates at hour:minute, spaced by the frequency stride.
 *
 * Starts today when that time hasn't passed yet, otherwise the next stride.
 * `setDate` is used for the arithmetic so month/year rollover and DST shifts
 * are handled by the Date implementation rather than by hand.
 */
export function buildFireDates(
  hour: number,
  minute: number,
  count: number,
  now: Date = new Date(),
  frequency: NotificationFrequency = 'daily'
): Date[] {
  if (count <= 0) return [];

  const stride = frequencyStrideDays(frequency);
  const dates: Date[] = [];

  const first = new Date(now);
  first.setHours(hour, minute, 0, 0);
  if (first.getTime() <= now.getTime()) {
    first.setDate(first.getDate() + stride);
  }

  for (let i = 0; i < count; i += 1) {
    const date = new Date(first);
    date.setDate(first.getDate() + i * stride);
    dates.push(date);
  }

  return dates;
}

/**
 * How many notifications to queue to cover roughly `windowDays` ahead.
 *
 * A weekly queue needs far fewer entries than a daily one to span the same
 * stretch of calendar, and iOS caps an app at 64 pending notifications — so we
 * scale the count by the stride instead of always queueing a fixed number.
 */
export function scheduleCountForWindow(
  frequency: NotificationFrequency,
  windowDays: number
): number {
  const stride = frequencyStrideDays(frequency);
  return Math.max(1, Math.ceil(windowDays / stride));
}
