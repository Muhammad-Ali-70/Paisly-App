module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // Most RN libraries ship untranspiled ESM/Flow; let babel-jest handle them
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@sentry|@shopify|posthog-react-native|@posthog|lucide-react-native|react-native-.*|lottie-react-native|gifted-charts-core|zustand|@tanstack)/)',
  ],
};
