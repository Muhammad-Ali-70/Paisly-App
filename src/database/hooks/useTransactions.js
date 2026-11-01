import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTransactionsApi } from '../../services/transactionService';
import { groupTransactions } from '../../utils/transactionUtils';
import useTransactionStore, {
  mergeOverlay,
} from '../../store/useTransactionStore';

const toTime = d => (d ? new Date(d).getTime() : null);

/**
 * Fetches transactions from the backend with pagination and filters.
 *
 * Stale-while-revalidate: `loading` is only true while there is nothing to show
 * yet. Later reloads (filter changes, pull-to-refresh, a new transaction being
 * saved) keep the current list on screen and swap it when the response lands.
 * Just-added transactions from useTransactionStore are merged in immediately.
 */
export const useTransactions = ({
  accountId,
  categoryIds,
  type,
  search,
  month,
  year,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
} = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const overlay = useTransactionStore(s => s.overlay);
  const version = useTransactionStore(s => s.version);
  const pruneConfirmed = useTransactionStore(s => s.pruneConfirmed);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const hasDataRef = useRef(false);
  // Ignore responses from superseded requests (fast filter/search changes)
  const requestIdRef = useRef(0);

  // categoryIds arrives as a new array every render; key it by value
  const categoryKey = categoryIds?.join(',') ?? '';

  const fetchTransactions = useCallback(
    async ({ page = 1, append = false, pullToRefresh = false } = {}) => {
      const requestId = ++requestIdRef.current;
      const startedAt = Date.now();

      if (append) setLoadingMore(true);
      else if (pullToRefresh) setRefreshing(true);
      else if (!hasDataRef.current) setLoading(true);

      try {
        const data = await getTransactionsApi({
          accountId,
          categoryIds: categoryKey ? categoryKey.split(',') : undefined,
          type,
          search,
          month,
          year,
          dateFrom,
          dateTo,
          minAmount,
          maxAmount,
          page,
          limit: 20,
        });
        if (requestId !== requestIdRef.current) return;

        setTransactions(prev =>
          append ? [...prev, ...data.transactions] : data.transactions,
        );
        setPagination(data.pagination);
        hasMoreRef.current = data.pagination.hasNextPage;
        pageRef.current = page;
        hasDataRef.current = true;
        setError(null);
        if (page === 1) pruneConfirmed(startedAt);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        // Keep showing stale data; only surface the error when there is none
        if (!hasDataRef.current) {
          setError(err.message ?? 'Failed to load transactions');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [
      accountId,
      categoryKey,
      type,
      search,
      month,
      year,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      pruneConfirmed,
    ],
  );

  // Initial load, filter changes, and server-side changes (new/edited data)
  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    fetchTransactions({ page: 1, append: false });
  }, [fetchTransactions, version]);

  // Called by FlashList onEndReached
  const fetchNextPage = useCallback(() => {
    if (!hasMoreRef.current || loadingMore || loading) return;
    fetchTransactions({ page: pageRef.current + 1, append: true });
  }, [fetchTransactions, loadingMore, loading]);

  const refresh = useCallback(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    fetchTransactions({ page: 1, append: false, pullToRefresh: true });
  }, [fetchTransactions]);

  // Overlay entries only show when they would match the server-side filters
  const matchesFilters = useCallback(
    t => {
      const accId = t.accountId?._id ?? t.accountId;
      if (accountId && accId !== accountId) return false;
      if (categoryKey && !categoryKey.split(',').includes(t.category)) {
        return false;
      }
      if (type && t.type !== type) return false;
      const time = toTime(t.date);
      if (dateFrom && time < toTime(dateFrom)) return false;
      if (dateTo && time > toTime(dateTo)) return false;
      if (minAmount && t.amount < Number(minAmount)) return false;
      if (maxAmount && t.amount > Number(maxAmount)) return false;
      return true;
    },
    [accountId, categoryKey, type, dateFrom, dateTo, minAmount, maxAmount],
  );

  const merged = useMemo(
    () => mergeOverlay(transactions, overlay, matchesFilters),
    [transactions, overlay, matchesFilters],
  );

  const totalExpenses = merged
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = merged
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // groupTransactions applies the local search/type filter (covers overlay rows too)
  const getGrouped = useCallback(
    (opts = {}) => groupTransactions(merged, opts),
    [merged],
  );

  return {
    transactions: merged,
    loading,
    refreshing,
    loadingMore,
    pagination,
    error,
    totalExpenses,
    totalIncome,
    getGrouped,
    fetchNextPage,
    refresh,
  };
};
