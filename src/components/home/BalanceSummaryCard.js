import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import { hp, wp } from '../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { getGradients } from '../../constants/colors';
import useAppStore from '@store/useAppStore';
import { Label, borderRadius, shadowCard } from '../../constants/globalstyle';
import { formatDisplay } from '../common/CurrencyView';
import RollingNumber from '../common/RollingNumber';

const BalanceSummaryCard = ({ totalBalance = 0, monthlyChange = '+2.4%' }) => {
  const theme = useThemeColors();
  const themeName = useAppStore(s => s.theme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const grads = getGradients(themeName);

  return (
    <LinearGradient
      colors={grads.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadowCard]}
    >
      <Label
        type="bodySmall"
        weight="medium"
        color="onPrimary"
        style={styles.label}
      >
        TOTAL BALANCE
      </Label>

      {/* Rolls softly to the new total when a transaction changes it */}
      <RollingNumber
        text={formatDisplay(totalBalance)}
        type="h4"
        weight="bold"
        color="onPrimary"
        style={styles.amount}
      />

      <View style={styles.badge}>
        <TrendingUp size={wp(3.5)} color={theme.onPrimary} strokeWidth={2} />
        <Label
          type="bodyXs"
          weight="semiBold"
          color="onPrimary"
          style={styles.badgeText}
        >
          {monthlyChange} this month
        </Label>
      </View>
    </LinearGradient>
  );
};

const createStyles = t =>
  StyleSheet.create({
    card: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      borderRadius: borderRadius.xl,
      padding: wp(5),
      gap: wp(0.5),
    },
    label: {
      opacity: 0.85,
    },
    amount: {
      marginTop: hp(0.2),
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      marginTop: hp(1.2),
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: borderRadius.full,
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.5),
    },
    badgeText: {
      opacity: 0.9,
    },
  });

export default BalanceSummaryCard;
