module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // babel-plugin-lucide-icons imports per-icon files that lucide's package
  // "exports" doesn't list; Metro resolves them in metro.config.js, Jest here
  moduleNameMapper: {
    '^lucide-react-native/dist/cjs/icons/(.*)$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1',
  },
  // Most RN libraries ship untranspiled ESM/Flow; let babel-jest handle them
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-google-signin|@notifee|@react-navigation|@sentry|@shopify|posthog-react-native|@posthog|lucide-react-native|react-native-.*|lottie-react-native|gifted-charts-core|zustand|@tanstack)/)',
  ],
};
