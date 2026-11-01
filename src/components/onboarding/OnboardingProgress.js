import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';

// Top bar: brand (or a back button after step 1), "STEP n OF N", and a
// segmented progress bar showing how far along setup is.
const OnboardingProgress = ({ step, total, onBack }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {step > 0 ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={wp(5)} color={theme.textMain} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <Label type="h4" weight="bold" color="primary">
            Paisly
          </Label>
        )}
        <Label
          type="bodyXs"
          weight="semiBold"
          color="textMuted"
          style={styles.stepLabel}
        >
          STEP {step + 1} OF {total}
        </Label>
      </View>

      <View style={styles.segments}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.segment, i <= step && styles.segmentDone]}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      paddingHorizontal: wp(5),
      paddingTop: hp(1.5),
      gap: hp(1.5),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: wp(10),
    },
    backBtn: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      backgroundColor: t.surfacePrimary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    stepLabel: {
      letterSpacing: 1,
    },
    segments: {
      flexDirection: 'row',
      gap: wp(2),
    },
    segment: {
      flex: 1,
      height: 5,
      borderRadius: 3,
      backgroundColor: t.outlineVariant,
    },
    segmentDone: {
      backgroundColor: t.primary,
    },
  });

export default OnboardingProgress;
