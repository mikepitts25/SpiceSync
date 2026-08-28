import type { KinkVote } from '../../src/stores/votes';
import {
  isPairPreference,
  isReadiness,
  isVoteValue,
  normalizeVoteRecord,
  readinessToVote,
} from '../votes/rolePreferences';
import { decodeBase64, encodeBase64 } from './base64';
import {
  decryptFromPartner,
  encryptForPartner,
  sha256Base64,
  signEd25519,
  verifyEd25519,
} from './crypto';
import type { PartnerVoteRecord } from './partnerVotes';
import type {
  PutVoteSnapshotRequest,
  VoteSnapshotResponse,
} from './relayTypes';

type SnapshotVote = {
  cardId: string;
  vote: 'yes' | 'maybe' | 'no';
  pairPreference?: 'give' | 'receive' | 'both';
  readiness?: 'yes' | 'curious' | 'not_now' | 'hard_no';
};

type PlainVoteSnapshot = {
  schemaVersion: 1;
  authorDeviceId: string;
  recipientDeviceId: string;
  requestGeneration: number;
  snapshotVersion: number;
  votes: SnapshotVote[];
  answeredCount: number;
  updatedAt: number;
};

function signaturePayload(input: {
  coupleId: string;
  authorDeviceId: string;
  recipientDeviceId: string;
  requestGeneration: number;
  snapshotVersion: number;
  payloadHash: string;
}): string {
  return [
    'vote-snapshot-v1',
    input.coupleId,
    input.authorDeviceId,
    input.recipientDeviceId,
    input.requestGeneration,
    input.snapshotVersion,
    input.payloadHash,
  ].join(':');
}

function normalizeVotes(votes: Record<string, KinkVote>): SnapshotVote[] {
  return Object.keys(votes)
    .sort()
    .flatMap((cardId) => {
      const vote = normalizeVoteRecord(votes[cardId]);
      if (!vote) return [];
      return [
        {
          cardId,
          vote: vote.value,
          ...(vote.pairPreference
            ? { pairPreference: vote.pairPreference }
            : {}),
          ...(vote.readiness ? { readiness: vote.readiness } : {}),
        },
      ];
    });
}

export function buildEncryptedVoteSnapshot(input: {
  coupleId: string;
  authorDeviceId: string;
  recipientDeviceId: string;
  requestGeneration: number;
  snapshotVersion: number;
  updatedAt: number;
  votes: Record<string, KinkVote>;
  authorEncryptionPrivateKey: Uint8Array;
  authorSigningPrivateKey: Uint8Array;
  recipientEncryptionPublicKey: Uint8Array;
}): PutVoteSnapshotRequest {
  const normalizedVotes = normalizeVotes(input.votes);
  const plaintext: PlainVoteSnapshot = {
    schemaVersion: 1,
    authorDeviceId: input.authorDeviceId,
    recipientDeviceId: input.recipientDeviceId,
    requestGeneration: input.requestGeneration,
    snapshotVersion: input.snapshotVersion,
    votes: normalizedVotes,
    answeredCount: normalizedVotes.length,
    updatedAt: input.updatedAt,
  };
  const encrypted = encryptForPartner(
    input.authorEncryptionPrivateKey,
    input.recipientEncryptionPublicKey,
    JSON.stringify(plaintext)
  );
  const signature = signEd25519(
    input.authorSigningPrivateKey,
    new TextEncoder().encode(
      signaturePayload({
        coupleId: input.coupleId,
        authorDeviceId: input.authorDeviceId,
        recipientDeviceId: input.recipientDeviceId,
        requestGeneration: input.requestGeneration,
        snapshotVersion: input.snapshotVersion,
        payloadHash: encrypted.payloadHash,
      })
    )
  );
  return {
    authorDeviceId: input.authorDeviceId,
    recipientDeviceId: input.recipientDeviceId,
    requestGeneration: input.requestGeneration,
    snapshotVersion: input.snapshotVersion,
    encryptedPayload: encrypted.encryptedPayload,
    payloadHash: encrypted.payloadHash,
    signature: encodeBase64(signature),
  };
}

