import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import TestRenderer from 'react-test-renderer';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
  }),
}));

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
const { GameSetupPanel } = require('../components/game/GameSetupPanel');
const {
  GamePlayerMatchup,
  GameSessionHeader,
} = require('../components/game/GameSessionChrome');
const { GameRoundPanel } = require('../components/game/GameRoundPanel');

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

  it('keeps the active language selector compact, right aligned, and tappable', () => {
    const props = roundProps();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<GameRoundPanel {...props} />);
    });

    const selector = tree!.root.find(
      (node) =>
        node.type === View &&
        node.props.accessibilityLabel === 'Card language'
    );
    expect(StyleSheet.flatten(selector.props.style).alignSelf).toBe('flex-end');
    expect(
      StyleSheet.flatten(selector.parent!.parent!.props.style).alignItems
    ).toBe('flex-end');

    const options = ['EN', 'ES'].map((label) =>
      tree!.root.find(
        (node) => node.props.accessibilityLabel === `Card language: ${label}`
      )
    );
    expect(options).toHaveLength(2);
    options.forEach((option) => {
      expect(flattenedPressableStyle(option)).toMatchObject({
        minWidth: GAME_CONTROL_MIN_SIZE,
        minHeight: GAME_CONTROL_MIN_SIZE,
      });
    });
  });

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
    TestRenderer.act(() =>
      firstName.props.onChangeText('Alexandria-Montgomery-24')
    );
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
    const names = tree!.root
      .findAllByType(Text)
      .filter((name) => name.props.children === longName);
    expect(names).toHaveLength(2);
    names.forEach((name) => {
      expect(name.props.numberOfLines).toBe(1);
      expect(name.props.adjustsFontSizeToFit).toBe(true);
      expect(name.props.minimumFontScale).toBe(0.72);
    });
  });

  it('renders urgent timed challenge controls and forwards outcomes', () => {
    const props = roundProps();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<GameRoundPanel {...props} />);
    });
    expect(tree!.root.findByProps({ children: '0:09' })).toBeDefined();
    expect(
      tree!.root.findByProps({ children: 'Challenge Round' })
    ).toBeDefined();
    TestRenderer.act(() =>
      tree!.root
        .find((node) => node.props.accessibilityLabel === 'PASS / RISK')
        .props.onPress()
    );
    TestRenderer.act(() =>
      tree!.root
        .find((node) => node.props.accessibilityLabel === 'DONE')
        .props.onPress()
    );
    expect(props.onPassRisk).toHaveBeenCalledTimes(1);
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('does not render timer controls for an untimed revealed card', () => {
    const props = roundProps();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <GameRoundPanel {...props} timer={undefined} />
      );
    });
    expect(
      tree!.root.findAll((node) => node.props.accessibilityLabel === 'Reset')
    ).toHaveLength(0);
    expect(tree!.root.findByProps({ children: '1 min' })).toBeDefined();
  });

  it('allows localized timer actions to wrap and grow with system text', () => {
    const props = roundProps();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <GameRoundPanel
          {...props}
          timer={{
            ...props.timer,
            startLabel: 'Comenzar',
            resetLabel: 'Reiniciar',
          }}
        />
      );
    });

    const reset = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Reiniciar'
    );
    expect(StyleSheet.flatten(reset.parent!.props.style).flexWrap).toBe('wrap');
    expect(flattenedPressableStyle(reset).flexBasis).toBeGreaterThanOrEqual(
      120
    );
    const resetText = reset
      .findAllByType(Text)
      .find((node) => node.props.children === 'Reiniciar');
    expect(StyleSheet.flatten(resetText!.props.style)).toMatchObject({
      flexShrink: 1,
      textAlign: 'center',
    });
  });

  it('keeps the active countdown silent and announces only expiry', () => {
    const props = roundProps();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<GameRoundPanel {...props} />);
    });

    const activeCountdown = tree!.root.findByProps({ children: '0:09' });
    expect(activeCountdown.props.accessibilityLiveRegion).toBeUndefined();

    TestRenderer.act(() => {
      tree!.update(
        <GameRoundPanel
          {...props}
          timer={{ ...props.timer, remainingSeconds: 0 }}
        />
      );
    });

    const expiry = tree!.root.find(
      (node) => node.props.accessibilityLabel === "Time's Up!"
    );
    expect(expiry.props.accessibilityLiveRegion).toBe('polite');
    expect(expiry.props.children).toBe('0:00');
  });
});
