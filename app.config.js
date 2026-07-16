/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "exposhop",
  slug: "exposhop",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  icon: "./assets/images/icon.png",
  updates: {
    url: "https://u.expo.dev/b47648ab-c041-49f6-8246-4f90c83da126",
  },
  runtimeVersion: "1.0.0",
  extra: {
    eas: {
      projectId: "b47648ab-c041-49f6-8246-4f90c83da126",
    },
    saleorApi: process.env.SALEOR_API_URL || "",
    stripePK: process.env.STRIPE_PK || "",
    channel: process.env.CHANNEL || "",
    locale: process.env.LOCALE?.split(",") || [],
    appName: process.env.APP_NAME || "",
    /** Minutes before departure after which the trip can no longer be sold (default 60). */
    bookingCutoffMinutesBeforeDeparture:
      parseInt(process.env.BOOKING_CUTOFF_MINUTES_BEFORE_DEPARTURE ?? "60", 10) || 60,
  },
  plugins: [
    "expo-font",
    "expo-router",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#A6C65A",
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        ios: {
          image: "./assets/images/splash.png",
          backgroundColor: "#A6C65A",
          resizeMode: "contain",
        },
        android: {
          image: "./assets/images/splash.png",
          backgroundColor: "#A6C65A",
          resizeMode: "contain",
        },
      },
    ],
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "",
        enableGooglePay: false,
      },
    ],
  ],
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#A6C65A",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vaflaly.exposhop",
  },
  android: {
    package: "com.vaflaly.exposhop",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#A6C65A",
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png",
  },
};
