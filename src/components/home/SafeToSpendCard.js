import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, shadowCard } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { ACTIVE_CURRENCY, formatAmount } from '../../utils/currency';

const money = n =>
  `${ACTIVE_CURRENCY.symbol} ${formatAmount(String(Math.round(Math.abs(n))))}`;

/**
 * Today's spending allowance until payday. `result` comes from
 * computeSafeToSpend; tapping the card lets the user change their payday.
 */
const SafeToSpendCard = ({ result, onPress }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const overAllowance = result.leftToday < 0;
  const short = result.shortfall > 0;
  const bad = overAllowance || short;

  let headline = money(result.leftToday);
  let caption = 'left to spend today';
  if (short) {
    headline = money(result.shortfall);
    caption = 'short of reaching payday';
  } else if (overAllowance) {
    caption = 'over today’s limit';
  }

  const limitNote =
    result.limitedBy === 'budget' ? 'your budget' : 'your balance after bills';
  const days = `${result.daysLeft} day${result.daysLeft === 1 ? '' : 's'} to payday`;
  const bills = result.committed > 0 ? ` · ${money(result.committed)} in bills` : '';

  return (
    <TouchableOpacity
      style={[styles.card, shadowCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Wallet size={wp(4.5)} color={theme.primary} strokeWidth={1.8} />
        </View>
        <Label type="bodySmall" weight="semiBold" color="textMain">
          Safe to spend today
        </Label>
      </View>

      <Label type="displayMd" weight="bold" color={bad ? 'error' : 'primary'}>
        {headline}
      </Label>
      <Label type="bodyXs" weight="regular" color="textMuted" style={styles.caption}>
        {caption}
        {!bad && result.allowance > 0 ? ` · of ${money(result.allowance)}` : ''}
      </Label>

      <Label type="bodyXs" weight="regular" color="textMuted" style={styles.note}>
        {days}
        {bills} · based on {limitNote}
      </Label>
    </TouchableOpacity>
  );
};

const createStyles = t =>
  StyleSheet.create({
    card: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      padding: wp(4),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      marginBottom: hp(1),
    },
    iconWrap: {
      width: wp(8),
      height: wp(8),
      borderRadius: wp(4),
      backgroundColor: t.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    caption: { marginTop: hp(0.2) },
    note: { marginTop: hp(1) },
  });

export default SafeToSpendCard;
