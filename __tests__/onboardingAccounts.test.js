import {
  buildSeedAccounts,
  totalBalance,
  isValidBalanceInput,
} from '../src/utils/onboardingAccounts';

const bank = { id: 'bank-hbl', label: 'HBL', color: '#006', initials: 'HB', balance: '1500.50' };
const wallet = { id: 'wallet-easypaisa', label: 'Easypaisa', color: '#0a0', initials: 'EP', balance: '' };

test('always creates a primary Wallet Cash account, even at zero', () => {
  const [cash, ...rest] = buildSeedAccounts({ cash: '0' });
  expect(cash).toMatchObject({ type: 'wallet', balance: 0, isPrimary: true, sortOrder: 0 });
  expect(rest).toEqual([]);
});

test('keeps the payload shape the seed endpoint expects', () => {
  const accounts = buildSeedAccounts({
    cash: '250',
    banks: [bank, { ...bank, id: 'other', label: 'Other bank' }],
    wallets: [wallet],
  });
  expect(accounts.map(a => [a.type, a.sortOrder, a.isPrimary])).toEqual([
    ['wallet', 0, true],
    ['bank', 10, true],
    ['bank', 11, false],
    ['digitalWallet', 20, true],
  ]);
  expect(accounts[1]).toMatchObject({ sourceId: 'bank-hbl', balance: 1500.5 });
  expect(accounts[2].sourceId).toBeNull(); // "other" has no logo/source
  expect(accounts[3].balance).toBe(0); // blank balance counts as 0
});

test('totalBalance sums cash, banks and wallets; junk counts as 0', () => {
  expect(totalBalance({ cash: '100', banks: [bank], wallets: [wallet] })).toBe(1600.5);
  expect(totalBalance({ cash: '.' })).toBe(0);
});

test('isValidBalanceInput rejects empty and lone separators', () => {
  expect(isValidBalanceInput('0')).toBe(true);
  expect(isValidBalanceInput('12.5')).toBe(true);
  expect(isValidBalanceInput('')).toBe(false);
  expect(isValidBalanceInput('.')).toBe(false);
});