function decodePlainSnapshot(value: unknown): PlainVoteSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid vote snapshot payload');
  }
  const snapshot = value as Partial<PlainVoteSnapshot>;
  if (
    snapshot.schemaVersion !== 1 ||
    typeof snapshot.authorDeviceId !== 'string' ||
    typeof snapshot.recipientDeviceId !== 'string' ||
    !Number.isSafeInteger(snapshot.requestGeneration) ||
    (snapshot.requestGeneration ?? 0) < 1 ||
    !Number.isSafeInteger(snapshot.snapshotVersion) ||
    (snapshot.snapshotVersion ?? 0) < 1 ||
    !Number.isSafeInteger(snapshot.answeredCount) ||
    (snapshot.answeredCount ?? -1) < 0 ||
    typeof snapshot.updatedAt !== 'number' ||
    !Array.isArray(snapshot.votes)
  ) {
    throw new Error('Invalid vote snapshot payload');
  }
  const cardIds = new Set<string>();
  const votes: SnapshotVote[] = [];
  for (const raw of snapshot.votes) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid vote snapshot vote');
    }
    const vote = raw as Partial<SnapshotVote>;
    if (
      typeof vote.cardId !== 'string' ||
      vote.cardId.length === 0 ||
      cardIds.has(vote.cardId) ||
      !isVoteValue(vote.vote) ||
      (vote.pairPreference !== undefined &&
        !isPairPreference(vote.pairPreference)) ||
      (vote.readiness !== undefined &&
        (!isReadiness(vote.readiness) ||
          readinessToVote(vote.readiness) !== vote.vote))
    ) {
      throw new Error('Invalid vote snapshot vote');
    }
    cardIds.add(vote.cardId);
    votes.push(vote as SnapshotVote);
  }
  if (snapshot.answeredCount !== votes.length) {
    throw new Error('Invalid vote snapshot count');
  }
  return { ...snapshot, votes } as PlainVoteSnapshot;
}

export type DecryptedVoteSnapshot = {
  authorDeviceId: string;
  requestGeneration: number;
  snapshotVersion: number;
  answeredCount: number;
  votes: Record<string, PartnerVoteRecord>;
};

export function validateAndDecryptVoteSnapshot(input: {
  coupleId: string;
  myDeviceId: string;
  partnerDeviceId: string;
  snapshot: VoteSnapshotResponse;
  myEncryptionPrivateKey: Uint8Array;
  partnerEncryptionPublicKey: Uint8Array;
  partnerSigningPublicKey: Uint8Array;
  receivedAt: number;
}): DecryptedVoteSnapshot {
  const snapshot = input.snapshot;
  if (
    snapshot.coupleId !== input.coupleId ||
    snapshot.recipientDeviceId !== input.myDeviceId
  ) {
    throw new Error('Vote snapshot has wrong recipient');
  }
  if (snapshot.authorDeviceId !== input.partnerDeviceId) {
    throw new Error('Vote snapshot has wrong author');
  }
  if (sha256Base64(snapshot.encryptedPayload) !== snapshot.payloadHash) {
    throw new Error('Vote snapshot hash mismatch');
  }
  const signatureValid = verifyEd25519(
    input.partnerSigningPublicKey,
    decodeBase64(snapshot.signature),
    new TextEncoder().encode(
      signaturePayload({
        coupleId: snapshot.coupleId,
        authorDeviceId: snapshot.authorDeviceId,
        recipientDeviceId: snapshot.recipientDeviceId,
        requestGeneration: snapshot.requestGeneration,
        snapshotVersion: snapshot.snapshotVersion,
        payloadHash: snapshot.payloadHash,
      })
    )
  );
  if (!signatureValid) {
    throw new Error('Vote snapshot signature mismatch');
  }
  const plaintext = decryptFromPartner(
    input.myEncryptionPrivateKey,
    input.partnerEncryptionPublicKey,
    snapshot.encryptedPayload
  );
  const decoded = decodePlainSnapshot(JSON.parse(plaintext));
  if (
    decoded.authorDeviceId !== snapshot.authorDeviceId ||
    decoded.recipientDeviceId !== snapshot.recipientDeviceId ||
    decoded.requestGeneration !== snapshot.requestGeneration ||
    decoded.snapshotVersion !== snapshot.snapshotVersion
  ) {
    throw new Error('Vote snapshot claims mismatch');
  }
  const votes = Object.fromEntries(
    decoded.votes.map((vote) => [
      vote.cardId,
      {
        cardId: vote.cardId,
        vote: vote.vote,
        ...(vote.pairPreference ? { pairPreference: vote.pairPreference } : {}),
        ...(vote.readiness ? { readiness: vote.readiness } : {}),
        updatedAt: decoded.updatedAt,
        receivedAt: input.receivedAt,
      },
    ])
  );
  return {
    authorDeviceId: decoded.authorDeviceId,
    requestGeneration: decoded.requestGeneration,
    snapshotVersion: decoded.snapshotVersion,
    answeredCount: decoded.answeredCount,
    votes,
  };
}
