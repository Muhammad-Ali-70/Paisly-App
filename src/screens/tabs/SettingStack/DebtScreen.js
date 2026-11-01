import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PlusCircle, Search } from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import SearchBar from '../../../components/ui/SearchBar';
import SkeletonSection from '../../../components/common/skeleton/SkeletonSection';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { useDebtList, useDebtSummary } from '../../../queries/debts';
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDate } from '../../../utils/date';

const DebtItem = ({ debt, onPress, themeColors, styles }) => (
  <TouchableOpacity
    style={[
      styles.debtItem,
      {
        backgroundColor: themeColors.surfacePrimary,
        borderColor: themeColors.outlineVariant,
      },
    ]}
    onPress={() => onPress(debt._id)}
  >
    <View style={styles.debtInfo}>
      <Label type="bodySmall" weight="semiBold" color="textMain">
        {debt.description || 'No Description'}
      </Label>
      <Label type="bodyXs" weight="regular" color="textMuted">
        {debt.counterpartyName} - Due: {formatDate(debt.dueDate)}
      </Label>
    </View>
    <Label
      type="bodySmall"
      weight="semiBold"
      color={debt.debtType === 'receivable' ? 'primary' : 'error'}
    >
      PKR {debt.totalAmount?.toLocaleString() ?? '0'}
    </Label>
  </TouchableOpacity>
);

const DebtScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const debtsQuery = useDebtList(debouncedSearch.trim());
  const { data: summary } = useDebtSummary();
  // Pick up debts added/edited/deleted on other screens when coming back
  useRefreshOnFocus(['debts']);

  const debts = useMemo(
    () => debtsQuery.data?.pages.flatMap(p => p.data) ?? [],
    [debtsQuery.data],
  );
  // Skeleton only on a true first load; cached lists render immediately
  const loading = debtsQuery.isPending;
  const loadingMore = debtsQuery.isFetchingNextPage;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await debtsQuery.refetch();
    setRefreshing(false);
  }, [debtsQuery]);

  const { hasNextPage, isFetching, fetchNextPage: loadNextPage } = debtsQuery;
  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) loadNextPage();
  }, [hasNextPage, isFetching, loadNextPage]);

  const renderItem = useCallback(
    ({ item }) => (
      <DebtItem
        debt={item}
        onPress={id => navigation.navigate('DebtDetailScreen', { id })}
        themeColors={theme}
        styles={styles}
      />
    ),
    [navigation, theme, styles],
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Label
        type="bodySmall"
        weight="regular"
        color="textMuted"
        style={styles.empty}
      >
        {search ? 'No debts match your search.' : 'No debts yet.'}
      </Label>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <ActivityIndicator
        size="small"
        color={theme.primary}
        style={styles.loadingMore}
      />
    );
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Debt Calculator"
        onBack={() => navigation.goBack()}
      />

      {summary && (summary.totalOutstanding > 0 || summary.totalReceivable > 0) && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Label type="bodyXs" weight="regular" color="textMuted">
                I OWE
              </Label>
              <Label type="h6" weight="bold" color="error">
                PKR {summary.totalOutstanding.toLocaleString()}
              </Label>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Label type="bodyXs" weight="regular" color="textMuted">
                THEY OWE ME
              </Label>
              <Label type="h6" weight="bold" color="primary">
                PKR {summary.totalReceivable.toLocaleString()}
              </Label>
            </View>
          </View>
        </View>
      )}

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search debts..."
          leftIconName="search"
        />
      </View>

      {loading ? (
        <SkeletonSection itemCount={6} showHeader={false} style={styles.skeleton} />
      ) : debtsQuery.isError && debts.length === 0 ? (
        <View style={styles.errorWrap}>
          <Label type="bodySmall" color="error" style={styles.errorText}>
            {debtsQuery.error?.message || 'Failed to load debts.'}
          </Label>
          <PrimaryButton
            variant="primary"
            size="sm"
            label="Retry"
            onPress={() => debtsQuery.refetch()}
          />
        </View>
      ) : (

        <FlashList
          data={debts}
          keyExtractor={item => item._id || item.id}
          renderItem={renderItem}
          estimatedItemSize={hp(8)}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.4}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.scrollContent}
        />
      )}

      <View style={styles.fabWrap}>
        <PrimaryButton
          variant="primary"
          size="lg"
          label="Add New Debt"
          leftIcon={<PlusCircle size={wp(5)} color={theme.onPrimary} />}
          onPress={() => navigation.navigate('AddEditDebtScreen')}
        />
      </View>
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.background,
    },
    searchWrap: {
      paddingHorizontal: wp(5),
      marginBottom: hp(1.5),
      marginTop: hp(1),
    },
    scrollContent: {
      paddingBottom: hp(12),
      paddingHorizontal: wp(5),
    },
    skeleton: {
      marginTop: 0,
    },
    errorWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: hp(1.5),
    },
    errorText: {
      textAlign: 'center',
      paddingHorizontal: wp(10),
    },
    empty: {
      textAlign: 'center',
      marginTop: hp(10),
    },
    loadingMore: {
      paddingVertical: hp(2),
    },
    debtItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: hp(1.8),
      paddingHorizontal: wp(4),
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: hp(1),
    },
    debtInfo: {
      flex: 1,
      gap: hp(0.3),
    },
    fabWrap: {
      position: 'absolute',
      bottom: hp(3),
      width: '100%',
      paddingHorizontal: wp(5),
    },
    summaryCard: {
      marginHorizontal: wp(5),
      marginTop: hp(2),
      backgroundColor: t.surfacePrimary,
      borderRadius: 12,
      padding: wp(4),
      borderWidth: 1,
      borderColor: t.outlineVariant,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
      gap: hp(0.5),
    },
    summaryDivider: {
      width: 1,
      height: hp(4),
      backgroundColor: t.outlineVariant,
    },
  });

export default DebtScreen;
