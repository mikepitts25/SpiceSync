import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function ThemeProvider({ children }: PropsWithChildren) {
  // Wrap children in a native view so raw strings never leak to the root
  return <View style={{ flex: 1 }}>{children}</View>;
}
