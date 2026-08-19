import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import ConversationScreen from '../app/(conversation)';
import ConversationTopicScreen from '../app/(conversation)/topic/[category]';
import { useConversationStore } from '../lib/state/conversationStore';
import { useSettingsStore } from '../src/stores/settingsStore';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ category: 'date_night' }),
  useRouter: () => ({
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

function getVisibleCopy(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .flatMap((node) => node.props.children)
    .filter((child): child is string => typeof child === 'string');
}

describe('Spanish conversation UI', () => {
  let tree: TestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    useSettingsStore.setState({ language: 'es' });
    useConversationStore.setState({ favorites: [], history: [] });
  });

  afterEach(() => {
    if (tree) TestRenderer.act(() => tree?.unmount());
    tree = undefined;
  });

  it('renders the conversation lane heading and tiles in Spanish', () => {
    TestRenderer.act(() => {
      tree = TestRenderer.create(<ConversationScreen />);
    });

    expect(getVisibleCopy(tree!)).toEqual(
      expect.arrayContaining([
        'TEMAS DE CHARLA',
        'Elige un tipo de conversación',
        'Noche de cita',
        'Conocerse mejor',
        'Relación',
        'Picante',
        'Lenguajes del amor',
      ])
    );
  });

  it('renders conversation navigation and actions in Spanish', () => {
    TestRenderer.act(() => {
      tree = TestRenderer.create(<ConversationTopicScreen />);
    });

    expect(getVisibleCopy(tree!)).toEqual(
      expect.arrayContaining([
        'Noche de cita',
        'PREGUNTA 1 DE 50',
        'SALTAR',
        'GUARDAR',
        'COMPARTIR',
      ])
    );
  });
});
