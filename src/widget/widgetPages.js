import { ACTIVE_CURRENCY, formatAmount } from '../utils/currency';
import { billsDueSoon, daysUntilDue, dueLabel } from '../utils/recurring';

// Runs in the app (not the headless widget task): turns app data into small,
// display-ready pages. The widget only has to draw one of them.

const DAY_MS = 24 * 60 * 60 * 1000;
const BILL_WINDOW_DAYS = 14;

const money = n =>
  `${ACTIVE_CURRENCY.symbol} ${formatAmount(String(Math.round(Math.abs(n))))}`;

const daysUntilDate = (date, now = new Date()) => {
  const due = new Date(date);
  const a = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / DAY_MS);
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
];

// What was actually spent: this month's total, with today's spend underneath.
// Needs no payday or bills set up, so it's the same for every user.
const spendPage = (dashboard, now = new Date()) => {
  if (!dashboard) return null;
  const today =
    dashboard.dailySpending?.find(d => d.day === now.getDate())?.total ?? 0;
  return {
    kind: 'spend',
    label: `Spent in ${MONTHS[now.getMonth()]}`,
    amount: money(dashboard.totalExpenses ?? 0),
    caption: today > 0 ? `Today: ${money(today)}` : 'Nothing spent today',
    tone: 'normal',
  };
};

const billPage = bills => {
  const due = billsDueSoon(bills, BILL_WINDOW_DAYS);
  if (!due.length) return null;
  const [next, ...rest] = due;
  const days = daysUntilDue(next);
  const more = rest.length ? ` · +${rest.length} more` : '';
  return {
    kind: 'bill',
    label: next.title,
    amount: money(next.amount),
    caption: `${dueLabel(days)}${more}`,
    tone: days <= 0 ? 'alert' : 'normal',
    uri: 'paisly://bills',
  };
};

const debtPage = debts => {
  const upcoming = [...(debts ?? [])].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
  );
  if (!upcoming.length) return null;
  const next = upcoming[0];
  const days = daysUntilDate(next.dueDate);
  const who = next.counterpartyName || next.description || 'someone';
  const more = upcoming.length > 1 ? ` · +${upcoming.length - 1} more` : '';
  return {
    kind: 'debt',
    label:
      next.debtType === 'receivable' ? `${who} owes you` : `You owe ${who}`,
    amount: money(next.remainingAmount),
    caption: `${dueLabel(days)}${more}`,
    tone: days <= 0 ? 'alert' : 'normal',
    uri: 'paisly://debts',
  };
};

const notificationsPage = unread =>
  unread > 0
    ? {
        kind: 'notifications',
        label: 'Notifications',
        amount: `${unread} unread`,
        caption: 'Tap to open',
        tone: 'normal',
        uri: 'paisly://notifications',
      }
    : null;

/**
 * The pages the widget cycles through. The month's spending always comes first;
 * the others appear only when there is something to show.
 */
export const buildWidgetPages = ({ dashboard, bills, debts, unread }) =>
  [
    spendPage(dashboard),
    billPage(bills),
    debtPage(debts),
    notificationsPage(unread),
  ].filter(Boolean);
