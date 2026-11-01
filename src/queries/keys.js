// Query keys in one place so invalidation stays consistent. Keys are
// hierarchical: invalidating ['transactions'] also hits every list below it.
export const queryKeys = {
  dashboard: (month, year) => ['dashboard', month, year],
  activity: ['activity'],

  transactionLists: ['transactions', 'list'],
  transactionList: filters => ['transactions', 'list', filters],
  categoryTransactions: (category, month, year) => [
    'transactions',
    'category',
    category,
    month,
    year,
  ],

  notifications: ['notifications', 'list'],
  unreadCount: ['notifications', 'unread'],

  budget: ['budget', 'current'],
  budgetTemplates: income => ['budget', 'templates', income],

  debtSummary: ['debts', 'summary'],
  debtList: search => ['debts', 'list', search],
  debt: id => ['debts', 'detail', id],
  debtTransactions: id => ['debts', 'detail', id, 'transactions'],

  investmentList: search => ['investments', 'list', search],
};
