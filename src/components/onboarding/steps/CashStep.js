import React, { useMemo } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { hp, wp } from '../../../constants/responsive';
import { Label, borderRadius } from '../../../constants/globalstyle';
import { ACTIVE_CURRENCY, sanitiseInput } from '../../../utils/currency';
import fonts from '../../../constants/fonts';
import { useThemeColors } from '@hooks/useThemeColors';

const QUICK_AMOUNTS = ['500', '1000', '5000', '10000'];

// One big amount field with quick picks: the whole step is a single decision.
const CashStep = ({ value, onChange }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Label
          type="bodyXs"
          weight="semiBold"
          color="textMuted"
          style={styles.cardLabel}
        >
          CASH IN HAND
        </Label>
        <View style={styles.amountRow}>
          <Label type="h3" weight="bold" color="primary">
            {ACTIVE_CURRENCY.symbol}
          </Label>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={text => onChange(sanitiseInput(text))}
            placeholder="0"
            placeholderTextColor={theme.outlineVariant}
            keyboardType={
              ACTIVE_CURRENCY.decimals > 0 ? 'decimal-pad' : 'number-pad'
            }
            maxLength={12}
            accessibilityLabel="Cash in hand"
          />
        </View>
      </View>

      <View style={styles.chips}>
        {QUICK_AMOUNTS.map(amount => {
          const active = value === amount;
          return (
            <TouchableOpacity
              key={amount}
              onPress={() => onChange(amount)}
              activeOpacity={0.75}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Label
                type="bodySmall"
                weight="semiBold"
                color={active ? 'onPrimary' : 'textMain'}
              >
                {Number(amount).toLocaleString()}
              </Label>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      paddingHorizontal: wp(5),
      gap: hp(2),
    },
    card: {
      alignItems: 'center',
      gap: hp(1),
      paddingVertical: hp(3.5),
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.xl,
      borderWidth: 1.5,
      borderColor: t.outlineVariant,
    },
    cardLabel: {
      letterSpacing: 1,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
    },
    input: {
      fontSize: RFValue(40),
      fontFamily: fonts.bold,
      color: t.textMain,
      minWidth: wp(26),
      padding: 0,
      includeFontPadding: false,
    },
    chips: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: wp(2.5),
    },
    chip: {
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: borderRadius.full,
      backgroundColor: t.surfacePrimary,
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    chipActive: {
      backgroundColor: t.primary,
      borderColor: t.primary,
    },
  });

export default CashStep;
