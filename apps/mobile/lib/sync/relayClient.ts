import type {
  AcceptInviteRequest,
  AcceptInviteResponse,
  AppendEventRequest,
  CoupleResponse,
  CreateInviteRequest,
  CreateInviteResponse,
  InviteResponse,
  ListEventsResponse,
  RelayErrorBody,
  SyncEventResponse,
} from './relayTypes';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type RelayTransport = {
  health(): Promise<{ ok: boolean }>;
  createInvite(body: CreateInviteRequest): Promise<CreateInviteResponse>;
  getInvite(inviteId: string): Promise<InviteResponse>;
  acceptInvite(
    inviteId: string,
    body: AcceptInviteRequest
  ): Promise<AcceptInviteResponse>;
  getCouple(coupleId: string): Promise<CoupleResponse>;
  appendEvent(
    coupleId: string,
    body: AppendEventRequest
  ): Promise<SyncEventResponse>;
  listEvents(
    coupleId: string,
    afterServerSequence: number
  ): Promise<ListEventsResponse>;
  revokeCouple(
    coupleId: string
  ): Promise<{ coupleId: string; revokedAt: number | null }>;
};

export class RelayHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'RelayHttpError';
  }
}

export class RelayClient implements RelayTransport {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(baseUrl: string, fetchImpl: FetchLike = fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetchImpl = fetchImpl;
  }

  health(): Promise<{ ok: boolean }> {
    return this.request('/healthz', { method: 'GET' });
  }

  createInvite(body: CreateInviteRequest): Promise<CreateInviteResponse> {
    return this.request('/invites', {
      method: 'POST',
      body,
    });
  }

  getInvite(inviteId: string): Promise<InviteResponse> {
    return this.request(`/invites/${encodeURIComponent(inviteId)}`, {
      method: 'GET',
    });
  }

  acceptInvite(
    inviteId: string,
    body: AcceptInviteRequest
  ): Promise<AcceptInviteResponse> {
    return this.request(`/invites/${encodeURIComponent(inviteId)}/accept`, {
      method: 'POST',
      body,
    });
  }

  getCouple(coupleId: string): Promise<CoupleResponse> {
    return this.request(`/couples/${encodeURIComponent(coupleId)}`, {
      method: 'GET',
    });
  }

  appendEvent(
    coupleId: string,
    body: AppendEventRequest
  ): Promise<SyncEventResponse> {
    return this.request(`/couples/${encodeURIComponent(coupleId)}/events`, {
      method: 'POST',
      body,
    });
  }

  listEvents(
    coupleId: string,
    afterServerSequence: number
  ): Promise<ListEventsResponse> {
    return this.request(
      `/couples/${encodeURIComponent(coupleId)}/events?after=${encodeURIComponent(
        String(afterServerSequence)
      )}`,
      { method: 'GET' }
    );
  }

  revokeCouple(
    coupleId: string
  ): Promise<{ coupleId: string; revokedAt: number | null }> {
    return this.request(`/couples/${encodeURIComponent(coupleId)}/revoke`, {
      method: 'POST',
    });
  }

  private async request<T>(
    path: string,
    options: { method: 'GET' | 'POST'; body?: unknown }
  ): Promise<T> {
    const init: RequestInit = {
      method: options.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    const json = (await response.json().catch(() => ({}))) as
      | T
      | RelayErrorBody;

    if (!response.ok) {
      const errorBody = json as RelayErrorBody;
      throw new RelayHttpError(
        response.status,
        errorBody.error?.code || 'HTTP_ERROR',
        errorBody.error?.message ||
          `Relay request failed with status ${response.status}`
      );
    }

    return json as T;
  }
}
