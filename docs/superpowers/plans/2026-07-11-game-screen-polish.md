# Game Screen Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the pre-game setup and active gameplay screens into one responsive, professional, and playful game-night lounge experience without changing game behavior.

**Architecture:** Keep `app/(game)/index.tsx` as the sole owner of game state, persistence, roulette, timer, and consequences. Move display-only controls into focused components under `components/game/`; each component receives values and callbacks and contains no game rules or persistence. Protect the extraction with renderer tests and retain the existing source-level behavior tests for the route.

**Tech Stack:** React 19, React Native 0.81, Expo 54, Expo Router, `expo-linear-gradient`, `lucide-react-native`, TypeScript 5.9, Jest 29, `react-test-renderer`.

## Global Constraints

- Preserve all existing rules, state transitions, persistence, translations, sounds, and navigation.
- Do not introduce new modes, settings, assets, data models, or dependencies.
- Use deep wine and layered burgundy surfaces; pink is primary and orange is limited to accent gradients.
- Reserve glow for primary actions, active selections, the matchup arrow, and short reveal moments.
- Keep every game-screen pressable and input target at least 44 points tall and wide.
- Preserve React Native system font scaling; multiline challenge and explanatory copy must grow vertically instead of being clipped.
- Preserve accessibility roles, labels, selected states, disabled states, and existing sound cues.
- English and Spanish labels, challenge copy, and 24-character player names must render predictably.
- Verify on iPhone 17 Pro Max and one smaller iPhone simulator.

## File Map

- Create `apps/mobile/components/game/GameControls.tsx`: local visual tokens and reusable surface, pill, segmented-control, and button primitives.
- Create `apps/mobile/components/game/GameSetupPanel.tsx`: complete pre-game hero, setup form, options, and start actions.
- Create `apps/mobile/components/game/GameSessionChrome.tsx`: active session header and player-to-target matchup.
- Create `apps/mobile/components/game/GameRoundPanel.tsx`: ready/spinning/revealed card presentation, timer, and round outcome actions.
- Modify `apps/mobile/app/(game)/index.tsx`: retain state and callbacks; compose the new presentational components and delete migrated styles.
- Create `apps/mobile/__tests__/game-screen-components.test.tsx`: renderer coverage for visual primitives, setup interactions, long names, Spanish copy, timer states, and outcomes.
- Modify `apps/mobile/__tests__/game-hub-transition-animation.test.ts`: update structure assertions after extraction while continuing to protect game behavior.

---

### Task 1: Game-Screen Visual Primitives

**Files:**
- Create: `apps/mobile/components/game/GameControls.tsx`
- Create: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: `COLORS`, `GRADIENTS`, `RADII`, and `SHADOWS` from `constants/theme`.
- Produces: `GameSurface`, `GamePill`, `GameSegmentedControl<T>`, `GameButton`, and `GAME_CONTROL_MIN_SIZE`.

- [ ] **Step 1: Write failing tests for the shared visual contract**

Create `apps/mobile/__tests__/game-screen-components.test.tsx` with the test harness and first assertions:

```tsx
import React from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import TestRenderer from 'react-test-renderer';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

const {
  GAME_CONTROL_MIN_SIZE,
  GameButton,
  GameSegmentedControl,
} = require('../components/game/GameControls');

function flattenedPressableStyle(node: TestRenderer.ReactTestInstance) {
  const value =
    typeof node.props.style === 'function'
      ? node.props.style({ pressed: false })
      : node.props.style;
  return StyleSheet.flatten(value);
}

describe('game-screen presentation components', () => {
  it('keeps buttons and segmented options at least 44 points tall', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <>
          <GameButton label="Start Game" onPress={jest.fn()} />
          <GameSegmentedControl
            accessibilityLabel="Card language"
            value="en"
            options={[
              { value: 'en', label: 'EN' },
              { value: 'es', label: 'ES' },
            ]}
            onChange={jest.fn()}
          />
        </>
      );
    });

    const controls = tree!.root.findAllByType(Pressable);
    expect(GAME_CONTROL_MIN_SIZE).toBe(44);
    controls.forEach((control) => {
      expect(flattenedPressableStyle(control).minHeight).toBeGreaterThanOrEqual(
        GAME_CONTROL_MIN_SIZE
      );
    });
  });

  it('reports selected state and forwards segmented changes', () => {
    const onChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <GameSegmentedControl
          accessibilityLabel="Card language"
          value="en"
          options={[
            { value: 'en', label: 'EN' },
            { value: 'es', label: 'ES' },
          ]}
          onChange={onChange}
        />
      );
    });

    const spanish = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Card language: ES'
    );
    expect(spanish.props.accessibilityState).toEqual({ selected: false });
    TestRenderer.act(() => spanish.props.onPress());
    expect(onChange).toHaveBeenCalledWith('es');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: FAIL with `Cannot find module '../components/game/GameControls'`.

- [ ] **Step 3: Implement the reusable controls**

Create `apps/mobile/components/game/GameControls.tsx`:

```tsx
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

