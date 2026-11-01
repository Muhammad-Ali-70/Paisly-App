import useTransactionStore, {
  mergeOverlay,
} from '../src/store/useTransactionStore';
import useAccountStore from '../src/store/useAccountStore';
import {
  createTransactionApi,
  getHomeDataApi,
  getTransactionsApi,
} from '../src/services/transactionService';

jest.mock('../src/services/transactionService', () => ({
  createTransactionApi: jest.fn(),
  getHomeDataApi: jest.fn(),
  getTransactionsApi: jest.fn(),
}));
jest.mock('../src/services/debtService', () => ({
  getDebtSummaryApi: jest.fn(() =>
    Promise.resolve({ totalOutstanding: 0, totalReceivable: 0 }),
  ),
}));
jest.mock('../src/services/apiClient', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
}));

const account = { _id: 'acc1', label: 'Wallet', type: 'wallet' };
const payload = {
  accountId: 'acc1',
  type: 'expense',
  amount: 40,
  category: 'food',
  description: 'Lunch',
  date: '2026-11-02T10:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useTransactionStore.getState().clear();
  useAccountStore.setState({ accounts: [{ ...account, balance: 100 }] });
  getHomeDataApi.mockResolvedValue({ recentTransactions: [], totalExpenses: 0 });
  getTransactionsApi.mockResolvedValue({ transactions: [] });
});

const balance = () => useAccountStore.getState().accounts[0].balance;

test('shows a pending row and moves the balance before the server answers', async () => {
  let resolve;
  createTransactionApi.mockReturnValue(new Promise(r => (resolve = r)));

  const promise = useTransactionStore
    .getState()
    .createTransaction(payload, account);

  const [row] = useTransactionStore.getState().overlay;
  expect(row.pending).toBe(true);
  expect(row.accountId).toEqual(account);
  expect(balance()).toBe(60);

  resolve({ ...payload, _id: 'srv1', accountId: account });
  await promise;

  const [confirmed] = useTransactionStore.getState().overlay;
  expect(confirmed._id).toBe('srv1');
  expect(confirmed.pending).toBeUndefined();
  expect(useTransactionStore.getState().activity.expense).toBe(true);
});

test('rolls back the row and the balance when the server rejects', async () => {
  createTransactionApi.mockRejectedValue(new Error('Insufficient balance.'));

  await expect(
    useTransactionStore.getState().createTransaction(payload, account),
  ).rejects.toThrow('Insufficient balance.');

  expect(useTransactionStore.getState().overlay).toHaveLength(0);
  expect(balance()).toBe(100);
});

test('pruneConfirmed drops only entries confirmed before the fetch started', () => {
  useTransactionStore.setState({
    overlay: [
      { _id: 'old', confirmedAt: 1000 },
      { _id: 'new', confirmedAt: 3000 },
      { _id: 'temp', pending: true },
    ],
  });
  useTransactionStore.getState().pruneConfirmed(2000);
  expect(useTransactionStore.getState().overlay.map(t => t._id)).toEqual([
    'new',
    'temp',
  ]);
});

test('mergeOverlay dedupes by id, filters, and keeps newest first', () => {
  const list = [{ _id: 'a', date: '2026-11-01' }];
  const overlay = [
    { _id: 'a', date: '2026-11-01' },
    { _id: 'b', date: '2026-11-02' },
    { _id: 'c', date: '2026-11-03', skip: true },
  ];
  const merged = mergeOverlay(list, overlay, t => !t.skip);
  expect(merged.map(t => t._id)).toEqual(['b', 'a']);
});

test('dashboard load probes activity once for never-checked types', async () => {
  getTransactionsApi.mockImplementation(({ type }) =>
    Promise.resolve({ transactions: type === 'income' ? [{ _id: 'i' }] : [] }),
  );

  await useTransactionStore.getState().fetchDashboard();
  expect(useTransactionStore.getState().activity).toEqual({
    expense: false,
    income: true,
  });
  expect(getTransactionsApi).toHaveBeenCalledTimes(2);

  await useTransactionStore.getState().fetchDashboard();
  expect(getTransactionsApi).toHaveBeenCalledTimes(2);
});
