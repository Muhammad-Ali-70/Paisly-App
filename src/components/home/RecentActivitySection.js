import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { hp, wp } from '../../constants/responsive';
import { Label, borderRadius } from '../../constants/globalstyle';
import { useThemeColors } from '@hooks/useThemeColors';
import RecentActivityItem from './RecentActivityItem';
import TransactionDetailModal from '../modals/transaction/TransactionDetailModal';

const RecentActivitySection = ({
  label = 'Recent Activity',
  total,
  transactions = [],
  onSeeAll,
  onAddPress,
}) => {
  const [selectedTx, setSelectedTx] = useState(null);
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <View style={styles.section}>
        <View style={styles.header}>
          <Label type="headingXs" weight="bold" color="textMain">
            {label}
          </Label>

          {onSeeAll ? (
            <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
              <Label type="bodySmall" weight="semiBold" color="primary">
                See All
              </Label>
            </TouchableOpacity>
          ) : total !== undefined ? (
            <Label
              type="bodySmall"
              weight="semiBold"
              color={total >= 0 ? 'primary' : 'error'}
            >
              {total >= 0 ? '+' : ''}PKR {Math.abs(total).toLocaleString()}
            </Label>
          ) : null}
        </View>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Receipt size={wp(7)} color={theme.textMuted} strokeWidth={1.5} />
            <Label type="bodySmall" weight="semiBold" color="textMain">
              Nothing logged this month
            </Label>
            <Label
              type="bodyXs"
              weight="regular"
              color="textMuted"
              style={styles.emptyText}
            >
              Add today's spending to keep your monthly picture accurate.
            </Label>
            {onAddPress && (
              <TouchableOpacity onPress={onAddPress} activeOpacity={0.7}>
                <Label type="bodySmall" weight="semiBold" color="primary">
                  Add a transaction
                </Label>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlashList
            data={transactions}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            estimatedItemSize={hp(8)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <RecentActivityItem
                {...item}
                onPress={() => setSelectedTx(item.raw)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      <TransactionDetailModal
        visible={!!selectedTx}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
};

const createStyles = t =>
  StyleSheet.create({
    section: {
      marginHorizontal: wp(5),
      marginTop: hp(2.5),
      gap: hp(1.5),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    list: {
      paddingBottom: hp(0.5),
    },
    separator: {
      height: hp(1.2),
    },
    empty: {
      alignItems: 'center',
      gap: hp(0.8),
      paddingVertical: hp(3),
      paddingHorizontal: wp(6),
      borderRadius: borderRadius.lg,
      backgroundColor: t.surfacePrimary,
    },
    emptyText: {
      textAlign: 'center',
    },
  });

export default RecentActivitySection;
