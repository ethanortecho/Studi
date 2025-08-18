const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure Metro to resolve @ alias
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@': path.resolve(__dirname),
  },
};

// Also update the watch folders to include the resolved path
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname),
];

module.exports = withNativeWind(config, { input: './global.css' })