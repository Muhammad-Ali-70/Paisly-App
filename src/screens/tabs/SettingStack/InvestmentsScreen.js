import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { TrendingUp, Settings } from 'lucide-react-native';
import { hp, wp } from '../../../constants/responsive';
import { useThemeColors } from '@hooks/useThemeColors';
import { Label, borderRadius, shadowCard } from '../../../constants/globalstyle';
import ScreenHeader from '../../../components/common/Screenheader';
import SearchBar from '../../../components/ui/SearchBar';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import SkeletonSection from '../../../components/common/skeleton/SkeletonSection';
import { useInvestmentList } from '../../../queries/investments';
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus';
import { useDebounce } from '../../../hooks/useDebounce';
import CurrencyView from '../../../components/common/CurrencyView';

const FREQ_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

const STATUS_COLORS = {
  active: '#10B981',
  paused: '#F59E0B',
  stopped: '#EF4444',
  inactive: '#94A3B8',
};

const InvestmentItem = ({ item, onPress, themeColors, styles: s }) => (
  <TouchableOpacity
    style={[s.card, shadowCard, { backgroundColor: themeColors.surfacePrimary, borderColor: themeColors.outlineVariant }]}
    onPress={() => onPress(item._id)}
    activeOpacity={0.7}
  >
    <View style={s.cardHeader}>
      <View style={[s.iconWrap, { backgroundColor: themeColors.primary + '18' }]}>
        <TrendingUp size={wp(4.5)} color={themeColors.primary} strokeWidth={2} />
      </View>
      <View style={s.cardInfo}>
        <Label type="bodySmall" weight="semiBold" color="textMain" numberOfLines={1}>
          {item.title}
        </Label>
        <Label type="bodyXs" weight="regular" color="textMuted">
          {item.accountId?.label || 'Account'} · {FREQ_LABEL[item.frequency] || item.frequency}
        </Label>
      </View>
      <View style={[s.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#94A3B8') + '20' }]}>
        <Label type="caption" weight="semiBold" style={{ color: STATUS_COLORS[item.status] || '#94A3B8' }}>
          {item.status}
        </Label>
      </View>
    </View>

    <View style={s.cardBody}>
      <View style={s.statCol}>
        <Label type="bodyXs" weight="regular" color="textMuted">Principal</Label>
        <CurrencyView amount={item.principal} type="bodySmall" weight="semiBold" color="textMain" />
      </View>
      <View style={s.statCol}>
        <Label type="bodyXs" weight="regular" color="textMuted">Returned</Label>
        <CurrencyView amount={item.totalReturned} type="bodySmall" weight="semiBold" color="primary" />
      </View>
      <View style={s.statCol}>
        <Label type="bodyXs" weight="regular" color="textMuted">Next Due</Label>
        <Label type="bodyXs" weight="semiBold" color="textMain">
          {item.nextReturnDate
            ? new Date(item.nextReturnDate).toLocaleDateString()
            : '—'}
        </Label>
      </View>
    </View>
  </TouchableOpacity>
);

const InvestmentsScreen = ({ navigation }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const investmentsQuery = useInvestmentList();
  useRefreshOnFocus(['investments']);

  // The list endpoint has no search parameter, so filter the loaded rows
  const investments = useMemo(() => {
    const all = investmentsQuery.data?.pages.flatMap(p => p.investments || []) ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      i =>
        i.title?.toLowerCase().includes(q) ||
        i.accountId?.label?.toLowerCase().includes(q),
    );
  }, [investmentsQuery.data, debouncedSearch]);
  // Skeleton only on a true first load; cached lists render immediately
  const loading = investmentsQuery.isPending;
  const loadingMore = investmentsQuery.isFetchingNextPage;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await investmentsQuery.refetch();
    setRefreshing(false);
  }, [investmentsQuery]);

  const { hasNextPage, isFetching, fetchNextPage: loadNextPage } =
    investmentsQuery;
  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) loadNextPage();
  }, [hasNextPage, isFetching, loadNextPage]);

  const renderItem = useCallback(
    ({ item }) => (
      <InvestmentItem item={item} onPress={() => {}} themeColors={theme} styles={styles} />
    ),
    [theme, styles],
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Label type="bodySmall" weight="regular" color="textMuted" style={styles.empty}>
        {search ? 'No investments match your search.' : 'No investments yet.'}
      </Label>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={theme.primary} style={styles.loadingMore} />;
  };

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title="Investments"
        onBack={() => navigation.goBack()}
        backIcon="arrow"
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('InvestmentSettingsScreen')}
            activeOpacity={0.7}
          >
            <Settings size={wp(5.5)} color={theme.textMain} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search investments..."
        />
      </View>

      {loading ? (
        <SkeletonSection itemCount={4} showHeader={false} style={styles.skeleton} />
      ) : investmentsQuery.isError && investments.length === 0 ? (
        <View style={styles.loadingWrap}>
          <Label type="bodySmall" color="error" style={styles.empty}>
            {investmentsQuery.error?.message || 'Failed to load investments.'}
          </Label>
          <PrimaryButton
            variant="primary"
            size="sm"
            label="Retry"
            onPress={() => investmentsQuery.refetch()}
            style={styles.retry}
          />
        </View>
      ) : (

        <FlashList
          data={investments}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          estimatedItemSize={hp(14)}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.4}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.scrollContent}
        />
      )}
    </View>
  );
};

const createStyles = t =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.background },
    searchWrap: { paddingHorizontal: wp(5), marginBottom: hp(1.5), marginTop: hp(1) },
    scrollContent: { paddingBottom: hp(12), paddingHorizontal: wp(5) },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    skeleton: { marginTop: 0 },
    retry: { marginTop: hp(1.5) },
    empty: { textAlign: 'center', marginTop: hp(10) },
    loadingMore: { paddingVertical: hp(2) },
    card: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      padding: wp(4),
      marginBottom: hp(1.5),
      gap: hp(1.5),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
    },
    iconWrap: {
      width: wp(9),
      height: wp(9),
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: { flex: 1, gap: hp(0.2) },
    statusBadge: {
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.4),
      borderRadius: 999,
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: hp(1),
      borderTopWidth: 0.5,
      borderTopColor: t.outlineVariant,
    },
    statCol: { alignItems: 'flex-start', gap: hp(0.2) },
  });

export default InvestmentsScreen;
