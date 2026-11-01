import React from 'react';
import { View, StyleSheet } from 'react-native';
import { wp, hp } from '../../constants/responsive';
import { Label } from '../../constants/globalstyle';
import BottomSheet from '../ui/BottomSheet';
import SelectableIcon from '../ui/SelectableIcon';
import useAccountStore from '../../store/useAccountStore';
import {
  getAccountTypeMeta,
  ACCOUNT_TYPE_META,
} from '../../constants/theme/accountMeta';
import { getAccountMeta } from '../../utils/accountMetaLookup';

const PaymentSourceModal = ({ visible, activeId, onSelect, onClose }) => {
  const accounts = useAccountStore(s => s.accounts);

  const handleSelect = id => {
    onSelect(id);
    onClose();
  };

  const groups = ['wallet', 'bank', 'digitalWallet']
    .map(type => ({
      type,
      label: ACCOUNT_TYPE_META[type].label.toUpperCase() + 'S',
      items: accounts.filter(a => a.type === type),
    }))
    .filter(g => g.items.length > 0);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Payment Source">
      {groups.map(group => (
        <View key={group.type}>
          <Label
            type="bodyXs"
            weight="semiBold"
            color="textMuted"
            style={styles.sectionLabel}
          >
            {group.label}
          </Label>

          <View style={styles.sourcesRow}>
            {group.items.map(account => {
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
                  onPress={() => handleSelect(account._id)}
                  size="grid"
                  imageUri={imageMeta.imageUri}
                  initials={imageMeta.initials}
                  color={imageMeta.color}
                />
              );
            })}
          </View>
        </View>
      ))}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    paddingHorizontal: wp(5),
    marginBottom: hp(1),
    letterSpacing: 0.6,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
    gap: wp(2),
  },
});

export default PaymentSourceModal;
