import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@hooks/useThemeColors';
import { borderRadius } from '../../../constants/globalstyle';

/**
 * Pulses every SkeletonBox inside it with one shared animation, so a whole
 * screen of placeholders breathes in sync and costs a single UI-thread loop.
 */
export const SkeletonPulse = ({ children, style }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[style, animatedStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      {children}
    </Animated.View>
  );
};

// textMuted at low alpha reads as a neutral "bone" on both light and dark surfaces
export const SkeletonBox = ({
  width,
  height,
  radius = borderRadius.sm,
  style,
}) => {
  const theme = useThemeColors();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: `${theme.textMuted}26`,
        },
        style,
      ]}
    />
  );
};
