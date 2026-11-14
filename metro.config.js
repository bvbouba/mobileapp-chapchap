const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Avoid Watchman FSEventStreamStart crashes on this machine; Metro falls back to Node crawler.
config.useWatchman = false;

module.exports = config;
