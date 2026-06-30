import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

type SafeAreaViewProps = ViewProps & {
  edges?: readonly Edge[];
};

const ALL_EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];

/**
 * Drop-in replacement for react-native-safe-area-context's <SafeAreaView/>.
 *
 * The library's SafeAreaView is a *native* component: it measures insets and
 * applies its padding one frame after the screen attaches. On lower-powered
 * devices that lag is visible — content paints flush against the top, then
 * drops down by the notch inset on the next frame (the "drop-in from the top"
 * glitch seen when switching tabs or returning from a pushed screen).
 *
 * This version reads insets from the React context via useSafeAreaInsets(),
 * which is seeded synchronously by `initialWindowMetrics` on the
 * SafeAreaProvider. Padding is therefore applied as plain style during the very
 * first render, so content lands in its final position immediately — no jump.
 *
 * API-compatible with the common usage (`edges` + `style` + children). Padding
 * is applied for the requested edges (default: all four).
 */
export function SafeAreaView({
  edges = ALL_EDGES,
  style,
  ...rest
}: SafeAreaViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        style,
        {
          paddingTop: edges.includes('top') ? insets.top : undefined,
          paddingRight: edges.includes('right') ? insets.right : undefined,
          paddingBottom: edges.includes('bottom') ? insets.bottom : undefined,
          paddingLeft: edges.includes('left') ? insets.left : undefined,
        },
      ]}
      {...rest}
    />
  );
}

export default SafeAreaView;
