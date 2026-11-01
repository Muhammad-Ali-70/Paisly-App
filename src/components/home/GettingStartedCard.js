import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { CircleCheck, ChevronRight, X } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';

/**
 * Checklist shown on Home until the user has logged an expense, an income and
 * set a budget. Gives a new account something to do instead of empty charts.
 * `steps`: [{ key, title, subtitle, done, onPress }]
 */
const GettingStartedCard = ({ steps, onDismiss }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const doneCount = steps.filter(s => s.done).length;
  const progress = doneCount / steps.length;
  const nextKey = steps.find(s => !s.done)?.key;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Label type="bodyMedium" weight="bold" color="textMain">
            Get started with Paisly
          </Label>
          <Label type="bodyXs" weight="regular" color="textMuted">
            {doneCount} of {steps.length} done · takes about a minute
          </Label>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss getting started"
        >
          <X size={wp(4.5)} color={theme.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {steps.map(step => {
        const isNext = step.key === nextKey;
        return (
          <TouchableOpacity
            key={step.key}
            onPress={step.onPress}
            disabled={step.done || !step.onPress}
            activeOpacity={0.7}
            style={[styles.step, isNext && styles.stepNext]}
          >
            {step.done ? (
              <CircleCheck size={wp(5.5)} color={theme.primary} strokeWidth={2} />
            ) : (
              <View
                style={[styles.circle, isNext && { borderColor: theme.primary }]}
              />
            )}
            <View style={styles.stepText}>
              <Label
                type="bodySmall"
                weight="semiBold"
                color={step.done ? 'textMuted' : 'textMain'}
                style={step.done && styles.doneTitle}
              >
                {step.title}
              </Label>
              {!step.done && (
                <Label type="bodyXs" weight="regular" color="textMuted">
                  {step.subtitle}
                </Label>
              )}
            </View>
            {!step.done && step.onPress && (
              <ChevronRight
                size={wp(4.5)}
                color={isNext ? theme.primary : theme.textMuted}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    card: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      padding: wp(4),
      gap: hp(1),
      borderRadius: borderRadius.xl,
      backgroundColor: t.surfacePrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: wp(3),
    },
    headerText: {
      flex: 1,
      gap: hp(0.3),
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.background,
      overflow: 'hidden',
      marginBottom: hp(0.5),
    },
    fill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: t.primary,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(3),
      borderRadius: borderRadius.lg,
    },
    stepNext: {
      backgroundColor: t.background,
    },
    circle: {
      width: wp(5.5),
      height: wp(5.5),
      borderRadius: wp(2.75),
      borderWidth: 2,
      borderColor: t.outlineVariant,
    },
    stepText: {
      flex: 1,
      gap: hp(0.2),
    },
    doneTitle: {
      textDecorationLine: 'line-through',
    },
  });

export default GettingStartedCard;
