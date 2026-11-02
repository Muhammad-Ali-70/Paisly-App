import { useCallback } from 'react';
import { Alert } from 'react-native';
import { usePayRecurring, useSkipRecurring } from '../queries/recurring';
import { useToastService } from '../utils/ToastService';
import { ACTIVE_CURRENCY, formatAmount } from '../utils/currency';

const money = n =>
  `${ACTIVE_CURRENCY.symbol} ${formatAmount(String(Math.round(n)))}`;

/**
 * "Paid" / "Skip" for a recurring bill, shared by the bills list and Home.
 * Paying moves money, so it asks first; the server rejects a repeated request
 * for the same due date, so a double tap can't pay twice.
 */
const usePayBill = () => {
  const toast = useToastService();
  const pay = usePayRecurring();
  const skip = useSkipRecurring();

  const failed = error => {
    const message = error?.message ?? 'Something went wrong. Please try again.';
    if (message === 'Insufficient balance.') {
      toast.warning('Insufficient balance in the bill’s account.');
    } else {
      toast.error(message);
    }
  };

  const confirmPaid = useCallback(
    bill => {
      const verb = bill.type === 'income' ? 'received' : 'paid';
      Alert.alert(
        `Mark ${bill.title} as ${verb}?`,
        `${money(bill.amount)} will be recorded${
          bill.accountId?.label ? ` in ${bill.accountId.label}` : ''
        } and the next due date set.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: bill.type === 'income' ? 'Received' : 'Paid',
            onPress: () =>
              pay.mutate(
                { bill },
                {
                  onSuccess: () => toast.success(`${bill.title} recorded`),
                  onError: failed,
                },
              ),
          },
        ],
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pay, toast],
  );

  const confirmSkip = useCallback(
    bill => {
      Alert.alert(
        `Skip ${bill.title} this time?`,
        'Nothing is recorded; the next due date is set.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip',
            onPress: () =>
              skip.mutate({ bill }, { onError: failed }),
          },
        ],
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skip, toast],
  );

  return { confirmPaid, confirmSkip, busy: pay.isPending || skip.isPending };
};

export default usePayBill;
