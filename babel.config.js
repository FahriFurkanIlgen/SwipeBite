module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // SDK 54 + Reanimated 4: babel-preset-expo wires the worklets plugin
    // automatically when react-native-reanimated is installed.
  };
};
