import { createClient } from "npm:@supabase/supabase-js@2.112.3";

import {
  type AppleCredentials,
  AppleTransientRevocationError,
  exchangeAppleAuthorizationCode,
  revokeAppleToken,
  verifyAppleIdentityToken,
} from "../_shared/apple.ts";
import { isAllowedCorsOrigin, responseHeaders } from "../_shared/cors.ts";
import { verifyGoogleIdentityToken } from "../_shared/google.ts";

const FUNCTION_METHODS = "POST, OPTIONS";
const MAX_APPLE_AUTHORIZATION_CODE_LENGTH = 4096;
const MAX_GOOGLE_ID_TOKEN_LENGTH = 16384;

export interface VerifiedIdentity {
  provider: string;
  subject: string | null;
}

export interface VerifiedUser {
  id: string;
  isAnonymous: boolean;
  identities: VerifiedIdentity[];
}

export interface AppleExchangeResult {
  idToken: string;
  tokenToRevoke: string;
}

export interface DeleteAccountDependencies {
  getUser(token: string): Promise<VerifiedUser | null>;
  exchangeAppleAuthorizationCode(code: string): Promise<AppleExchangeResult>;
  verifyAppleIdentityToken(identityToken: string): Promise<{ subject: string }>;
  revokeAppleToken(token: string): Promise<void>;
  createGoogleChallenge(userId: string): Promise<{
    challengeId: string;
    expiresAt: string;
  }>;
  verifyGoogleIdentityToken(
    identityToken: string,
  ): Promise<{ subject: string }>;
  consumeGoogleChallenge(challengeId: string, userId: string): Promise<boolean>;
  cleanupUserData(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  logError(event: Record<string, unknown>): void;
}

export async function handleDeleteAccount(
  request: Request,
  dependencies = createDeleteAccountDependencies(),
): Promise<Response> {
  if (!isAllowedCorsOrigin(request)) {
    return textResponse(request, 403, "Forbidden");
  }
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonError(request, 405, "method_not_allowed");
  }

  const bearerToken = readBearerToken(request);
  if (bearerToken === null) return jsonError(request, 401, "unauthorized");

  let user: VerifiedUser | null;
  try {
    user = await dependencies.getUser(bearerToken);
  } catch {
    return jsonError(request, 401, "unauthorized");
  }
  if (user === null) return jsonError(request, 401, "unauthorized");
  if (user.isAnonymous) {
    return jsonError(request, 403, "permanent_account_required");
  }

  const body = await parseDeleteRequest(request);
  if (body === null) return jsonError(request, 400, "invalid_request");

  if (body.action === "create_google_challenge") {
    const googleSubjects = linkedSubjects(user, "google");
    if (googleSubjects.length === 0) {
      return jsonError(request, 422, "google_identity_verification_failed");
    }
    try {
      const challenge = await dependencies.createGoogleChallenge(user.id);
      return jsonResponse(request, 201, challenge);
    } catch {
      return jsonError(request, 500, "google_challenge_failed");
    }
  }

