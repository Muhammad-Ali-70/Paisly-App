import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStackNavigator from './RootStackNavigator';
import useAuthStore, { selectPendingAction } from '../store/useAuthStore';
import { actionFromUrl } from '../utils/deepLinkHandler';

const RootNavigator = () => {
  const pendingAction = useAuthStore(selectPendingAction);

  useEffect(() => {
    // paisly:// links: launcher shortcuts (res/xml/shortcuts.xml), the home-screen
    // widget and external links. Recorded as a pending action, so cold start,
    // warm start and logged-out all behave alike.
    const handleUrl = url => {
      const action = actionFromUrl(url);
      if (action) useAuthStore.getState().setPendingAction(action);
    };
    Linking.getInitialURL().then(url => url && handleUrl(url));
    const linkSubscription = Linking.addEventListener('url', ({ url }) =>
      handleUrl(url),
    );

    return () => linkSubscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <RootStackNavigator pendingAction={pendingAction} />
    </NavigationContainer>
  );
};

export default RootNavigator;
