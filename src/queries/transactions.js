import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  createTransactionApi,
  createBulkTransactionsApi,
  getHomeDataApi,
  getTransactionsApi,
} from '../services/transactionService';
import useAccountStore from '../store/useAccountStore';
import { queryKeys } from './keys';

const PAGE_SIZE = 20;
// Recent-activity length the /dashboard endpoint returns
const RECENT_LIMIT = 5;

const currentMonth = () => {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
};

const toTime = d => (d ? new Date(d).getTime() : null);

/** Whether a transaction belongs in a list fetched with these filters. */
export const matchesFilters = (t, filters = {}) => {
  const { accountId, categoryIds, type, dateFrom, dateTo, minAmount, maxAmount } =
    filters;
  const accId = t.accountId?._id ?? t.accountId;
  if (accountId && accId !== accountId) return false;
  if (categoryIds?.length && !categoryIds.includes(t.category)) return false;
  if (type && t.type !== type) return false;
  const time = toTime(t.date);
  if (dateFrom && time < toTime(dateFrom)) return false;
  if (dateTo && time > toTime(dateTo)) return false;
  if (minAmount && t.amount < Number(minAmount)) return false;
  if (maxAmount && t.amount > Number(maxAmount)) return false;
  // Server-side search can't be predicted reliably; leave those lists alone
  if (filters.search) return false;
  return true;
};

const isUnfiltered = filters =>
  Object.values(filters).every(v => v === undefined);

// ─── Queries ────────────────────────────────────────────────────────────────

/** Paged History list. Keeps the previous list on screen while filters change. */
export const useTransactionList = filters =>
  useInfiniteQuery({
    queryKey: queryKeys.transactionList(filters),
    queryFn: ({ pageParam }) =>
      getTransactionsApi({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.pagination?.hasNextPage ? allPages.length + 1 : undefined,
    placeholderData: keepPreviousData,
    // Only the default (unfiltered) list is worth restoring on cold start
    meta: { persist: isUnfiltered(filters) },
  });

const dashboardQuery = () => {
  const { month, year } = currentMonth();
  return {
    queryKey: queryKeys.dashboard(month, year),
    queryFn: () => getHomeDataApi({ month, year }),
    meta: { persist: true },
  };
};

export const useDashboard = () => useQuery(dashboardQuery());

/**
 * Whether the user has ever logged an expense / income. The dashboard only
 * covers the current month, so it can't answer this; one row per type is
 * enough. Flipped to true locally when the user saves their first one.
 */
const activityQuery = {
  queryKey: queryKeys.activity,
  queryFn: async () => {
    const [expense, income] = await Promise.all(
      ['expense', 'income'].map(type =>
        getTransactionsApi({ type, limit: 1 }).then(
          res => (res.transactions?.length ?? 0) > 0,
        ),
      ),
    );
    return { expense, income };
  },
  // Only ever changes from false to true, which the app does itself
  staleTime: Infinity,
  meta: { persist: true },
};

export const useActivity = () => useQuery(activityQuery);

/**
 * Started during the splash so Home mounts with data. Includes the activity
 * probe, otherwise a new user would see the regular layout for a moment
 * before the getting-started checklist replaces it.
 */
export const prefetchHomeData = queryClient => {
  queryClient.prefetchQuery(dashboardQuery());
  queryClient.prefetchQuery(activityQuery);
};

/** After any server-side change to transactions or balances. */
export const invalidateTransactionData = queryClient => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['budget'] });
  useAccountStore.getState().fetchAccounts();
};

// ─── Optimistic create ──────────────────────────────────────────────────────

const adjustBalance = (accountId, delta) =>
  useAccountStore.setState(state => ({
    accounts: state.accounts.map(a =>
      a._id === accountId ? { ...a, balance: (a.balance ?? 0) + delta } : a,
    ),
  }));

const prependToFirstPage = (data, tx) => {
  if (!data?.pages?.length) return data;
  const [first, ...rest] = data.pages;
  return {
    ...data,
    pages: [{ ...first, transactions: [tx, ...first.transactions] }, ...rest],
  };
};

const replaceInPages = (data, id, tx) =>
  data?.pages && {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      transactions: page.transactions.map(t => (t._id === id ? tx : t)),
    })),
  };

/**
 * Mutation options for adding a transaction. The row appears in every
 * matching History list and on Home, and the balance moves, before the
 * server answers; all of it rolls back if the request fails.
 *
 * Callbacks live in the options (not mutate()'s second argument) so they still
 * run after AddTransaction has closed.
 */
