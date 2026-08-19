const FUNCTION_PATH = "/spicesync-invite-link/link/";
const INVITE_ID_PATTERN = /^inv_[A-Za-z0-9_-]{1,128}$/;

function notFound(): Response {
  return new Response("Invite link not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function createInviteLinkResponse(request: Request): Response {
  const url = new URL(request.url);
  const markerIndex = url.pathname.indexOf(FUNCTION_PATH);
  if (markerIndex === -1) return notFound();

  const encodedInviteId = url.pathname.slice(markerIndex + FUNCTION_PATH.length);
  let inviteId: string;
  try {
    inviteId = decodeURIComponent(encodedInviteId);
  } catch {
    return notFound();
  }
  if (!INVITE_ID_PATTERN.test(inviteId)) return notFound();

  return new Response(null, {
    status: 302,
    headers: {
      location: `spicesync://link/${inviteId}`,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}

if (import.meta.main) {
  Deno.serve(createInviteLinkResponse);
}
