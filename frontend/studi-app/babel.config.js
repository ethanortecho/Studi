module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NativeWind needs this; order is fine here.
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  };
};