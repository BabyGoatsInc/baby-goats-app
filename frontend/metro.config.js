const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude unnecessary directories from file watching to prevent ENOSPC errors
config.watchFolders = [__dirname];
config.resolver.blacklistRE = /(.*)\/(__tests__|android|ios|build|dist|.git|node_modules\/.*\/android|node_modules\/.*\/ios|node_modules\/.*\/windows|node_modules\/.*\/macos)(\/.*)?$/;

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 1;

// Disable watchman since it's not available in this environment
config.watcher = {
  watchman: {
    deferStates: ['hg.update'],
  },
  healthCheck: {
    enabled: false,
  },
  additionalExts: ['ts', 'tsx'],
};

// Optimize resolver to reduce file system operations
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
