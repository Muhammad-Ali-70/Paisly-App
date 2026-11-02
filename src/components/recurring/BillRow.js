import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { ACTIVE_CURRENCY, formatAmount } from '../../utils/currency';
import { daysUntilDue, dueLabel } from '../../utils/recurring';

const money = n =>
  `${ACTIVE_CURRENCY.symbol} ${formatAmount(String(Math.round(n)))}`;

const FREQUENCY = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

/**
 * One recurring bill with its due status and the Paid / Skip actions. Without
 * actions it's a plain tappable row.
 */
const BillRow = ({ bill, onPress, onPaid, onSkip, disabled }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const days = daysUntilDue(bill);
  const overdue = bill.isActive && days < 0;
  const income = bill.type === 'income';

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.main}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.text}>
          <Label type="bodySmall" weight="semiBold" color="textMain" numberOfLines={1}>
            {bill.title}
          </Label>
          <Label
            type="bodyXs"
            weight="regular"
            color={overdue ? 'error' : 'textMuted'}
          >
            {bill.isActive ? dueLabel(days) : 'Paused'} ·{' '}
            {FREQUENCY[bill.frequency]}
          </Label>
        </View>
        <Label
          type="bodySmall"
          weight="bold"
          color={income ? 'primary' : 'textMain'}
        >
          {income ? '+' : ''}
          {money(bill.amount)}
        </Label>
      </TouchableOpacity>

      {bill.isActive && (onPaid || onSkip) ? (
        <View style={styles.actions}>
          {onSkip ? (
            <TouchableOpacity
              style={[styles.action, styles.skip]}
              activeOpacity={0.7}
              onPress={onSkip}
              disabled={disabled}
            >
              <Label type="bodyXs" weight="semiBold" color="textMuted">
                Skip
              </Label>
            </TouchableOpacity>
          ) : null}
          {onPaid ? (
            <TouchableOpacity
              style={[styles.action, styles.paid]}
              activeOpacity={0.8}
              onPress={onPaid}
              disabled={disabled}
            >
              <Label type="bodyXs" weight="semiBold" color="onPrimary">
                {income ? 'Received' : 'Paid'}
              </Label>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      gap: hp(1),
    },
    main: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
    text: { flex: 1, gap: hp(0.2) },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: wp(2) },
    action: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(0.8),
      borderRadius: borderRadius.lg,
    },
    skip: { backgroundColor: t.surfaceContainer },
    paid: { backgroundColor: t.primary },
  });

export default BillRow;
