import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Label } from '../../constants/globalstyle';
import { wp, hp } from '../../constants/responsive';
import { ACTIVE_CURRENCY, sanitiseInput } from '../../utils/currency';
import { RFValue } from 'react-native-responsive-fontsize';
import fonts from '../../constants/fonts';
import { useThemeColors } from '@hooks/useThemeColors';

const CurrencyInput = ({
  value,
  onChangeText,
  currency = ACTIVE_CURRENCY,
  label = 'Set Balance',
  showLabel = true,
  placeholder,
  containerStyle,
  inputStyle,
  ...rest
}) => {
  const derivedPlaceholder =
    placeholder ??
    (currency.decimals > 0 ? `0.${'0'.repeat(currency.decimals)}` : '0');

  const handleChange = text => {
    const clean = sanitiseInput(text, currency);
    onChangeText?.(clean);
  };

  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {showLabel && (
        <Label
          type="bodyXs"
          weight="medium"
          color="textMuted"
          style={styles.label}
        >
          {label}
        </Label>
      )}

      <View style={styles.row}>
        <Label type="bodySmall" color="textMain" style={styles.symbol}>
          {currency.symbol}
          {'  '}
        </Label>

        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={handleChange}
          placeholder={derivedPlaceholder}
          placeholderTextColor={theme.outlineVariant}
          keyboardType={currency.decimals > 0 ? 'decimal-pad' : 'number-pad'}
          maxLength={12}
          {...rest}
        />
      </View>
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
    minWidth: wp(20),
  },
  label: {
    marginBottom: hp(0.3),
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  symbol: {
    includeFontPadding: false,
  },
  input: {
    fontSize: RFValue(15),
    fontFamily: fonts.bold,
    color: t.primary,
    padding: 0,
    minWidth: wp(12),
    textAlign: 'right',
    includeFontPadding: false,
  },
});

export default CurrencyInput;
