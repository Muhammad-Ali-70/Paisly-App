import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootStackNavigator from './RootStackNavigator';
import { useToastService } from '../utils/ToastService';
import useAuthStore, { selectPendingAction } from '../store/useAuthStore';
import {
  initializeShortcuts,
  subscribeToShortcuts,
  getInitialShortcut,
} from '../services/appShortcutsService';
import { handleShortcutAction } from '../utils/deepLinkHandler';

const RootNavigator = () => {
  const toast = useToastService();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const pendingAction = useAuthStore(selectPendingAction);

  useEffect(() => {
    initializeShortcuts();

    const handleShortcut = shortcutItem =>
      handleShortcutAction(
        shortcutItem,
        useAuthStore.getState(),
        toastRef.current,
      );

    getInitialShortcut().then(shortcutItem => {
      if (shortcutItem) handleShortcut(shortcutItem);
    });

    const unsubscribe = subscribeToShortcuts(handleShortcut);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  // Run once: read auth state at call time instead of subscribing to the whole
  // store, which re-ran this effect on every auth change (e.g. isLoading).
  }, []);

  return (
    <NavigationContainer>
      <RootStackNavigator pendingAction={pendingAction} />
    </NavigationContainer>
  );
};

export default RootNavigator;
