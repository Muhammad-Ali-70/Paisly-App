import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  createDebtApi,
  deleteDebtApi,
  getDebtByIdApi,
  getDebtsApi,
  getDebtSummaryApi,
  getDebtTransactionsApi,
  updateDebtApi,
} from '../services/debtService';
import { queryKeys } from './keys';
import { invalidateTransactionData } from './transactions';

const PAGE_SIZE = 10;

export const debtSummaryQuery = {
  queryKey: queryKeys.debtSummary,
  queryFn: async () => {
    const data = await getDebtSummaryApi();
    return {
      totalOutstanding: data.totalOutstanding || 0,
      totalReceivable: data.totalReceivable || 0,
    };
  },
  meta: { persist: true },
};

export const useDebtSummary = () => useQuery(debtSummaryQuery);

/** Paged debt list; keeps the previous results on screen while searching. */
export const useDebtList = search =>
  useInfiniteQuery({
    queryKey: queryKeys.debtList(search),
    queryFn: ({ pageParam }) =>
      getDebtsApi({
        search: search || undefined,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.pagination?.hasNextPage ? allPages.length + 1 : undefined,
    placeholderData: keepPreviousData,
    // Only the unfiltered list is worth restoring on cold start
    meta: { persist: !search },
  });

export const useDebt = id =>
  useQuery({
    queryKey: queryKeys.debt(id),
    queryFn: () => getDebtByIdApi(id),
    enabled: !!id,
  });

export const useDebtTransactions = id =>
  useQuery({
    queryKey: queryKeys.debtTransactions(id),
    queryFn: async () =>
      (await getDebtTransactionsApi(id, { limit: 10 })).transactions || [],
    enabled: !!id,
  });

/**
 * Create or update a debt. Creating one moves money into/out of the source
 * account and records a transaction on the server, so transaction data is
 * refreshed too; updates only change the debt itself.
 */
export const useSaveDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      id ? updateDebtApi(id, data) : createDebtApi(data),
    onSuccess: (_saved, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      if (!id) invalidateTransactionData(queryClient);
    },
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => deleteDebtApi(id),
    onSuccess: () => {
      // Soft delete on the server; no balances or transactions change. The
      // detail query is left alone: its screen is still mounted until it
      // navigates back, and refetching a deleted debt would 404.
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.debtSummary });
    },
  });
};
