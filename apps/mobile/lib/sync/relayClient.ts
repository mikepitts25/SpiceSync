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
} from './relayTypes';

export type RelayTransport = {
  health(): Promise<{ ok: boolean }>;
  createInvite(body: CreateInviteRequest): Promise<CreateInviteResponse>;
  getInvite(inviteId: string): Promise<InviteResponse>;
  acceptInvite(
    inviteId: string,
    body: AcceptInviteRequest
  ): Promise<AcceptInviteResponse>;
  getCouple(coupleId: string): Promise<CoupleResponse>;
  findCoupleForDevice(deviceId: string): Promise<CoupleResponse | null>;
  recoverDevice(body: DeviceRecoveryRequest): Promise<DeviceRecoveryResponse>;
  revokeDevice(deviceId: string): Promise<void>;
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
