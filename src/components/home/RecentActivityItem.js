import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, ArrowRightLeft } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, borderRadius } from '../../constants/globalstyle';
import CurrencyView from '../common/CurrencyView';
import PaymentIcon from '../common/Paymenticon';
import { ACCOUNT_TYPE_META } from '../../constants/theme/accountMeta';
import { useThemeColors } from '@hooks/useThemeColors';
import colors from '../../constants/colors';

const AccountTag = ({ label, type }) => {
  const meta = ACCOUNT_TYPE_META[type] ?? ACCOUNT_TYPE_META.wallet;
  const tagStyles = {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    backgroundColor: meta.iconBg,
    borderColor: meta.iconColor,
  };
  return (
    <View style={tagStyles}>
      <Label type="caption" weight="semiBold" style={{ color: meta.iconColor }}>
        {label}
      </Label>
    </View>
  );
};

const RecentActivityItem = ({
  iconName,
  iconColor,
  iconBg,
  title,
  subtitle,
  amount,
  accountLabel,
  accountType,
  isTransfer,
  toAccountLabel,
  pending,
  onPress,
}) => {
  const isPositive = amount >= 0 && !isTransfer;
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderSubtitle = () => {
    if (!isTransfer) {
      return (
        <Label
          type="bodyXs"
          weight="regular"
          color="textMuted"
          numberOfLines={1}
        >
          {subtitle}
        </Label>
      );
    }
    const parts = subtitle?.split('→') ?? [];
    return (
      <View style={styles.transferSubtitle}>
        <Label
          type="bodyXs"
          weight="regular"
          color="textMuted"
          numberOfLines={1}
        >
          {parts[0]?.trim()}
        </Label>
        <ArrowRight
          size={wp(4)}
          color={colors.primaryContainer}
          strokeWidth={2}
        />
        <Label
          type="bodyXs"
          weight="regular"
          color="textMuted"
          numberOfLines={1}
        >
          {parts[1]?.trim()}
        </Label>
      </View>
    );
  };

  const renderAmount = () => {
    if (isTransfer) {
      return (
        <Label type="bodySmall" weight="semiBold" color="textMuted">
          PKR {Math.abs(amount).toLocaleString()}
        </Label>
      );
    }
    return (
      <CurrencyView
        amount={Math.abs(amount)}
        type="bodySmall"
        weight="semiBold"
        positive={isPositive}
        negative={!isPositive}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={pending}
      activeOpacity={0.7}
      style={[styles.row, pending && styles.pending]}
    >
      {isTransfer ? (
        <View style={styles.transferIcon}>
          <ArrowRightLeft size={wp(6)} color="#0284C7" strokeWidth={1.8} />
        </View>
      ) : (
        <PaymentIcon
          name={iconName}
          backgroundColor={iconBg}
          color={iconColor}
          containerSize={wp(11)}
          size={wp(5.5)}
        />
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Label
            type="bodySmall"
            weight="semiBold"
            color="textMain"
            numberOfLines={1}
            style={styles.titleText}
          >
            {title}
          </Label>
          {accountLabel ? (
            <AccountTag
              label={isTransfer ? accountLabel : accountLabel}
              type={accountType}
            />
          ) : null}
        </View>

        {renderSubtitle()}
      </View>

      {renderAmount()}
    </TouchableOpacity>
  );
};

const createStyles = t =>
  StyleSheet.create({
    pending: { opacity: 0.55 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.lg,
      paddingVertical: wp(2),
      paddingHorizontal: wp(2),
      gap: wp(3),
      marginBottom: hp(1),
    },
    info: {
      flex: 1,
      gap: hp(0.3),
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      flexShrink: 1,
    },
    titleText: {
      flexShrink: 1,
    },
    transferIcon: {
      width: wp(11),
      height: wp(11),
      borderRadius: borderRadius.lg,
      backgroundColor: '#F0F9FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    transferSubtitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
    },
  });

export default RecentActivityItem;
