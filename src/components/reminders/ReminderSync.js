import { useEffect } from 'react';
import { AppState } from 'react-native';
import useAppStore from '../../store/useAppStore';
import { queryClient } from '../../services/queryClient';
import { dayKey, syncDailyReminder } from '../../services/remindersService';
import { handleLaunchNotification } from '../../services/reminderEvents';
import { refreshDebtReminders } from '../../queries/debts';
import { refreshBillReminders } from '../../queries/recurring';

const warn = label => error => console.warn(`[Reminders] ${label}:`, error);

const syncDaily = () => {
  const r = useAppStore.getState().reminders;
  syncDailyReminder({
    enabled: r.dailyEnabled,
    hour: r.dailyHour,
    minute: r.dailyMinute,
    loggedToday: r.lastLoggedDay === dayKey(),
  }).catch(warn('daily'));
};

// Several triggers (launch, foreground, a debt query landing) often arrive together
let debtTimer;
const syncDebts = () => {
  clearTimeout(debtTimer);
  debtTimer = setTimeout(
    () => refreshDebtReminders().catch(warn('debts')),
    1500,
  );
};

let billTimer;
const syncBills = () => {
  clearTimeout(billTimer);
  billTimer = setTimeout(
    () => refreshBillReminders().catch(warn('bills')),
    1500,
  );
};

/**
 * Keeps the local notifications in step with the settings and the data. Mounted
 * only in the signed-in tree. Renders nothing.
 */
const ReminderSync = () => {
  const {
    dailyEnabled,
    dailyHour,
    dailyMinute,
    debtEnabled,
    billEnabled,
    lastLoggedDay,
  } = useAppStore(s => s.reminders);

  useEffect(syncDaily, [
    dailyEnabled,
    dailyHour,
    dailyMinute,
    lastLoggedDay,
  ]);

  useEffect(syncDebts, [debtEnabled]);
  useEffect(syncBills, [billEnabled]);

  useEffect(() => {
    handleLaunchNotification().catch(warn('launch'));

    // Coming back after midnight changes what "today" means, and debts may have
    // changed on another device
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      syncDaily();
      syncDebts();
      syncBills();
    });
    // Any debt created, edited, paid off or deleted refetches a ['debts'] query
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.type !== 'updated' || event.action.type !== 'success') return;
      const scope = event.query.queryKey[0];
      if (scope === 'debts') syncDebts();
      if (scope === 'recurring') syncBills();
    });
    return () => {
      appState.remove();
      unsubscribe();
      clearTimeout(debtTimer);
      clearTimeout(billTimer);
    };
  }, []);

  return null;
};

export default ReminderSync;
