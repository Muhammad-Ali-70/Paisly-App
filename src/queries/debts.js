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
  recordPaymentApi,
  updateDebtApi,
} from '../services/debtService';
import { queryKeys } from './keys';
import { invalidateTransactionData } from './transactions';
import useAppStore from '../store/useAppStore';
import { syncDebtReminders } from '../services/remindersService';

const PAGE_SIZE = 10;

/**
 * Rebuilds the local due-date reminders from the server's open debts. If the
 * fetch fails the existing reminders are left as they are.
 */
export const refreshDebtReminders = async () => {
  const { debtEnabled } = useAppStore.getState().reminders;
  if (!debtEnabled) return syncDebtReminders({ enabled: false });
  const lists = await Promise.all(
    ['active', 'partially_paid'].map(status =>
      getDebtsApi({ status, limit: 50 }),
    ),
  );
  return syncDebtReminders({
    enabled: true,
    debts: lists.flatMap(list => list.data),
  });
};

export const debtSummaryQuery = {
  queryKey: queryKeys.debtSummary,
  queryFn: async () => {
    const data = await getDebtSummaryApi();
    return {
      totalOutstanding: data.totalOutstanding || 0,
      totalReceivable: data.totalReceivable || 0,
      // Due within the week; the home-screen widget surfaces the soonest
      upcomingDebts: data.upcomingDebts || [],
      // Every open debt the user owes; safe-to-spend sets aside those due before payday
      payableDebts: data.payableDebts || [],
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

/**
 * Record a repayment (paid or received). The server creates the linked
 * transaction, moves the account balance and settles the debt once nothing
 * remains, so debts, transaction data, balances and reminders all refresh.
 */
export const useRecordDebtPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payment }) => recordPaymentApi(id, payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      invalidateTransactionData(queryClient);
      refreshDebtReminders().catch(() => {});
    },
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: id => deleteDebtApi(id),
    onSuccess: () => {
      // The server reverses the debt's transactions and balances, so those
      // refresh too. The detail query is left alone: its screen is still
      // mounted until it navigates back, and refetching a deleted debt 404s.
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.debtSummary });
      invalidateTransactionData(queryClient);
      refreshDebtReminders().catch(() => {});
    },
  });
};
