# SpiceSync Production Release Gateway Design

## Objective

Restore SpiceSync to TestFlight without weakening the repository's production
release gate. The release must include working Google and Apple account flows,
a managed public account-deletion endpoint, and independently verified abuse
controls before EAS may submit the iOS archive to App Store Connect.

## Current State

- The Expo SDK 54 development build compiles and renders in the iOS simulator.
- The full release check passes locally when production social recovery is not
  required: 131 Jest suites and 791 tests pass, along with TypeScript and Expo
  configuration checks.
- EAS production build `1.0.0 (10)` failed in `eas-build-pre-install` because
  the production environment lacks Google Web and iOS OAuth client IDs, a
  managed deletion URL, and the managed-gateway verification flag.
- The checked-in iOS plist has no Google callback URL scheme.
- `spicesync.app` has no resolving DNS record.
- The raw public Supabase account-deletion function is deployed and reachable,
  so it cannot currently sit behind an effective managed control point.

## Selected Architecture

### Managed deletion gateway

Deploy a Cloudflare Worker at a stable `workers.dev` URL. The initial release
will not depend on purchasing or configuring `spicesync.app`; a custom domain
can be mapped later without changing the gateway contract.

The Worker will expose `/account-deletion` for `GET` and `POST` only. It will:

- enforce Cloudflare-managed per-IP and per-request rate limiting;
- apply an abuse-control policy suitable for a public unauthenticated form;
- emit structured, privacy-safe operational logs and expose alertable failure
  and throttling signals;
- forward allowed requests to the Supabase Edge Function;
- inject a server-only gateway authorization secret;
- preserve the origin response status, body, browser/CORS headers, and
  `Cache-Control: no-store` behavior;
- reject unsupported methods and avoid logging submitted provider identifiers
  or contact values.

The Supabase `spicesync-account-deletion` function will require the gateway
authorization secret in hosted production. Direct requests to the raw
`*.supabase.co/functions/v1/...` origin without that secret will return a
non-success response. Local tests may inject the same dependency without
placing a production value in source control.

The gateway secret will be generated once and stored only in Cloudflare Worker
secrets and Supabase Edge Function secrets. It will not use an `EXPO_PUBLIC_*`
name and will never be compiled into the mobile application.

### Google identity configuration

Use the existing SpiceSync Google Cloud project when one is available in the
authenticated operator account; otherwise create a dedicated SpiceSync
project. Configure the consent screen for the minimal `openid`, `email`, and
`profile` scopes.

Create or reuse:

- a Web OAuth client whose redirect URI is
  `https://gewxwyvjcdplbdkygnib.supabase.co/auth/v1/callback`;
- an iOS OAuth client for bundle ID `com.spicesync.app`.

Configure the Supabase Google provider with the Web client ID first and the
iOS client ID in its accepted audiences. Keep the Web client secret only in
Supabase. Store the two public client IDs in the protected EAS production
environment as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and
`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

Derive the reverse-client-ID URL scheme from the iOS client ID and add it to
the checked-in iOS `Info.plist`. The app's dynamic Expo configuration must
resolve to the same scheme. Add the Web client ID to the deletion Edge
Function environment as `GOOGLE_WEB_CLIENT_ID` so token verification uses the
same audience as the mobile client.

### Apple identity configuration

Verify the existing App ID `com.spicesync.app` has Sign in with Apple enabled
and that the distribution profile carries the entitlement. Configure or reuse
the related Services ID and return URL for the Supabase callback.

Configure the Supabase Apple provider with the Services ID first and the native
App ID as an accepted audience. Configure the deletion Edge Function with
`APPLE_TEAM_ID`, native `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, and
`APPLE_PRIVATE_KEY`. The private key remains only in the approved secret
stores. Existing valid Apple configuration will be reused instead of rotated
without cause.

### EAS release environment

Keep the existing `testflight` profile semantics:

- production EAS environment;
- store distribution;
- automatic remote build-number increment;
- purchases disabled;
- free beta access enabled.

After gateway verification, set:

