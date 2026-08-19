export type ParsedInviteUrl = {
  inviteId: string;
  inviteSecret: string;
};

export function parseInviteUrl(input: string): ParsedInviteUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/\/link\/([^/?#\s]+)#([A-Za-z0-9_%~-]+)/);
  if (!match) return null;
  try {
    return {
      inviteId: decodeURIComponent(match[1]),
      inviteSecret: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}
