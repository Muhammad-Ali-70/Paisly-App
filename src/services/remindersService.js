import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import { ACTIVE_CURRENCY, formatAmount } from '../utils/currency';

// A sync queued just before logout can run after cancelAllReminders; checking
// the session when it runs stops the old user's reminders being rescheduled.
// Lazy require avoids a circular import (the auth store imports this file).
const hasSession = () => !!require('../store/useAuthStore').default.getState().token;

// Everything here is local: the phone already knows the reminder time and the
// debt due dates, so no server or FCM is involved. Notification ids are
// deterministic so scheduling the same thing twice replaces it.

export const REMINDER_ACTIONS = {
  ADD_EXPENSE: 'ADD_EXPENSE',
  VIEW_DEBTS: 'VIEW_DEBTS',
  VIEW_BILLS: 'VIEW_BILLS',
};

const CHANNELS = {
  daily: 'daily-reminder',
  debt: 'debt-reminders',
  bill: 'bill-reminders',
};
const BILL_PREFIX = 'bill-';
const DAILY_ID = 'daily';
const DEBT_PREFIX = 'debt-';

// Android caps pending alarms (~500 on some devices); the soonest-due debts matter most
const MAX_DEBTS = 40;
const DEBT_REMINDER_HOUR = 9;
const DAY_MS = 24 * 60 * 60 * 1000;

// "Around this time" is enough for a nudge, and inexact alarms need no special
// permission (exact alarms are denied by default on Android 14+).
const trigger = (timestamp, repeatFrequency) => ({
  type: TriggerType.TIMESTAMP,
  timestamp,
  alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE },
  ...(repeatFrequency !== undefined && { repeatFrequency }),
});

// Calls run one after another so a sync can't interleave with the next one
let queue = Promise.resolve();
const enqueue = task => {
  queue = queue.then(task, task);
  return queue;
};

const ensureChannels = async () => {
  await notifee.createChannel({
    id: CHANNELS.daily,
    name: 'Daily reminder',
    importance: AndroidImportance.DEFAULT,
  });
  await notifee.createChannel({
    id: CHANNELS.debt,
    name: 'Debt reminders',
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: CHANNELS.bill,
    name: 'Bill reminders',
    importance: AndroidImportance.HIGH,
  });
};

/** Asks for POST_NOTIFICATIONS (Android 13+). Returns true when notifications can show. */
export const requestReminderPermission = async () => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
};

export const openNotificationSettings = () => notifee.openNotificationSettings();

export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

// ── Daily "log your spending" reminder ──────────────────────────────────────