export const GAME_CONTROL_MIN_SIZE = 44;

export function GameSurface({
  children,
  style,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  return (
    <View style={[styles.surface, elevated && styles.surfaceElevated, style]}>
      {children}
    </View>
  );
}

export function GamePill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'warning';
}) {
  return (
    <View style={[styles.pill, styles[`pill_${tone}`]]}>
      <Text style={[styles.pillText, styles[`pillText_${tone}`]]}>{label}</Text>
    </View>
  );
}

export type GameSegmentOption<T extends string> = {
  value: T;
  label: string;
};

export function GameSegmentedControl<T extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
}: {
  accessibilityLabel: string;
  value: T;
  options: readonly GameSegmentOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel}: ${option.label}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segmentOption,
              selected && styles.segmentOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GameButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const content = (
    <>
      {icon}
      <Text
        style={[
          styles.buttonText,
          variant !== 'primary' && styles.buttonTextSecondary,
        ]}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonPress,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.buttonBody}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.buttonBody,
            styles.buttonSecondary,
            variant === 'danger' && styles.buttonDanger,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.085)',
    backgroundColor: COLORS.cardAlt,
  },
  surfaceElevated: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...SHADOWS.card,
  },
  pill: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pill_neutral: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pill_accent: {
    borderColor: 'rgba(255,45,146,0.36)',
    backgroundColor: 'rgba(255,45,146,0.16)',
  },
  pill_warning: {
    borderColor: 'rgba(245,158,11,0.36)',
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  pillText: { fontSize: 16, fontWeight: '800' },
  pillText_neutral: { color: COLORS.textSub },
  pillText_accent: { color: COLORS.pink },
  pillText_warning: { color: COLORS.maybe },
  segmented: {
    minHeight: GAME_CONTROL_MIN_SIZE,
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  segmentOption: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  segmentOptionSelected: { backgroundColor: 'rgba(255,45,146,0.24)' },
  segmentText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '900' },
  segmentTextSelected: { color: COLORS.textPrimary },
  buttonPress: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  buttonBody: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    borderRadius: RADII.pill,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  buttonDanger: {
    borderColor: 'rgba(239,68,68,0.28)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  buttonText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  buttonTextSecondary: { color: COLORS.textSub },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.42 },
});
```

- [ ] **Step 4: Run the primitive tests and type-check the new component**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
npx tsc --noEmit
```

Expected: the two Jest tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the primitives**

```bash
git add apps/mobile/components/game/GameControls.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Add game screen visual primitives"
```

---

### Task 2: Polished Pre-Game Setup

**Files:**
- Create: `apps/mobile/components/game/GameSetupPanel.tsx`
- Modify: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: `GameSurface`, `GameSegmentedControl`, and `GameButton` from Task 1; `GameCustomDeckMode` from `lib/gameDeck`; `GameCardDisplayLanguage` from `data/gameCardTranslations`.
- Produces: `GameSetupPanel` and `GameSetupMode` with all state supplied through props.

- [ ] **Step 1: Add failing setup interaction and accessibility tests**

Append imports and a helper fixture to `game-screen-components.test.tsx`, then add this test:

```tsx
const { GameSetupPanel } = require('../components/game/GameSetupPanel');

function setupProps() {
  return {
    gameNightLabel: 'GAME NIGHT',
    introTitle: 'Pick your vibe',
    introBody: '120 cards ready for Normal mode.',
    badgeLabels: ['TRUTH', 'DARE', 'CHALLENGE'],
    mode: 'normal',
    modeOptions: [
      { value: 'normal', label: 'Normal' },
      { value: 'intense', label: 'Intense' },
    ],
    onModeChange: jest.fn(),
    intenseDisclaimer: undefined,
    playerCount: 2,
    playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    onPlayerCountChange: jest.fn(),
    onPlayerNameChange: jest.fn(),
    drinkingMode: false,
    onDrinkingModeChange: jest.fn(),
    cardLanguage: 'en',
    onCardLanguageChange: jest.fn(),
    customCardsAvailable: true,
    customDeckMode: 'include',
    onCustomDeckModeChange: jest.fn(),
    onOpenCustomDeck: jest.fn(),
    startLabel: 'Start Playing',
    onStart: jest.fn(),
    startDisabled: false,
  };
}

it('groups setup controls and forwards player, language, deck, and start actions', () => {
  const props = setupProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<GameSetupPanel {...props} />);
  });

  const playerFour = tree!.root.find(
    (node) => node.props.accessibilityLabel === '4 players'
  );
  TestRenderer.act(() => playerFour.props.onPress());
  expect(props.onPlayerCountChange).toHaveBeenCalledWith(4);

  const firstName = tree!.root.findAllByType(TextInput)[0];
  TestRenderer.act(() => firstName.props.onChangeText('Alexandria-Montgomery-24'));
  expect(props.onPlayerNameChange).toHaveBeenCalledWith(
    0,
    'Alexandria-Montgomery-24'
  );

  const spanish = tree!.root.find(
    (node) => node.props.accessibilityLabel === 'Card language: ES'
  );
  TestRenderer.act(() => spanish.props.onPress());
  expect(props.onCardLanguageChange).toHaveBeenCalledWith('es');

  const start = tree!.root.find(
    (node) => node.props.accessibilityLabel === 'Start Playing'
  );
  TestRenderer.act(() => start.props.onPress());
  expect(props.onStart).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the setup test and verify it fails**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
```

