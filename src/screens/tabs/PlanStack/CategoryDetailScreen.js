import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/Screenheader';
import CurrencyView from '../../../components/common/CurrencyView';
import PaymentIcon from '../../../components/common/Paymenticon';
import RecentActivityItem from '../../../components/home/RecentActivityItem';
import TransactionDetailModal from '../../../components/modals/transaction/TransactionDetailModal';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label } from '../../../constants/globalstyle';
import { hp, wp } from '../../../constants/responsive';
import { getCategoryMeta, getCategoryLabel } from '../../../constants/theme/accountMeta';
import { getTransactionsApi } from '../../../services/transactionService';
import { groupTransactions } from '../../../utils/transactionUtils';
import { useCurrentBudget } from '../../../queries/budget';
import { queryKeys } from '../../../queries/keys';
import SkeletonSection from '../../../components/common/skeleton/SkeletonSection';

// Local calendar date (YYYY-MM-DD). toISOString() would convert to UTC first,
// which turns the 1st of the month into the previous day east of Greenwich.
const toLocalDate = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

const CategoryDetailScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: currentBudget } = useCurrentBudget();
  const meta = getCategoryMeta(category);
  const breakdown = currentBudget?.spending?.byCategory?.find(c => c.category === category);

  const [selectedTx, setSelectedTx] = useState(null);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  // Lives under ['transactions'], so adding a transaction refreshes it too
  const { data: rawTransactions, isPending } = useQuery({
    queryKey: queryKeys.categoryTransactions(category, month, year),
    queryFn: async () => {
      const data = await getTransactionsApi({
        categoryIds: [category],
        dateFrom: toLocalDate(new Date(year, month, 1)),
        dateTo: toLocalDate(new Date(year, month + 1, 0)),
        limit: 100,
      });
      return data.transactions;
    },
  });

  // RecentActivityItem expects the grouped display shape, not raw API rows
  const transactions = useMemo(
    () =>
      groupTransactions(rawTransactions ?? []).flatMap(g => g.transactions),
    [rawTransactions],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <RecentActivityItem {...item} onPress={() => setSelectedTx(item.raw)} />
    ),
    [],
  );

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title={breakdown?.label || getCategoryLabel(category)}
        onBack={() => navigation.goBack()}
        backIcon="arrow"
      />

      {breakdown && (
        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <PaymentIcon
              name={meta.iconName}
              backgroundColor={meta.iconBg}
              color={meta.iconColor}
              containerSize={wp(14)}
              size={wp(7)}
            />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Label type="bodyXs" weight="regular" color="textMuted">Spent</Label>
                <CurrencyView amount={breakdown.spent} type="bodySmall" weight="bold" color="textMain" />
              </View>
              {breakdown.limit && (
                <>
                  <View style={styles.summaryItem}>
                    <Label type="bodyXs" weight="regular" color="textMuted">Budget</Label>
                    <CurrencyView amount={breakdown.limit} type="bodySmall" weight="bold" color="textMain" />
                  </View>
                  <View style={styles.summaryItem}>
                    <Label type="bodyXs" weight="regular" color="textMuted">Remaining</Label>
                    <CurrencyView amount={breakdown.remaining} type="bodySmall" weight="bold" color={breakdown.remaining >= 0 ? 'primary' : 'error'} />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.transactionHeader}>
        <Label type="bodyXs" weight="semiBold" color="textMuted" style={styles.transactionLabel}>
          THIS MONTH
        </Label>
      </View>

      {isPending ? (
        <SkeletonSection itemCount={5} showHeader={false} style={styles.skeleton} />
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <Label type="bodySmall" weight="regular" color="textMuted">
            No transactions in this category this month
          </Label>
        </View>
      ) : (
        <FlashList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          estimatedItemSize={hp(7)}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TransactionDetailModal
        visible={!!selectedTx}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </View>
  );
};

const createStyles = (t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    summary: { paddingHorizontal: wp(5), marginTop: hp(2) },
    summaryCard: {
      backgroundColor: t.surfacePrimary,
      borderRadius: 16,
      padding: wp(5),
      alignItems: 'center',
      gap: hp(2),
    },
    summaryRow: { flexDirection: 'row', gap: wp(6) },
    summaryItem: { alignItems: 'center', gap: hp(0.3) },
    transactionHeader: { paddingHorizontal: wp(5), marginTop: hp(2.5), marginBottom: hp(1) },
    transactionLabel: { letterSpacing: 0.8 },
    listContent: { paddingHorizontal: wp(5), paddingBottom: hp(12) },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    skeleton: { marginTop: 0 },
  });

export default CategoryDetailScreen;
