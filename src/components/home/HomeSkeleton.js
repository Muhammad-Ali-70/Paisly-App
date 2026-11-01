import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { hp, wp } from '../../constants/responsive';
import { borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { SkeletonPulse, SkeletonBox } from '../common/skeleton/Skeleton';
import SkeletonSection from '../common/skeleton/SkeletonSection';

/** First-load placeholder mirroring the dashboard's card layout. */
const HomeSkeleton = () => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      <SkeletonPulse>
        <View style={styles.balanceCard}>
          <SkeletonBox width={wp(28)} height={hp(1.6)} />
          <SkeletonBox width={wp(52)} height={hp(4)} radius={borderRadius.md} />
          <SkeletonBox
            width={wp(40)}
            height={hp(2.6)}
            radius={borderRadius.full}
          />
        </View>

        <View style={styles.accountsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.accountTile}>
              <SkeletonBox
                width={wp(9)}
                height={wp(9)}
                radius={borderRadius.md}
              />
              <SkeletonBox width="70%" height={hp(1.4)} />
              <SkeletonBox width="50%" height={hp(1.6)} />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <SkeletonBox width={wp(36)} height={hp(1.8)} />
          <SkeletonBox width="100%" height={hp(14)} radius={borderRadius.md} />
        </View>
      </SkeletonPulse>

      <SkeletonSection itemCount={3} />
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    balanceCard: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      padding: wp(5),
      gap: hp(1.2),
      borderRadius: borderRadius.xl,
      backgroundColor: t.surfacePrimary,
    },
    accountsRow: {
      flexDirection: 'row',
      gap: wp(3),
      marginHorizontal: wp(5),
      marginTop: hp(2),
    },
    accountTile: {
      flex: 1,
      gap: hp(0.8),
      padding: wp(3),
      borderRadius: borderRadius.lg,
      backgroundColor: t.surfacePrimary,
    },
    card: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      padding: wp(4),
      gap: hp(1.5),
      borderRadius: borderRadius.xl,
      backgroundColor: t.surfacePrimary,
    },
  });

export default HomeSkeleton;
