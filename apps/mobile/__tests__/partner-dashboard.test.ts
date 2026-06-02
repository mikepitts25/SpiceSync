import {
  formatRelativeSyncTime,
  getPartnerDashboardStats,
} from '../lib/sync/partnerDashboard';

const now = Date.UTC(2026, 5, 2, 12, 0, 0);

describe('partner dashboard stats', () => {
  it('formats missing and relative sync times', () => {
    expect(formatRelativeSyncTime(null, now)).toBe('Never synced');
    expect(formatRelativeSyncTime(now - 20_000, now)).toBe('Just now');
    expect(formatRelativeSyncTime(now - 5 * 60_000, now)).toBe('5m ago');
    expect(formatRelativeSyncTime(now - 3 * 60 * 60_000, now)).toBe('3h ago');
    expect(formatRelativeSyncTime(now - 2 * 24 * 60 * 60_000, now)).toBe(
      '2d ago'
    );
  });

  it('builds display stats from local sync state', () => {
    const stats = getPartnerDashboardStats({
      now,
      link: {
        coupleId: 'couple-1',
        myDeviceId: 'dev-a',
        partnerDeviceId: 'dev-b',
        partnerSigningPublicKey: 'sign',
        partnerEncryptionPublicKey: 'enc',
        linkedAt: now - 24 * 60 * 60_000,
        lastPulledServerSequence: 4,
        lastSyncedAt: now - 5 * 60_000,
        status: 'active',
      },
      partnerVotes: {
        'card-1': {
          cardId: 'card-1',
          vote: 'yes',
          updatedAt: now - 10,
          receivedAt: now - 5,
        },
      },
      answeredCount: 3,
      pendingEvents: [
        {
          eventId: 'evt-1',
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'couple.unlink',
            eventId: 'evt-1',
            authorDeviceId: 'dev-a',
            updatedAt: now,
          },
          createdAt: now,
          attempts: 0,
          nextAttemptAt: now,
        },
      ],
      localProfileId: 'profile-a',
      profiles: [{ id: 'profile-a', displayName: 'Mike' }],
    });

    expect(
      Object.fromEntries(stats.map((stat) => [stat.label, stat.value]))
    ).toMatchObject({
      Status: 'Connected',
      'Last synced': '5m ago',
      'Pending uploads': '1',
      'Partner votes received': '1',
      'Partner answered': '3',
      'Syncing local profile': 'Mike',
    });
  });
});
