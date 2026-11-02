import { parseShortcutType } from '../services/appShortcutsService';

// Only records the intent. PendingActionHandler (mounted inside the signed-in,
// onboarded navigator) runs it once the target routes exist, so it works from a
// cold start (splash still showing), a warm start and before login alike.
export const handleShortcutAction = (shortcutItem, authStore, toastService) => {
  const actionType = parseShortcutType(shortcutItem);

  if (!actionType) {
    console.warn('[DeepLink] Unknown shortcut action:', shortcutItem);
    return;
  }

  if (!authStore.token) {
    toastService.info('Please log in to continue');
  } else if (!authStore.user?.isOnboarded) {
    toastService.info('Please complete onboarding first');
  }

  authStore.setPendingAction(actionType);
};

const URL_ACTIONS = {
  addExpense: 'ADD_EXPENSE',
  addIncome: 'ADD_INCOME',
  history: 'VIEW_HISTORY',
  bills: 'VIEW_BILLS',
  debts: 'VIEW_DEBTS',
  notifications: 'VIEW_NOTIFICATIONS',
};

/** paisly://addExpense and friends (home-screen widget, links) → pending action. */
export const actionFromUrl = url => {
  const match = /^paisly:\/\/([A-Za-z]+)/.exec(url ?? '');
  return (match && URL_ACTIONS[match[1]]) || null;
};

export const executeShortcutNavigation = (actionType, navigation) => {
  if (!navigation) {
    console.warn('[DeepLink] Navigation not ready');
    return;
  }

  try {
    switch (actionType) {
      case 'ADD_EXPENSE':
        if (navigation.navigate) {
          navigation.navigate('AddTransaction', { type: 'expense' });
        }
        break;
      case 'ADD_INCOME':
        if (navigation.navigate) {
          navigation.navigate('AddTransaction', { type: 'income' });
        }
        break;
      case 'VIEW_NOTIFICATIONS':
        navigation.navigate('Notifications');
        break;
      case 'VIEW_BILLS':
        navigation.navigate('TabNavigator', {
          screen: 'User',
          params: { screen: 'RecurringBills' },
        });
        break;
      case 'VIEW_DEBTS':
        navigation.navigate('TabNavigator', {
          screen: 'User',
          params: { screen: 'DebtScreen' },
        });
        break;
      case 'VIEW_HISTORY':
        if (navigation.navigate) {
          navigation.navigate('TabNavigator', {
            screen: 'History',
          });
        }
        break;
      default:
        console.warn('[DeepLink] Unhandled action type:', actionType);
    }
  } catch (error) {
    console.error('[DeepLink] Navigation error:', error);
  }
};

export const executePendingAction = (pendingAction, navigation, clearPendingAction) => {
  if (!pendingAction) return;

  executeShortcutNavigation(pendingAction, navigation);
  clearPendingAction();
};
