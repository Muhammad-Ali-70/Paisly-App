import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Label, TEXT_TYPES } from '../../constants/globalstyle';

/**
 * A soft odometer for money: each digit is a clipped 0–9 strip that eases to
 * its new value, while the currency symbol, commas and signs stay put. Quiet on
 * purpose: no bounce, no fade, it settles in ~0.6s and skips the animation on
 * first render and when the system "reduce motion" setting is on.
 *
 * Pass the already-formatted string ("Rs 12,500"), so every screen keeps its
 * own formatting rules.
 */

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const DURATION = 600;
const EASING = Easing.out(Easing.cubic);

const RollingDigit = ({ digit, height, labelProps, animate }) => {
  const offset = useSharedValue(-digit * height);
  const lastHeight = useRef(height);

  useEffect(() => {
    const target = -digit * height;
    // A font-size change is a re-layout, not a value change: jump there
    if (!animate || lastHeight.current !== height) {
      lastHeight.current = height;
      offset.value = target;
      return;
    }
    offset.value = withTiming(target, { duration: DURATION, easing: EASING });
  }, [digit, height, animate, offset]);

  const strip = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View style={[styles.window, { height }]}>
      <Animated.View style={strip}>
        {DIGITS.map(d => (
          <Label key={d} {...labelProps}>
            {d}
          </Label>
        ))}
      </Animated.View>
    </View>
  );
};

const RollingNumber = ({ text, type = 'body', weight, color, style }) => {
  const reduceMotion = useReducedMotion();
  // Animate only changes after the first paint
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const animate = mounted.current && !reduceMotion;

  // Fixed line box so every glyph and strip cell is exactly one row tall
  const fontSize = TEXT_TYPES[type] || TEXT_TYPES.body;
  const height = Math.round(fontSize * 1.3);

  const labelProps = useMemo(
    () => ({
      type,
      weight,
      color,
      style: [styles.glyph, { height, lineHeight: height }],
    }),
    [type, weight, color, height],
  );

  // Keyed from the right, so the units digit keeps its strip when the number
  // grows a digit (new digits appear on the left, like a real counter)
  const chars = String(text ?? '').split('');
  const cells = chars.map((char, i) => {
    const key = `p${chars.length - i}`;
    return /\d/.test(char) ? (
      <RollingDigit
        key={key}
        digit={Number(char)}
        height={height}
        labelProps={labelProps}
        animate={animate}
      />
    ) : (
      <Label key={key} {...labelProps}>
        {char === ' ' ? ' ' : char}
      </Label>
    );
  });

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      <View
        style={styles.row}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {cells}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  window: {
    overflow: 'hidden',
  },
  glyph: {
    // Equal-width digits: the amount doesn't wobble sideways while rolling
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default React.memo(RollingNumber);
