import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRecurringApi,
  deleteRecurringApi,
  getRecurringApi,
  payRecurringApi,
  skipRecurringApi,
  updateRecurringApi,
} from '../services/recurringService';
import { queryClient as sharedClient } from '../services/queryClient';
import { syncBillReminders } from '../services/remindersService';
import useAppStore from '../store/useAppStore';
import { queryKeys } from './keys';
import { invalidateTransactionData, markLoggedToday } from './transactions';

export const recurringQuery = {
  queryKey: queryKeys.recurring,
  queryFn: getRecurringApi,
  meta: { persist: true },
};

export const useRecurring = () => useQuery(recurringQuery);

/** Create (no id) or update a recurring bill. */
export const useSaveRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      id ? updateRecurringApi(id, data) : createRecurringApi(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurringApi,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });
};

/**
 * Marks this occurrence paid: the server records a normal transaction and moves
 * the due date on. Sending the due date we saw makes a double tap harmless
 * (the second request is rejected as stale instead of paying the next month).
 */
export const usePayRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bill, amount }) =>
      payRecurringApi(bill._id, {
        dueDate: bill.nextDueDate,
        ...(amount && { amount }),
      }),
    onSuccess: () => {
      markLoggedToday();
      invalidateTransactionData(queryClient);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });
};

export const useSkipRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bill }) =>
      skipRecurringApi(bill._id, { dueDate: bill.nextDueDate }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });
};

/**
 * Rebuilds the local bill reminders from the cached bills (fetching them when
 * they aren't loaded yet). If that fails the existing reminders stay.
 */
export const refreshBillReminders = async () => {
  const { billEnabled } = useAppStore.getState().reminders;
  if (!billEnabled) return syncBillReminders({ enabled: false });
  const bills = await sharedClient.fetchQuery(recurringQuery);
  return syncBillReminders({ enabled: true, bills });
};
