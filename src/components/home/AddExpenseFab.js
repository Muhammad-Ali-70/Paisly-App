import React, { useEffect, useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';

const SIZE = wp(14);
const EXPANDED_WIDTH = wp(38);
// Resolved here because wp() is a JS-thread function and can't run inside a worklet
const LABEL_SHIFT = wp(2);
const TIMING = { duration: 220, easing: Easing.out(Easing.cubic) };

/**
 * Extended FAB for the fastest path to a new expense. Shows "Add expense" at
 * rest and shrinks to just the plus icon while the user scrolls down, so it
 * never covers list content for long.
 */
const AddExpenseFab = ({ onPress, collapsed = false }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const progress = useSharedValue(collapsed ? 0 : 1);

  useEffect(() => {
    progress.value = withTiming(collapsed ? 0 : 1, TIMING);
  }, [collapsed, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    width: SIZE + (EXPANDED_WIDTH - SIZE) * progress.value,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * -LABEL_SHIFT }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Plus size={wp(6)} color={theme.onPrimary} strokeWidth={2.5} />
        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Label
            type="bodySmall"
            weight="bold"
            color="onPrimary"
            numberOfLines={1}
          >
            Add expense
          </Label>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      right: wp(5),
      bottom: hp(2),
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: t.primary,
      // Same glow as the tab bar's center button so they read as one family
      shadowColor: t.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    button: {
      flex: 1,
      borderRadius: SIZE / 2,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      // Icon stays pinned left so it doesn't shift while the pill resizes
      paddingLeft: (SIZE - wp(6)) / 2,
    },
    labelWrap: {
      marginLeft: wp(2),
      width: wp(24),
    },
  });

export default AddExpenseFab;
