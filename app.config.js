import "dotenv/config";

export default {
  expo: {
    name: "Wardrobe",
    slug: "wardrobe-frontend",
    owner: "averynov",
    version: "1.0.0",
    sdkVersion: "53.0.0",
    scheme:
      "com.googleusercontent.apps.809628732165-1ed16gps96nb0agc7eagn6l2j6ef72t4", // 👈 required for native auth
    ios: {
      bundleIdentifier: "com.wardrobefrontend", // 👈 must match Google OAuth iOS client
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "oauth2.googleapis.com": {
              NSIncludesSubdomains: true,
              NSExceptionRequiresForwardSecrecy: false,
            },
          },
        },
      },
    },
    android: {
      package: "com.wardrobefrontend", // 👈 optional, for Android if needed
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
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
    },
  },
};
