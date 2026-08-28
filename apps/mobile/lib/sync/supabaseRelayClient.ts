import type {
  AcceptInviteRequest,
  AcceptInviteResponse,
  AppendEventRequest,
  CoupleResponse,
  CreateInviteRequest,
  CreateInviteResponse,
  DeviceRecoveryRequest,
  DeviceRecoveryResponse,
  InviteResponse,
  GetVoteSnapshotResponse,
  ListEventsResponse,
  PutVoteSnapshotRequest,
  SyncEventResponse,
  VoteSnapshotResponse,
} from './relayTypes';
import { RelayHttpError } from './relayClient';

type SupabaseRpcError = {
  code?: string;
  message?: string;
};

type SupabaseRpcResult<T> = {
  data: T | null;
  error: SupabaseRpcError | null;
};

export type SupabaseRelayClientLike = {
  rpc: <T = unknown>(
    functionName: string,
    args?: Record<string, unknown>
  ) => Promise<SupabaseRpcResult<T>>;
};

type SupabaseRelayOptions = {
  publicBaseUrl?: string;
};

export class SupabaseRelayClient {
  private readonly supabase: SupabaseRelayClientLike;
  private readonly ensureSession: () => Promise<string>;
  private readonly publicBaseUrl: string;

  constructor(
    supabase: SupabaseRelayClientLike,
    ensureSession: () => Promise<string>,
    options: SupabaseRelayOptions = {}
  ) {
    this.supabase = supabase;
    this.ensureSession = ensureSession;
    this.publicBaseUrl = (options.publicBaseUrl ?? '').replace(/\/+$/, '');
  }

  async health(): Promise<{ ok: boolean }> {
    await this.ensureSession();
    return { ok: true };
  }

  async createInvite(body: CreateInviteRequest): Promise<CreateInviteResponse> {
    const data = await this.callRpc<{
      inviteId: string;
      inviteUrl?: string;
      expiresAt?: number;
    }>('spicesync_create_invite', {
      p_inviter_device_id: body.inviterDeviceId,
      p_inviter_public_key: body.inviterPublicKey,
      p_inviter_signing_public_key: body.inviterSigningPublicKey,
      p_invite_secret_hash: body.inviteSecretHash,
      p_inviter_profile_name: body.inviterProfileName ?? null,
      p_inviter_profile_avatar: body.inviterProfileAvatar ?? null,
    });

    return {
      inviteId: data.inviteId,
      inviteUrl:
        data.inviteUrl ??
        `${this.publicBaseUrl}/functions/v1/spicesync-invite-link/link/${encodeURIComponent(data.inviteId)}`,
      expiresAt: data.expiresAt,
    };
  }

  getInvite(inviteId: string): Promise<InviteResponse> {
    return this.callRpc('spicesync_get_invite', {
      p_invite_id: inviteId,
    });
  }

  acceptInvite(
    inviteId: string,
    body: AcceptInviteRequest
  ): Promise<AcceptInviteResponse> {
    return this.callRpc('spicesync_accept_invite', {
      p_invite_id: inviteId,
      p_accepter_device_id: body.accepterDeviceId,
      p_accepter_public_key: body.accepterPublicKey,
      p_accepter_signing_public_key: body.accepterSigningPublicKey,
      p_invite_proof: body.inviteProof,
      p_accepter_profile_name: body.accepterProfileName ?? null,
      p_accepter_profile_avatar: body.accepterProfileAvatar ?? null,
    });
  }

  getCouple(coupleId: string): Promise<CoupleResponse> {
    return this.callRpc('spicesync_get_couple', {
      p_couple_id: coupleId,
    });
  }

  findCoupleForDevice(deviceId: string): Promise<CoupleResponse | null> {
    return this.callOptionalRpc('spicesync_find_couple_for_device', {
      p_device_id: deviceId,
    });
  }

  recoverDevice(body: DeviceRecoveryRequest): Promise<DeviceRecoveryResponse> {
    return this.callRpc('spicesync_register_or_recover_device', {
      p_device_id: body.deviceId,
      p_encryption_public_key: body.encryptionPublicKey,
      p_signing_public_key: body.signingPublicKey,
    });
  }

  async revokeDevice(deviceId: string): Promise<void> {
    await this.callOptionalRpc<void>('spicesync_revoke_device', {
      p_device_id: deviceId,
    });
  }

  appendEvent(
    coupleId: string,
    body: AppendEventRequest
  ): Promise<SyncEventResponse> {
    if (
      body.recipientDeviceId !== null &&
      body.recipientDeviceId !== undefined
    ) {
      return this.callRpc('spicesync_append_event_v2', {
        p_couple_id: coupleId,
        p_event_id: body.eventId,
        p_author_device_id: body.authorDeviceId,
        p_recipient_device_id: body.recipientDeviceId,
        p_client_sequence: body.clientSequence,
        p_encrypted_payload: body.encryptedPayload,
        p_payload_hash: body.payloadHash,
        p_signature: body.signature,
      });
    }
    return this.callRpc('spicesync_append_event', {
      p_couple_id: coupleId,
      p_event_id: body.eventId,
      p_author_device_id: body.authorDeviceId,
      p_client_sequence: body.clientSequence,
      p_encrypted_payload: body.encryptedPayload,
      p_payload_hash: body.payloadHash,
      p_signature: body.signature,
    });
  }

  listEvents(
    coupleId: string,
    afterServerSequence: number
  ): Promise<ListEventsResponse> {
    return this.callRpc('spicesync_list_events', {
      p_couple_id: coupleId,
      p_after_server_sequence: afterServerSequence,
      p_limit: 100,
    });
  }

  putVoteSnapshot(
    coupleId: string,
    body: PutVoteSnapshotRequest
  ): Promise<VoteSnapshotResponse> {
    return this.callRpc('spicesync_put_vote_snapshot', {
      p_couple_id: coupleId,
      p_author_device_id: body.authorDeviceId,
      p_recipient_device_id: body.recipientDeviceId,
      p_request_generation: body.requestGeneration,
      p_snapshot_version: body.snapshotVersion,
      p_encrypted_payload: body.encryptedPayload,
      p_payload_hash: body.payloadHash,
      p_signature: body.signature,
    });
  }

  getVoteSnapshot(coupleId: string): Promise<GetVoteSnapshotResponse> {
    return this.callRpc('spicesync_get_vote_snapshot', {
      p_couple_id: coupleId,
    });
  }

  revokeCouple(
    coupleId: string
  ): Promise<{ coupleId: string; revokedAt: number | null }> {
    return this.callRpc('spicesync_revoke_couple', {
      p_couple_id: coupleId,
    });
  }

  private async callRpc<T>(
    functionName: string,
    args: Record<string, unknown>
  ): Promise<T> {
    const data = await this.callOptionalRpc<T>(functionName, args);
    if (data === null) {
      throw new RelayHttpError(
        404,
        'NOT_FOUND',
        'Supabase relay returned no data'
      );
    }
    return data;
  }

  private async callOptionalRpc<T>(
    functionName: string,
    args: Record<string, unknown>
  ): Promise<T | null> {
    await this.ensureSession();
    const { data, error } = await this.supabase.rpc<T>(functionName, args);
    if (error) {
      const message = error.message || 'Supabase relay request failed';
      const semanticCode =
        error.code === 'P0001' && /^[A-Z][A-Z0-9_]+$/.test(message.trim())
          ? message.trim()
          : error.code || 'SUPABASE_RPC_ERROR';
      throw new RelayHttpError(
        400,
        semanticCode,
        message
      );
    }
    return data;
  }
}
