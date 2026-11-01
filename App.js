import React from 'react';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';
import { ENV } from './src/config/env';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { StatusBar, View, StyleSheet } from 'react-native';
import useAppStore from '@store/useAppStore';
import { useThemeColors } from '@hooks/useThemeColors';
import ToastCustomProvider from '@contexts/ToastProvider.js';
import RootNavigator from '@navigations/RootNavigator.js';
import { initSentry } from '@services/sentry.js';
import { Label } from '@constants/globalstyle.js';
import PrimaryButton from './src/components/ui/PrimaryButton';

initSentry();

const ErrorFallback = ({ resetError }) => {
  const theme = useThemeColors();
  return (
    <View
      style={[fallbackStyles.container, { backgroundColor: theme.background }]}
    >
      <Label
        type="displayMd"
        weight="bold"
        color="textMain"
        style={fallbackStyles.emoji}
      >
        ⚠️
      </Label>
      <Label
        type="h3"
        weight="semiBold"
        color="textMain"
        style={fallbackStyles.title}
      >
        Something went wrong
      </Label>
      <Label type="body" color="textMuted" style={fallbackStyles.subtitle}>
        The error has been reported. Please restart the app.
      </Label>
      <PrimaryButton
        variant="primary"
        size="lg"
        label="Try Again"
        onPress={resetError}
      />
    </View>
  );
};

const AppContent = () => {
  const theme = useAppStore(state => state.theme);
  const colors = useThemeColors();
  const barStyle = theme === 'dark' ? 'light-content' : 'dark-content';

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <SafeAreaView
        edges={['top']}
        style={{ backgroundColor: colors.background }}
      />
      <View
        style={[styles.mainContainer, { backgroundColor: colors.background }]}
      >
        <StatusBar hidden={false} barStyle={barStyle} translucent />
        <RootNavigator />
      </View>
      <SafeAreaView
        edges={['bottom']}
        style={{ backgroundColor: colors.surfacePrimary }}
      />
    </View>
  );
};

// Analytics only initializes with a real key in .env (POSTHOG_KEY)
const hasPostHogKey =
  !!ENV.POSTHOG_KEY && !ENV.POSTHOG_KEY.includes('your_posthog_key');

const AnalyticsProvider = ({ children }) => {
  if (!hasPostHogKey) return children;
  return (
    <PostHogProvider
      apiKey={ENV.POSTHOG_KEY}
      options={{
        host: ENV.POSTHOG_HOST,
        captureAppLifecycleEvents: true,
      }}
    >
      {children}
    </PostHogProvider>
  );
};

const App = () => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          {/* Draw under both system bars on every Android version, matching the
              edge-to-edge mode Android 15+ enforces, so keyboard insets behave
              identically across devices. The SafeAreaViews in AppContent pad. */}
          <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
            <AnalyticsProvider>
              <ToastCustomProvider>
                <AppContent />
              </ToastCustomProvider>
            </AnalyticsProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Sentry.ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContainer: { flex: 1 },
});

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emoji: { marginBottom: 8 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 22, marginBottom: 8 },
});

export default Sentry.wrap(App);
