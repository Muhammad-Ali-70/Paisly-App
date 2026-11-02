import { useMemo } from 'react';
import useAccountStore from '../store/useAccountStore';
import useAppStore from '../store/useAppStore';
import { useDashboard } from '../queries/transactions';
import { useRecurring } from '../queries/recurring';
import { computeSafeToSpend } from '../utils/safeToSpend';

/**
 * Today's safe-to-spend figures from data the app already holds (balances, the
 * month's dashboard, recurring bills, payday). Null until the dashboard loads.
 */
const useSafeToSpend = () => {
  const accounts = useAccountStore(s => s.accounts);
  const paydayDay = useAppStore(s => s.paydayDay);
  const { data: dashboard } = useDashboard();
  const { data: bills } = useRecurring();

  return useMemo(() => {
    if (!dashboard) return null;
    const today = new Date().getDate();
    const onDay = list => list?.find(d => d.day === today)?.total ?? 0;
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
      paydayDay,
      spentToday,
    });
  }, [dashboard, accounts, bills, paydayDay]);
};

export default useSafeToSpend;
