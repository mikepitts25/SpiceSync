import type {
  AcceptInviteRequest,
  AcceptInviteResponse,
  AppendEventRequest,
  CoupleResponse,
  CreateInviteRequest,
  CreateInviteResponse,
  InviteResponse,
  ListEventsResponse,
  SyncEventResponse,
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

type SupabaseAuthUser = {
  id?: string | null;
};

type SupabaseAuthSession = {
  user?: SupabaseAuthUser | null;
  [key: string]: unknown;
};

type SupabaseAnonymousSignInData = {
  user?: SupabaseAuthUser | null;
  session?: SupabaseAuthSession | null;
};

type SupabaseRelayAuth = {
  getSession: () => Promise<{
    data?: { session?: SupabaseAuthSession | null } | null;
    error?: SupabaseRpcError | null;
  }>;
  signInAnonymously: () => Promise<{
    data?: SupabaseAnonymousSignInData | null;
    error?: SupabaseRpcError | null;
  }>;
};

export type SupabaseRelayClientLike = {
  auth: SupabaseRelayAuth;
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
  private readonly publicBaseUrl: string;

  constructor(
    supabase: SupabaseRelayClientLike,
    options: SupabaseRelayOptions = {}
  ) {
    this.supabase = supabase;
    this.publicBaseUrl = (options.publicBaseUrl ?? '').replace(/\/+$/, '');
  }

  async health(): Promise<{ ok: boolean }> {
    await this.ensureAnonymousSession();
    return { ok: true };
  }

  async getAuthenticatedUserId(): Promise<string> {
    const userId = await this.ensureAnonymousSession();
    if (!userId) {
      throw new RelayHttpError(
        401,
        'SUPABASE_AUTH_ERROR',
        'Supabase auth user id is unavailable'
      );
    }
    return userId;
  }

  async createInvite(
    body: CreateInviteRequest
  ): Promise<CreateInviteResponse> {
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
        data.inviteUrl ?? `${this.publicBaseUrl}/link/${data.inviteId}`,
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

  appendEvent(
    coupleId: string,
    body: AppendEventRequest
  ): Promise<SyncEventResponse> {
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
    await this.ensureAnonymousSession();
    const { data, error } = await this.supabase.rpc<T>(functionName, args);
    if (error) {
      throw new RelayHttpError(
        400,
        error.code || 'SUPABASE_RPC_ERROR',
        error.message || 'Supabase relay request failed'
      );
    }
    if (data === null) {
      throw new RelayHttpError(
        404,
        'NOT_FOUND',
        'Supabase relay returned no data'
      );
    }
    return data;
  }

  private async ensureAnonymousSession(): Promise<string | null> {
    const sessionResult = await this.supabase.auth.getSession();
    if (sessionResult.error) {
      throw new RelayHttpError(
        401,
        sessionResult.error.code || 'SUPABASE_AUTH_ERROR',
        sessionResult.error.message || 'Could not read Supabase session'
      );
    }

    if (sessionResult.data?.session) {
      return sessionResult.data.session.user?.id ?? null;
    }

    const signInResult = await this.supabase.auth.signInAnonymously();
    if (signInResult.error) {
      throw new RelayHttpError(
        401,
        signInResult.error.code || 'SUPABASE_AUTH_ERROR',
        signInResult.error.message || 'Could not create anonymous session'
      );
    }

    return (
      signInResult.data?.user?.id ??
      signInResult.data?.session?.user?.id ??
      null
    );
  }
}
