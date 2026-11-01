import { useCallback, useMemo, useState } from 'react';
import { useTransactionList } from '../../queries/transactions';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { groupTransactions } from '../../utils/transactionUtils';

/**
 * History's view of the paged transaction list (TanStack infinite query).
 *
 * `loading` is only true while there is nothing to show yet: filter changes
 * keep the previous list on screen, and transactions saved from
 * AddTransaction are inserted into the cache optimistically.
 */
export const useTransactions = ({
  accountId,
  categoryIds,
  type,
  search,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
} = {}) => {
  // categoryIds arrives as a new array every render; key it by value
  const categoryKey = categoryIds?.join(',') ?? '';
  const filters = useMemo(
    () => ({
      accountId,
      categoryIds: categoryKey ? categoryKey.split(',') : undefined,
      type,
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
    }),
    [accountId, categoryKey, type, search, dateFrom, dateTo, minAmount, maxAmount],
  );

  const query = useTransactionList(filters);
  useRefreshOnFocus(['transactions', 'list']);
  const [refreshing, setRefreshing] = useState(false);

  const transactions = useMemo(
    () => query.data?.pages.flatMap(p => p.transactions) ?? [],
    [query.data],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // groupTransactions applies the local search/type filter
  const getGrouped = useCallback(
    (opts = {}) => groupTransactions(transactions, opts),
    [transactions],
  );

  return {
    transactions,
    loading: query.isPending,
    refreshing,
    loadingMore: isFetchingNextPage,
    // Errors only matter when there's no cached list to fall back on
    error: query.isError && !query.data ? query.error?.message : null,
    getGrouped,
    fetchNextPage: loadMore,
    refresh,
  };
};
