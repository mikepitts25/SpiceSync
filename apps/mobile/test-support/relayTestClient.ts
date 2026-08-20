import type { RelayTransport } from '../lib/sync/relayClient';
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
  ListEventsResponse,
  SyncEventResponse,
} from '../lib/sync/relayTypes';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class RelayTestClient implements RelayTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: FetchLike
  ) {}

  health(): Promise<{ ok: boolean }> {
    return this.request('/healthz', { method: 'GET' });
  }

  createInvite(body: CreateInviteRequest): Promise<CreateInviteResponse> {
    return this.request('/invites', { method: 'POST', body });
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

  findCoupleForDevice(deviceId: string): Promise<CoupleResponse | null> {
    return this.request(`/couples/by-device/${encodeURIComponent(deviceId)}`, {
      method: 'GET',
    });
  }

  recoverDevice(body: DeviceRecoveryRequest): Promise<DeviceRecoveryResponse> {
    return this.request('/devices/recover', { method: 'POST', body });
  }

  revokeDevice(deviceId: string): Promise<void> {
    return this.request(`/devices/${encodeURIComponent(deviceId)}/revoke`, {
      method: 'POST',
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
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    };
    const response = await this.fetchImpl(
      `${this.baseUrl.replace(/\/+$/, '')}${path}`,
      init
    );
    return (await response.json()) as T;
  }
}
