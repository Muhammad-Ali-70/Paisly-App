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
  const navigationRef = React.useRef();
  const toast = useToastService();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const pendingAction = useAuthStore(selectPendingAction);

  useEffect(() => {
    initializeShortcuts();

    getInitialShortcut().then(shortcutItem => {
      if (shortcutItem && navigationRef.current) {
        handleShortcutAction(
          shortcutItem,
          navigationRef.current,
          useAuthStore.getState(),
          toastRef.current,
        );
      }
    });

    const handleShortcut = shortcutItem => {
      if (navigationRef.current) {
        handleShortcutAction(
          shortcutItem,
          navigationRef.current,
          useAuthStore.getState(),
          toastRef.current,
        );
      }
    };

    const unsubscribe = subscribeToShortcuts(handleShortcut);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  // Run once: read auth state at call time instead of subscribing to the whole
  // store, which re-ran this effect on every auth change (e.g. isLoading).
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStackNavigator pendingAction={pendingAction} />
    </NavigationContainer>
  );
};

export default RootNavigator;