Expected: FAIL with `Cannot find module '../components/game/GameSetupPanel'`.

- [ ] **Step 3: Implement `GameSetupPanel`**

Create `apps/mobile/components/game/GameSetupPanel.tsx`. The component must:

```tsx
export type GameSetupMode = 'normal' | 'intense';

export type GameSetupPanelProps = {
  gameNightLabel: string;
  introTitle: string;
  introBody: string;
  badgeLabels: string[];
  mode: GameSetupMode;
  modeOptions: readonly GameSegmentOption<GameSetupMode>[];
  onModeChange: (mode: GameSetupMode) => void;
  intenseDisclaimer?: string;
  playerCount: number;
  playerNames: string[];
  onPlayerCountChange: (count: number) => void;
  onPlayerNameChange: (index: number, name: string) => void;
  drinkingMode: boolean;
  onDrinkingModeChange: (value: boolean) => void;
  cardLanguage: GameCardDisplayLanguage;
  onCardLanguageChange: (language: GameCardDisplayLanguage) => void;
  customCardsAvailable: boolean;
  customDeckMode: GameCustomDeckMode;
  onCustomDeckModeChange: (mode: GameCustomDeckMode) => void;
  onOpenCustomDeck: () => void;
  startLabel: string;
  onStart: () => void;
  startDisabled: boolean;
};
```

Use a vertical `ScrollView` whose `contentContainerStyle` has `paddingBottom: 18` and no fixed height. Render, in order:

```tsx
<View style={styles.hero}>
  <Text style={styles.eyebrow}>{gameNightLabel}</Text>
  <GameSegmentedControl
    accessibilityLabel="Game mode"
    value={mode}
    options={modeOptions}
    onChange={onModeChange}
  />
  {intenseDisclaimer ? (
    <Text style={styles.disclaimer}>{intenseDisclaimer}</Text>
  ) : null}
</View>

<GameSurface elevated style={styles.setupCard}>
  <CardAccentTop />
  <View style={styles.setupInner}>
    <View style={styles.badges}>
      {badgeLabels.map((label) => <GamePill key={label} label={label} />)}
    </View>
    <Text style={styles.title}>{introTitle}</Text>
    <Text style={styles.body}>{introBody}</Text>
    <Text style={styles.sectionLabel}>Number of Players</Text>
    <View style={styles.playerCountRow}>
      {[2, 3, 4].map((count) => (
        <Pressable
          key={count}
          accessibilityRole="button"
          accessibilityLabel={`${count} players`}
          accessibilityState={{ selected: playerCount === count }}
          onPress={() => onPlayerCountChange(count)}
          style={[styles.playerCount, playerCount === count && styles.playerCountActive]}
        >
          <Text style={styles.playerCountText}>{count}</Text>
        </Pressable>
      ))}
    </View>
    <View style={styles.nameGrid}>
      {playerNames.slice(0, playerCount).map((name, index) => (
        <TextInput
          key={index}
          accessibilityLabel={`Player ${index + 1} name`}
          value={name}
          onChangeText={(value) => onPlayerNameChange(index, value)}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          style={styles.nameInput}
        />
      ))}
    </View>
    <View style={styles.optionRow}>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>Drinking game</Text>
        <Text style={styles.optionBody}>Adds drinks and shots to pass consequences.</Text>
      </View>
      <Switch
        accessibilityLabel="Drinking game"
        value={drinkingMode}
        onValueChange={onDrinkingModeChange}
        trackColor={{ false: 'rgba(255,255,255,0.14)', true: 'rgba(255,47,146,0.55)' }}
        thumbColor={COLORS.textPrimary}
      />
    </View>
    <View style={styles.languageRow}>
      <Text style={styles.sectionLabel}>Card Language</Text>
      <GameSegmentedControl
        accessibilityLabel="Card language"
        value={cardLanguage}
        options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]}
        onChange={onCardLanguageChange}
      />
    </View>
    {customCardsAvailable ? (
      <View style={styles.languageRow}>
        <Text style={styles.sectionLabel}>Deck Mix</Text>
        <GameSegmentedControl
          accessibilityLabel="Deck mix"
          value={customDeckMode}
          options={[
            { value: 'include', label: 'Include Custom' },
            { value: 'customOnly', label: 'Custom Only' },
          ]}
          onChange={onCustomDeckModeChange}
        />
      </View>
    ) : null}
    <GameButton
      label="Custom Deck"
      variant="secondary"
      icon={<PlusCircle size={18} color={COLORS.pink} />}
      onPress={onOpenCustomDeck}
    />
    <GameButton
      label={startLabel}
      icon={<Play size={20} color={COLORS.textPrimary} fill="white" />}
      onPress={onStart}
      disabled={startDisabled}
    />
  </View>
</GameSurface>
```

