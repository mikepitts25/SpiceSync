# Couple Match Artwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every rendered `💑` glyph with the supplied SpiceSync pepper-heart artwork, while Insights shows the linked couple's real profile avatars and heart badge.

**Architecture:** Bundle the supplied PNG and expose it through a reusable `MatchCoupleIcon`. Extract Profiles' linked-avatar treatment into `CoupleAvatarPair`, then compose both through `InsightsCoupleMark` so linked Insights uses profile avatars and unlinked Insights uses the generic artwork. Stable achievement IDs select custom artwork so persisted legacy emoji values can never leak into rendered text.

**Tech Stack:** React Native 0.81, Expo 54, TypeScript 5.9, Zustand, `expo-linear-gradient`, `lucide-react-native`, Jest 29, React Native Testing Library.

## Global Constraints

- The `💑` glyph must never render in the app.
- The glyph may remain only in `src/constants/emojis.ts` as non-rendered legacy migration input.
- Preserve the uncommitted `barTrack` changes already present in both Insights files.
- Copy `/Users/mike/Downloads/Generated image 3.png` into the repository; never reference Downloads or `.codex/generated_images` at runtime.
- Do not fetch artwork over the network or add dependencies.
- Existing compatibility calculations, Insights copy, profile data, and achievement progress behavior remain unchanged.
- Run commands from `/Users/mike/AppIdeas/SpiceSync/apps/mobile` unless a step says otherwise.

---

### Task 1: Bundle and render the generic pepper-heart artwork

**Files:**
- Copy: `/Users/mike/Downloads/Generated image 3.png` → `apps/mobile/assets/match-couple-peppers.png`
- Create: `apps/mobile/components/MatchCoupleIcon.tsx`
- Create: `apps/mobile/__tests__/MatchCoupleIcon.test.tsx`

**Interfaces:**
- Consumes: bundled PNG at `../assets/match-couple-peppers.png`.
- Produces: `MatchCoupleIcon({ size?: number; accessibilityLabel?: string; testID?: string }): React.ReactElement`.

- [ ] **Step 1: Write the failing component test**

```tsx
import { render } from '@testing-library/react-native';

import MatchCoupleIcon from '../components/MatchCoupleIcon';

describe('MatchCoupleIcon', () => {
  it('renders bundled couple artwork with an accessible label', () => {
    const rendered = render(
      <MatchCoupleIcon
        size={40}
        accessibilityLabel="SpiceSync couple match"
        testID="match-couple-icon"
      />
    );

    expect(rendered.getByTestId('match-couple-icon')).toBeTruthy();
    expect(rendered.getByLabelText('SpiceSync couple match')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `npm test -- --runInBand __tests__/MatchCoupleIcon.test.tsx`

Expected: FAIL because `../components/MatchCoupleIcon` does not exist.

- [ ] **Step 3: Copy the approved source image into app assets**

Run from the repository root:

```bash
cp '/Users/mike/Downloads/Generated image 3.png' apps/mobile/assets/match-couple-peppers.png
sips -g pixelWidth -g pixelHeight -g format apps/mobile/assets/match-couple-peppers.png
```

Expected: `pixelWidth: 1254`, `pixelHeight: 1254`, and `format: png`.

- [ ] **Step 4: Implement the reusable image component**

```tsx
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { COLORS } from '../constants/theme';

type MatchCoupleIconProps = {
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
};

const MATCH_COUPLE_ARTWORK = require('../assets/match-couple-peppers.png');

