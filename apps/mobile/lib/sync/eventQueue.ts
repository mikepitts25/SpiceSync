import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { encodeBase64 } from './base64';
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
  clientSequence: number;
  payload: PlainSyncEvent;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
};

type DistributiveOmit<T, K extends keyof any> = T extends unknown
  ? Omit<T, K>
  : never;
export type EnqueueInput = DistributiveOmit<PlainSyncEvent, 'eventId'> & {
  eventId?: string;
};

type EventQueueState = {
  pending: PendingEvent[];
  nextClientSequence: number;
  enqueue: (payload: EnqueueInput) => PendingEvent;
  markAttempted: (eventId: string, success: boolean, error?: string) => void;
  dueEvents: (now: number) => PendingEvent[];
  removeEvent: (eventId: string) => void;
  reset: () => void;
};

const BACKOFF_MS = [0, 2000, 5000, 15000, 60000, 300000];

function nextDelay(attempts: number): number {
  return BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
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
      nextClientSequence: 1,
      enqueue: (payload) => {
        const eventId = payload.eventId || newEventId();
        const sequence = get().nextClientSequence;
        const now = Date.now();
        const fullPayload = { ...payload, eventId } as PlainSyncEvent;
        const pending: PendingEvent = {
          eventId,
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
      reset: () => set({ pending: [], nextClientSequence: 1 }),
    }),
    {
      name: 'spicesync-sync-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