Define local styles with these non-negotiable values: `setupCard.overflow = 'hidden'`, `setupInner.paddingHorizontal = 20`, `setupInner.paddingVertical = 20`, `setupInner.gap = 14`, `title.fontSize = 32`, `body.fontSize = 17`, `body.lineHeight = 24`, every `playerCount` is `minWidth: 52, minHeight: 44`, every `nameInput` has `minHeight: 48`, and `optionRow.minHeight = 56`. Use `COLORS.card`, `COLORS.cardAlt`, `COLORS.textPrimary`, `COLORS.textSub`, `COLORS.textMuted`, and translucent pink fills; do not add new hex colors.

- [ ] **Step 4: Run setup tests and type-check**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
npx tsc --noEmit
```

Expected: all game-screen component tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the setup component**

```bash
git add apps/mobile/components/game/GameSetupPanel.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Build polished game setup panel"
```

---

### Task 3: Session Header and Player Matchup

**Files:**
- Create: `apps/mobile/components/game/GameSessionChrome.tsx`
- Modify: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: `GameSurface`, `GamePill`, `GameButton`, `GRADIENTS`, and existing display strings.
- Produces: `GameSessionHeader` and `GamePlayerMatchup`.

- [ ] **Step 1: Add failing header and long-name matchup tests**

Append:

```tsx
const {
  GamePlayerMatchup,
  GameSessionHeader,
} = require('../components/game/GameSessionChrome');

it('renders a stable Spanish session header with optional drinking status', () => {
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <GameSessionHeader
        gameNightLabel="NOCHE DE JUEGO"
        modeLabel="Intenso"
        drinkingLabel="Bebiendo"
        endGameLabel="Terminar juego"
        onEndGame={jest.fn()}
      />
    );
  });
  expect(tree!.root.findByProps({ children: 'Bebiendo' })).toBeDefined();
  expect(
    tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Terminar juego'
    )
  ).toBeDefined();
});

