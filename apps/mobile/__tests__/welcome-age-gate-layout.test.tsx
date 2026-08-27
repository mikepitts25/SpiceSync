import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Text } from 'react-native';

import WelcomeFlow from '../app/welcome/WelcomeFlow';
import { useSettings } from '../lib/state/useStore';

const mockRouter = { push: jest.fn(), replace: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('welcome age gate layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useSettings.setState({ ageConfirmed: false, language: 'en' });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('places the final progress indicator after the age-gate buttons in the scrollable content', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<WelcomeFlow />);
    });
    const pressButton = (label: string) => {
      const button = tree!.root
        .findAll((candidate) => candidate.props.accessibilityRole === 'button')
        .find((candidate) =>
          candidate
            .findAllByType(Text)
            .some((text) => text.props.children === label)
        );
      if (!button) {
        throw new Error(`Could not find welcome button: ${label}`);
      }
      TestRenderer.act(() => {
        button.props.onPress();
        jest.advanceTimersByTime(500);
      });
    };

    pressButton('Get Started');
    pressButton('Continue');
    pressButton('Continue');
    pressButton('Continue');

    const ageGate = tree!.root.findByProps({ testID: 'age-gate-scroll' });
    const progress = ageGate.findByProps({ testID: 'welcome-progress' });
    const buttons = ageGate.findByProps({ testID: 'age-gate-buttons' });
    const footerOrder = ageGate
      .findAll(
        (candidate) =>
          candidate.props.testID === 'age-gate-buttons' ||
          candidate.props.testID === 'welcome-progress'
      )
      .map((candidate) => candidate.props.testID);

    expect(progress).toBeTruthy();
    expect(buttons).toBeTruthy();
    expect(footerOrder.indexOf('age-gate-buttons')).toBeGreaterThanOrEqual(0);
    expect(footerOrder.indexOf('welcome-progress')).toBeGreaterThan(
      footerOrder.lastIndexOf('age-gate-buttons')
    );
  });

  it('opens account restoration from the welcome brand screen', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<WelcomeFlow />);
    });
    const restoreButton = tree!.root
      .findAll((candidate) => candidate.props.accessibilityRole === 'button')
      .find((candidate) =>
        candidate
          .findAllByType(Text)
          .some((text) => text.props.children === 'Restore existing account')
      );

    if (!restoreButton) {
      throw new Error('Could not find account restoration button');
    }
    TestRenderer.act(() => {
      restoreButton.props.onPress();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/restore');
  });

  it('offers account protection after age confirmation before completing onboarding', async () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<WelcomeFlow />);
    });
    const pressButton = async (label: string) => {
      const button = tree!.root
        .findAll((candidate) => candidate.props.accessibilityRole === 'button')
        .find((candidate) =>
          candidate
            .findAllByType(Text)
            .some((text) => text.props.children === label)
        );
      if (!button) {
        throw new Error(`Could not find welcome button: ${label}`);
      }
      await TestRenderer.act(async () => {
        button.props.onPress();
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });
    };

    await pressButton('Get Started');
    await pressButton('Continue');
    await pressButton('Continue');
    await pressButton('Continue');

    TestRenderer.act(() => {
      for (const checkbox of tree!.root.findAll(
        (candidate) =>
          candidate.props.accessibilityRole === 'checkbox' &&
          typeof candidate.props.onPress === 'function'
      )) {
        checkbox.props.onPress();
      }
    });
    await pressButton("I'm 18 or Older");
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });
    TestRenderer.act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(
      tree!.root
        .findAllByType(Text)
        .some((text) => text.props.children === 'Protect your account')
    ).toBe(true);
    expect(
      tree!.root
        .findAllByType(Text)
        .some((text) => text.props.children === 'Continue with Google')
    ).toBe(true);
    expect(mockRouter.replace).not.toHaveBeenCalled();

    await pressButton('Not now');

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/(settings)/profiles/new',
      params: { from: 'welcome' },
    });
  });
});
