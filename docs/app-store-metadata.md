# App Store Metadata Pass

Guidance for the iOS App Store (and Google Play) listing. Context: iOS
guideline 1.1.4 rejections in this category are usually triggered by store
METADATA — screenshots, description, keywords — not by the app itself. The
listing must read like a relationship/wellness product, consistent with the
neutral, non-graphic language rule in `CONTRIBUTING.md`.

## Ratings and category

- **iOS age rating:** 17+ (Frequent/Intense Mature/Suggestive Themes). Do not
  attempt a lower rating.
- **Google Play:** Mature 17+ via the content questionnaire.
- **Category:** Lifestyle (primary). Health & Fitness is a defensible
  secondary on iOS.

## Copy rules (description, subtitle, keywords, what's new)

- Neutral and non-graphic everywhere. Talk about *communication*,
  *compatibility*, *intimacy*, and *date nights* — never specific acts.
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
> fun with conversation starters and party games — all stored only on your
> devices, never on a server.

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
  privacy ("Find what you both want to try", "100% on-device").

## App Review notes (paste into the review notes field)

> SpiceSync is a private compatibility and date-night app for adult couples.
>
> - An age gate (18+) is the first screen and must be confirmed before any
>   content is reachable.
> - All content is written in neutral, non-graphic language and is curated;
>   there is no user-generated content shared between users, no community,
>   and no messaging.
> - All data is stored exclusively on-device. There is no server, no account,
>   and no data collection. Partner comparison works by exchanging an encoded
>   code (QR or text) directly between the two users' devices.
> - A "discrete mode" hides app content from shoulder-surfing, and the app
>   supports a biometric/PIN lock.
> - Custom entries are validated against a blocked-terms safety filter
>   (lib/safety/safetyFilter.ts).
>
> Demo instructions: pass the age gate, create a profile (no account
> needed), and use "Reset deck"/sample codes to explore matching.

## Privacy questionnaire ("nutrition label")

- Data collected: **none**. No identifiers, no usage data, no diagnostics
  (verify: no analytics SDK is linked before shipping).
- All processing on-device; declare "Data Not Collected" across the board.
- Purchases: IAP for premium packs (see `lib/pricing.ts`) — handled by the
  store, no personal data touched by the app.

## Pre-submission checklist

- [ ] Listing copy contains no explicit terms, in any locale (check ES too).
- [ ] Screenshots re-taken on current UI, soft-tier content only.
- [ ] Age rating questionnaire answers match the 17+ rating.
- [ ] Review notes above pasted into App Review Information.
- [ ] Privacy label says Data Not Collected and remains true (no analytics).
- [ ] `CONTRIBUTING.md` language rule re-checked against any new store copy.
