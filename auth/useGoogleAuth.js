// // ✅ useGoogleAuth.js
import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import { createOrFetchUser } from "../api/user";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (setUser) => {
  const isAndroid = Platform.OS === "android";

  const redirectUri = makeRedirectUri({
    scheme: isAndroid
      ? `com.googleusercontent.apps.${
          Constants.expoConfig.extra.ANDROID_GOOGLE_CLIENT_ID.split(".apps")[0]
        }`
      : `com.googleusercontent.apps.${
          Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID.split(".apps")[0]
        }`,

    useProxy: !isAndroid,
  });

  const clientId = isAndroid
    ? Constants.expoConfig.extra.ANDROID_GOOGLE_CLIENT_ID
    : Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    redirectUri,
    scopes: ["profile", "email"],
    useProxy: !isAndroid,
  });

  useEffect(() => {
    const authenticate = async () => {
      if (response?.type === "success") {
        const { authentication } = response;
        if (!authentication?.idToken) {
          console.warn("❌ No ID token from Google");
          return;
        }

        try {
          const credential = GoogleAuthProvider.credential(
            authentication.idToken
          );
          const userCred = await signInWithCredential(auth, credential);

          const backendUser = await createOrFetchUser(userCred.user);

          setUser({ firebase: userCred.user, backend: backendUser });
        } catch (err) {
          console.error("Firebase sign-in or backend sync failed:", err);
        }
      }
    };

    authenticate();
  }, [response]);

  return {
    login: () => promptAsync(),
    ready: !!request,
  };
};