const nextDailyTimestamp = (hour, minute, skipToday) => {
  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  if (skipToday || at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
  return at.getTime();
};

/**
 * Schedules (or moves) the repeating daily reminder. When the user already
 * logged something today the first fire is tomorrow, so nobody is nagged for
 * something they've done.
 */
export const syncDailyReminder = ({ enabled, hour, minute, loggedToday }) =>
  enqueue(async () => {
    if (!enabled) {
      await notifee.cancelTriggerNotification(DAILY_ID);
      return;
    }
    await ensureChannels();
    await notifee.createTriggerNotification(
      {
        id: DAILY_ID,
        title: 'Log today’s spending',
        body: 'Add what you spent today while you still remember it.',
        data: { action: REMINDER_ACTIONS.ADD_EXPENSE },
        android: {
          channelId: CHANNELS.daily,
          smallIcon: 'ic_notification',
          color: '#10B981',
          pressAction: { id: 'default', launchActivity: 'default' },
        },
      },
      trigger(
        nextDailyTimestamp(hour, minute, loggedToday),
        RepeatFrequency.DAILY,
      ),
    );
  });

// ── Debt due-date reminders ─────────────────────────────────────────────────

const atReminderHour = date => {
  const at = new Date(date);
  at.setHours(DEBT_REMINDER_HOUR, 0, 0, 0);
  return at;
};

const money = amount =>
  `${ACTIVE_CURRENCY.symbol} ${formatAmount(String(Math.round(amount || 0)))}`;

const debtText = debt => {
  const who = debt.counterpartyName || 'someone';
  return debt.debtType === 'receivable'
    ? `${who} owes you ${money(debt.remainingAmount)}`
    : `You owe ${who} ${money(debt.remainingAmount)}`;
};

const debtNotification = (id, title, debt) => ({
  id,
  title,
  body: debtText(debt),
  data: { action: REMINDER_ACTIONS.VIEW_DEBTS },
  android: {
    channelId: CHANNELS.debt,
    smallIcon: 'ic_notification',
    // Names and amounts stay hidden on the lock screen
    visibility: AndroidVisibility.PRIVATE,
    color: '#10B981',
    pressAction: { id: 'default', launchActivity: 'default' },
  },
});

/**
 * Replaces every pending debt reminder with the ones the current debt list
 * implies: one a few days before the due date and one on the day. Rebuilding
 * from the list (instead of patching per change) also covers a fresh install,
 * debts edited on another device and settled or deleted debts.
 */
export const syncDebtReminders = ({ enabled, debts = [] }) =>
  enqueue(async () => {
    const pending = await notifee.getTriggerNotificationIds();
    const stale = pending.filter(id => id.startsWith(DEBT_PREFIX));
    if (stale.length) await notifee.cancelTriggerNotifications(stale);
    if (!enabled || !hasSession()) return;

    await ensureChannels();
    const now = Date.now();
    const open = debts
      .filter(d => d.status !== 'settled' && d.status !== 'waived')
      .filter(d => new Date(d.dueDate).getTime() > now - DAY_MS)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, MAX_DEBTS);

    for (const debt of open) {
      const due = atReminderHour(debt.dueDate);
      const daysBefore = debt.reminderDaysBefore ?? 3;

      if (daysBefore > 0) {
        const early = due.getTime() - daysBefore * DAY_MS;
        if (early > now) {
          await notifee.createTriggerNotification(
            debtNotification(
              `${DEBT_PREFIX}${debt._id}-early`,
              `Due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`,
              debt,
            ),
            trigger(early),
          );
        }
      }
      if (due.getTime() > now) {
        await notifee.createTriggerNotification(
          debtNotification(`${DEBT_PREFIX}${debt._id}-due`, 'Due today', debt),
          trigger(due.getTime()),
        );
      }
    }
  });

// ── Recurring bill reminders ────────────────────────────────────────────────

const billNotification = (id, title, bill) => ({
  id,
  title,
  body: `${bill.title} · ${money(bill.amount)}`,
  data: { action: REMINDER_ACTIONS.VIEW_BILLS },
  android: {
    channelId: CHANNELS.bill,
    smallIcon: 'ic_notification',
    visibility: AndroidVisibility.PRIVATE,
    color: '#10B981',
    pressAction: { id: 'default', launchActivity: 'default' },
  },
});

/**
 * Same rebuild-from-the-list approach as the debt reminders, under its own id
 * prefix. Bills hold a calendar date stored at 12:00 UTC, so it is read back as
 * that local calendar day before the reminder hour is applied.
 */
export const syncBillReminders = ({ enabled, bills = [] }) =>
  enqueue(async () => {
    const pending = await notifee.getTriggerNotificationIds();
    const stale = pending.filter(id => id.startsWith(BILL_PREFIX));
    if (stale.length) await notifee.cancelTriggerNotifications(stale);
    if (!enabled || !hasSession()) return;

    await ensureChannels();
    const now = Date.now();
    const upcoming = bills
      .filter(b => b.isActive)
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
      .slice(0, MAX_DEBTS);

    for (const bill of upcoming) {
      const iso = new Date(bill.nextDueDate);
      const due = new Date(
        iso.getUTCFullYear(),
        iso.getUTCMonth(),
        iso.getUTCDate(),
        DEBT_REMINDER_HOUR,
      );
      const daysBefore = bill.reminderDaysBefore ?? 2;

      if (daysBefore > 0) {
        const early = due.getTime() - daysBefore * DAY_MS;
        if (early > now) {
          await notifee.createTriggerNotification(
            billNotification(
              `${BILL_PREFIX}${bill._id}-early`,
              `Bill due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`,
              bill,
            ),
            trigger(early),
          );
        }
      }
      if (due.getTime() > now) {
        await notifee.createTriggerNotification(
          billNotification(
            `${BILL_PREFIX}${bill._id}-due`,
            bill.type === 'income' ? 'Expected today' : 'Bill due today',
            bill,
          ),
          trigger(due.getTime()),
        );
      }
    }
  });

/** Logout: nothing scheduled for the previous user should survive. */
export const cancelAllReminders = () =>
  enqueue(() => notifee.cancelAllNotifications());
