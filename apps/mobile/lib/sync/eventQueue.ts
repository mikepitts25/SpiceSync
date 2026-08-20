import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { encodeBase64 } from './base64';
import {
  getActiveRemoteSyncOwnership,
  useCoupleLinkStore,
} from './coupleLink';
import { randomBytes } from './crypto';
import type { PairPreference, Readiness } from '../votes/rolePreferences';

export type SyncEventType =
  | 'vote.upsert'
  | 'reveal.unlock'
  | 'progress.snapshot'
  | 'couple.unlink';

export type PlainSyncEvent =
  | {
      schemaVersion: 1;
      eventType: 'vote.upsert';
      eventId: string;
      authorDeviceId: string;
      cardId: string;
      vote: 'yes' | 'maybe' | 'no';
      pairPreference?: PairPreference;
      readiness?: Readiness;
      updatedAt: number;
    }
  | {
      schemaVersion: 1;
      eventType: 'reveal.unlock';
      eventId: string;
      authorDeviceId: string;
      bucket: 'partialYesMaybe' | 'mutualMaybe';
      updatedAt: number;
    }
  | {
      schemaVersion: 1;
      eventType: 'progress.snapshot';
      eventId: string;
      authorDeviceId: string;
      answeredCount: number;
      updatedAt: number;
    }
  | {
      schemaVersion: 1;
      eventType: 'couple.unlink';
      eventId: string;
      authorDeviceId: string;
      updatedAt: number;
    };

export type PendingEvent = {
  eventId: string;
  ownerUserId?: string;
  coupleId?: string;
  authorDeviceId?: string;
  // Missing recipient metadata identifies a legacy v1 queued event. New
  // events record the active partner so they always use the v2 envelope.
  recipientDeviceId?: string | null;
  envelopeVersion?: 1 | 2;
  clientSequence: number;
  payload: PlainSyncEvent;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
};

export type QuarantineReason =
  | 'account-switched'
  | 'no-couple'
  | 'couple-changed'
  | 'ownership-mismatch'
  | 'legacy-unproven';

export type QuarantinedEvent = {
  eventId: string;
  ownerUserId?: string;
  coupleId?: string;
  reason: QuarantineReason;
  quarantinedAt: number;
};

type DistributiveOmit<T, K extends keyof any> = T extends unknown
  ? Omit<T, K>
  : never;
export type EnqueueInput = DistributiveOmit<PlainSyncEvent, 'eventId'> & {
  eventId?: string;
};

type EventQueueState = {
  pending: PendingEvent[];
  quarantined: QuarantinedEvent[];
  nextClientSequence: number;
  enqueue: (payload: EnqueueInput) => PendingEvent | null;
  markAttempted: (eventId: string, success: boolean, error?: string) => void;
  dueEvents: (now: number) => PendingEvent[];
  removeEvent: (eventId: string) => void;
  replaceEvent: (eventId: string, replacement: PendingEvent) => void;
  quarantineEvent: (eventId: string, reason: QuarantineReason) => void;
  quarantineAll: (reason: QuarantineReason) => number;
  reset: () => void;
};

const BACKOFF_MS = [0, 2000, 5000, 15000, 60000, 300000];

function nextDelay(attempts: number): number {
  return BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
}

function mergePersistedEventQueueState(
  persistedState: unknown,
  currentState: EventQueueState
): EventQueueState {
  const persisted =
    persistedState && typeof persistedState === 'object'
      ? (persistedState as Partial<EventQueueState>)
      : {};
  return {
    ...currentState,
    ...persisted,
    pending: Array.isArray(persisted.pending) ? persisted.pending : [],
    quarantined: Array.isArray(persisted.quarantined)
      ? persisted.quarantined
      : [],
    nextClientSequence:
      typeof persisted.nextClientSequence === 'number'
        ? persisted.nextClientSequence
        : currentState.nextClientSequence,
  };
}

export function newEventId(): string {
  return (
    'evt_' +
    encodeBase64(randomBytes(12))
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 16)
  );
}