  const appleSubjects = linkedAppleSubjects(user);
  if (appleSubjects !== null) {
    if (appleSubjects.length === 0) {
      return jsonError(request, 422, "apple_identity_verification_failed");
    }
    if (body.appleAuthorizationCode === undefined) {
      return jsonError(request, 422, "apple_authorization_code_required");
    }
    let exchange: AppleExchangeResult;
    try {
      exchange = await dependencies.exchangeAppleAuthorizationCode(
        body.appleAuthorizationCode,
      );
      const identity = await dependencies.verifyAppleIdentityToken(
        exchange.idToken,
      );
      if (!appleSubjects.includes(identity.subject)) {
        return jsonError(request, 403, "apple_identity_mismatch");
      }
    } catch {
      return jsonError(request, 422, "apple_identity_verification_failed");
    }
    try {
      await dependencies.revokeAppleToken(exchange.tokenToRevoke);
    } catch (error) {
      if (!(error instanceof AppleTransientRevocationError)) {
        return jsonError(request, 502, "apple_token_revocation_failed");
      }
      dependencies.logError({
        event: "apple_token_revocation_failed",
        error: error instanceof Error ? error.name : "unknown",
        userId: user.id,
      });
    }
  } else {
    const googleSubjects = linkedSubjects(user, "google");
    if (googleSubjects.length === 0) {
      return jsonError(request, 422, "google_identity_verification_failed");
    }
    if (
      body.googleChallengeId === undefined || body.googleIdToken === undefined
    ) {
      return jsonError(request, 422, "google_reauthentication_required");
    }
    let identity: { subject: string };
    try {
      identity = await dependencies.verifyGoogleIdentityToken(
        body.googleIdToken,
      );
    } catch {
      return jsonError(request, 403, "google_identity_verification_failed");
    }
    if (!googleSubjects.includes(identity.subject)) {
      return jsonError(request, 403, "google_identity_mismatch");
    }
    let consumed = false;
    try {
      consumed = await dependencies.consumeGoogleChallenge(
        body.googleChallengeId,
        user.id,
      );
    } catch {
      consumed = false;
    }
    if (!consumed) {
      return jsonError(request, 403, "google_challenge_invalid");
    }
  }

  try {
    await dependencies.cleanupUserData(user.id);
  } catch {
    return jsonError(request, 500, "account_cleanup_failed");
  }
  try {
    await dependencies.deleteUser(user.id);
  } catch {
    return jsonError(request, 500, "account_deletion_failed");
  }
  return new Response(null, {
    status: 204,
    headers: responseHeaders(
      request,
      "text/plain; charset=utf-8",
      FUNCTION_METHODS,
    ),
  });
}

export function createDeleteAccountDependencies(): DeleteAccountDependencies {
  const client = serviceClient();
  let appleCredentials: AppleCredentials | undefined;
  const credentials = () => appleCredentials ??= readAppleCredentials();

  return {
    async getUser(token) {
      const { data, error } = await client.auth.getUser(token);
      if (error !== null || data.user === null) return null;
      return mapVerifiedAuthUser(data.user);
    },
    exchangeAppleAuthorizationCode: (code) =>
      exchangeAppleAuthorizationCode(code, credentials()),
    verifyAppleIdentityToken: (identityToken) =>
      verifyAppleIdentityToken(identityToken, credentials().clientId),
    revokeAppleToken: (token) => revokeAppleToken(token, credentials()),
    async createGoogleChallenge(userId) {
      const { data, error } = await client.rpc(
        "spicesync_issue_google_deletion_challenge",
        { p_user_id: userId },
      ).single();
      if (error !== null || !isRecord(data)) {
        throw error ?? new Error("challenge");
      }
      return {
        challengeId: String(data.challenge_id),
        expiresAt: String(data.expires_at),
      };
    },
    verifyGoogleIdentityToken: (identityToken) =>
      verifyGoogleIdentityToken(
        identityToken,
        requiredEnvironment("GOOGLE_WEB_CLIENT_ID"),
      ),
    async consumeGoogleChallenge(challengeId, userId) {
      const { data, error } = await client.rpc(
        "spicesync_consume_google_deletion_challenge",
        { p_challenge_id: challengeId, p_user_id: userId },
      );
      if (error !== null) throw error;
      return data === true;
    },
    async cleanupUserData(userId) {
      const revokedAt = new Date().toISOString();
      const couples = await client.from("spicesync_couples")
        .update({ revoked_at: revokedAt })
        .or(`member_a_user_id.eq.${userId},member_b_user_id.eq.${userId}`);
      if (couples.error !== null) throw couples.error;
      const devices = await client.from("spicesync_devices")
        .update({ status: "revoked", revoked_at: revokedAt })
        .eq("user_id", userId);
      if (devices.error !== null) throw devices.error;
    },
    async deleteUser(userId) {
      const { error } = await client.auth.admin.deleteUser(userId);
      if (error !== null) throw error;
    },
    logError(event) {
      console.error(JSON.stringify(event));
    },
  };
}

