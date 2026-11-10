const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

/**
 * Bills carry a calendar date stored as 12:00 UTC; read it back as that same
 * local calendar date instead of letting the timezone shift it.
 */
export const calendarDay = iso => {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

/**
 * The next payday after today. With no payday set the month's end counts: the
 * 1st of next month is when "this month's money" runs out. A payday that falls
 * on today starts a fresh period, so the next one is a month away.
 */
export const nextPayday = (paydayDay, now = new Date()) => {
  const today = startOfDay(now);
  const y = today.getFullYear();
  const m = today.getMonth();
  if (!paydayDay) return new Date(y, m + 1, 1);

  const thisMonth = new Date(y, m, Math.min(paydayDay, daysInMonth(y, m)));
  if (thisMonth > today) return thisMonth;
  const nextM = m + 1;
  return new Date(
    y,
    nextM,
    Math.min(paydayDay, daysInMonth(y, nextM)),
  );
};

/** Whole days from today through the day before `date` (at least 1). */
export const daysUntil = (date, now = new Date()) =>
  Math.max(1, Math.round((date - startOfDay(now)) / DAY_MS));

/** Expense bills still to pay before `payday` (overdue ones included). */
export const billsCommitted = (bills, payday) =>
  (bills ?? [])
    .filter(b => b.isActive && b.type === 'expense')
    .reduce((sum, b) => {
      let due = calendarDay(b.nextDueDate);
      let count = 0;
      // A weekly bill can fall due more than once before payday
      do {
        if (due < payday) count += 1;
        due = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 7);
      } while (b.frequency === 'weekly' && due < payday);
      return sum + count * b.amount;
    }, 0);

/** Udhar the user owes that falls due before `payday` (overdue ones included). */
export const debtsCommitted = (debts, payday) =>
  (debts ?? [])
    .filter(d => d.remainingAmount > 0 && calendarDayLocal(d.dueDate) < payday)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

// Debt due dates are full timestamps (not 12:00 UTC calendar days like bills)
const calendarDayLocal = iso => startOfDay(new Date(iso));

/**
 * What the user can spend today and still reach payday.
 *
 * Two limits, and the lower one wins, so the number never suggests more than
 * either allows (it still works for someone without a budget):
 *  - cash: balance minus bills and udhar repayments due before payday, spread
 *    over the days until payday;
 *  - budget: this month's budget left, spread over the days left in *this
 *    month* only (the budget resets on the 1st, so it can't fund days after).
 * Today's own spending is added back before dividing, so the daily allowance
 * stays put during the day and `leftToday` is what shrinks as they spend.
 */
export const computeSafeToSpend = ({
  balance,
  budgetRemaining = null,
  bills = [],
  debts = [],
  paydayDay = null,
  spentToday = 0,
  now = new Date(),
}) => {
  const payday = nextPayday(paydayDay, now);
  const daysLeft = daysUntil(payday, now);
  const billsDue = billsCommitted(bills, payday);
  const debtsDue = debtsCommitted(debts, payday);
  const committed = billsDue + debtsDue;

  const cashPool = balance - committed + spentToday;
  const cashDaily = cashPool / daysLeft;

  const hasBudget = budgetRemaining !== null && budgetRemaining !== undefined;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const budgetDays = Math.min(daysLeft, daysUntil(monthEnd, now));
  const budgetPool = hasBudget ? budgetRemaining + spentToday : Infinity;
  const budgetDaily = budgetPool / budgetDays;

  const limitedByBudget = hasBudget && budgetDaily < cashDaily;
  const pool = limitedByBudget ? budgetPool : cashPool;
  const daily = limitedByBudget ? budgetDaily : cashDaily;

  const allowance = daily > 0 ? Math.floor(daily) : 0;
  return {
    payday,
    daysLeft,
    committed,
    billsCommitted: billsDue,
    debtsCommitted: debtsDue,
    allowance,
    leftToday: allowance - spentToday,
    spentToday,
    // Not enough for the days ahead even at zero spend today
    shortfall: pool < 0 ? Math.ceil(-pool) : 0,
    limitedBy: limitedByBudget ? 'budget' : 'cash',
  };
};
