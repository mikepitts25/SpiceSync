# Onboarding Readiness V1 Design

## Goal

Strengthen app-store readiness and user trust by making the final welcome step an explicit adult, consent, and privacy confirmation instead of a single generic 18+ button.

## Scope

The welcome flow keeps its current five screens. The final age gate adds three required confirmations:

- I am 18 or older.
- I will only use this for consensual, legal adult exploration.
- I understand votes are private by default and remote sync uses limited encrypted relay data.

The continue button stays disabled until all confirmations are selected. The screen also links to Privacy Policy and Terms.

## Non-Goals

- No account creation.
- No legal rewrite of the full Privacy Policy or Terms.
- No biometric gate change.
- No new database fields.
- No remote storage of confirmation details.

## Data

Add a small pure helper under `lib/welcome/readiness.ts` for requirement definitions and completion checks. The existing `ageConfirmed` boolean remains the only persisted completion value.

## UX

The screen remains visual and compact. The existing 18+ seal stays. Below the description, users see tappable checklist rows with check icons. The primary button is visually disabled until every row is checked.

Privacy and Terms links are placed near the checklist. They route to existing Settings legal screens.

## Testing

Add tests for:

- Requirement ids and copy are stable.
- Completion is false until all requirement ids are present.
- Welcome content includes the new readiness copy in English and Spanish.
- Welcome flow references the legal routes and disables the continue action until requirements are met.
