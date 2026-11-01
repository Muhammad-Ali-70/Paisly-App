/* eslint-env jest */
// Native-module mocks for rendering the app under Jest.
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-mmkv', () => {
  const createMMKV = () => {
    const data = new Map();
    return {
      getString: key => data.get(key),
      set: (key, value) => data.set(key, value),
      remove: key => data.delete(key),
      contains: key => data.has(key),
      clearAll: () => data.clear(),
    };
  };
  return { createMMKV };
});

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: component => component,
  ErrorBoundary: ({ children }) => children,
  captureException: jest.fn(),
  mobileReplayIntegration: jest.fn(() => ({})),
  setUser: jest.fn(),
}));

jest.mock('posthog-react-native', () => ({
  PostHogProvider: ({ children }) => children,
  usePostHog: () => ({ capture: jest.fn() }),
}));

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('react-native-quick-actions', () => ({
  setShortcutItems: jest.fn(),
  popInitialAction: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));
