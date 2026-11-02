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

/**
 * What the user can spend today and still reach payday.
 *
 * The pool is the lower of the budget left and the cash left after upcoming
 * bills, so the number never suggests more than either allows, and it still
 * works for someone who hasn't set a budget. Today's own spending is added back
 * before dividing, so the daily allowance stays put during the day and
 * `leftToday` is what shrinks as they spend.
 */
export const computeSafeToSpend = ({
  balance,
  budgetRemaining = null,
  bills = [],
  paydayDay = null,
  spentToday = 0,
  now = new Date(),
}) => {
  const payday = nextPayday(paydayDay, now);
  const daysLeft = daysUntil(payday, now);
  const committed = billsCommitted(bills, payday);
  const cash = balance - committed;
  const hasBudget = budgetRemaining !== null && budgetRemaining !== undefined;
  const limitedByBudget = hasBudget && budgetRemaining < cash;
  const pool = (limitedByBudget ? budgetRemaining : cash) + spentToday;

  const allowance = pool > 0 ? Math.floor(pool / daysLeft) : 0;
  return {
    payday,
    daysLeft,
    committed,
    allowance,
    leftToday: allowance - spentToday,
    spentToday,
    // Not enough for the days ahead even at zero spend today
    shortfall: pool < 0 ? Math.ceil(-pool) : 0,
    limitedBy: limitedByBudget ? 'budget' : 'cash',
  };
};
