const toBalance = value => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Builds the accounts payload for POST /accounts/seed from the onboarding
 * state: the cash balance (a Wallet Cash account is always created, even at 0)
 * plus the banks and wallet apps the user added, in the order they added them.
 */
export const buildSeedAccounts = ({ cash, banks = [], wallets = [] }) => [
  {
    type: 'wallet',
    label: 'Wallet Cash',
    color: '#10B981',
    initials: 'WC',
    balance: toBalance(cash),
    isPrimary: true,
    sortOrder: 0,
  },
  ...banks.map((acct, idx) => ({
    type: 'bank',
    sourceId: acct.id === 'other' ? null : acct.id,
    label: acct.label,
    color: acct.color,
    initials: acct.initials,
    balance: toBalance(acct.balance),
    isPrimary: idx === 0,
    sortOrder: 10 + idx,
  })),
  ...wallets.map((acct, idx) => ({
    type: 'digitalWallet',
    sourceId: acct.id === 'other' ? null : acct.id,
    label: acct.label,
    color: acct.color,
    initials: acct.initials,
    balance: toBalance(acct.balance),
    isPrimary: idx === 0,
    sortOrder: 20 + idx,
  })),
];

export const totalBalance = ({ cash, banks = [], wallets = [] }) =>
  toBalance(cash) +
  banks.reduce((sum, a) => sum + toBalance(a.balance), 0) +
  wallets.reduce((sum, a) => sum + toBalance(a.balance), 0);

export const isValidBalanceInput = value => Number.isFinite(parseFloat(value));
