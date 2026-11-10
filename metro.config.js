const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const path = require('path');
const {withSentryConfig} = require('@sentry/react-native/metro');

const defaultConfig = getDefaultConfig(__dirname);
const {assetExts, sourceExts} = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve(
      'react-native-svg-transformer/react-native',
    ),
  },
  resolver: {
    // babel-plugin-lucide-icons rewrites icon imports to these per-icon files.
    // lucide's package "exports" only lists the barrel, so resolve them as
    // plain files (otherwise Metro warns for every icon before falling back).
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('lucide-react-native/dist/cjs/icons/')) {
        return {
          type: 'sourceFile',
          filePath: path.join(__dirname, 'node_modules', moduleName),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    alias: {
      '@assets': __dirname + '/src/assets',
      '@components': __dirname + '/src/components',
      '@constants': __dirname + '/src/constants',
      '@contexts': __dirname + '/src/contexts',
      '@database': __dirname + '/src/database',
      '@hooks': __dirname + '/src/hooks',
      '@navigations': __dirname + '/src/navigations',
      '@screens': __dirname + '/src/screens',
      '@services': __dirname + '/src/services',
      '@store': __dirname + '/src/store',
      '@utils': __dirname + '/src/utils',
    },
  },
};

module.exports = withSentryConfig(mergeConfig(defaultConfig, config));
