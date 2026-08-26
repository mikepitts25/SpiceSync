import { createClient } from "npm:@supabase/supabase-js@2.112.3";

import { isAllowedCorsOrigin, responseHeaders } from "../_shared/cors.ts";

const FUNCTION_METHODS = "GET, POST, OPTIONS";
const ALLOWED_PROVIDERS = new Set(["apple", "google"]);
const MAX_CONTACT_LENGTH = 320;
const MAX_FORM_BODY_BYTES = 2048;
const REQUEST_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const UNSAFE_CONTACT_CHARACTER =
  /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u;
export const GATEWAY_HEADER = "x-spicesync-gateway";

export interface DeletionRequest {
  contact: string;
  provider: "apple" | "google";
}

export interface DeletionPageDependencies {
  gatewaySecret: string;
  insertDeletionRequest(
    request: DeletionRequest,
  ): Promise<{ requestId: string }>;
}

export async function handleDeletionPage(
  request: Request,
  dependencies = createDeletionPageDependencies(),
): Promise<Response> {
  if (!(await hasValidGatewaySecret(request, dependencies.gatewaySecret))) {
    return textResponse(request, 403, "Forbidden");
  }
  if (!isAllowedCorsOrigin(request)) {
    return textResponse(request, 403, "Forbidden");
  }
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method === "GET") return formResponse(request);
  if (request.method !== "POST") {
    return textResponse(request, 405, "Method Not Allowed", {
      allow: FUNCTION_METHODS,
    });
  }
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith(
      "application/x-www-form-urlencoded",
    )
  ) {
    return textResponse(request, 415, "Unsupported Media Type");
  }

  const parsedRequest = await parseDeletionRequest(request);
  if (parsedRequest === "too_large") {
    return textResponse(request, 413, "Deletion request is too large");
  }
  if (parsedRequest === null) {
    return textResponse(request, 400, "Invalid deletion request");
  }
  if (UNSAFE_CONTACT_CHARACTER.test(parsedRequest.contact)) {
    return textResponse(request, 422, "Invalid deletion request");
  }
  const deletionRequest = {
    ...parsedRequest,
    contact: parsedRequest.contact.trim(),
  };
  if (
    !ALLOWED_PROVIDERS.has(deletionRequest.provider) ||
    deletionRequest.contact.length < 3 ||
    deletionRequest.contact.length > MAX_CONTACT_LENGTH
  ) {
    return textResponse(request, 422, "Invalid deletion request");
  }

  let requestId: string;
  try {
    requestId =
      (await dependencies.insertDeletionRequest(deletionRequest)).requestId;
  } catch {
    return textResponse(
      request,
      503,
      "Unable to accept your request right now",
    );
  }
  if (!REQUEST_REFERENCE_PATTERN.test(requestId)) {
    return textResponse(
      request,
      503,
      "Unable to accept your request right now",
    );
  }
  return confirmationResponse(request, requestId, deletionRequest.contact);
}

export async function hasValidGatewaySecret(
  request: Request,
  expectedSecret: string,
): Promise<boolean> {
  const suppliedSecret = request.headers.get(GATEWAY_HEADER);
  if (suppliedSecret === null || suppliedSecret.length === 0) return false;

  const encoder = new TextEncoder();
  const [suppliedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(suppliedSecret)),
    crypto.subtle.digest("SHA-256", encoder.encode(expectedSecret)),
  ]);
  const suppliedBytes = new Uint8Array(suppliedDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let mismatch = suppliedBytes.length ^ expectedBytes.length;
  for (let index = 0; index < suppliedBytes.length; index += 1) {
    mismatch |= suppliedBytes[index] ^ expectedBytes[index];
  }
  return mismatch === 0;
}