export default function MatchCoupleIcon({
  size = 48,
  accessibilityLabel = 'Couple match',
  testID,
}: MatchCoupleIconProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Image
        source={MATCH_COUPLE_ARTWORK}
        resizeMode="cover"
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={{ width: size, height: size, transform: [{ scale: 1.15 }] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
  },
});
```

- [ ] **Step 5: Run the focused test**

Run: `npm test -- --runInBand __tests__/MatchCoupleIcon.test.tsx`

Expected: PASS, 1 test.

- [ ] **Step 6: Commit the generic artwork component**

```bash
git add assets/match-couple-peppers.png components/MatchCoupleIcon.tsx __tests__/MatchCoupleIcon.test.tsx
git commit -m "feat: add custom couple match artwork"
```

---

### Task 2: Extract the shared linked-couple avatar treatment

**Files:**
- Create: `apps/mobile/components/CoupleAvatarPair.tsx`
- Create: `apps/mobile/__tests__/CoupleAvatarPair.test.tsx`
- Modify: `apps/mobile/app/(tabs)/profiles.tsx:21-40, 223-253, 476-505`

**Interfaces:**
- Consumes: `ProfileAvatarIcon`, `COLORS`, `GRADIENTS`, `LinearGradient`, and `Heart`.
- Produces: `CoupleAvatarPair({ firstAvatar, secondAvatar, size?, accessibilityLabel?, testID? }): React.ReactElement`.

- [ ] **Step 1: Write the failing shared-pair test**

```tsx
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('lucide-react-native', () => ({ Heart: 'Heart' }));

import { render } from '@testing-library/react-native';
import CoupleAvatarPair from '../components/CoupleAvatarPair';

