const { getDefaultConfig } = require('@expo/metro-config');

// Get the default config and just export it without any custom modifications
module.exports = getDefaultConfig(__dirname, {
  // Reset to default resolver
  resolver: {},
  // Reset to default transformer
  transformer: {},
  // Reset to default serializer  
  serializer: {},
});