export function createDeletionPageDependencies(): DeletionPageDependencies {
  const client = createClient(
    requiredEnvironment("SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  return {
    gatewaySecret: requiredEnvironment("SPICESYNC_DELETION_GATEWAY_SECRET"),
    async insertDeletionRequest(request) {
      const { data, error } = await client.from(
        "spicesync_account_deletion_requests",
      )
        .insert({ contact: request.contact, provider: request.provider })
        .select("request_id")
        .single();
      if (
        error !== null || data === null || typeof data.request_id !== "string"
      ) {
        throw error ??
          new Error("Deletion request insert returned no reference");
      }
      return { requestId: data.request_id };
    },
  };
}

async function parseDeletionRequest(
  request: Request,
): Promise<DeletionRequest | "too_large" | null> {
  const body = await readBoundedFormBody(request);
  if (body === "too_large" || body === null) return body;
  const form = new URLSearchParams(body);
  const entries = [...form.entries()];
  if (
    entries.length !== 2 ||
    entries.some(([key, value]) =>
      (key !== "provider" && key !== "contact") || typeof value !== "string"
    )
  ) return null;
  const providerValues = form.getAll("provider");
  const contactValues = form.getAll("contact");
  if (providerValues.length !== 1 || contactValues.length !== 1) return null;
  const provider = providerValues[0];
  const contact = contactValues[0];
  if (typeof provider !== "string" || typeof contact !== "string") return null;
  return {
    provider: provider as DeletionRequest["provider"],
    contact,
  };
}

async function readBoundedFormBody(
  request: Request,
): Promise<string | "too_large" | null> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) return null;
    if (Number(contentLength) > MAX_FORM_BODY_BYTES) return "too_large";
  }

  const reader = request.body?.getReader();
  if (reader === undefined) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_FORM_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The oversize boundary is already established; cancellation is
          // best-effort and must not turn it into a malformed-body response.
        }
        return "too_large";
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function formResponse(request: Request): Response {
  return htmlResponse(
    request,
    200,
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Delete your SpiceSync account</title><style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:3rem auto;padding:0 1rem;color:#2c1a12}label{display:block;margin-top:1rem}input,select,button{font:inherit;padding:.5rem;width:100%;box-sizing:border-box}button{margin-top:1.5rem;background:#a34b24;color:white;border:0;border-radius:.4rem}</style></head>
<body><main><h1>SpiceSync account deletion</h1><p>Submit a request and we will manually verify it. We aim to complete verified requests within 30 days.</p>
<p>Deletion removes your SpiceSync authentication account, its provider email or identifier, account-associated device and couple metadata, invitations, and encrypted relay events. We retain the provider, contact, request status, and timestamps as the manual request record needed to process and document the request.</p>
<p>Only local SpiceSync data on the device where in-app deletion finishes is cleared. Local copies on other devices remain until you reset or uninstall SpiceSync there. Reinstalling does not restore local profiles, votes, or history after deletion.</p>
<p>Account deletion and store subscription cancellation are separate. SpiceSync currently offers lifetime access rather than a subscription.</p>
<form method="post" action=""><label>Sign-in provider<select name="provider" required><option value="apple">Apple</option><option value="google">Google</option></select></label>
<label>Contact email<input name="contact" type="text" maxlength="320" required></label><button type="submit">Request deletion</button></form></main></body></html>`,
  );
}

function confirmationResponse(
  request: Request,
  requestId: string,
  contact: string,
): Response {
  return htmlResponse(
    request,
    202,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Deletion request received</title></head><body><main><h1>SpiceSync deletion request received</h1><p>We received a request for ${
      escapeHtml(contact)
    }.</p><p>Your request reference is <code>${
      escapeHtml(requestId)
    }</code>.</p><p>We will complete manual verification and aim to finish verified requests within 30 days. The provider, contact, request status, and timestamps remain as the manual request record. Account deletion does not clear local copies on other devices or cancel a separate store subscription.</p></main></body></html>`,
  );
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;",
  )
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function htmlResponse(
  request: Request,
  status: number,
  html: string,
): Response {
  return new Response(html, {
    status,
    headers: responseHeaders(
      request,
      "text/html; charset=utf-8",
      FUNCTION_METHODS,
    ),
  });
}

function textResponse(
  request: Request,
  status: number,
  text: string,
  extraHeaders: HeadersInit = {},
): Response {
  const headers = responseHeaders(
    request,
    "text/plain; charset=utf-8",
    FUNCTION_METHODS,
  );
  for (const [name, value] of new Headers(extraHeaders)) {
    headers.set(name, value);
  }
  return new Response(text, { status, headers });
}

function optionsResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(
      request,
      "text/plain; charset=utf-8",
      FUNCTION_METHODS,
    ),
  });
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

if (import.meta.main) {
  Deno.serve((request) => handleDeletionPage(request));
}
