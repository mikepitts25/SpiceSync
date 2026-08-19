import {
  assertEquals,
} from "jsr:@std/assert@1";

import { createInviteLinkResponse } from "./index.ts";

Deno.test("redirects a valid invite id without consuming its client-side fragment", () => {
  const response = createInviteLinkResponse(
    new Request(
      "https://project.supabase.co/functions/v1/spicesync-invite-link/link/inv_abc123#client-secret",
    ),
  );

  assertEquals(response.status, 302);
  assertEquals(response.headers.get("cache-control"), "no-store");
  assertEquals(
    response.headers.get("location"),
    "spicesync://link/inv_abc123",
  );
  assertEquals(response.headers.get("location")?.includes("client-secret"), false);
});

Deno.test("rejects malformed invite ids without embedding them in HTML", async () => {
  const response = createInviteLinkResponse(
    new Request(
      "https://project.supabase.co/functions/v1/spicesync-invite-link/link/%3Cscript%3E",
    ),
  );

  assertEquals(response.status, 404);
  assertEquals((await response.text()).includes("<script>"), false);
});