it('keeps 24-character player names in one bounded matchup row', () => {
  const longName = 'Alexandria-Montgomery-24';
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <GamePlayerMatchup
        playerLabel="PLAYER UP"
        playerName={longName}
        targetLabel="TARGET"
        targetName={longName}
      />
    );
  });
  const names = tree!.root.findAllByProps({ children: longName });
  expect(names).toHaveLength(2);
  names.forEach((name) => {
    expect(name.props.numberOfLines).toBe(1);
    expect(name.props.adjustsFontSizeToFit).toBe(true);
    expect(name.props.minimumFontScale).toBe(0.72);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run `cd apps/mobile && npm test -- --runInBand __tests__/game-screen-components.test.tsx`.

Expected: FAIL with `Cannot find module '../components/game/GameSessionChrome'`.

- [ ] **Step 3: Implement the session chrome**

Create `apps/mobile/components/game/GameSessionChrome.tsx` with:

```tsx
export function GameSessionHeader({
  gameNightLabel,
  modeLabel,
  drinkingLabel,
  endGameLabel,
  onEndGame,
}: {
  gameNightLabel: string;
  modeLabel: string;
  drinkingLabel?: string;
  endGameLabel: string;
  onEndGame: () => void;
}) {
  return (
    <GameSurface style={styles.header}>
      <View style={styles.headerZone}>
        <Text numberOfLines={1} style={styles.eyebrow}>{gameNightLabel}</Text>
        <Text numberOfLines={1} style={styles.mode}>{modeLabel}</Text>
      </View>
      <View style={[styles.headerZone, styles.headerCenter]}>
        {drinkingLabel ? <GamePill label={drinkingLabel} tone="accent" /> : null}
      </View>
      <View style={[styles.headerZone, styles.headerAction]}>
        <GameButton label={endGameLabel} variant="secondary" onPress={onEndGame} />
      </View>
    </GameSurface>
  );
}

export function GamePlayerMatchup({
  playerLabel,
  playerName,
  targetLabel,
  targetName,
}: {
  playerLabel: string;
  playerName: string;
  targetLabel: string;
  targetName: string;
}) {
  const person = (label: string, name: string, target: boolean) => (
    <View style={[styles.person, target ? styles.target : styles.player]}>
      <Text style={[styles.role, target && styles.targetText]}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[styles.name, target && styles.targetText]}
      >
        {name}
      </Text>
    </View>
  );
  return (
    <GameSurface style={styles.matchup}>
      {person(playerLabel, playerName, false)}
      <LinearGradient colors={GRADIENTS.primary} style={styles.arrow}>
        <ArrowRight size={28} color={COLORS.textPrimary} strokeWidth={3} />
      </LinearGradient>
      {person(targetLabel, targetName, true)}
    </GameSurface>
  );
}
```

The local styles must use a three-zone `header` row with `gap: 8`, each `headerZone` set to `flex: 1, minWidth: 0`, center/action alignment as in the approved spec, and a 44-point minimum height for the End Game button. The matchup must be a single row; each person card uses `flex: 1, minWidth: 0, minHeight: 92`, the arrow is `52x52`, and target text is right aligned. Use `rgba(255,45,146,0.14)` for the player surface and `rgba(65,92,120,0.18)` for the target surface.

- [ ] **Step 4: Run tests and type-check**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx
npx tsc --noEmit
```

Expected: all component tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the session chrome**

```bash
git add apps/mobile/components/game/GameSessionChrome.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Add polished game session chrome"
```

---

### Task 4: Challenge, Timer, and Outcome Presentation

**Files:**
- Create: `apps/mobile/components/game/GameRoundPanel.tsx`
- Modify: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: display strings, countdown values, callbacks, `GameCardDisplayLanguage`, `GameSegmentedControl`, `GameSurface`, `AccentBar`, and `CardAccentTop`.
- Produces: `GameRoundPanel`, `GameRoundPhase`, and `GameTimerDisplay`.

- [ ] **Step 1: Add failing revealed, untimed, urgent, and outcome tests**

Add a `roundProps()` fixture with ready/spinning/revealed copy and append:

```tsx
const { GameRoundPanel } = require('../components/game/GameRoundPanel');

function roundProps() {
  return {
    phase: 'revealed',
    language: 'en',
    onLanguageChange: jest.fn(),
    drawDisabled: false,
    onDraw: jest.fn(),
    mysteryLabel: 'Mystery card',
    drawLabel: 'Tap to Spin',
    hiddenBody: 'The next card stays hidden until the roulette lands.',
    spinningLabel: 'Roulette is spinning',
    spinningTitle: 'Challenge Round',
    spinningMeta: 'Level 2',
    revealedTitle: 'Challenge Round',
    revealedBody: 'Ask twenty yes/no questions.',
    timerEstimate: '1 min',
    timer: {
      totalSeconds: 60,
      remainingSeconds: 9,
      running: false,
      timesUpLabel: "Time's Up!",
      startLabel: 'Start',
      pauseLabel: 'Pause',
      resetLabel: 'Reset',
      onStart: jest.fn(),
      onPause: jest.fn(),
      onReset: jest.fn(),
    },
    passRiskLabel: 'PASS / RISK',
    doneLabel: 'DONE',
    onPassRisk: jest.fn(),
    onDone: jest.fn(),
  };
}

it('renders urgent timed challenge controls and forwards outcomes', () => {
  const props = roundProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<GameRoundPanel {...props} />);
  });
  expect(tree!.root.findByProps({ children: '0:09' })).toBeDefined();
  expect(tree!.root.findByProps({ children: 'Challenge Round' })).toBeDefined();
  TestRenderer.act(() =>
    tree!.root.find((node) => node.props.accessibilityLabel === 'PASS / RISK').props.onPress()
  );
  TestRenderer.act(() =>
    tree!.root.find((node) => node.props.accessibilityLabel === 'DONE').props.onPress()
  );
  expect(props.onPassRisk).toHaveBeenCalledTimes(1);
  expect(props.onDone).toHaveBeenCalledTimes(1);
});

it('does not render timer controls for an untimed revealed card', () => {
  const props = roundProps();
  let tree: TestRenderer.ReactTestRenderer;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<GameRoundPanel {...props} timer={undefined} />);
  });
  expect(
    tree!.root.findAll((node) => node.props.accessibilityLabel === 'Reset')
  ).toHaveLength(0);
  expect(tree!.root.findByProps({ children: '1 min' })).toBeDefined();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run `cd apps/mobile && npm test -- --runInBand __tests__/game-screen-components.test.tsx`.

Expected: FAIL with `Cannot find module '../components/game/GameRoundPanel'`.

- [ ] **Step 3: Implement `GameRoundPanel` as a display-only state renderer**

Define these public types in `GameRoundPanel.tsx`:

```tsx
export type GameRoundPhase = 'ready' | 'spinning' | 'revealed';

export type GameTimerDisplay = {
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  timesUpLabel: string;
  startLabel: string;
  pauseLabel: string;
  resetLabel: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};
```

The `GameRoundPanel` props are the exact keys in `roundProps()`, plus `rouletteStyle?: StyleProp<ViewStyle>`. Build the component with this structure:

