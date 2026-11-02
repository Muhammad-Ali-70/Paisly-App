import { calendarDay } from './safeToSpend';

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = n => String(n).padStart(2, '0');

export const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

/** The API takes plain calendar days, never timestamps. */
export const toDayString = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Whole days until the bill's due date (negative once overdue). */
export const daysUntilDue = (bill, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((calendarDay(bill.nextDueDate) - today) / DAY_MS);
};

export const dueLabel = days => {
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
};

/** Active bills due within `withinDays` (overdue ones included), soonest first. */
export const billsDueSoon = (bills, withinDays = 7, now = new Date()) =>
  (bills ?? [])
    .filter(b => b.isActive && daysUntilDue(b, now) <= withinDays)
    .sort((a, b) => daysUntilDue(a, now) - daysUntilDue(b, now));
