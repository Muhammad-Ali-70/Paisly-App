import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from '../ui/BottomSheet';
import { Label } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import { hp, wp } from '../../constants/responsive';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const ordinal = n => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
};

export const paydayLabel = day => (day ? `${ordinal(day)} of the month` : 'Month end');

const PaydayModal = ({ visible, onClose, value, onSelect }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const choose = day => {
    onSelect(day);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="When do you get paid?">
      <Label type="bodyXs" weight="regular" color="textMuted" style={styles.hint}>
        Used to work out how much you can safely spend each day until your next
        payday. Short months use their last day.
      </Label>

      <View style={styles.grid}>
        {DAYS.map(day => {
          const active = value === day;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.cell, active && styles.cellActive]}
              activeOpacity={0.7}
              onPress={() => choose(day)}
            >
              <Label
                type="bodySmall"
                weight="semiBold"
                color={active ? 'onPrimary' : 'textMain'}
              >
                {day}
              </Label>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.monthEnd, !value && styles.cellActive]}
        activeOpacity={0.7}
        onPress={() => choose(null)}
      >
        <Label
          type="bodySmall"
          weight="semiBold"
          color={!value ? 'onPrimary' : 'textMain'}
        >
          No fixed day · use month end
        </Label>
      </TouchableOpacity>
    </BottomSheet>
  );
};

const createStyles = t =>
  StyleSheet.create({
    hint: { marginBottom: hp(1.5) },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
    cell: {
      width: wp(11.5),
      height: wp(11.5),
      borderRadius: wp(6),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceContainer,
    },
    cellActive: { backgroundColor: t.primary },
    monthEnd: {
      marginTop: hp(2),
      height: hp(6),
      borderRadius: wp(3),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.surfaceContainer,
    },
  });

export default PaydayModal;
