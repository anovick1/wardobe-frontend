import "dotenv/config";
const devIP = process.env.DEV_API_IP;

export default {
  expo: {
    name: "wardrobe",
    slug: "wardrobe-frontend",
    owner: "averynov",
    version: "1.0.0",
    sdkVersion: "53.0.0",
    scheme: [
      "wardrobe",
      `com.googleusercontent.apps.${
        process.env.IOS_GOOGLE_CLIENT_ID.split(".apps")[0]
      }`,
      `com.googleusercontent.apps.${
        process.env.ANDROID_GOOGLE_CLIENT_ID.split(".apps")[0]
      }`,
      `fb${process.env.FACEBOOK_APP_ID}`,
    ], // 👈 required for native auth
    facebookAppId: `fb${process.env.FACEBOOK_APP_ID}`,
    facebookDisplayName: "Wardrobe",
    facebookScheme: `fb${process.env.FACEBOOK_APP_ID}`,
    ios: {
      bundleIdentifier: "com.wardrobefrontend", // 👈 must match Google OAuth iOS client
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsArbitraryLoadsInWebContent: true,
          NSExceptionDomains: {
            "oauth2.googleapis.com": {
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: false,
            },
          },
        },
        NSLocationWhenInUseUsageDescription:
          "This app needs access to your location to show weather-based outfit suggestions.",
        NSCalendarsUsageDescription:
          "This app needs calendar access to add outfit plans to your schedule.",
        NSRemindersUsageDescription:
          "This app uses reminders to help you plan outfits for events.", // 👈 ADD THIS
      },
    },
    android: {
      package: "com.wardrobefrontend", // 👈 optional, for Android if needed,
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "CAMERA", // for launchCameraAsync
        "READ_MEDIA_IMAGES", // scoped storage on Android 13+
        "READ_CALENDAR",
        "WRITE_CALENDAR",
      ],
      edgeToEdgeEnabled: true,
    },
    extra: {
      FLASK_API_BASE_URL: process.env.FLASK_API_BASE_URL,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      WEB_GOOGLE_CLIENT_ID: process.env.WEB_GOOGLE_CLIENT_ID,
      IOS_GOOGLE_CLIENT_ID: process.env.IOS_GOOGLE_CLIENT_ID,
      ANDROID_GOOGLE_CLIENT_ID: process.env.ANDROID_GOOGLE_CLIENT_ID,
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    },
  },
};