```tsx
<View style={styles.stage}>
  <GameSurface elevated style={styles.card}>
    <CardAccentTop />
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.cardContent}
    >
      <GameSegmentedControl
        accessibilityLabel="Card language"
        value={language}
        options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]}
        onChange={onLanguageChange}
      />
      {phase === 'ready' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={drawLabel}
          accessibilityHint={hiddenBody}
          accessibilityState={{ disabled: drawDisabled }}
          disabled={drawDisabled}
          onPress={onDraw}
          style={({ pressed }) => [styles.cardBack, pressed && styles.pressed]}
        >
          <AccentBar />
          <Text style={styles.kicker}>{mysteryLabel}</Text>
          <Text style={styles.title}>{drawLabel}</Text>
          <Text style={styles.body}>{hiddenBody}</Text>
        </Pressable>
      ) : phase === 'spinning' ? (
        <Animated.View style={[styles.cardBack, styles.spinning, rouletteStyle]}>
          <AccentBar />
          <Text style={styles.kicker}>{spinningLabel}</Text>
          <Text style={styles.title}>{spinningTitle}</Text>
          <Text style={styles.spinningMeta}>{spinningMeta}</Text>
        </Animated.View>
      ) : (
        <View style={styles.challenge}>
          <AccentBar />
          <Text style={styles.title}>{revealedTitle}</Text>
          <Text style={styles.body}>{revealedBody}</Text>
          <GamePill label={timerEstimate} tone="warning" />
        </View>
      )}
      {phase === 'revealed' && timer ? (
        <TimerPanel timer={timer} timerEstimate={timerEstimate} />
      ) : null}
    </ScrollView>
  </GameSurface>
  {phase === 'revealed' ? (
    <View style={styles.outcomes}>
      <OutcomeAction
        label={passRiskLabel}
        icon={X}
        color={COLORS.no}
        onPress={onPassRisk}
      />
      <OutcomeAction
        label={doneLabel}
        icon={CheckCircle}
        color={COLORS.pink}
        primary
        onPress={onDone}
      />
    </View>
  ) : null}
</View>
```

Implement `TimerPanel` in the same file. It computes `progress = remainingSeconds / totalSeconds`, clamps it to `0...1`, formats countdown with the existing `formatGameCardTimerSeconds`, uses `COLORS.no` at 10 seconds or fewer, and renders Start/Pause plus Reset as separate 44-point `Pressable`s. Implement `OutcomeAction` in the same file with a minimum 66-point primary circle, minimum 52-point secondary circle, a minimum 44-point pressable wrapper, an accessibility label equal to its visible label, and pressed opacity/scale feedback.

Local styles must include: `stage.flex = 1`, `card.flex = 1`, `card.overflow = 'hidden'`, `cardContent.paddingHorizontal = 18`, `cardContent.paddingVertical = 16`, `cardContent.gap = 14`, `cardBack.minHeight = 220`, `title.fontSize = 32`, `title.lineHeight = 38`, `body.fontSize = 17`, `body.lineHeight = 25`, `timerPanel.borderRadius = 18`, `progressTrack.height = 7`, and `outcomes.paddingVertical = 4`. Do not give challenge or explanatory text a fixed height.

