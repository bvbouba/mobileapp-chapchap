module.exports = {
    "name": "exposhop",
    "slug": "exposhop",
    "version": "1.0.0",
    "updates": {
        "url": "https://u.expo.dev/b47648ab-c041-49f6-8246-4f90c83da126"
    },
    "runtimeVersion": {
        "policy": "appVersion"
    },
    "extra": {
        "eas": {
            "projectId": "b47648ab-c041-49f6-8246-4f90c83da126"
        },
        saleorApi: process.env.SALEOR_API_URL || "",
        stripePK: process.env.STRIPE_PK || "",
        channel: process.env.CHANNEL || "",
        locale: process.env.LOCALE?.split(",") || [],
        appName: process.env.APP_NAME || "",
    },
    "plugins": [
        "expo-font",
        "expo-router",
        "expo-web-browser",
        [
            "@stripe/stripe-react-native",
            {
                "merchantIdentifier": "",
                "enableGooglePay": false
            }
        ]
    ],
    "name": "exposhop",
    "slug": "exposhop",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {
        "image": "./assets/images/saleor-splash.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
        "**/*"
    ],
    "ios": {
        "supportsTablet": true
    },
    "android": {
        "adaptiveIcon": {
            "foregroundImage": "./assets/images/adaptive-icon.png",
            "backgroundColor": "#ffffff"
        }
    },
    "web": {
        "bundler": "metro",
        "favicon": "./assets/images/favicon.png"
    }
};