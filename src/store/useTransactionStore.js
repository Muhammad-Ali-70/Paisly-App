import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../services/storage';
import {
  createTransactionApi,
  getHomeDataApi,
  getTransactionsApi,
} from '../services/transactionService';
import { getDebtSummaryApi } from '../services/debtService';
import useAccountStore from './useAccountStore';

// Recent-activity length the /dashboard endpoint returns
const RECENT_LIMIT = 5;

let dashboardRequest = null;

const ACTIVITY_TYPES = ['expense', 'income'];

// Marks types seen in this month's data; asks the API (one row) only for
// types that have never been checked. A known `false` flips to true once the
// user logs that type (createTransaction) or it shows up on the dashboard.
const resolveActivity = async (activity, recent) => {
  const next = { ...activity };
  recent.forEach(t => {
    if (ACTIVITY_TYPES.includes(t.type)) next[t.type] = true;
  });
  await Promise.all(
    ACTIVITY_TYPES.filter(type => next[type] === null).map(type =>
      getTransactionsApi({ type, limit: 1 })
        .then(res => {
          next[type] = (res.transactions?.length ?? 0) > 0;
        })
        .catch(() => {}),
    ),
  );
  return next;
};

const adjustBalance = (accountId, delta) =>
  useAccountStore.setState(state => ({
    accounts: state.accounts.map(a =>
      a._id === accountId ? { ...a, balance: (a.balance ?? 0) + delta } : a,
    ),
  }));

/**
 * Cache for the dashboard plus an overlay of transactions the user just added.
 *
 * The overlay lets Home and History show a new transaction the moment it is
 * saved (stale-while-revalidate): entries start `pending`, get swapped for the
 * server copy on success, or are rolled back on failure. Once a transaction
 * list fetch that started after confirmation lands, the server data includes
 * the entry and `pruneConfirmed` drops it from the overlay. (Only the list
 * prunes: Home dedupes by id, so a lingering confirmed entry is harmless there.)
 */
const useTransactionStore = create(
  persist(
    (set, get) => ({
      dashboard: null,
      debtSummary: { totalOutstanding: 0, totalReceivable: 0 },
      dashboardError: null,
      overlay: [],
      // Bumped whenever server data changed; list hooks revalidate on it
      version: 0,
      // Whether the user has ever logged each type (null = not checked yet).
      // The dashboard only covers the current month, so it can't answer this.
      activity: { expense: null, income: null },
      checklistDismissed: false,

      dismissChecklist: () => set({ checklistDismissed: true }),

      // Concurrent callers (splash prefetch, Home focus) share one request
      fetchDashboard: () => {
        if (!dashboardRequest) {
          dashboardRequest = get()
            .loadDashboard()
            .finally(() => {
              dashboardRequest = null;
            });
        }
        return dashboardRequest;
      },

      loadDashboard: async () => {
        const now = new Date();
        try {
          const [data, debt] = await Promise.all([
            getHomeDataApi({ month: now.getMonth(), year: now.getFullYear() }),
            getDebtSummaryApi().catch(() => null),
          ]);
          // Resolved before the dashboard is stored so Home never flashes the
          // regular (empty) layout before the new-user layout.
          const activity = await resolveActivity(
            get().activity,
            data.recentTransactions ?? [],
          );
          set(state => ({
            dashboard: data,
            // `true` wins: a transaction saved while this request was in
            // flight may already have flipped a flag
            activity: {
              expense: state.activity.expense || activity.expense,
              income: state.activity.income || activity.income,
            },
            debtSummary: debt
              ? {
                  totalOutstanding: debt.totalOutstanding || 0,
                  totalReceivable: debt.totalReceivable || 0,
                }
              : state.debtSummary,
            dashboardError: null,
          }));
        } catch (err) {
          set({
            dashboardError: err?.message || 'Could not load your dashboard.',
          });
        }
      },

      /**
       * Optimistically adds a transaction: it appears in Home/History and the
       * account balance moves immediately. Resolves with the server copy;
       * rejects (after rolling back) with the API error.
       */
      createTransaction: async (payload, account) => {
        const tempId = `temp-${Date.now()}`;
        const delta =
          payload.type === 'expense' ? -payload.amount : payload.amount;

        set(state => ({
          overlay: [
            {
              ...payload,
              _id: tempId,
              accountId: account,
              pending: true,
            },
            ...state.overlay,
          ],
        }));
        adjustBalance(account._id, delta);

        try {
          const saved = await createTransactionApi(payload);
          set(state => ({
            overlay: state.overlay.map(t =>
              t._id === tempId ? { ...saved, confirmedAt: Date.now() } : t,
            ),
            version: state.version + 1,
            activity: { ...state.activity, [payload.type]: true },
          }));
          // Reconcile balances/totals with the server in the background
          useAccountStore.getState().fetchAccounts();
          get().fetchDashboard();
          return saved;
        } catch (err) {
          set(state => ({
            overlay: state.overlay.filter(t => t._id !== tempId),
          }));
          adjustBalance(account._id, -delta);
          throw err;
        }
      },

      // Server data changed outside the overlay (edits, deletes, transfers…)
      invalidate: () => {
        set(state => ({ version: state.version + 1 }));
        get().fetchDashboard();
      },

      pruneConfirmed: fetchStartedAt =>
        set(state => {
          const overlay = state.overlay.filter(
            t => !t.confirmedAt || t.confirmedAt >= fetchStartedAt,
          );
          return overlay.length === state.overlay.length ? state : { overlay };
        }),

      clear: () =>
        set({
          dashboard: null,
          debtSummary: { totalOutstanding: 0, totalReceivable: 0 },
          dashboardError: null,
          overlay: [],
          activity: { expense: null, income: null },
          checklistDismissed: false,
        }),
    }),
    {
      name: 'transaction-cache',
      storage: createJSONStorage(() => mmkvStorage),
      // The overlay is in-flight state; only the last good dashboard survives restarts
      partialize: state => ({
        dashboard: state.dashboard,
        debtSummary: state.debtSummary,
        activity: state.activity,
        checklistDismissed: state.checklistDismissed,
      }),
    },
  ),
);

/** Overlay entries not yet present in `list`, newest first. */
export const mergeOverlay = (list, overlay, predicate = () => true) => {
  if (overlay.length === 0) return list;
  const ids = new Set(list.map(t => t._id));
  const extra = overlay.filter(t => !ids.has(t._id) && predicate(t));
  if (extra.length === 0) return list;
  return [...extra, ...list].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

export { RECENT_LIMIT };

export default useTransactionStore;
