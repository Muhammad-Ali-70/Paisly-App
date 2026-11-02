import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStackNavigator from './RootStackNavigator';
import { useToastService } from '../utils/ToastService';
import useAuthStore, { selectPendingAction } from '../store/useAuthStore';
import {
  initializeShortcuts,
  subscribeToShortcuts,
  getInitialShortcut,
} from '../services/appShortcutsService';
import { handleShortcutAction, actionFromUrl } from '../utils/deepLinkHandler';

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

    // paisly:// links, e.g. the widget's "+" button. Same pending-action path
    // as shortcuts, so cold start, warm start and logged-out all behave alike.
    const handleUrl = url => {
      const action = actionFromUrl(url);
      if (action) useAuthStore.getState().setPendingAction(action);
    };
    Linking.getInitialURL().then(url => url && handleUrl(url));
    const linkSubscription = Linking.addEventListener('url', ({ url }) =>
      handleUrl(url),
    );

    return () => {
      if (unsubscribe) unsubscribe();
      linkSubscription.remove();
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
