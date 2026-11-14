/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "ChapChap Tickets",
  slug: "exposhop",
  version: "1.0.0",
  orientation: "default",
  scheme: "chapchap-tickets",
  userInterfaceStyle: "automatic",
  owner: "vaflaly",
  icon: "./assets/images/icon.png",
  runtimeVersion: "1.0.0",
  updates: {
    url: "https://u.expo.dev/b47648ab-c041-49f6-8246-4f90c83da126",
    enabled: false,
    checkAutomatically: "NEVER",
    fallbackToCacheTimeout: 0,
  },
  extra: {
    eas: {
      projectId: "b47648ab-c041-49f6-8246-4f90c83da126",
    },
    saleorApi:
      process.env.EXPO_PUBLIC_SALEOR_API_URL ||
      process.env.SALEOR_API_URL ||
      "https://server.chapchapticket.com/graphql/",
    stripePK: process.env.STRIPE_PK || "",
    channel: process.env.CHANNEL || "ci",
    locale: process.env.LOCALE?.split(",") || ["fr"],
    appName: process.env.APP_NAME || "ChapChap Tickets",
    privacyPolicyUrl: "https://www.chapchapticket.com/ci/privacy-policy",
    termsUrl: "https://www.chapchapticket.com/ci/conditions",
    accountDeletionUrl: "https://www.chapchapticket.com/ci/accountDeletion",
    /** Minutes before departure after which the trip can no longer be sold (default 60). */
    bookingCutoffMinutesBeforeDeparture:
      parseInt(process.env.BOOKING_CUTOFF_MINUTES_BEFORE_DEPARTURE ?? "60", 10) ||
      60,
  },
  plugins: [
    "expo-font",
    "expo-router",
    "expo-web-browser",
    "expo-secure-store",
    "expo-screen-orientation",
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "ChapChap utilise Face ID pour vous reconnecter rapidement et en sécurité.",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#A6C65A",
        image: "./assets/images/splash-logo.png",
        imageWidth: 280,
        resizeMode: "contain",
        ios: {
          image: "./assets/images/splash-logo.png",
          backgroundColor: "#A6C65A",
          resizeMode: "contain",
        },
        android: {
          image: "./assets/images/splash-logo.png",
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
    image: "./assets/images/splash-logo.png",
    resizeMode: "contain",
    backgroundColor: "#A6C65A",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vaflaly.exposhop",
    buildNumber: "3",
    icon: "./assets/images/icon.png",
    infoPlist: {
      CFBundleDisplayName: "ChapChap Tickets",
      ITSAppUsesNonExemptEncryption: false,
      UIViewControllerBasedStatusBarAppearance: true,
      NSFaceIDUsageDescription:
        "ChapChap utilise Face ID pour vous reconnecter rapidement et en sécurité.",
      NSCameraUsageDescription:
        "ChapChap peut utiliser l'appareil photo uniquement si une fonctionnalité de paiement ou de scan l'exige.",
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhoneNumber",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePaymentInfo",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherUserContent",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
      ],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1", "3B52.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
      ],
    },
  },
  android: {
    package: "com.vaflaly.exposhop",
    versionCode: 8,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#A6C65A",
    },
    // Production traffic is HTTPS only (Saleor + storefront).
    usesCleartextTraffic: false,
    // expo-location / maps are not used — strip leftover permissions for Play review.
    blockedPermissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
    ],
    permissions: [
      "android.permission.INTERNET",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
      "android.permission.VIBRATE",
    ],
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png",
  },
};
