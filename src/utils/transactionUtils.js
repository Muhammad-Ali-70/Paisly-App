import {
  getCategoryMeta,
  getCategoryLabel,
  CATEGORIES,
} from '../constants/theme/accountMeta';

export const CATEGORY_LABEL = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.label]),
);

export const formatTime = ts =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = ts => {
  const d = new Date(ts);
  return (
    d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

const dayKey = ts => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export const dayLabel = ts => {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const same = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (same(d, now)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Groups transactions by day and maps them to the display shape.
 * Expects API-shaped data where accountId is a populated object { _id, label, type, ... }.
 */
export const groupTransactions = (
  transactions,
  { search = '', category = null, acId = null, type = null } = {},
) => {
  let filtered = transactions;

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.description?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q),
    );
  }

  if (category) filtered = filtered.filter(t => t.category === category);
  if (type) filtered = filtered.filter(t => t.type === type);
  if (acId) {
    filtered = filtered.filter(t => {
      const id = t.accountId?._id ?? t.accountId;
      return id === acId;
    });
  }

  const buckets = {};

  filtered.forEach(t => {
    const dateTs =
      typeof t.date === 'string' ? new Date(t.date).getTime() : t.date;
    const key = dayKey(dateTs);

    if (!buckets[key]) {
      buckets[key] = {
        key,
        label: dayLabel(dateTs),
        transactions: [],
        total: 0,
      };
    }

    const meta = getCategoryMeta(t.category);
    const categoryLabel = getCategoryLabel(t.category);
    const account = t.accountId ?? null;
    const toAccount =
      t.toAccountId && typeof t.toAccountId === 'object'
        ? t.toAccountId
        : null;
    const id = t._id;
    const isTransfer = t.type === 'transfer';

    buckets[key].transactions.push({
      id,
      isTransfer,
      pending: !!t.pending,
      iconName: isTransfer ? 'transfer' : meta.iconName,
      iconBg: isTransfer ? '#F0F9FF' : meta.iconBg,
      iconColor: isTransfer ? '#0284C7' : meta.iconColor,
      title: isTransfer
        ? t.description?.trim() || 'Transfer'
        : t.description?.trim() || categoryLabel,
      subtitle: isTransfer
        ? `${account?.label ?? '—'} → ${toAccount?.label ?? '—'} · ${formatTime(dateTs)}`
        : `${categoryLabel} · ${formatTime(dateTs)}`,
      amount: isTransfer ? t.amount : t.type === 'expense' ? -t.amount : t.amount,
      accountLabel: account?.label ?? null,
      accountType: account?.type ?? null,
      toAccountLabel: toAccount?.label ?? null,
      toAccountType: toAccount?.type ?? null,
      raw: {
        id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        categoryLabel,
        description: t.description ?? '',
        note: t.note ?? '',
        date: dateTs,
        accountId: account?._id ?? t.accountId,
        accountLabel: account?.label ?? '—',
        accountType: account?.type ?? '—',
        toAccountId: toAccount?._id ?? null,
        toAccountLabel: toAccount?.label ?? null,
        toAccountType: toAccount?.type ?? null,
      },
    });

    if (isTransfer) {
      buckets[key].total += 0;
    } else {
      buckets[key].total += t.type === 'expense' ? -t.amount : t.amount;
    }
  });

  return Object.values(buckets);
};
