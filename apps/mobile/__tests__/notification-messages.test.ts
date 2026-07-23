import {
  DAILY_CARD_MESSAGES,
  CONVERSATION_MESSAGES,
  MATCH_MESSAGES,
  STREAK_MESSAGES,
  getMessageBank,
  localizeMessage,
  pickMessageSequence,
} from '../data/notification_messages';
import {
  FREQUENCY_OPTIONS,
  buildFireDates,
  frequencyStrideDays,
  scheduleCountForWindow,
} from '../lib/notifications/schedule';

const ALL_BANKS = [
  ...DAILY_CARD_MESSAGES,
  ...CONVERSATION_MESSAGES,
  ...MATCH_MESSAGES,
  ...STREAK_MESSAGES,
];

describe('notification message bank', () => {
  it('has unique ids across every bank', () => {
    const ids = ALL_BANKS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides both EN and ES copy for every message', () => {
    for (const message of ALL_BANKS) {
      expect(message.title.trim()).not.toHaveLength(0);
      expect(message.body.trim()).not.toHaveLength(0);
      expect(message.titleEs.trim()).not.toHaveLength(0);
      expect(message.bodyEs.trim()).not.toHaveLength(0);
    }
  });

  it('keeps bodies short enough to survive a lock screen', () => {
    for (const message of ALL_BANKS) {
      expect(message.body.length).toBeLessThanOrEqual(120);
      expect(message.bodyEs.length).toBeLessThanOrEqual(120);
    }
  });

  it('localizes by language with an EN fallback', () => {
    const [message] = DAILY_CARD_MESSAGES;
    expect(localizeMessage(message, 'es')).toEqual({
      title: message.titleEs,
      body: message.bodyEs,
    });
    expect(localizeMessage(message, 'en')).toEqual({
      title: message.title,
      body: message.body,
    });
    expect(localizeMessage(message, 'fr')).toEqual({
      title: message.title,
      body: message.body,
    });
  });
});

describe('pickMessageSequence', () => {
  it('deals a full cycle with no repeats before exhausting the bank', () => {
    const bank = getMessageBank('daily_card');
    const picked = pickMessageSequence('daily_card', bank.length);

    expect(picked).toHaveLength(bank.length);
    expect(new Set(picked.map((m) => m.id)).size).toBe(bank.length);
  });

  it('never repeats a message on two consecutive days', () => {
    // Far more days than the smallest bank holds, so this crosses several
    // reshuffle seams — exactly where a naive implementation repeats itself.
    const picked = pickMessageSequence('streak', 200);

    expect(picked).toHaveLength(200);
    for (let i = 1; i < picked.length; i += 1) {
      expect(picked[i].id).not.toBe(picked[i - 1].id);
    }
  });

  it('returns nothing for a non-positive count', () => {
    expect(pickMessageSequence('daily_card', 0)).toEqual([]);
    expect(pickMessageSequence('daily_card', -3)).toEqual([]);
  });
});

describe('buildFireDates', () => {
  it('starts today when the time has not passed yet', () => {
    const now = new Date('2026-07-13T08:00:00');
    const [first] = buildFireDates(20, 0, 3, now);

    expect(first.getDate()).toBe(13);
    expect(first.getHours()).toBe(20);
    expect(first.getMinutes()).toBe(0);
  });

  it('skips to tomorrow when the time has already passed', () => {
    const now = new Date('2026-07-13T21:30:00');
    const [first] = buildFireDates(20, 0, 3, now);

    expect(first.getDate()).toBe(14);
    expect(first.getHours()).toBe(20);
  });

  it('produces the requested number of consecutive future days', () => {
    const now = new Date('2026-07-13T08:00:00');
    const dates = buildFireDates(20, 0, 14, now);

    expect(dates).toHaveLength(14);
    for (const date of dates) {
      expect(date.getTime()).toBeGreaterThan(now.getTime());
    }
    for (let i = 1; i < dates.length; i += 1) {
      const dayApart =
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      expect(dayApart).toBeCloseTo(1, 5);
    }
  });

  it('rolls over month boundaries', () => {
    const now = new Date('2026-07-30T08:00:00');
    const dates = buildFireDates(20, 0, 4, now);

    expect(dates.map((d) => d.getMonth())).toEqual([6, 6, 7, 7]);
    expect(dates.map((d) => d.getDate())).toEqual([30, 31, 1, 2]);
  });

  it('spaces fire dates by the frequency stride', () => {
    const now = new Date('2026-07-13T08:00:00');

    expect(
      buildFireDates(20, 0, 3, now, 'every_other_day').map((d) => d.getDate())
    ).toEqual([13, 15, 17]);

    expect(
      buildFireDates(20, 0, 3, now, 'weekly').map((d) => d.getDate())
    ).toEqual([13, 20, 27]);
  });

  it('skips a full stride when the time has already passed', () => {
    const now = new Date('2026-07-13T21:00:00');

    // Not simply "tomorrow" — the next slot on a weekly cadence is a week out.
    expect(buildFireDates(20, 0, 1, now, 'weekly')[0].getDate()).toBe(20);
  });
});

describe('frequency scheduling', () => {
  it('maps each frequency to its stride in days', () => {
    expect(frequencyStrideDays('daily')).toBe(1);
    expect(frequencyStrideDays('every_other_day')).toBe(2);
    expect(frequencyStrideDays('weekly')).toBe(7);
  });

  it('queues fewer entries for sparser cadences covering the same window', () => {
    expect(scheduleCountForWindow('daily', 14)).toBe(14);
    expect(scheduleCountForWindow('every_other_day', 14)).toBe(7);
    expect(scheduleCountForWindow('weekly', 14)).toBe(2);
  });

  it('always queues at least one entry', () => {
    for (const frequency of FREQUENCY_OPTIONS) {
      expect(scheduleCountForWindow(frequency, 1)).toBeGreaterThanOrEqual(1);
      expect(scheduleCountForWindow(frequency, 0)).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps every queue combined under the iOS 64-notification cap', () => {
    // iOS silently drops pending notifications past 64. The worst case is every
    // queue enabled at its most frequent cadence.
    const worstCase =
      scheduleCountForWindow('daily', 14) + // activity cards, if set to daily
      scheduleCountForWindow('daily', 14) + // conversation starters
      scheduleCountForWindow('weekly', 14) + // match alerts
      scheduleCountForWindow('daily', 14); // streak reminders

    expect(worstCase).toBeLessThanOrEqual(64);
  });
});
