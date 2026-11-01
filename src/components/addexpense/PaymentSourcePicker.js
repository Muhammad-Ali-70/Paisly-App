import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { hp, wp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import SelectableIcon from '../ui/SelectableIcon';
import useAccountStore from '../../store/useAccountStore';
import { getAccountTypeMeta } from '../../constants/theme/accountMeta';
import { getAccountMeta } from '../../utils/accountMetaLookup';
import { useThemeColors } from '@hooks/useThemeColors';

const PaymentSourcePicker = ({ activeId, onSelect, onSeeAll }) => {
  const accounts = useAccountStore(s => s.accounts);
  const loading = useAccountStore(s => s.loading);

  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const ordered = [
    ...accounts.filter(a => a.type === 'wallet'),
    ...accounts.filter(a => a.type !== 'wallet'),
  ];
  const quickAccounts = ordered.slice(0, 3);
  // An account picked from "See All" must stay visible (and highlighted) in
  // the row, so it takes the last slot when it isn't one of the first three.
  const active = ordered.find(a => a._id === activeId);
  if (active && !quickAccounts.includes(active)) {
    quickAccounts[quickAccounts.length - 1] = active;
  }

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Label type="bodyMedium" weight="semiBold" color="textMain">
          Payment Source
        </Label>
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Label type="bodySmall" weight="semiBold" color="primary">
            See All
          </Label>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {quickAccounts.map(account => {
          const meta = getAccountTypeMeta(account.type);
          const imageMeta = getAccountMeta(account.type, account.sourceId);
          return (
            <SelectableIcon
              key={account._id}
              iconName={meta.iconName}
              iconBg={meta.iconBg}
              iconColor={meta.iconColor}
              label={account.label}
              active={activeId === account._id}
              onPress={() => onSelect(account._id)}
              size="lg"
              imageUri={imageMeta.imageUri}
              initials={imageMeta.initials}
              color={imageMeta.color}
            />
          );
        })}
      </View>
    </View>
  );
};

const createStyles = t => StyleSheet.create({
  section: { marginHorizontal: wp(5), gap: hp(1.2) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', gap: wp(3) },
});

export default PaymentSourcePicker;
