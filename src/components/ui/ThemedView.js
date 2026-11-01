import React from 'react';
import { View } from 'react-native';
import { useThemeColors } from '@hooks/useThemeColors';

/**
 * ThemedView — A View wrapper that auto-applies background colors from the active theme.
 *
 * Props:
 *  - variant: 'background' | 'surface' | 'surfaceSecondary' | 'card' | 'none' (default: 'background')
 *  - style:     Additional styles (merged after theme styles)
 *  - children:  React children
 *  - ...props:  All other View props are spread through
 */
const ThemedView = ({
  variant = 'background',
  style,
  children,
  ...props
}) => {
  const theme = useThemeColors();

  const backgroundColors = {
    background: theme.background,
    surface: theme.surfacePrimary,
    surfaceSecondary: theme.surfaceSecondary,
    card: theme.surfaceSecondary,
    none: undefined,
  };

  const backgroundColor = backgroundColors[variant] || backgroundColors.background;

  return (
    <View
      style={[{ backgroundColor }, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export default ThemedView;
