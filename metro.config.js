const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Avoid Watchman FSEventStreamStart crashes on this machine; Metro falls back to Node crawler.
config.useWatchman = false;

// @stripe/stripe-react-native is native-only. Expo Router still bundles checkout.tsx for web.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "@stripe/stripe-react-native") {
    return {
      filePath: path.resolve(__dirname, "shims/stripe-react-native.web.js"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
