import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { Label } from '../../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import CurrencyInput from '../../common/CurrencyInput';

const AccountRow = ({
  account,
  accountIdKey = 'bankId',
  isPrimary,
  onBalanceChange,
  onRemove,
}) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accountId = account[accountIdKey];

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: account.color }]} />

      <View style={styles.info}>
        <Label type="bodySmall" weight="semiBold" color="textMain">
          {account.label}
          {isPrimary && (
            <Label type="bodySmall" weight="regular" color="textMuted">
              {'  • default'}
            </Label>
          )}
        </Label>
      </View>

      <CurrencyInput
        value={account.balance}
        onChangeText={text => onBalanceChange(accountId, text)}
        label="Balance"
        showLabel
      />

      {!isPrimary && (
        <TouchableOpacity
          onPress={() => onRemove(accountId)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.removeBtn}
        >
          <X size={wp(4)} color={theme.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.8),
    gap: wp(2.5),
  },
  dot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    flexShrink: 0,
  },
  info: {
    flex: 1,
  },
  removeBtn: {
    marginLeft: wp(1),
  },
});

export default AccountRow;
