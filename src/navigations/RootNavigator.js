import React, { useEffect, useMemo } from 'react';
import { Linking } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import RootStackNavigator from './RootStackNavigator';
import useAuthStore, { selectPendingAction } from '../store/useAuthStore';
import { actionFromUrl } from '../utils/deepLinkHandler';
import { useThemeColors } from '@hooks/useThemeColors';
import { useIsDarkMode } from '@hooks/useIsDarkMode';

const RootNavigator = () => {
  const pendingAction = useAuthStore(selectPendingAction);
  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  // Without this, React Navigation paints its own light background, which
  // showed as white corners behind the rounded tab bar in dark mode.
  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surfacePrimary,
        border: colors.outlineVariant,
        primary: colors.primary,
        text: colors.textMain,
      },
    };
  }, [isDark, colors]);

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
    <NavigationContainer theme={navTheme}>
      <RootStackNavigator pendingAction={pendingAction} />
    </NavigationContainer>
  );
};

export default RootNavigator;
