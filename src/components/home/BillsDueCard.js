import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, shadowCard } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import BillRow from '../recurring/BillRow';
import usePayBill from '../../hooks/usePayBill';

const MAX_SHOWN = 3;

/** Bills due this week (or overdue) with one-tap Paid. Hidden when there are none. */
const BillsDueCard = ({ bills, onSeeAll, onOpenBill }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { confirmPaid, confirmSkip, busy } = usePayBill();

  if (!bills.length) return null;

  return (
    <View style={[styles.card, shadowCard]}>
      <View style={styles.header}>
        <Label type="bodySmall" weight="semiBold" color="textMain">
          Bills due soon
        </Label>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Label type="bodyXs" weight="semiBold" color="primary">
            {bills.length > MAX_SHOWN ? `See all ${bills.length}` : 'See all'}
          </Label>
        </TouchableOpacity>
      </View>

      {bills.slice(0, MAX_SHOWN).map((bill, index) => (
        <View key={bill._id} style={index > 0 ? styles.divided : undefined}>
          <BillRow
            bill={bill}
            onPress={() => onOpenBill(bill)}
            onPaid={() => confirmPaid(bill)}
            onSkip={() => confirmSkip(bill)}
            disabled={busy}
          />
        </View>
      ))}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    card: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingTop: hp(1.8),
    },
    divided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.outlineVariant,
    },
  });

export default BillsDueCard;
