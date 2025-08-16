const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce file watcher usage to prevent ENOSPC errors
config.watchFolders = [__dirname];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize watcher settings
config.watcher = {
  ...config.watcher,
  additionalExts: ['ts', 'tsx'],
  watchman: false, // Disable watchman since it's not available
  healthCheck: {
    enabled: false
  }
};

// Reduce the scope of what Metro watches
config.resolver.blacklistRE = /node_modules\/.*\/node_modules\/react-native\/.*/;

module.exports = config;