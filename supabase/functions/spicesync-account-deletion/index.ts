import { createClient } from "npm:@supabase/supabase-js@2.112.3";

import { isAllowedCorsOrigin, responseHeaders } from "../_shared/cors.ts";

const FUNCTION_METHODS = "GET, POST, OPTIONS";
const ALLOWED_PROVIDERS = new Set(["apple", "google"]);
const MAX_CONTACT_LENGTH = 320;
const REQUEST_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export interface DeletionRequest {
  contact: string;
  provider: "apple" | "google";
}

export interface DeletionPageDependencies {
  insertDeletionRequest(
    request: DeletionRequest,
  ): Promise<{ requestId: string }>;
}

export async function handleDeletionPage(
  request: Request,
  dependencies = createDeletionPageDependencies(),
): Promise<Response> {
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

  const deletionRequest = await parseDeletionRequest(request);
  if (deletionRequest === null) {
    return textResponse(request, 400, "Invalid deletion request");
  }
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
): Promise<DeletionRequest | null> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return null;
  }
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
    provider: provider.trim() as DeletionRequest["provider"],
    contact: contact.trim(),
  };
}

function formResponse(request: Request): Response {
  return htmlResponse(
    request,
    200,
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Delete your SpiceSync account</title><style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:3rem auto;padding:0 1rem;color:#2c1a12}label{display:block;margin-top:1rem}input,select,button{font:inherit;padding:.5rem;width:100%;box-sizing:border-box}button{margin-top:1.5rem;background:#a34b24;color:white;border:0;border-radius:.4rem}</style></head>
<body><main><h1>SpiceSync account deletion</h1><p>Submit a request and we will manually verify it before deleting your account.</p>
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
    }</code>.</p><p>We will complete manual verification before deleting your account.</p></main></body></html>`,
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
