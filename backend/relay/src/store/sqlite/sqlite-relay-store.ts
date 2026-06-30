import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import type {
  AcceptInviteResult,
  AcceptInviteStoreInput,
  AppendEventStoreInput,
  CreateInviteStoreInput,
  RelayStore,
} from '../relay-store';
import type { CoupleRecord, InviteRecord, SyncEventRecord } from '../../domain/types';

type InviteRow = {
  invite_id: string;
  inviter_device_id: string;
  inviter_public_key: string;
  inviter_signing_public_key: string;
  invite_secret_hash: string;
  created_at: number;
  expires_at: number;
  accepted_at: number | null;
  couple_id: string | null;
};

type CoupleRow = {
  couple_id: string;
  member_a_device_id: string;
  member_b_device_id: string;
  member_a_public_key: string;
  member_b_public_key: string;
  member_a_signing_public_key: string;
  member_b_signing_public_key: string;
  created_at: number;
  revoked_at: number | null;
};

type SyncEventRow = {
  server_sequence: number;
  event_id: string;
  couple_id: string;
  author_device_id: string;
  client_sequence: number;
  encrypted_payload: string;
  payload_hash: string;
  signature: string;
  created_at: number;
  expires_at: number | null;
};

function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}

function mapInvite(row: InviteRow): InviteRecord {
  return {
    inviteId: row.invite_id,
    inviterDeviceId: row.inviter_device_id,
    inviterPublicKey: row.inviter_public_key,
    inviterSigningPublicKey: row.inviter_signing_public_key,
    inviteSecretHash: row.invite_secret_hash,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    coupleId: row.couple_id,
  };
}

