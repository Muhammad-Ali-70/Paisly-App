import { Platform, DeviceEventEmitter } from 'react-native';
import QuickActions from 'react-native-quick-actions';

export const SHORTCUT_TYPES = {
  ADD_EXPENSE: 'com.paisly.app.addExpense',
  ADD_INCOME: 'com.paisly.app.addIncome',
  VIEW_HISTORY: 'com.paisly.app.viewHistory',
};

export const initializeShortcuts = () => {
  try {
    const shortcuts = [
      {
        type: SHORTCUT_TYPES.ADD_EXPENSE,
        title: 'Add Expense',
        subtitle: 'Add a new expense',
        icon: Platform.select({ ios: 'Compose', android: 'ic_shortcut_expense' }),
        userInfo: { url: 'paisly://addExpense' },
      },
      {
        type: SHORTCUT_TYPES.ADD_INCOME,
        title: 'Add Income',
        subtitle: 'Add a new income',
        icon: Platform.select({ ios: 'Add', android: 'ic_shortcut_income' }),
        userInfo: { url: 'paisly://addIncome' },
      },
      {
        type: SHORTCUT_TYPES.VIEW_HISTORY,
        title: 'View History',
        subtitle: 'View transaction history',
        icon: Platform.select({ ios: 'Time', android: 'ic_shortcut_history' }),
        userInfo: { url: 'paisly://history' },
      },
    ];

    QuickActions.setShortcutItems(shortcuts);
  } catch (error) {
    console.error('[AppShortcuts] Error initializing shortcuts:', error);
  }
};

// Warm-start shortcuts only. The launch shortcut comes from getInitialShortcut(),
// which must not be repeated here or a cold start would handle it twice.
export const subscribeToShortcuts = callback => {
  try {
    const listener = DeviceEventEmitter.addListener('quickActionShortcut', callback);
    return () => listener.remove();
  } catch (error) {
    console.error('[AppShortcuts] Error subscribing to shortcuts:', error);
    return () => {};
  }
};

export const unsubscribeFromShortcuts = () => {
  try {
    QuickActions.clearShortcutItems();
  } catch (error) {
    console.error('[AppShortcuts] Error unsubscribing from shortcuts:', error);
  }
};

// popInitialAction doesn't clear the launch intent (it stays on the Activity), so
// every call returns the same shortcut. Read it once per JS runtime.
let initialShortcutRead = false;

export const getInitialShortcut = async () => {
  if (initialShortcutRead) return null;
  initialShortcutRead = true;
  try {
    const action = await QuickActions.popInitialAction();
    return action || null;
  } catch (error) {
    console.error('[AppShortcuts] Error getting initial shortcut:', error);
    return null;
  }
};

export const parseShortcutType = shortcutItem => {
  if (!shortcutItem) return null;

  const type = shortcutItem.type;

  switch (type) {
    case SHORTCUT_TYPES.ADD_EXPENSE:
      return 'ADD_EXPENSE';
    case SHORTCUT_TYPES.ADD_INCOME:
      return 'ADD_INCOME';
    case SHORTCUT_TYPES.VIEW_HISTORY:
      return 'VIEW_HISTORY';
    default:
      return null;
  }
};
