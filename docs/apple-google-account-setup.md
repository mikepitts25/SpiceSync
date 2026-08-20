# Apple and Google account-release setup

This is the production checklist for recoverable Apple/Google accounts, partner
sync, device recovery, and account deletion. It was checked against the
[Supabase Apple login](https://supabase.com/docs/guides/auth/social-login/auth-apple),
[Google login](https://supabase.com/docs/guides/auth/social-login/auth-google),
[identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking),
and [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets)
documentation on 2026-08-20.

Do not call an unreleased build "production-ready" until the dashboard,
console, and physical-device matrix below are all complete.

## What ships in the mobile app

The checked-in production identity is deliberately fixed:

| Item | Required value |
| --- | --- |
| iOS bundle ID and Android package | `com.spicesync.app` |
| Expo/deep-link scheme | `spicesync` |
| iOS Apple capability | `expo.ios.usesAppleSignIn: true` and the `expo-apple-authentication` plugin |
| Google iOS callback scheme | `com.googleusercontent.apps.<Google iOS client-ID prefix>`; `app.config.js` derives it from `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| EAS build profile | `production`, which already selects EAS environment `production` |

The native flows use `signInWithIdToken` and `linkIdentity` with native
credentials. They do not use a browser `signInWithOAuth` callback today. Keep
the `spicesync` scheme and generated Google reverse-client-ID scheme registered
in the native build nevertheless; do not add a speculative web callback route.

## Public mobile configuration (EAS)

Copy the variable *names* from `apps/mobile/.env.example` to EAS environment
`production`. All four values are consumed by the compiled mobile app, so
`EXPO_PUBLIC_*` values are public configuration, not secrets:

| Variable | Production source and use |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | The exact `https://<project-ref>.supabase.co` project URL used by the relay client. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The project publishable/legacy anon key. It is public only with correct RLS; never substitute a service-role/secret key. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | The Google **Web application** OAuth client ID. The native Google library uses it as `webClientId` on iOS and Android. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | The Google **iOS** OAuth client ID for bundle ID `com.spicesync.app`; it generates the reverse-client-ID URL scheme. |

Set each value in EAS as `plaintext` (or `sensitive` if the team wants it
masked in EAS UI); it cannot be an EAS `secret` because it is embedded into the
app. For example, use a trusted operator shell variable rather than writing a
value into this repository:

```sh
eas env:set --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_URL --value "$SPICESYNC_PRODUCTION_SUPABASE_URL"
```

Repeat for the other three names. EAS environments are separate per
development/preview/production, and the checked-in `eas.json` production
profile selects `production`; see the [EAS environment-variable guide](https://docs.expo.dev/eas/environment-variables/).

The offline command remains useful for baseline checks, but it cannot prove a
social-recovery production release. Before every social-recovery release, run
this exact mandatory preflight with the real EAS production environment:

```sh
cd apps/mobile
eas env:exec production 'npm run release:check -- --require-social-recovery' --non-interactive
```

`--require-social-recovery` requires every relay variable, both Google client
IDs, the Apple capability/plugin, `spicesync` and generated Google iOS callback
schemes, and the fixed production iOS/Android IDs. The check enables that same
required mode automatically whenever the selected `EAS_BUILD_PROFILE` resolves
through `eas.json` inheritance to `environment: production`—including the
checked-in `testflight` profile that extends `production`. Missing, invalid, or
cyclic supplied profiles fail closed rather than falling back to baseline mode.
When a valid resolved profile omits `environment`, the check follows Expo's
current documented build defaults: `distribution: "store"` is production,
`developmentClient: true` is development, and all other valid profiles are
preview. This preserves the checked-in `preview`/`development` baseline modes
without treating an invalid environment value as preview.
Without either signal, the baseline `npm run release:check` remains valid
offline and reports social recovery as not required only when both relay
variables are absent. Blank, placeholder, malformed, and incomplete values do
not pass either mode.

Keep the following release-control inputs in the protected EAS/CI production
environment used for the mandatory preflight. They are deliberately **not** in
`.env.example`, are not mobile `EXPO_PUBLIC_*` configuration, and must never be
compiled into the app:

| Variable | Required value in required mode |
| --- | --- |
| `SPICESYNC_ACCOUNT_DELETION_URL` | Stable public `https://` managed proxy/gateway URL for the account-deletion page; a raw `*.supabase.co/functions/v1/...` URL is rejected. |
| `SPICESYNC_DELETION_RATE_LIMIT_VERIFIED` | Exactly `true`, only after the managed endpoint and origin-bypass controls below have been independently verified. |

Never add any of these server-only values to EAS or an `EXPO_PUBLIC_*` name:
`SUPABASE_SERVICE_ROLE_KEY`, `APPLE_TEAM_ID`, `APPLE_CLIENT_ID`,
`APPLE_KEY_ID`, or `APPLE_PRIVATE_KEY`.

## Supabase Auth dashboard

In the production project, open **Authentication → Providers** and complete
both providers before testing a device.

1. Enable Apple and Google.
2. In **Authentication → Configuration**, enable **Manual linking**. This is
   required for a signed-in account to call Supabase `linkIdentity` and attach
   the other provider; automatic matching by email is not a substitute for the
   explicit in-app link flow.
3. In **Authentication → URL configuration**, set the Site URL only to the
   actual public SpiceSync web origin, currently `https://spicesync.app` if it
   is live. Do not leave development origins in production. Native flows do
   not need a Supabase redirect allow-list entry; if a future browser OAuth
   flow is added, add only its exact reviewed callback URL and implement that
   route first.
4. Record the hosted-project callback exactly as
   `https://<project-ref>.supabase.co/auth/v1/callback`. This is the callback
   to register with both Apple Services ID and Google Web OAuth client. It is
   not the public deletion page and must use the real project ref.
5. For Google, enter a comma-separated list of all Web, iOS, and Android
   client IDs in Supabase with the **Web client ID first**, then save its Web
   client ID/secret in the Google provider configuration. Supabase documents
   this ordering for multiple Google audiences.
6. For Apple, enter the Services ID **first**, then the native App ID client
   ID `com.spicesync.app` in the Apple provider Client IDs list. Supabase uses
   the first ID for web OAuth while accepting any listed audience for native
   `signInWithIdToken`.

Configuration in `supabase/config.toml` is local-development configuration,
not proof that the hosted dashboard is ready. In particular, its disabled local
provider/manual-linking defaults must not be copied to production.

## Apple Developer and provider configuration

1. In Apple Developer **Identifiers**, create or select the App ID whose
   bundle ID is exactly `com.spicesync.app`. Enable **Sign in with Apple** for
   that App ID. Regenerate/use a distribution provisioning profile that carries
   the capability. The Expo config is necessary but does not grant this Apple
   Developer entitlement by itself.
2. Create a Services ID associated with that App ID for any Supabase/web OAuth
   use. Under that Services ID, register the domain
   `<project-ref>.supabase.co` and return URL
   `https://<project-ref>.supabase.co/auth/v1/callback`. Keep the exact,
   actual identifiers in the release record rather than committing them here.
3. Create a Sign in with Apple key and record its Team ID, Key ID, and `.p8`
   private key in the approved secret manager. Revoke and replace a lost or
   exposed `.p8` key immediately.
4. Configure the Supabase Apple provider with the Services ID first, the
   native App ID in its accepted client IDs, and the Apple OAuth client secret
   generated from that key. A web/Services-ID Apple client secret has a maximum
   six-month lifetime; schedule rotation before it expires. Native-only Apple
   sign-in does not remove this rotation obligation when the Services-ID OAuth
   configuration is present.
5. The deletion Edge Function needs its own server configuration. Set
   `APPLE_CLIENT_ID` to the **native** client/audience it exchanges and
   verifies: `com.spicesync.app`, not the Services ID. Its generated client
   secret is short-lived and signed on demand from the `.p8` private key.

Apple cancellation is not an error: protect/link/restore must leave the
existing account and local state unchanged. Deleting an Apple-linked SpiceSync
account obtains a fresh native authorization code, verifies its Apple subject
against the linked identity, tries Apple token revocation, then deletes the
SpiceSync account only after cleanup. A permanent Apple-linked account cannot
be deleted from Android when a fresh Apple credential is unavailable; use an
iPhone/iPad or the external request route.

## Google Cloud and provider configuration

Use one Google Cloud project and configure the consent screen's audience,
branding, and the minimal `openid`, email, and profile scopes. Create all of
the following OAuth clients:

| Client type | Required configuration | Where its ID goes |
| --- | --- | --- |
| Web application | Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI. Add only a real reviewed web origin if web sign-in is introduced. | Supabase Google provider; `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Keep its client secret in Supabase, never in the app. |
| iOS | Bundle ID `com.spicesync.app`. | Supabase Google provider list; `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; its reverse-client-ID becomes `com.googleusercontent.apps.<prefix>`. |
| Android | Package name `com.spicesync.app`; add every signing-certificate fingerprint below. | Supabase Google provider list. The current mobile code does not read an Android client-ID environment variable. |

Register the exact SHA-1 fingerprints for both debug and release testing. Use
the certificate shown by the relevant signing system, not a copied example:

```sh
keytool -list -v -keystore <debug-keystore> -alias <debug-key-alias>
keytool -list -v -keystore <release-or-upload-keystore> -alias <release-key-alias>
```

For an app distributed through Google Play App Signing, also register the
**Google Play app-signing certificate** SHA-1, because that is the certificate
on the installed production APK/AAB; do not assume an upload-key fingerprint is
sufficient. Re-run the `keytool` checks after key rotation and update the
Google Android client before shipping.

Google cancellation is also a no-op for protect/link/restore. Google-only
account deletion performs fresh Google sign-in and then deletes the SpiceSync
account; it deliberately does not revoke Google locally before the server has
confirmed deletion, so a transient failure cannot strand a still-existing
account. Manage Google-account consent separately in the Google account if
provider access must be revoked.

## Edge Function secrets, migration, and deployment

Keep a non-versioned secrets file in the approved secret manager. It must
contain the following **names**, with production values supplied only at
deployment time:

```dotenv
APPLE_TEAM_ID=
APPLE_CLIENT_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

Never manually set hosted `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` with
`supabase secrets set`. Hosted Supabase injects its default project URL and
service-role key for Edge Functions; setting them yourself can override those
platform-managed defaults. Verify their availability and the deletion
function's hosted behavior through a controlled deployment/health test in the
target project. For local `supabase functions serve`, use the local stack's
defaults (or an untracked, local-only test environment when exercising an
external dependency); do not copy that local convenience into hosted secrets.
The Apple private key may use literal `\\n` line breaks. These four Apple values
are Edge Function-only; the private key can sign revocation credentials.

After a reviewer has confirmed the hosted Auth settings, deploy in this order
from the repository root. These commands mutate the named production project,
so replace the project-ref only in a trusted operator session:

```sh
supabase link --project-ref <production-project-ref>
supabase db push --linked
supabase secrets set --project-ref <production-project-ref> --env-file <untracked-apple-secrets-file>
supabase functions deploy spicesync-delete-account spicesync-account-deletion \
  --project-ref <production-project-ref>
```

Do not use `--no-verify-jwt` for `spicesync-delete-account`. The committed
`supabase/config.toml` makes only the public
`spicesync-account-deletion` request page JWT-free; the authenticated deletion
function retains gateway JWT verification and rechecks the bearer token.

The raw JWT-free Supabase Function URL is an **origin/test endpoint only**:

```text
https://<project-ref>.supabase.co/functions/v1/spicesync-account-deletion
```

Never submit that raw URL to Google Play merely because it has fixed CORS.
CORS does not rate-limit public browser requests. The final Google Play **Data
deletion** URL must instead be a stable HTTPS URL at an approved managed
proxy/gateway, for example `https://<managed-deletion-host>/account-deletion`.
It must identify SpiceSync and accept a deletion request without requiring app
reinstallation.

Production deployment, release, and Google Play publication are blocked until
that managed point is actually deployed and a reviewer has verified all of the
following against the final submitted URL:

1. Enforced per-IP and per-request rate limiting, with an approved external
   WAF/abuse-control policy and abuse monitoring/alerting.
2. Correct pass-through/preservation of the deletion response's security
   headers, including its browser/CORS and `no-store` behavior.
3. A successful GET and a successful valid POST through the managed URL.
4. The published raw Supabase function origin is not bypassable by the public
   client. If the origin cannot be restricted so that the proxy is the effective
   public control point, the release remains blocked.

Only after those checks may a trusted release operator set
`SPICESYNC_ACCOUNT_DELETION_URL` to the managed URL and
`SPICESYNC_DELETION_RATE_LIMIT_VERIFIED=true` for the required preflight. Do
not invent either value and do not claim the proxy exists before that evidence
is available. The in-app Account settings delete path and this external URL are
both required for an app that offers account creation; see [Google Play's
current policy guidance](https://support.google.com/googleplay/android-developer/answer/13327111).

## Operational security settings

- CORS is intentionally fixed to `https://spicesync.app` in
  `supabase/functions/_shared/cors.ts`; it never reflects arbitrary origins.
  A new web origin requires a reviewed code change, test, and deployment.
- The managed deletion proxy/gateway is a release prerequisite, not a future
  hardening item. Its verified external rate limit/WAF must front the submitted
  URL and the raw origin must not remain a public bypass. Do not replace this
  with an unreviewed per-instance in-memory limiter.
- Set a short hosted Supabase Auth JWT lifetime appropriate to the app's risk
  profile (at most one hour; usually 15–60 minutes). Do not go below five
  minutes without a measured reason. Access JWTs are stateless until expiry,
  so deletion/revocation protections still need the server-side current-user
  checks already in the database/functions.
- Keep refresh-token rotation enabled and protect logs: never log credentials,
  bearer tokens, Apple authorization codes, provider refresh tokens,
  service-role keys, or private keys.

## Physical release matrix

Use release-signed builds with the actual production EAS environment. Record
the build number, platform/OS, provider account, project ref, and result for
each row. A cancelled provider sheet must leave the original account, couple,
and local data unchanged.

| Scenario | Device and required action | Expected result |
| --- | --- | --- |
| Apple protect, link, cancel | Physical iPhone: create/enter partner sync, protect with Apple, link Google, then cancel an attempted provider operation. | Apple and Google identities appear on the account; cancel changes nothing. |
| Apple reinstall/restore/delete | Physical iPhone: uninstall, reinstall, choose Restore with Apple, confirm a local profile, then delete with a fresh Apple credential. | Couple/device metadata recover; old device is replaced; server deletion is confirmed before local reset. |
| Google on iPhone | Physical iPhone: protect/link Google, exercise cancellation, uninstall/reinstall/restore, confirm a profile, then delete. | Google ID token is accepted with iOS client/callback configuration; no local reset on cancel or deletion error. |
| Google on Android | Physical Android: protect/link Google, exercise cancellation, uninstall/reinstall/restore, confirm a profile, then delete. | Android package and the installed signing SHA are accepted; no local reset on cancel or deletion error. |
| Key rotation notice | Two partnered physical devices: replace/recover one device after reinstall, then foreground the other. | The other device sees the key-change notice, refreshes partner metadata, and sends one newly encrypted event addressed to the new recipient device/key. |
| Old-installation denial | Keep the replaced old installation offline until after replacement, then reconnect and attempt an append. | It receives an authorization/device-revoked failure and cannot append or silently re-authorize. |
| External deletion | From a browser with no app installed, use the final managed Google Play deletion URL for valid Apple and Google requests; test both GET and POST and confirm the raw origin cannot bypass the proxy controls. | The page is branded, no-store, accepts the request, returns a reference, explains manual verification, and remains protected by the verified managed rate controls. |

Recovery restores only account/couple metadata and encrypted partner-sync
position after the user explicitly selects a local profile. It **does not
restore local profiles, votes, history, intimate local data, or device private
keys**. This is intentional: those data never leave the device in recoverable
form.

## Final release evidence

Attach to the release ticket: EAS required-mode production-preflight output; a
screenshot or four-eyes record of the Apple/Google/Supabase dashboard values
(without secrets); migration/function deployment output; the final managed
Google Play deletion URL plus the rate-limit/origin-bypass/GET-and-POST
evidence; the completed matrix; and the key/certificate rotation dates. If
console credentials, release signing, the approved managed proxy, or physical
devices are unavailable, mark the corresponding rows **NOT RUN/BLOCKED**.
Automated tests do not prove native provider configuration or physical sign-in
readiness.
