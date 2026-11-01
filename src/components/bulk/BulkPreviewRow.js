import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, ChevronDown } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import PaymentIcon from '../common/Paymenticon';
import CurrencyView from '../common/CurrencyView';
import {
  getCategoryLabel,
  getCategoryMeta,
} from '../../constants/theme/accountMeta';

/**
 * One parsed line in Bulk Add's preview. Valid rows show the detected
 * category (tap to change) and type (tap to flip); invalid rows say why.
 */
const BulkPreviewRow = ({ row, onCategoryPress, onTypeToggle }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (row.error) {
    return (
      <View style={[styles.row, styles.rowError]}>
        <View style={styles.errorIcon}>
          <AlertCircle size={wp(5.5)} color={theme.error} strokeWidth={2} />
        </View>
        <View style={styles.info}>
          <Label type="bodySmall" weight="semiBold" color="textMain" numberOfLines={1}>
            {row.raw}
          </Label>
          <Label type="bodyXs" weight="regular" color="error">
            Line {row.line} · {row.error}
          </Label>
        </View>
      </View>
    );
  }

  const meta = getCategoryMeta(row.category);
  const isIncome = row.type === 'income';

  return (
    <View style={styles.row}>
      <PaymentIcon
        name={meta.iconName}
        backgroundColor={meta.iconBg}
        color={meta.iconColor}
        containerSize={wp(11)}
        size={wp(5.5)}
      />

      <View style={styles.info}>
        <Label type="bodySmall" weight="semiBold" color="textMain" numberOfLines={1}>
          {row.description || getCategoryLabel(row.category)}
        </Label>
        <TouchableOpacity
          onPress={() => onCategoryPress(row)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
          style={styles.categoryChip}
          accessibilityLabel={`Category ${getCategoryLabel(row.category)}, tap to change`}
        >
          <Label type="bodyXs" weight="regular" color="textMuted" numberOfLines={1}>
            {getCategoryLabel(row.category)}
          </Label>
          <ChevronDown size={wp(3)} color={theme.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.right}>
        <CurrencyView
          amount={row.amount}
          type="bodySmall"
          weight="semiBold"
          positive={isIncome}
          negative={!isIncome}
        />
        <TouchableOpacity
          onPress={() => onTypeToggle(row)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
          style={[
            styles.typeChip,
            { backgroundColor: isIncome ? theme.surfaceContainerLow : theme.errorContainer },
          ]}
          accessibilityLabel={`${isIncome ? 'Income' : 'Expense'}, tap to switch`}
        >
          <Label
            type="caption"
            weight="bold"
            color={isIncome ? 'primary' : 'error'}
          >
            {isIncome ? 'INCOME' : 'EXPENSE'}
          </Label>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      backgroundColor: t.surfacePrimary,
      borderRadius: borderRadius.lg,
      paddingVertical: wp(2.5),
      paddingHorizontal: wp(3),
    },
    rowError: {
      borderWidth: 1,
      borderColor: t.error,
    },
    errorIcon: {
      width: wp(11),
      height: wp(11),
      borderRadius: borderRadius.md,
      backgroundColor: t.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      gap: hp(0.4),
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1),
      alignSelf: 'flex-start',
    },
    right: {
      alignItems: 'flex-end',
      gap: hp(0.6),
    },
    typeChip: {
      paddingHorizontal: wp(2),
      paddingVertical: hp(0.3),
      borderRadius: borderRadius.full,
    },
  });

export default BulkPreviewRow;
