import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { Label, borderRadius } from '../../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import AccountAvatar from '../../ui/AccountAvatar';
import CurrencyInput from '../../common/CurrencyInput';
import { getAccountMeta } from '../../../utils/accountMetaLookup';

const AccountCard = ({ account, type, isDefault, onBalanceChange, onRemove, styles, theme }) => {
  const meta = getAccountMeta(type, account.id);

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountTop}>
        <AccountAvatar
          imageUri={meta.imageUri}
          initials={account.initials}
          color={account.color}
          size={wp(11)}
        />
        <View style={styles.accountName}>
          <Label type="bodySmall" weight="semiBold" color="textMain" numberOfLines={1}>
            {account.label}
          </Label>
          {isDefault && (
            <Label type="bodyXs" weight="regular" color="textMuted">
              Default account
            </Label>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onRemove(account)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${account.label}`}
        >
          <X size={wp(4.5)} color={theme.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceRow}>
        <Label type="bodyXs" weight="medium" color="textMuted">
          Current balance
        </Label>
        <CurrencyInput
          value={account.balance}
          onChangeText={text => onBalanceChange(account, text)}
          showLabel={false}
          accessibilityLabel={`${account.label} balance`}
        />
      </View>
    </View>
  );
};

/**
 * Shared step for bank accounts and wallet apps: an inviting empty state, then
 * one card per added account with a clearly labelled balance field.
 * `onAdd` opens the picker modal owned by the screen.
 */
const AccountsStep = ({
  type,
  accounts,
  onAdd,
  onRemove,
  onBalanceChange,
  emptyTitle,
  emptyHint,
  addLabel,
}) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {accounts.length === 0 ? (
        <TouchableOpacity
          onPress={onAdd}
          activeOpacity={0.8}
          style={styles.empty}
          accessibilityRole="button"
          accessibilityLabel={emptyTitle}
        >
          <View style={styles.emptyIcon}>
            <Plus size={wp(6)} color={theme.primary} strokeWidth={2.2} />
          </View>
          <Label type="bodyMedium" weight="semiBold" color="textMain">
            {emptyTitle}
          </Label>
          <Label type="bodyXs" weight="regular" color="textMuted" style={styles.emptyHint}>
            {emptyHint}
          </Label>
        </TouchableOpacity>
      ) : (
        <>
          {accounts.map((account, idx) => (
            <AccountCard
              key={account.id}
              account={account}
              type={type}
              isDefault={idx === 0}
              onBalanceChange={onBalanceChange}
              onRemove={onRemove}
              styles={styles}
              theme={theme}
            />
          ))}
          <TouchableOpacity
            onPress={onAdd}
            activeOpacity={0.75}
            style={styles.addMore}
          >
            <Plus size={wp(4.5)} color={theme.primary} strokeWidth={2.4} />
            <Label type="bodySmall" weight="semiBold" color="primary">
              {addLabel}
            </Label>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    container: {
      paddingHorizontal: wp(5),
      gap: hp(1.5),
    },
    empty: {
      alignItems: 'center',
      gap: hp(0.8),
      paddingVertical: hp(4),
      paddingHorizontal: wp(6),
      borderRadius: borderRadius.xl,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.primary,
      backgroundColor: t.surfacePrimary,
    },
    emptyIcon: {
      width: wp(13),
      height: wp(13),
      borderRadius: wp(6.5),
      backgroundColor: t.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(0.5),
    },
    emptyHint: {
      textAlign: 'center',
    },
    accountCard: {
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.xl,
      borderWidth: 1.5,
      borderColor: t.outlineVariant,
      padding: wp(4),
      gap: hp(1.5),
    },
    accountTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
    },
    accountName: {
      flex: 1,
      gap: hp(0.2),
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.background,
      borderRadius: borderRadius.lg,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.4),
    },
    addMore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
      paddingVertical: hp(1.4),
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.outlineVariant,
    },
  });

export default AccountsStep;