- `SPICESYNC_ACCOUNT_DELETION_URL` to the final Cloudflare URL;
- `SPICESYNC_DELETION_RATE_LIMIT_VERIFIED=true`.

The verification flag is an operator attestation. It may be set only after all
checks in the verification matrix pass against the deployed production URL.

## Data and Request Flow

1. A browser requests the public Cloudflare `/account-deletion` endpoint.
2. Cloudflare evaluates managed rate-limit and abuse-control policies.
3. The Worker forwards an allowed request to the Supabase Edge Function with
   the server-only gateway secret.
4. The Edge Function rejects missing or invalid gateway authorization before
   reading or processing a request body.
5. For `GET`, the Edge Function returns the no-store account-deletion page.
6. For a valid `POST`, the Edge Function validates and records the manual
   deletion request using its existing restricted service path.
7. The Worker returns the origin response while preserving required security
   headers and without caching sensitive output.

Native in-app account deletion continues to use the authenticated
`spicesync-delete-account` function and fresh provider proof. It does not pass
through the public manual-request gateway.

## Error Handling and Safety

- Gateway or origin timeouts return a generic no-store error without exposing
  internal URLs, secrets, or submitted identifiers.
- Rate-limited requests return `429` with a bounded retry indication.
- Direct raw-origin requests return a non-success response before request data
  is accepted.
- Unsupported methods return `405` with an explicit allow list.
- The Worker does not cache responses or follow arbitrary upstream redirects.
- Secrets are never printed in CLI output, committed, or copied into public
  EAS variables.
- If OAuth configuration cannot be proven correct, the build remains blocked.
- If a build succeeds but submission fails, retry submission for that exact
  archive rather than consuming another build number unnecessarily.

## Verification Matrix

Before setting the gateway verification flag:

1. Confirm the Cloudflare URL resolves over HTTPS and identifies SpiceSync.
2. Confirm a `GET` returns the account-deletion page successfully.
3. Submit one controlled valid `POST` and confirm the expected success result
   and database record; remove or clearly label the verification record if the
   operational process permits.
4. Confirm required `Content-Security-Policy`, CORS, `Referrer-Policy`,
   `X-Content-Type-Options`, and `Cache-Control: no-store` headers survive the
   gateway.
5. Confirm repeated requests trigger the managed rate limit and appear in
   privacy-safe Cloudflare telemetry.
6. Confirm the raw Supabase function origin rejects both `GET` and `POST`
   without the gateway secret.
7. Confirm the Worker rejects unsupported methods.
8. Confirm Google Web and iOS IDs pass the repository release validator and
   the checked-in iOS URL scheme matches the derived value.
9. Confirm Apple and Google provider settings and Edge Function secrets exist
   in their production systems without exposing their values.
10. Run `npm run release:check` under the resolved production inputs.
11. Run `expo-doctor` and review any non-blocking native-project warnings.
12. Start an EAS iOS build with the `testflight` profile and automatic submit
    profile `production`.
13. Confirm the EAS build is `FINISHED`, the submission is successful, and
    App Store Connect has accepted the build for TestFlight processing.

## Repository Changes

Expected tracked changes are limited to:

- a focused Cloudflare Worker package and its tests/configuration;
- gateway-secret validation in `spicesync-account-deletion` and its tests;
- the checked-in iOS callback URL scheme;
- release documentation or configuration required to make the deployment
  reproducible.

No credential values, service-role keys, OAuth client secrets, Apple private
keys, or gateway secrets will enter git.

## Deployment and Rollback

Deploy the Supabase function secret validation and Cloudflare Worker as one
coordinated change. Verify the Worker with the shared secret before announcing
or configuring its public URL.

If verification fails, keep the EAS gate closed and roll back the Worker route
or Supabase function deployment to the last known-safe version. Rotating the
gateway secret requires updating both secret stores before re-verification.
OAuth client changes should be additive until the new TestFlight build is
confirmed; do not revoke an existing working client during initial setup.

The release is complete only when App Store Connect accepts the archive and it
appears in TestFlight processing or as an available TestFlight build.