export const createTransactionMutation = (queryClient, { onError } = {}) => ({
  mutationFn: ({ payload }) => createTransactionApi(payload),

  onMutate: async ({ payload, account }) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.transactionLists });
    await queryClient.cancelQueries({ queryKey: ['dashboard'] });

    const tempId = `temp-${Date.now()}`;
    const temp = { ...payload, _id: tempId, accountId: account, pending: true };
    const delta = payload.type === 'expense' ? -payload.amount : payload.amount;

    const lists = queryClient.getQueriesData({
      queryKey: queryKeys.transactionLists,
    });
    lists.forEach(([key, data]) => {
      if (data && matchesFilters(temp, key[2])) {
        queryClient.setQueryData(key, prependToFirstPage(data, temp));
      }
    });

    const txDate = new Date(payload.date);
    const dashboardKey = queryKeys.dashboard(
      txDate.getMonth(),
      txDate.getFullYear(),
    );
    const dashboard = queryClient.getQueryData(dashboardKey);
    if (dashboard) {
      queryClient.setQueryData(dashboardKey, {
        ...dashboard,
        totalExpenses:
          (dashboard.totalExpenses ?? 0) +
          (payload.type === 'expense' ? payload.amount : 0),
        recentTransactions: [temp, ...(dashboard.recentTransactions ?? [])]
          .sort((a, b) => toTime(b.date) - toTime(a.date))
          .slice(0, RECENT_LIMIT),
      });
    }

    adjustBalance(account._id, delta);
    return { tempId, lists, dashboardKey, dashboard, delta };
  },

  onSuccess: (saved, { payload }, ctx) => {
    // Swap the temp row for the server copy until the refetch lands
    queryClient
      .getQueriesData({ queryKey: queryKeys.transactionLists })
      .forEach(([key, data]) => {
        if (data?.pages) {
          queryClient.setQueryData(key, replaceInPages(data, ctx.tempId, saved));
        }
      });
    queryClient.setQueryData(queryKeys.activity, old => ({
      ...old,
      [payload.type]: true,
    }));
  },

  onError: (err, { account }, ctx) => {
    if (ctx) {
      ctx.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (ctx.dashboard) queryClient.setQueryData(ctx.dashboardKey, ctx.dashboard);
      adjustBalance(account._id, -ctx.delta);
    }
    onError?.(err);
  },

  onSettled: () => invalidateTransactionData(queryClient),
});

export const useCreateTransaction = options => {
  const queryClient = useQueryClient();
  return useMutation(createTransactionMutation(queryClient, options));
};

// ─── Bulk add ───────────────────────────────────────────────────────────────

/**
 * Puts server-confirmed transactions into the cached History lists (only the
 * lists whose filters match) and moves the balance, so the batch is visible
 * immediately while the background refetch catches up.
 */
const insertSavedTransactions = (queryClient, saved) => {
  queryClient
    .getQueriesData({ queryKey: queryKeys.transactionLists })
    .forEach(([key, data]) => {
      if (!data?.pages?.length) return;
      const present = new Set(
        data.pages.flatMap(p => p.transactions.map(t => t._id)),
      );
      const rows = saved.filter(
        t => !present.has(t._id) && matchesFilters(t, key[2]),
      );
      if (!rows.length) return;
      const [first, ...rest] = data.pages;
      queryClient.setQueryData(key, {
        ...data,
        pages: [{ ...first, transactions: [...rows, ...first.transactions] }, ...rest],
      });
    });
};

/**
 * Not optimistic, unlike single add: the user types a long list on a dedicated
 * screen, so on failure they must still have their text. The server saves the
 * batch atomically, so the outcome is simply "all added" or "nothing changed".
 */
export const createBulkTransactionsMutation = queryClient => ({
  mutationFn: createBulkTransactionsApi,
  onSuccess: (data, { accountId }) => {
    const saved = data.transactions ?? [];
    insertSavedTransactions(queryClient, saved);

    const net = saved.reduce(
      (sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount),
      0,
    );
    adjustBalance(accountId, net);

    const types = new Set(saved.map(t => t.type));
    queryClient.setQueryData(queryKeys.activity, old => ({
      ...old,
      ...Object.fromEntries([...types].map(type => [type, true])),
    }));
  },
  onSettled: () => invalidateTransactionData(queryClient),
});

export const useCreateBulkTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation(createBulkTransactionsMutation(queryClient));
};