- [ ] **Step 4: Run component tests, timer tests, and type-check**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-screen-components.test.tsx __tests__/game-timer.test.ts
npx tsc --noEmit
```

Expected: both Jest suites PASS and TypeScript exits 0.

- [ ] **Step 5: Commit the round presentation**

```bash
git add apps/mobile/components/game/GameRoundPanel.tsx apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Add polished game round presentation"
```

---

### Task 5: Integrate the Polished Components Without Changing Game State

**Files:**
- Modify: `apps/mobile/app/(game)/index.tsx:1-2068`
- Modify: `apps/mobile/__tests__/game-hub-transition-animation.test.ts:1-176`

**Interfaces:**
- Consumes: all components from Tasks 1–4 and the existing `GameHub` state/callbacks.
- Produces: the final composed setup and active game screen; game logic signatures remain unchanged.

- [ ] **Step 1: Update the route structure test before changing the route**

In `game-hub-transition-animation.test.ts`, replace style-name assertions that belong to extracted presentation markup with component-boundary assertions:

```ts
it('composes focused presentation components while retaining game ownership', () => {
  const source = readGameHubSource();

  expect(source).toContain("from '../../components/game/GameSetupPanel'");
  expect(source).toContain("from '../../components/game/GameSessionChrome'");
  expect(source).toContain("from '../../components/game/GameRoundPanel'");
  expect(source).toContain('<GameSetupPanel');
  expect(source).toContain('<GameSessionHeader');
  expect(source).toContain('<GamePlayerMatchup');
  expect(source).toContain('<GameRoundPanel');
  expect(source).toContain('resolveGameRoundOutcome');
  expect(source).toContain('savePersistedGameSession');
  expect(source).toContain('loadPersistedGameSession');
  expect(source).toContain('clearPersistedGameSession');
  expect(source).toContain('startRouletteDraw');
  expect(source).toContain('finishRevealedCard');
  expect(source).toContain('acknowledgeConsequence');
});
```

Keep the existing tests for crossfade, setup state, roulette, hidden draw control, language copy, consequence translation, and persistence. Remove only assertions for migrated style names such as `styles.turnSpotlightPanel`, `styles.cardBackPanel`, and `styles.cardLanguageToggle`.

- [ ] **Step 2: Run the route test and verify it fails for missing component composition**

Run:

```bash
cd apps/mobile
npm test -- --runInBand __tests__/game-hub-transition-animation.test.ts
```

Expected: FAIL because the route does not yet import or render the new components.

- [ ] **Step 3: Replace pre-game markup with `GameSetupPanel`**

Move `GameMode` ownership to the imported `GameSetupMode` alias, remove migrated setup-only imports/styles, and replace the pre-game heading/mode/intro-card markup with:

```tsx
<GameSetupPanel
  gameNightLabel={t.game.gameNight.toUpperCase()}
  introTitle={t.game.introTitle}
  introBody={interpolate(t.game.introBody, {
    count: levelCards.length,
    mode: selectedModeLabel,
  })}
  badgeLabels={[t.game.truth, t.game.dare, t.game.challenge].map((label) =>
    label.toUpperCase()
  )}
  mode={selectedMode}
  modeOptions={(['normal', 'intense'] as const).map((value) => ({
    value,
    label: t.game.gameModes[value],
  }))}
  onModeChange={changeGameMode}
  intenseDisclaimer={
    selectedMode === 'intense' ? t.game.intenseDisclaimer : undefined
  }
  playerCount={playerCount}
  playerNames={playerNames}
  onPlayerCountChange={changePlayerCount}
  onPlayerNameChange={updatePlayerName}
  drinkingMode={drinkingMode}
  onDrinkingModeChange={setDrinkingMode}
  cardLanguage={cardLanguage}
  onCardLanguageChange={setCardLanguage}
  customCardsAvailable={customCards.length > 0}
  customDeckMode={customDeckMode}
  onCustomDeckModeChange={setCustomDeckMode}
  onOpenCustomDeck={() => router.push('/(game)/custom-deck')}
  startLabel={t.game.startPlaying}
  onStart={startGame}
  startDisabled={levelCards.length === 0}
/>
```

Keep this component inside the existing intro `Animated.View`; do not alter `visibleGameScene`, pointer events, accessibility hiding, or animation values.

- [ ] **Step 4: Replace active-game markup with the active components**

Render the header above `transitionStage` only when `hasStarted`, then compose the active scene as:

```tsx
<View style={styles.gameScene}>
  <GamePlayerMatchup
    playerLabel={cardCopy.playerUp.toUpperCase()}
    playerName={currentTurn.player}
    targetLabel={cardCopy.target.toUpperCase()}
    targetName={currentTurn.target}
  />
  <GameRoundPanel
    phase={roundPhase}
    language={cardLanguage}
    onLanguageChange={setCardLanguage}
    drawDisabled={levelCards.length === 0}
    onDraw={startRouletteDraw}
    mysteryLabel={cardCopy.mysteryCard}
    drawLabel={cardCopy.tapDraw}
    hiddenBody={cardCopy.hiddenCardBody}
    spinningLabel={cardCopy.rouletteSpinning}
    spinningTitle={
      roulettePreviewCard
        ? titleForCard(roulettePreviewCard, cardCopy.titles)
        : cardCopy.tapDraw
    }
    spinningMeta={
      roulettePreviewCard
        ? cardCopy.level(roulettePreviewCard.intensity)
        : selectedCardModeLabel
    }
    revealedTitle={
      currentCard
        ? titleForCard(currentCard, cardCopy.titles)
        : cardCopy.noCardsForLevels
    }
    revealedBody={displayedCardContent}
    timerEstimate={timerEstimateText}
    timer={
      isCardRevealed && totalTimerSeconds > 0
        ? {
            totalSeconds: totalTimerSeconds,
            remainingSeconds: timerSeconds,
            running: isTimerRunning,
            timesUpLabel: cardCopy.timesUp,
            startLabel: cardCopy.startTimer,
            pauseLabel: cardCopy.pauseTimer,
            resetLabel: cardCopy.resetTimer,
            onStart: startTimer,
            onPause: pauseTimer,
            onReset: resetTimer,
          }
        : undefined
    }
    rouletteStyle={rouletteCardStyle}
    passRiskLabel={cardCopy.passRisk.toUpperCase()}
    doneLabel={cardCopy.done.toUpperCase()}
    onPassRisk={() => finishRevealedCard(true)}
    onDone={() => finishRevealedCard(false)}
  />
