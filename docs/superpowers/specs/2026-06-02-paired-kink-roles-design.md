# Paired Kink Roles Design

## Goal

Give/receive kink pairs should appear as one kink card instead of two separate cards. When a kink supports directional roles, the mobile card should show an inline segmented control for `Give`, `Receive`, and `Both`, then let the user vote `Pass`, `Yes`, or `Maybe` as usual.

The admin tool at `admin/` must expose controls to enable or disable this mode per kink, because not every kink with directional language should become a give/receive selector.

We are starting fresh for tester data. No existing vote migration is required.

## Current Context

The mobile kink data source is `apps/mobile/data/kinks.en.json` and `apps/mobile/data/kinks.es.json`, loaded through `apps/mobile/lib/data.ts`.

The dataset already contains structured pairing metadata:

- `pairKey`: shared stable key for a give/receive pair, for example `oral-pleasure`
- `pairRole`: `give` or `receive`

Current observed English dataset shape:

- 319 total kinks
- 56 paired-role entries
- 28 complete give/receive pairs
- no incomplete pair keys in the current dataset

The admin tool currently edits normal kink fields such as title, description, tags, category, intensity, and tier. It does not yet expose pair-role fields or an audit workflow.

## Data Model

Kinks may have optional pair metadata:

```ts
type PairRole = 'give' | 'receive';
type PairPreference = 'give' | 'receive' | 'both';

type KinkItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  intensityScale: 1 | 2 | 3;
  tier?: 'soft' | 'naughty' | 'xxx';
  pairMode?: boolean;
  pairKey?: string;
  pairRole?: PairRole;
};
```

`pairMode` is the admin-controlled toggle that determines whether a pair is collapsed into one visible card. A kink with `pairKey` and `pairRole` but without `pairMode` enabled should remain a normal card until it has been audited.

When a complete pair is enabled, the app displays one canonical kink with an ID derived from the shared pair key:

```ts
id: `pair:${pairKey}`
```

The canonical card keeps references to the source entries:

```ts
type PairedKinkItem = KinkItem & {
  id: `pair:${string}`;
  pairMode: true;
  pairKey: string;
  roleOptions: ['give', 'receive', 'both'];
  sourceIds: {
    give: string;
    receive: string;
  };
};
```

## Pairing Rules

A pair collapses into one visible kink only when all of these are true:

- both give and receive entries exist for the same `pairKey`
- both entries have `pairMode: true`
- one entry has `pairRole: 'give'`
- one entry has `pairRole: 'receive'`

If the pair is incomplete or disabled, entries remain normal cards.

The combined card should use neutral copy where possible:

- strip role suffixes such as `(Giving)`, `(Receiving)`, `(Dar)`, and `(Recibir)` from the display title
- use the give entry as the canonical source for title, description, category, tier, and intensity after stripping role suffixes
- fall back to the receive entry only if the give entry is missing a field
- merge tags without duplicating `give`, `giving`, `receive`, or `receiving` in the visible card metadata

## Card-By-Card Audit

We should not blindly enable every pair. Each card needs an audit pass.

Good give/receive candidates:

- directional acts: oral, restraint, impact, teasing, worship, toys, praise, degradation, collaring, leash play
- activities where one partner clearly performs and the other receives
- activities where role preference materially changes compatibility

Poor give/receive candidates:

- mutual/shared activities: shared bath, eye contact, mutual masturbation, candles, porn together
- games or environmental setup: strip card game, lighting, shower, playlist, conversation
- most scenario roleplay, unless the pair has stable directional roles that matter to matching

The admin tool should help this audit by showing pair candidates and their source entries side by side.

## Mobile Card UX

Use the inline segmented control selected during brainstorming:

```text
Give | Receive | Both
```

Behavior:

- show the segmented control only on paired cards
- default paired cards to `Both`
- retain the normal `Pass`, `Yes`, and `Maybe` vote actions
- when the user votes on a paired card, store the selected role preference with the vote
- if the user later changes the segment on an already voted paired card, update the stored role preference
- show the paired card once in the deck, browse, and matches