function mapCouple(row: CoupleRow): CoupleRecord {
  return {
    coupleId: row.couple_id,
    memberADeviceId: row.member_a_device_id,
    memberBDeviceId: row.member_b_device_id,
    memberAPublicKey: row.member_a_public_key,
    memberBPublicKey: row.member_b_public_key,
    memberASigningPublicKey: row.member_a_signing_public_key,
    memberBSigningPublicKey: row.member_b_signing_public_key,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

function mapEvent(row: SyncEventRow): SyncEventRecord {
  return {
    serverSequence: row.server_sequence,
    eventId: row.event_id,
    coupleId: row.couple_id,
    authorDeviceId: row.author_device_id,
    clientSequence: row.client_sequence,
    encryptedPayload: row.encrypted_payload,
    payloadHash: row.payload_hash,
    signature: row.signature,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function isSqliteConstraint(error: unknown): boolean {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed');
}

export class SqliteRelayStore implements RelayStore {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    if (databasePath !== ':memory:') {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.db = new Database(databasePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  createInvite(input: CreateInviteStoreInput): InviteRecord {
    const inviteId = id('inv');
    this.db
      .prepare(
        `INSERT INTO invites (
          invite_id,
          inviter_device_id,
          inviter_public_key,
          inviter_signing_public_key,
          invite_secret_hash,
          created_at,
          expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        inviteId,
        input.inviterDeviceId,
        input.inviterPublicKey,
        input.inviterSigningPublicKey,
        input.inviteSecretHash,
        input.now,
        input.expiresAt,
      );

    const invite = this.getInvite(inviteId);
    if (!invite) throw new Error('Failed to create invite');
    return invite;
  }

  getInvite(inviteId: string): InviteRecord | null {
    const row = this.db
      .prepare('SELECT * FROM invites WHERE invite_id = ?')
      .get(inviteId) as InviteRow | undefined;
    return row ? mapInvite(row) : null;
  }

  acceptInvite(input: AcceptInviteStoreInput): AcceptInviteResult {
    const transaction = this.db.transaction(() => {
      const inviteRow = this.db
        .prepare('SELECT * FROM invites WHERE invite_id = ?')
        .get(input.inviteId) as InviteRow | undefined;
      if (!inviteRow) throw new Error('Invite not found');
      if (inviteRow.accepted_at || inviteRow.couple_id) throw new Error('Invite already accepted');
      if (inviteRow.expires_at <= input.now) throw new Error('Invite expired');

      const coupleId = id('cpl');
      this.db
        .prepare(
          `INSERT INTO couples (
            couple_id,
            member_a_device_id,
            member_b_device_id,
            member_a_public_key,
            member_b_public_key,
            member_a_signing_public_key,
            member_b_signing_public_key,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          coupleId,
          inviteRow.inviter_device_id,
          input.accepterDeviceId,
          inviteRow.inviter_public_key,
          input.accepterPublicKey,
          inviteRow.inviter_signing_public_key,
          input.accepterSigningPublicKey,
          input.now,
        );

      this.db
        .prepare('UPDATE invites SET accepted_at = ?, couple_id = ? WHERE invite_id = ?')
        .run(input.now, coupleId, input.inviteId);

      const updatedInvite = this.getInvite(input.inviteId);
      const couple = this.getCouple(coupleId);
      if (!updatedInvite || !couple) throw new Error('Failed to accept invite');

      return { invite: updatedInvite, couple };
    });

    return transaction();
  }

  getCouple(coupleId: string): CoupleRecord | null {
    const row = this.db
      .prepare('SELECT * FROM couples WHERE couple_id = ?')
      .get(coupleId) as CoupleRow | undefined;
    return row ? mapCouple(row) : null;
  }

  appendEvent(input: AppendEventStoreInput): SyncEventRecord {
    const couple = this.getCouple(input.coupleId);
    if (!couple || couple.revokedAt !== null) throw new Error('Couple not found');
    if (
      input.authorDeviceId !== couple.memberADeviceId &&
      input.authorDeviceId !== couple.memberBDeviceId
    ) {
      throw new Error('Author is not a couple member');
    }

    try {
      const result = this.db
        .prepare(
          `INSERT INTO sync_events (
            event_id,
            couple_id,
            author_device_id,
            client_sequence,
            encrypted_payload,
            payload_hash,
            signature,
            created_at,
            expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.eventId,
          input.coupleId,
          input.authorDeviceId,
          input.clientSequence,
          input.encryptedPayload,
          input.payloadHash,
          input.signature,
          input.now,
          input.expiresAt,
        );

      const row = this.db
        .prepare('SELECT * FROM sync_events WHERE server_sequence = ?')
        .get(result.lastInsertRowid) as SyncEventRow | undefined;
      if (!row) throw new Error('Failed to append sync event');
      return mapEvent(row);
    } catch (error) {
      if (isSqliteConstraint(error)) throw new Error('Duplicate sync event');
      throw error;
    }
  }

  listEventsAfter(
    coupleId: string,
    afterServerSequence: number,
    limit: number,
  ): SyncEventRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM sync_events
         WHERE couple_id = ? AND server_sequence > ?
         ORDER BY server_sequence ASC
         LIMIT ?`,
      )
      .all(coupleId, afterServerSequence, limit) as SyncEventRow[];
    return rows.map(mapEvent);
  }

  revokeCouple(coupleId: string, now: number): CoupleRecord | null {
    this.db.prepare('UPDATE couples SET revoked_at = ? WHERE couple_id = ?').run(now, coupleId);
    return this.getCouple(coupleId);
  }

  cleanupExpired(now: number): { invitesDeleted: number; eventsDeleted: number } {
    const invites = this.db
      .prepare('DELETE FROM invites WHERE expires_at <= ? AND accepted_at IS NULL')
      .run(now);
    const events = this.db
      .prepare('DELETE FROM sync_events WHERE expires_at IS NOT NULL AND expires_at <= ?')
      .run(now);

    return {
      invitesDeleted: Number(invites.changes),
      eventsDeleted: Number(events.changes),
    };
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invites (
        invite_id TEXT PRIMARY KEY,
        inviter_device_id TEXT NOT NULL,
        inviter_public_key TEXT NOT NULL,
        inviter_signing_public_key TEXT NOT NULL DEFAULT '',
        invite_secret_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        accepted_at INTEGER,
        couple_id TEXT
      );

      CREATE TABLE IF NOT EXISTS couples (
        couple_id TEXT PRIMARY KEY,
        member_a_device_id TEXT NOT NULL,
        member_b_device_id TEXT NOT NULL,
        member_a_public_key TEXT NOT NULL,
        member_b_public_key TEXT NOT NULL,
        member_a_signing_public_key TEXT NOT NULL DEFAULT '',
        member_b_signing_public_key TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        revoked_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS sync_events (
        server_sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        couple_id TEXT NOT NULL,
        author_device_id TEXT NOT NULL,
        client_sequence INTEGER NOT NULL,
        encrypted_payload TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        signature TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        UNIQUE(couple_id, author_device_id, client_sequence)
      );

      CREATE INDEX IF NOT EXISTS sync_events_couple_sequence
        ON sync_events (couple_id, server_sequence);
    `);
    this.addColumnIfMissing('invites', 'inviter_signing_public_key', "TEXT NOT NULL DEFAULT ''");
    this.addColumnIfMissing('couples', 'member_a_signing_public_key', "TEXT NOT NULL DEFAULT ''");
    this.addColumnIfMissing('couples', 'member_b_signing_public_key', "TEXT NOT NULL DEFAULT ''");
    this.addColumnIfMissing('sync_events', 'signature', "TEXT NOT NULL DEFAULT ''");
  }

  private addColumnIfMissing(table: string, column: string, definition: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (columns.some((entry) => entry.name === column)) return;
    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
