import * as Sentry from '@sentry/react-native';
import { ENV } from '../config/env';

export function initSentry() {
  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    // Off: avoids sending IP/device identifiers (Play Store Data Safety)
    sendDefaultPii: false,
    enableLogs: true,
    enabled: !ENV.IS_DEV,
    tracesSampleRate: 0.2,
    // Finance app: no routine session recording. Replays are captured only
    // around an error (still masked), which is what debugging needs.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
      }),
    ],
  });
}

export function setSentryUser(user) {
  Sentry.setUser({ id: user._id, email: user.email });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

export function captureError(error, context = {}) {
  Sentry.captureException(error, { extra: context });
}
