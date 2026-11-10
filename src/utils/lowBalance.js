import { Alert } from 'react-native';
import { ACTIVE_CURRENCY, formatAmount } from './currency';

// Spending may take an account below zero: tracked balances drift from the
// real bank/wallet, and refusing to log real spending is worse than a warning.
// Transfers are the exception (moving money you don't have makes no sense).

const formatSigned = n =>
  `${n < 0 ? '-' : ''}${ACTIVE_CURRENCY.symbol} ${formatAmount(
    String(Math.round(Math.abs(n))),
  )}`;

/** "This will put HBL at -Rs 500." when `delta` takes the account negative, else null. */
export const lowBalanceWarning = (account, delta) => {
  if (!account) return null;
  const before = account.balance ?? 0;
  const after = before + delta;
  // Only warn when this change is what pushes it (further) below zero
  if (after >= 0 || delta >= 0) return null;
  return `This will put ${account.label} at ${formatSigned(after)}.`;
};

/** Resolves true to go ahead; asks first only when the balance would go negative. */
export const confirmLowBalance = (account, delta) =>
  new Promise(resolve => {
    const warning = lowBalanceWarning(account, delta);
    if (!warning) {
      resolve(true);
      return;
    }
    Alert.alert(
      'Not enough balance',
      `${warning} Save anyway?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Save anyway', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
