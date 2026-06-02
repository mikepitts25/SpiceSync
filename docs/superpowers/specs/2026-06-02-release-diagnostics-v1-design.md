# Release Diagnostics V1 Design

## Goal

Add a no-cost release readiness surface inside the mobile app so TestFlight and pre-launch QA can quickly see whether the app is configured for a production build.

## Checks

- App identity: app name, iOS bundle identifier, and Android package must not use anonymous placeholders.
- Version: release builds need a visible app version.
- EAS project: warn when project id is missing or still local.
- Supabase relay: warn when remote partner sync is not configured for the build.
- Purchases: warn while paid unlocks are intentionally disabled.
- Notifications: warn in Expo Go because launch initialization is skipped there.
- Legal routes: fail if policy screens are not mounted.

## UI

The screen lives under Settings > About as "Release Diagnostics". It shows an overall status, counts by status, and one row per check. It must not print secrets or raw environment values.

## Scope

This is an internal QA aid, not a user-facing marketing feature. It does not add paid monitoring, server runtime, or external vendors.
