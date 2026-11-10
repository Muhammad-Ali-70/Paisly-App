import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import useAccountStore from '../store/useAccountStore';
import useAppStore, { selectHasPayday } from '../store/useAppStore';
import { useDashboard } from '../queries/transactions';
import { useRecurring } from '../queries/recurring';
import { useDebtSummary } from '../queries/debts';
import { computeSafeToSpend } from '../utils/safeToSpend';

const localDayKey = (d = new Date()) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const msUntilMidnight = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now + 1000;
};

/**
 * The current local day as a value that changes at midnight and when the app
 * comes back to the foreground on a new day. Without it a screen left open
 * overnight keeps yesterday's "spent today" and days-to-payday.
 */
const useToday = () => {
  const [day, setDay] = useState(localDayKey);

  useEffect(() => {
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDay(localDayKey());
        schedule();
      }, msUntilMidnight());
    };
    schedule();
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      setDay(localDayKey());
      schedule(); // timers don't fire reliably while backgrounded
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return day;
};

/**
 * Today's safe-to-spend figures from data the app already holds (balances, the
 * month's dashboard, recurring bills, udhar owed, payday). Null until the
 * dashboard loads, and null until the user has chosen a payday: without one the
 * figure would rest on a guessed deadline.
 */
const useSafeToSpend = () => {
  const accounts = useAccountStore(s => s.accounts);
  const paydayDay = useAppStore(s => s.paydayDay);
  const hasPayday = useAppStore(selectHasPayday);
  const { data: dashboard } = useDashboard();
  const { data: bills } = useRecurring();
  const { data: debtSummary } = useDebtSummary();
  const today = useToday();

  return useMemo(() => {
    if (!dashboard || !hasPayday) return null;
    const dayOfMonth = new Date().getDate();
    const onDay = list => list?.find(d => d.day === dayOfMonth)?.total ?? 0;
    // Paying a recurring bill isn't "spending today": it was already set aside
    // in the bills figure. (Older servers don't send the field; then it's 0.)
    const spentToday = Math.max(
      0,
      onDay(dashboard.dailySpending) - onDay(dashboard.dailyRecurringSpending),
    );
    return computeSafeToSpend({
      balance: accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0),
      budgetRemaining: dashboard.budget?.remaining ?? null,
      bills,
      // Older servers don't send payableDebts; then nothing is set aside
      debts: debtSummary?.payableDebts ?? [],
      paydayDay,
      spentToday,
    });
    // `today` re-runs this at midnight / on resume even when no data changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard, accounts, bills, debtSummary, paydayDay, hasPayday, today]);
};

export default useSafeToSpend;