</View>
```

Compose the session header as:

```tsx
<GameSessionHeader
  gameNightLabel={cardCopy.gameNight.toUpperCase()}
  modeLabel={selectedCardModeLabel}
  drinkingLabel={drinkingMode ? cardCopy.drinking : undefined}
  endGameLabel={cardCopy.endGame}
  onEndGame={confirmEndGame}
/>
```

Delete only styles and imports now owned by the new components. Keep `screen`, `content`, `transitionStage`, `sceneLayer`, `gameScene`, and all consequence-modal styles in the route.

- [ ] **Step 5: Run route, component, session, timer, deck, and persistence tests**

Run:

```bash
cd apps/mobile
npm test -- --runInBand \
  __tests__/game-screen-components.test.tsx \
  __tests__/game-hub-transition-animation.test.ts \
  __tests__/game-session.test.ts \
  __tests__/game-session-persistence.test.ts \
  __tests__/game-timer.test.ts \
  __tests__/game-deck.test.ts
npx tsc --noEmit
npx eslint 'app/(game)/index.tsx' components/game --ext .ts,.tsx
```

Expected: all six Jest suites PASS, TypeScript exits 0, and ESLint reports no errors in the touched files.

- [ ] **Step 6: Commit the route integration**

```bash
git add 'apps/mobile/app/(game)/index.tsx' \
  apps/mobile/__tests__/game-hub-transition-animation.test.ts
git commit -m "Integrate polished game screen experience"
```

---

### Task 6: Simulator Verification and Responsive Corrections

**Files:**
- Modify if required: `apps/mobile/components/game/GameControls.tsx`
- Modify if required: `apps/mobile/components/game/GameSetupPanel.tsx`
- Modify if required: `apps/mobile/components/game/GameSessionChrome.tsx`
- Modify if required: `apps/mobile/components/game/GameRoundPanel.tsx`
- Modify if required: `apps/mobile/app/(game)/index.tsx`
- Test: `apps/mobile/__tests__/game-screen-components.test.tsx`

**Interfaces:**
- Consumes: the fully integrated screen from Task 5.
- Produces: visually verified setup and active screens on large and small iPhones with no clipped controls or text.

- [ ] **Step 1: Start the app and inspect the setup state on iPhone 17 Pro Max**

Run `cd apps/mobile && npm run ios` if the existing Metro/native session is not already active. In Simulator, verify:

- Game Night, mode selection, setup card, player inputs, options, and both actions have a clear hierarchy.
- All setup content is reachable by scrolling.
- Start Game is dominant; Custom Deck is secondary.
- No text, switches, or inputs are clipped at default system text size.

Expected: the setup matches the approved lounge direction and every control remains readable and tappable.

- [ ] **Step 2: Inspect ready, spinning, revealed, timer, and consequence states on iPhone 17 Pro Max**

Start a two-player game and verify the directional matchup, hidden card, roulette transition, revealed challenge, timer Start/Pause/Reset, Pass/Risk, Done, and consequence modal. Toggle EN/ES and use `Alexandria-Montgomery-24` for both player names.

Expected: no overlap or clipping; the next action is visually obvious in every state; sounds fire once per existing event.

- [ ] **Step 3: Repeat the critical flow on a smaller iPhone simulator**

Use an available smaller device such as iPhone 16e or iPhone SE. Verify setup scrolling, Spanish labels, a multiline challenge, timer controls, and outcome actions above the tab bar.

Expected: content scrolls instead of shrinking below the specified sizes, and all 44-point targets remain reachable.

- [ ] **Step 4: Add one regression assertion before each responsive correction**

For every issue found, add a renderer assertion to `game-screen-components.test.tsx` first—for example, assert `ScrollView` presence for setup/round content, `numberOfLines={1}` and `minimumFontScale={0.72}` for player names, or a `minHeight: 44` style for the affected control. Run the focused test to see it fail, make the smallest style/layout correction, then rerun it to PASS.

- [ ] **Step 5: Run final verification**

Run:

```bash
cd apps/mobile
npm test -- --runInBand \
  __tests__/game-screen-components.test.tsx \
  __tests__/game-hub-transition-animation.test.ts \
  __tests__/game-session.test.ts \
  __tests__/game-session-persistence.test.ts \
  __tests__/game-timer.test.ts \
  __tests__/game-deck.test.ts
npx tsc --noEmit
npx eslint 'app/(game)/index.tsx' components/game --ext .ts,.tsx
```

Expected: all selected suites PASS, TypeScript exits 0, and ESLint reports no errors.

- [ ] **Step 6: Commit verified responsive corrections**

If simulator review required code changes:

```bash
git add 'apps/mobile/app/(game)/index.tsx' \
  apps/mobile/components/game \
  apps/mobile/__tests__/game-screen-components.test.tsx
git commit -m "Polish responsive game screen layout"
```

If no correction was required, do not create an empty commit.
