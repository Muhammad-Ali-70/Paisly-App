import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { hp, wp } from '../../../constants/responsive';
import { borderRadius } from '../../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { SkeletonPulse, SkeletonBox } from './Skeleton';

/**
 * Placeholder for a list of transaction / notification rows
 * (icon, two text lines, trailing amount). Mirrors RecentActivityItem.
 */
const SkeletonSection = ({ itemCount = 3, showHeader = true, style }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SkeletonPulse style={[styles.section, style]}>
      {showHeader && (
        <View style={styles.headerRow}>
          <SkeletonBox width={wp(28)} height={hp(2)} />
          <SkeletonBox width={wp(18)} height={hp(1.8)} />
        </View>
      )}

      {Array.from({ length: itemCount }).map((_, i) => (
        <View key={i} style={styles.itemRow}>
          <SkeletonBox width={wp(11)} height={wp(11)} radius={borderRadius.md} />
          <View style={styles.textCol}>
            <SkeletonBox width="62%" height={hp(1.6)} />
            <SkeletonBox width="38%" height={hp(1.2)} />
          </View>
          <SkeletonBox width={wp(14)} height={hp(1.6)} />
        </View>
      ))}
    </SkeletonPulse>
  );
};

const createStyles = t =>
  StyleSheet.create({
    section: {
      marginHorizontal: wp(5),
      marginTop: hp(2.5),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.5),
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.lg,
      paddingVertical: wp(2),
      paddingHorizontal: wp(2),
      marginBottom: hp(1.2),
    },
    textCol: {
      flex: 1,
      marginLeft: wp(3),
      gap: hp(0.8),
    },
  });

export default SkeletonSection;