This keeps paired cards visually close to normal cards while giving role preference enough visibility that users understand what they are voting on.

## Vote Storage

Current votes are stored as `Record<cardId, VoteValue>`. Paired votes need role preference, so the new shape should support both legacy string values and richer records:

```ts
type VoteValue = 'yes' | 'maybe' | 'no';

type KinkVote =
  | VoteValue
  | {
      value: VoteValue;
      pairPreference?: 'give' | 'receive' | 'both';
    };
```

Because tester data can be wiped, no migration is required. Backward-compatible reads are still useful so older unpaired vote code and tests can be updated incrementally.

For paired cards:

- vote key is `pair:<pairKey>`
- `value` is `yes`, `maybe`, or `no`
- `pairPreference` is `give`, `receive`, or `both`

For unpaired cards:

- vote key remains the kink ID
- role preference is absent

## Match Rules

For unpaired cards, matching remains unchanged.

For paired cards, both vote value and role compatibility matter.

Role compatibility matrix:

| Mine | Partner | Compatible |
| --- | --- | --- |
| Give | Receive | yes |
| Receive | Give | yes |
| Both | Give | yes |
| Both | Receive | yes |
| Give | Both | yes |
| Receive | Both | yes |
| Both | Both | yes |
| Give | Give | no |
| Receive | Receive | no |

Vote bucket behavior:

- `Yes + compatible Yes` appears in Mutual Yes
- compatible `Yes`/`Maybe` combinations appear in the partial bucket
- compatible `Maybe`/`Maybe` appears in Mutual Maybe
- any `No` remains non-matching
- incompatible roles do not appear as matches even if both users voted yes

## Sync

Partner sync must include paired vote metadata.

The encrypted `vote.upsert` payload should include role preference when present:

```ts
{
  eventType: 'vote.upsert',
  cardId: 'pair:oral-pleasure',
  vote: 'yes',
  pairPreference: 'give',
  updatedAt: number
}
```

Partner vote storage must preserve `pairPreference`, and match computation must use it for paired cards.

## Admin Tool

The admin kink editor should add:

- `Pair mode enabled` checkbox
- `Pair key` text field
- `Pair role` select: blank, `give`, `receive`
- paired card preview title
- visible badge in list cards for paired entries, for example `Pair: oral-pleasure / give`

The admin should also support an audit workflow:

- filter or view for paired candidates
- group entries by `pairKey`
- show give and receive source entries together
- highlight incomplete or inconsistent pairs
- allow pair mode to be enabled or disabled per source entry

Saving through admin must preserve the new fields in both English and Spanish kink JSON as appropriate.

## Fresh Reset

Since current data is tester-only, implementation can include a complete reset plan.

Supabase relay reset:

- delete sync events
- delete couples
- delete pending and accepted partner invites
- delete partner metadata stored on those relay rows

Local tester reset:

- clear local votes
- clear partner synced votes
- clear sync event queue
- clear couple link
- clear vote sync local profile binding
- clear reveal consent
- clear any stale legacy partner-code storage

This reset is a testing/development step, not a production migration.

## Testing

Required tests:

- complete enabled pairs collapse into one visible card
- disabled pairs remain separate normal cards
- incomplete pairs remain separate normal cards
- paired vote stores value plus role preference
- unpaired vote behavior still works
- role compatibility matrix matches the table above, including Both/Both
- incompatible Give/Give and Receive/Receive do not match
- paired vote sync uploads, pulls, and applies `pairPreference`
- admin form renders and saves pair fields

Manual checks:

- paired card selector appears on deck cards
- selector does not appear on normal cards
- Matches shows combined paired cards once
- admin audit view makes it obvious which pairs are enabled, disabled, incomplete, or inconsistent

## Out Of Scope

- migrating old tester votes
- preserving old separate give/receive vote history
- real-time sync interval changes
- rewriting the entire kink dataset into a single canonical item format