export const useEventQueueStore = create<EventQueueState>()(
  persist(
    (set, get) => ({
      pending: [],
      quarantined: [],
      nextClientSequence: 1,
      enqueue: (payload) => {
        const ownership = getActiveRemoteSyncOwnership();
        if (!ownership || payload.authorDeviceId !== ownership.authorDeviceId) {
          return null;
        }
        const eventId = payload.eventId || newEventId();
        const sequence = get().nextClientSequence;
        const now = Date.now();
        const fullPayload = { ...payload, eventId } as PlainSyncEvent;
        const pending: PendingEvent = {
          eventId,
          ownerUserId: ownership.ownerUserId,
          coupleId: ownership.coupleId,
          authorDeviceId: ownership.authorDeviceId,
          recipientDeviceId: ownership.recipientDeviceId,
          envelopeVersion: 2,
          clientSequence: sequence,
          payload: fullPayload,
          createdAt: now,
          attempts: 0,
          nextAttemptAt: now,
        };
        set((state) => ({
          pending: [...state.pending, pending],
          nextClientSequence: state.nextClientSequence + 1,
        }));
        return pending;
      },
      markAttempted: (eventId, success, error) => {
        if (success) {
          set((state) => ({
            pending: state.pending.filter((p) => p.eventId !== eventId),
          }));
          return;
        }
        set((state) => ({
          pending: state.pending.map((p) =>
            p.eventId === eventId
              ? {
                  ...p,
                  attempts: p.attempts + 1,
                  nextAttemptAt: Date.now() + nextDelay(p.attempts + 1),
                  lastError: error,
                }
              : p
          ),
        }));
      },
      dueEvents: (now) => get().pending.filter((p) => p.nextAttemptAt <= now),
      removeEvent: (eventId) => {
        set((state) => ({
          pending: state.pending.filter((p) => p.eventId !== eventId),
        }));
      },
      replaceEvent: (eventId, replacement) =>
        set((state) => ({
          pending: state.pending.map((item) =>
            item.eventId === eventId ? replacement : item
          ),
        })),
      quarantineEvent: (eventId, reason) =>
        set((state) => {
          const item = state.pending.find((pending) => pending.eventId === eventId);
          if (!item) return state;
          return {
            pending: state.pending.filter((pending) => pending.eventId !== eventId),
            quarantined: [
              ...state.quarantined,
              {
                eventId: item.eventId,
                ownerUserId: item.ownerUserId,
                coupleId: item.coupleId,
                reason,
                quarantinedAt: Date.now(),
              },
            ],
          };
        }),
      quarantineAll: (reason) => {
        const pending = get().pending;
        if (pending.length === 0) return 0;
        set((state) => ({
          pending: [],
          quarantined: [
            ...state.quarantined,
            ...pending.map((item) => ({
              eventId: item.eventId,
              ownerUserId: item.ownerUserId,
              coupleId: item.coupleId,
              reason,
              quarantinedAt: Date.now(),
            })),
          ],
        }));
        return pending.length;
      },
      reset: () => set({ pending: [], quarantined: [], nextClientSequence: 1 }),
    }),
    {
      name: 'spicesync-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
      merge: mergePersistedEventQueueState,
    }
  )
);

/**
 * Runs only after both persisted stores have hydrated. A pre-ownership queue
 * record may inherit couple provenance from the persisted active link, but it
 * does not inherit an account owner until live auth and recovery prove that
 * link. Without the saved same-device link, its plaintext is ambiguous and is
 * reduced to quarantine metadata.
 */
export function bindLegacyPendingToPersistedLink(): {
  bound: number;
  quarantined: number;
} {
  const link = useCoupleLinkStore.getState().link;
  const queue = useEventQueueStore.getState();
  const retained: PendingEvent[] = [];
  const newlyQuarantined: QuarantinedEvent[] = [];
  let bound = 0;

  for (const pending of queue.pending) {
    const alreadyBound =
      typeof pending.coupleId === 'string' &&
      typeof pending.authorDeviceId === 'string';
    if (alreadyBound) {
      retained.push(pending);
      continue;
    }

    const canBind =
      pending.envelopeVersion !== 2 &&
      link?.status === 'active' &&
      pending.payload.authorDeviceId === link.myDeviceId &&
      (pending.authorDeviceId === undefined ||
        pending.authorDeviceId === link.myDeviceId) &&
      (pending.coupleId === undefined || pending.coupleId === link.coupleId) &&
      (pending.ownerUserId === undefined ||
        pending.ownerUserId === link.ownerUserId);
    if (canBind) {
      retained.push({
        ...pending,
        coupleId: link.coupleId,
        authorDeviceId: link.myDeviceId,
        envelopeVersion: 1,
      });
      bound += 1;
      continue;
    }

    newlyQuarantined.push({
      eventId: pending.eventId,
      ownerUserId: pending.ownerUserId,
      coupleId: pending.coupleId,
      reason: 'legacy-unproven',
      quarantinedAt: Date.now(),
    });
  }

  if (bound > 0 || newlyQuarantined.length > 0) {
    useEventQueueStore.setState({
      pending: retained,
      quarantined: [...queue.quarantined, ...newlyQuarantined],
    });
  }
  return { bound, quarantined: newlyQuarantined.length };
}