describe('CoupleAvatarPair', () => {
  it('renders both profile avatars with one heart badge', () => {
    const rendered = render(
      <CoupleAvatarPair
        firstAvatar="flame"
        secondAvatar="rose"
        size={64}
        testID="active-couple"
      />
    );

    expect(rendered.getByTestId('active-couple-first-avatar')).toBeTruthy();
    expect(rendered.getByTestId('active-couple-second-avatar')).toBeTruthy();
    expect(rendered.getByTestId('active-couple-heart')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and verify the component is missing**

Run: `npm test -- --runInBand __tests__/CoupleAvatarPair.test.tsx`

Expected: FAIL because `../components/CoupleAvatarPair` does not exist.

- [ ] **Step 3: Implement the scalable shared component**

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';

import { COLORS, GRADIENTS } from '../constants/theme';
import ProfileAvatarIcon from './ProfileAvatarIcon';

type CoupleAvatarPairProps = {
  firstAvatar?: string | null;
  secondAvatar?: string | null;
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
};

export default function CoupleAvatarPair({
  firstAvatar,
  secondAvatar,
  size = 64,
  accessibilityLabel = 'Active couple',
  testID = 'couple-avatar-pair',
}: CoupleAvatarPairProps) {
  const overlap = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.81);
  const heartSize = Math.round(size * 0.41);
  const heartLeft = size - overlap / 2 - heartSize / 2;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.pair, { width: size * 2 - overlap, height: size }]}
    >
      <LinearGradient
        testID={`${testID}-first-avatar`}
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <ProfileAvatarIcon avatar={firstAvatar} size={iconSize} framed={false} />
      </LinearGradient>
      <LinearGradient
        testID={`${testID}-second-avatar`}
        colors={['#60A5FA', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, marginLeft: -overlap, zIndex: 0 },
        ]}
      >
        <ProfileAvatarIcon avatar={secondAvatar} size={iconSize} framed={false} />
      </LinearGradient>
      <View
        testID={`${testID}-heart`}
        style={[
          styles.heart,
          {
            left: heartLeft,
            top: (size - heartSize) / 2,
            width: heartSize,
            height: heartSize,
            borderRadius: heartSize / 2,
          },
        ]}
      >
        <Heart
          size={Math.round(heartSize * 0.54)}
          color={COLORS.textPrimary}
          fill={COLORS.textPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  avatar: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  heart: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --runInBand __tests__/CoupleAvatarPair.test.tsx`

Expected: PASS, 1 test.

- [ ] **Step 5: Replace Profiles' duplicated avatar markup**

Add `import CoupleAvatarPair from '../../components/CoupleAvatarPair';`. Keep `PARTNER_AVATAR_SIZE = 64`; remove the other `PARTNER_*` geometry constants. Replace `styles.partnerAvatars` and its children with:

```tsx
<CoupleAvatarPair
  firstAvatar={activeProfile?.emoji}
  secondAvatar={partnerAvatar}
  size={PARTNER_AVATAR_SIZE}
  accessibilityLabel={`${myName} and ${partnerName}`}
  testID="profiles-active-couple"
/>
```

Delete the unused `partnerAvatars`, `partnerAvatarCircle`, `partnerAvatarRight`, and `partnerHeartBadge` styles. Keep `Heart` because other Profiles UI still uses it.

- [ ] **Step 6: Run component and profile consistency tests**

Run: `npm test -- --runInBand __tests__/CoupleAvatarPair.test.tsx __tests__/active-profile-store-consistency.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the extraction**

```bash
git add components/CoupleAvatarPair.tsx __tests__/CoupleAvatarPair.test.tsx 'app/(tabs)/profiles.tsx'
git commit -m "refactor: share linked couple avatar treatment"
```

---

### Task 3: Personalize both Insights score cards

**Files:**
- Create: `apps/mobile/components/InsightsCoupleMark.tsx`
- Create: `apps/mobile/__tests__/InsightsCoupleMark.test.tsx`
- Modify: `apps/mobile/app/(insights)/index.tsx:1-40, 126-131, 270-273`
- Modify: `apps/mobile/app/(about)/InsightsScreen.tsx:1-75, 169-174, 294-297`

**Interfaces:**
- Consumes: `CoupleAvatarPair` and `MatchCoupleIcon`.
- Produces: `InsightsCoupleMark({ linked, activeAvatar, partnerAvatar, size? }): React.ReactElement`.

- [ ] **Step 1: Write failing linked and fallback tests**

```tsx
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('lucide-react-native', () => ({ Heart: 'Heart' }));

import { render } from '@testing-library/react-native';
import InsightsCoupleMark from '../components/InsightsCoupleMark';

describe('InsightsCoupleMark', () => {
  it('shows the real avatar pair for an active link', () => {
    const rendered = render(
      <InsightsCoupleMark linked activeAvatar="flame" partnerAvatar="rose" />
    );
    expect(rendered.getByTestId('insights-couple-pair')).toBeTruthy();
    expect(rendered.queryByTestId('insights-couple-artwork')).toBeNull();
  });

  it('shows generic artwork when no partner is linked', () => {
    const rendered = render(
      <InsightsCoupleMark linked={false} activeAvatar="flame" partnerAvatar={null} />
    );
    expect(rendered.getByTestId('insights-couple-artwork')).toBeTruthy();
    expect(rendered.queryByTestId('insights-couple-pair')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `npm test -- --runInBand __tests__/InsightsCoupleMark.test.tsx`

Expected: FAIL because `../components/InsightsCoupleMark` does not exist.

- [ ] **Step 3: Implement the linked-versus-fallback component**

```tsx
import React from 'react';
import CoupleAvatarPair from './CoupleAvatarPair';
import MatchCoupleIcon from './MatchCoupleIcon';

type InsightsCoupleMarkProps = {
  linked: boolean;
  activeAvatar?: string | null;
  partnerAvatar?: string | null;
  size?: number;
};

export default function InsightsCoupleMark({
  linked,
  activeAvatar,
  partnerAvatar,
  size = 64,
}: InsightsCoupleMarkProps) {
  if (!linked) {
    return (
      <MatchCoupleIcon
        size={size}
        accessibilityLabel="Couple match"
        testID="insights-couple-artwork"
      />
    );
  }

  return (
    <CoupleAvatarPair
      firstAvatar={activeAvatar}
      secondAvatar={partnerAvatar}
      size={size}
      accessibilityLabel="Active couple"
      testID="insights-couple-pair"
    />
  );
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --runInBand __tests__/InsightsCoupleMark.test.tsx`

Expected: PASS, 2 tests.

- [ ] **Step 5: Integrate state and markup into both Insights routes**

In each Insights file import `InsightsCoupleMark` and `useCoupleLinkStore`, then add:

```tsx
const activeProfile = useProfilesStore((state) => state.getActiveProfile());
const coupleLink = useCoupleLinkStore((state) =>
  state.link?.status === 'active' ? state.link : null
);
```

Replace the score emoji with:

```tsx
<View style={styles.scoreMark}>
  <InsightsCoupleMark
    linked={Boolean(coupleLink)}
    activeAvatar={activeProfile?.emoji}
    partnerAvatar={coupleLink?.partnerProfileAvatar}
  />
</View>
```

Replace `scoreEmoji` with `scoreMark: { marginBottom: SIZES.padding }`. Do not alter either existing `barTrack` wrapper/style.

- [ ] **Step 6: Run focused and store-consistency tests**

Run: `npm test -- --runInBand __tests__/InsightsCoupleMark.test.tsx __tests__/active-profile-store-consistency.test.ts`

Expected: PASS.

- [ ] **Step 7: Review the overlapping user-owned Insights diff without staging it**

Run from the repository root:

```bash
git diff -- 'apps/mobile/app/(insights)/index.tsx' 'apps/mobile/app/(about)/InsightsScreen.tsx'
```

Expected: the pre-existing `barTrack` changes and new couple-mark changes are both present. Leave these two files unstaged so the user's earlier hunks are not accidentally committed as Codex-owned work.

---

### Task 4: Replace loading and achievement glyphs and prevent regressions

**Files:**
- Create: `apps/mobile/__tests__/couple-match-glyph-regression.test.ts`
- Modify: `apps/mobile/app/index.tsx:2-50`
- Modify: `apps/mobile/src/stores/achievements.ts:1-220`
- Modify: `apps/mobile/app/(about)/AchievementsScreen.tsx:1-140`

**Interfaces:**
- Consumes: `MatchCoupleIcon`.
- Produces: `usesMatchCoupleArtwork(achievementId: string): boolean`.

- [ ] **Step 1: Write the failing source regression test**

```ts
import fs from 'fs';
import path from 'path';

const mobileRoot = path.resolve(__dirname, '..');
const sourceRoots = ['app', 'components', 'constants', 'lib', 'src'];
const legacyGlyph = String.fromCodePoint(0x1f491);

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  });
}

describe('legacy couple glyph', () => {
  it('exists only in the non-rendered profile avatar migration list', () => {
    const occurrences = sourceRoots
      .flatMap((root) => collectSourceFiles(path.join(mobileRoot, root)))
      .flatMap((filePath) =>
        fs
          .readFileSync(filePath, 'utf8')
          .split('\n')
          .map((line) => ({ filePath, line }))
          .filter(({ line }) => line.includes(legacyGlyph))
      );

    expect(occurrences).toHaveLength(1);
    expect(path.relative(mobileRoot, occurrences[0].filePath)).toBe(
      path.join('src', 'constants', 'emojis.ts')
    );
    expect(occurrences[0].line).toContain('legacy:');
  });
});
```

- [ ] **Step 2: Run the guard and verify it finds current rendered glyphs**

Run: `npm test -- --runInBand __tests__/couple-match-glyph-regression.test.ts`

Expected: FAIL because the glyph still appears outside the legacy migration list.

- [ ] **Step 3: Replace the entry loading glyph**

Import `MatchCoupleIcon`, replace the glyph with:

```tsx
<View style={styles.coupleIcon}>
  <MatchCoupleIcon size={64} accessibilityLabel="SpiceSync couple match" />
</View>
```

Replace `emoji` with `coupleIcon: { marginBottom: 16 }` in the stylesheet.

- [ ] **Step 4: Make achievement artwork selection independent of persisted emoji text**

Replace both old-glyph definitions in `src/stores/achievements.ts` with `emoji: '💕'`, then export:

```ts
const MATCH_COUPLE_ARTWORK_ACHIEVEMENT_IDS = new Set([
  'matches-50',
  'partner-connected',
]);

export function usesMatchCoupleArtwork(achievementId: string): boolean {
  return MATCH_COUPLE_ARTWORK_ACHIEVEMENT_IDS.has(achievementId);
}
```

- [ ] **Step 5: Render custom artwork for those achievement IDs**

Import `MatchCoupleIcon` and `usesMatchCoupleArtwork` into `app/(about)/AchievementsScreen.tsx`, then replace the unlocked icon body with:

```tsx
{achievement.unlocked ? (
  usesMatchCoupleArtwork(achievement.id) ? (
    <MatchCoupleIcon
      size={36}
      accessibilityLabel={`${achievement.title} achievement`}
    />
  ) : (
    <Text style={styles.achievementIconText}>{achievement.emoji}</Text>
  )
) : (
  <Text style={styles.achievementIconText}>🔒</Text>
)}
```

Add `achievementIconText: { fontSize: 28 }` to the stylesheet.

- [ ] **Step 6: Run regression and focused component tests**

Run:

```bash
npm test -- --runInBand \
  __tests__/couple-match-glyph-regression.test.ts \
  __tests__/MatchCoupleIcon.test.tsx \
  __tests__/CoupleAvatarPair.test.tsx \
  __tests__/InsightsCoupleMark.test.tsx
```

Expected: PASS, with exactly one allowed legacy occurrence.

- [ ] **Step 7: Commit loading, achievement, and guard changes**

```bash
git add app/index.tsx src/stores/achievements.ts 'app/(about)/AchievementsScreen.tsx' __tests__/couple-match-glyph-regression.test.ts
git commit -m "fix: remove rendered legacy couple emoji"
```

---

### Task 5: Full verification and visual review

**Files:**
- Verify all files changed in Tasks 1-4.
- Do not edit the supplied artwork during verification.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: verified mobile source with no rendered legacy couple glyph.

- [ ] **Step 1: Format only touched TypeScript files**

Run:

```bash
npx prettier --write \
  components/MatchCoupleIcon.tsx \
  components/CoupleAvatarPair.tsx \
  components/InsightsCoupleMark.tsx \
  __tests__/MatchCoupleIcon.test.tsx \
  __tests__/CoupleAvatarPair.test.tsx \
  __tests__/InsightsCoupleMark.test.tsx \
  __tests__/couple-match-glyph-regression.test.ts \
  app/index.tsx \
  'app/(tabs)/profiles.tsx' \
  'app/(insights)/index.tsx' \
  'app/(about)/InsightsScreen.tsx' \
  'app/(about)/AchievementsScreen.tsx' \
  src/stores/achievements.ts
```

Expected: all touched TypeScript files format successfully and the PNG is unchanged.

- [ ] **Step 2: Run focused tests and the complete suite**

```bash
npm test -- --runInBand \
  __tests__/MatchCoupleIcon.test.tsx \
  __tests__/CoupleAvatarPair.test.tsx \
  __tests__/InsightsCoupleMark.test.tsx \
  __tests__/couple-match-glyph-regression.test.ts \
  __tests__/active-profile-store-consistency.test.ts
npm test -- --runInBand
```

Expected: all focused tests and the complete suite pass.

- [ ] **Step 3: Run TypeScript and lint checks**

Run:

```bash
npx tsc --noEmit
npx eslint \
  components/MatchCoupleIcon.tsx \
  components/CoupleAvatarPair.tsx \
  components/InsightsCoupleMark.tsx \
  __tests__/MatchCoupleIcon.test.tsx \
  __tests__/CoupleAvatarPair.test.tsx \
  __tests__/InsightsCoupleMark.test.tsx \
  __tests__/couple-match-glyph-regression.test.ts \
  app/index.tsx \
  'app/(tabs)/profiles.tsx' \
  'app/(insights)/index.tsx' \
  'app/(about)/InsightsScreen.tsx' \
  'app/(about)/AchievementsScreen.tsx' \
  src/stores/achievements.ts
```

Expected: both commands exit 0.

- [ ] **Step 4: Prove the old glyph is migration-only**

Run from the repository root:

```bash
rg -n '💑' apps/mobile/app apps/mobile/components apps/mobile/constants apps/mobile/lib apps/mobile/src
```

Expected: exactly one result: the `legacy:` array in `apps/mobile/src/constants/emojis.ts`.

- [ ] **Step 5: Inspect the asset and final diff**

Run from the repository root:

```bash
sips -g pixelWidth -g pixelHeight -g format -g hasAlpha apps/mobile/assets/match-couple-peppers.png
git diff --check
git status --short
git diff -- 'apps/mobile/app/(insights)/index.tsx' 'apps/mobile/app/(about)/InsightsScreen.tsx'
```

Expected: a 1254×1254 PNG, clean whitespace, preserved `barTrack` changes, and new `InsightsCoupleMark` changes.

- [ ] **Step 6: Visually inspect required states**

Launch with `npm run ios` or the available Expo simulator. Verify entry/loading artwork, linked and unlinked Insights states, unlocked legacy About achievements, and the Profiles partner card. Confirm the PNG has no visible square edge at 36, 48, or 64 points.

- [ ] **Step 7: Handle final staging safely**

Commit formatter-only changes only for files already owned by Tasks 1, 2, and 4. Leave both Insights files unstaged unless the user explicitly authorizes including their pre-existing `barTrack` hunks.