export function mapVerifiedAuthUser(user: {
  id: string;
  is_anonymous?: boolean;
  identities?: Array<{ provider: string; identity_data?: unknown }> | null;
}): VerifiedUser {
  return {
    id: user.id,
    isAnonymous: user.is_anonymous === true,
    identities: (user.identities ?? []).map((identity) => ({
      provider: identity.provider,
      subject: readIdentitySubject(identity.identity_data),
    })),
  };
}

async function parseDeleteRequest(
  request: Request,
): Promise<
  {
    action?: "create_google_challenge";
    appleAuthorizationCode?: string;
    googleChallengeId?: string;
    googleIdToken?: string;
  } | null
> {
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith(
      "application/json",
    )
  ) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  const keys = Object.keys(parsed);
  const allowed = new Set([
    "action",
    "appleAuthorizationCode",
    "googleChallengeId",
    "googleIdToken",
  ]);
  if (keys.some((key) => !allowed.has(key))) return null;
  if (parsed.action !== undefined) {
    return parsed.action === "create_google_challenge" && keys.length === 1
      ? { action: parsed.action }
      : null;
  }
  const code = parsed.appleAuthorizationCode;
  const challengeId = parsed.googleChallengeId;
  const googleIdToken = parsed.googleIdToken;
  if (
    code === undefined && challengeId === undefined &&
    googleIdToken === undefined
  ) {
    return {};
  }
  if (code !== undefined) {
    if (challengeId !== undefined || googleIdToken !== undefined) return null;
    if (
      typeof code !== "string" || code.length === 0 ||
      code.length > MAX_APPLE_AUTHORIZATION_CODE_LENGTH ||
      !/^[A-Za-z0-9._~-]+$/.test(code)
    ) return null;
    return { appleAuthorizationCode: code };
  }
  if (
    typeof challengeId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        challengeId,
      ) ||
    typeof googleIdToken !== "string" || googleIdToken.length === 0 ||
    googleIdToken.length > MAX_GOOGLE_ID_TOKEN_LENGTH
  ) return null;
  return { googleChallengeId: challengeId, googleIdToken };
}

function linkedAppleSubjects(user: VerifiedUser): string[] | null {
  const appleIdentities = user.identities.filter((identity) =>
    identity.provider === "apple"
  );
  if (appleIdentities.length === 0) return null;
  return appleIdentities.flatMap((identity) =>
    identity.subject === null ? [] : [identity.subject]
  );
}

function linkedSubjects(user: VerifiedUser, provider: string): string[] {
  return user.identities.flatMap((identity) =>
    identity.provider === provider && identity.subject !== null
      ? [identity.subject]
      : []
  );
}

function readBearerToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  const match = value?.match(/^Bearer ([^\s]+)$/i);
  return match?.[1] ?? null;
}

function readIdentitySubject(value: unknown): string | null {
  if (
    !isRecord(value) || typeof value.sub !== "string" || value.sub.length === 0
  ) return null;
  return value.sub;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serviceClient() {
  return createClient(
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
}

function readAppleCredentials(): AppleCredentials {
  return {
    clientId: requiredEnvironment("APPLE_CLIENT_ID"),
    keyId: requiredEnvironment("APPLE_KEY_ID"),
    privateKey: requiredEnvironment("APPLE_PRIVATE_KEY"),
    teamId: requiredEnvironment("APPLE_TEAM_ID"),
  };
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function jsonError(request: Request, status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: responseHeaders(
      request,
      "application/json; charset=utf-8",
      FUNCTION_METHODS,
    ),
  });
}

function jsonResponse(
  request: Request,
  status: number,
  value: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: responseHeaders(
      request,
      "application/json; charset=utf-8",
      FUNCTION_METHODS,
    ),
  });
}

function textResponse(
  request: Request,
  status: number,
  text: string,
): Response {
  return new Response(text, {
    status,
    headers: responseHeaders(
      request,
      "text/plain; charset=utf-8",
      FUNCTION_METHODS,
    ),
  });
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

if (import.meta.main) {
  Deno.serve((request) => handleDeleteAccount(request));
}
