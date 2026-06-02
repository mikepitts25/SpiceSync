import type { CoupleLink } from './coupleLink';
import type { PendingEvent } from './eventQueue';
import type { PartnerVoteRecord } from './partnerVotes';

type ProfileLike = {
  id: string;
  name?: string;
  displayName?: string;
};

export type PartnerDashboardStatsInput = {
  link: CoupleLink | null;
  partnerVotes: Record<string, PartnerVoteRecord>;
  answeredCount: number;
  pendingEvents: PendingEvent[];
  localProfileId: string | null;
  profiles: ProfileLike[];
  now?: number;
};

export type PartnerDashboardStat = {
  label: string;
  value: string;
};

export function formatLinkedDate(timestamp: number | null | undefined): string {
  if (!timestamp) return 'Not linked';
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeSyncTime(
  timestamp: number | null | undefined,
  now: number = Date.now()
): string {
  if (!timestamp) return 'Never synced';
  const diffMs = Math.max(0, now - timestamp);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getPartnerDashboardStats({
  link,
  partnerVotes,
  answeredCount,
  pendingEvents,
  localProfileId,
  profiles,
  now = Date.now(),
}: PartnerDashboardStatsInput): PartnerDashboardStat[] {
  const profile = localProfileId
    ? profiles.find((item) => item.id === localProfileId)
    : null;
  const profileName =
    profile?.displayName ??
    profile?.name ??
    (localProfileId ? 'Unknown' : 'Not set');
  const receivedVotes = Object.keys(partnerVotes).length;
  const pendingUploads = pendingEvents.length;

  return [
    {
      label: 'Status',
      value: link?.status === 'active' ? 'Connected' : 'Not connected',
    },
    {
      label: 'Linked',
      value: formatLinkedDate(link?.linkedAt),
    },
    {
      label: 'Last synced',
      value: formatRelativeSyncTime(link?.lastSyncedAt, now),
    },
    {
      label: 'Pending uploads',
      value: String(pendingUploads),
    },
    {
      label: 'Partner votes received',
      value: String(receivedVotes),
    },
    {
      label: 'Partner answered',
      value: String(Math.max(answeredCount, receivedVotes)),
    },
    {
      label: 'Syncing local profile',
      value: profileName,
    },
  ];
}
