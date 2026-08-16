# App Store Metadata Pass

Guidance for the iOS App Store (and Google Play) listing. Context: iOS
guideline 1.1.4 rejections in this category are usually triggered by store
METADATA — screenshots, description, keywords — not by the app itself. The
listing must read like a relationship/wellness product, consistent with the
neutral, non-graphic language rule in `CONTRIBUTING.md`.

## Ratings and category

- **iOS age rating:** 18+ (Frequent Mature or Suggestive Themes and Sexual
  Content or Nudity). Do not
  attempt a lower rating.
- **Google Play:** Mature 17+ via the content questionnaire.
- **Category:** Lifestyle (primary). Health & Fitness is a defensible
  secondary on iOS.

## Copy rules (description, subtitle, keywords, what's new)

- Neutral and non-graphic everywhere. Talk about _communication_,
  _compatibility_, _intimacy_, and _date nights_ — never specific acts.
  Nothing in the listing should be more explicit than a mainstream
  relationship-advice column.
- Never use words that read as explicit content signals in review:
  no "kink" in the title/subtitle/keywords, no acronyms from the scene,
  no innuendo-laden emoji strings.
- Lead with privacy: it is both true and the strongest differentiator.

### Suggested subtitle

> Private couples' compatibility & date night games

### Suggested short description

> SpiceSync helps couples talk about what they both want. Compare
> preferences privately, discover what you match on, and keep date night
> fun with conversation starters and party games. Profiles and votes stay
> private by default, with encrypted relay sync available for linked partners.

### Suggested keyword themes (iOS keyword field)

couples, relationship, intimacy, date night, communication, compatibility,
partner quiz, conversation starters, marriage, spark

## Screenshots

- Use the tamest surfaces: home hub, conversation starters, date-night
  planner, matches screen with mild example items (e.g. "Candlelight
  Intimacy", "Sincere Compliment Session"), game setup screen.
- Do NOT screenshot: XXX-tier cards, intense-mode game cards, anything with
  the word "kink" visible, or the fantasy journal.
- Turn discrete mode OFF for screenshots but choose innocuous seeded content.
- No captions that promise explicit content; caption around connection and
  privacy ("Find what you both want to try", "Private by default").

## App Review notes (paste into the review notes field)

> SpiceSync is a private compatibility and date-night app for adult couples.
>
> - An age gate (18+) is the first screen and must be confirmed before any
>   content is reachable.
> - All content is written in neutral, non-graphic language and is curated;
>   there is no user-generated content shared between users, no community,
>   and no messaging.
> - No email address or password is required. Partner sync uses anonymous
>   Supabase authentication, an invite link or QR code, limited connection
>   metadata, and encrypted sync payloads. The service cannot read the
>   plaintext contents of encrypted votes.
> - A "discrete mode" hides app content from shoulder-surfing, and the app
>   supports a biometric/PIN lock.
> - Custom entries are validated against a blocked-terms safety filter
>   (lib/safety/safetyFilter.ts).
>
> Demo instructions: pass the age gate, create a profile (no account
> needed), and use "Reset deck"/sample codes to explore matching.

## Privacy questionnaire ("nutrition label")

- Declare data used for **App Functionality**, not tracking or advertising:
  identifiers for anonymous Supabase authentication and linked devices, plus
  user content for optional profile display metadata and encrypted partner-sync
  changes retained by the relay.
- The app has no third-party analytics or advertising SDK. Re-check linked/not
  linked selections against App Store Connect's current definitions when the
  questionnaire is completed.
- Purchases are handled by the App Store. Revisit purchase-history disclosure
  before enabling the IAP build profile.

## Pre-submission checklist

- [ ] Listing copy contains no explicit terms, in any locale (check ES too).
- [ ] Screenshots re-taken on current UI, soft-tier content only.
- [ ] Age rating questionnaire answers match the 18+ rating.
- [ ] Review notes above pasted into App Review Information.
- [ ] Privacy label includes relay identifiers and user content used for App
      Functionality, with no tracking.
- [ ] `CONTRIBUTING.md` language rule re-checked against any new store copy.
