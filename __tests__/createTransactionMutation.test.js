import { QueryClient, MutationObserver } from '@tanstack/react-query';
import {
  createTransactionMutation,
  matchesFilters,
} from '../src/queries/transactions';
import { queryKeys } from '../src/queries/keys';
import useAccountStore from '../src/store/useAccountStore';
import { createTransactionApi } from '../src/services/transactionService';

jest.mock('../src/services/transactionService', () => ({
  createTransactionApi: jest.fn(),
  getHomeDataApi: jest.fn(),
  getTransactionsApi: jest.fn(),
}));
jest.mock('../src/services/apiClient', () => ({
  get: jest.fn(() => new Promise(() => {})),
}));

const account = { _id: 'acc1', label: 'Wallet', type: 'wallet' };
const payload = {
  accountId: 'acc1',
  type: 'expense',
  amount: 40,
  category: 'food',
  description: 'Lunch',
  date: new Date().toISOString(),
};

const now = new Date();
const dashboardKey = queryKeys.dashboard(now.getMonth(), now.getFullYear());
const allKey = queryKeys.transactionList({});
const incomeKey = queryKeys.transactionList({ type: 'income' });
const page = transactions => ({
  pages: [{ transactions, pagination: { hasNextPage: false } }],
  pageParams: [1],
});

let queryClient;
const ids = key =>
  queryClient.getQueryData(key).pages[0].transactions.map(t => t._id);
const balance = () => useAccountStore.getState().accounts[0].balance;

const run = (options = {}) => {
  const observer = new MutationObserver(
    queryClient,
    createTransactionMutation(queryClient, options),
  );
  return observer.mutate({ payload, account });
};

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // Seed the caches the way screens would have them
  queryClient.setQueryData(allKey, page([{ _id: 'old', type: 'expense' }]));
  queryClient.setQueryData(incomeKey, page([]));
  queryClient.setQueryData(dashboardKey, {
    totalExpenses: 100,
    recentTransactions: [],
  });
  useAccountStore.setState({ accounts: [{ ...account, balance: 100 }] });
});

afterEach(() => queryClient.clear());

test('inserts a pending row and moves the balance before the server answers', async () => {
  let resolve;
  createTransactionApi.mockReturnValue(new Promise(r => (resolve = r)));

  const done = run();
  await new Promise(r => setTimeout(r, 0)); // let onMutate run

  const [row] = queryClient.getQueryData(allKey).pages[0].transactions;
  expect(row.pending).toBe(true);
  expect(row.accountId).toEqual(account);
  // Lists whose filters don't match are left alone
  expect(ids(incomeKey)).toEqual([]);
  expect(queryClient.getQueryData(dashboardKey).totalExpenses).toBe(140);
  expect(balance()).toBe(60);

  resolve({ ...payload, _id: 'srv1', accountId: account });
  await done;

  expect(ids(allKey)).toEqual(['srv1', 'old']);
  expect(queryClient.getQueryData(queryKeys.activity)).toEqual({
    expense: true,
  });
});

test('rolls back lists, dashboard and balance when the server rejects', async () => {
  createTransactionApi.mockRejectedValue(new Error('Insufficient balance.'));
  const onError = jest.fn();

  await expect(run({ onError })).rejects.toThrow('Insufficient balance.');

  expect(ids(allKey)).toEqual(['old']);
  expect(queryClient.getQueryData(dashboardKey).totalExpenses).toBe(100);
  expect(balance()).toBe(100);
  expect(onError).toHaveBeenCalledWith(expect.any(Error));
});

test('matchesFilters mirrors the server-side list filters', () => {
  const tx = {
    accountId: { _id: 'acc1' },
    category: 'food',
    type: 'expense',
    amount: 40,
    date: '2026-11-02T10:00:00.000Z',
  };
  expect(matchesFilters(tx, {})).toBe(true);
  expect(matchesFilters(tx, { accountId: 'acc1', categoryIds: ['food'] })).toBe(
    true,
  );
  expect(matchesFilters(tx, { accountId: 'other' })).toBe(false);
  expect(matchesFilters(tx, { type: 'income' })).toBe(false);
  expect(matchesFilters(tx, { minAmount: '50' })).toBe(false);
  expect(matchesFilters(tx, { dateFrom: '2026-11-03' })).toBe(false);
  // Search results can't be predicted locally
  expect(matchesFilters(tx, { search: 'lunch' })).toBe(false);
});
