import { parseInviteUrl } from '../lib/sync/inviteUrl';

type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({
  path,
}: RedirectSystemPathOptions): string {
  try {
    const invite = parseInviteUrl(path);
    if (!invite) return path;

    return `/partner-connect?remoteInviteId=${encodeURIComponent(
      invite.inviteId
    )}&remoteInviteSecret=${encodeURIComponent(invite.inviteSecret)}`;
  } catch {
    return path;
  }
}
