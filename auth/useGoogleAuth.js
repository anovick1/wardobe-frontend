// // ✅ useGoogleAuth.js
import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { makeRedirectUri } from "expo-auth-session";

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
  console.log("🔁 Redirect URI:", redirectUri);

  const clientId = isAndroid
    ? Constants.expoConfig.extra.ANDROID_GOOGLE_CLIENT_ID
    : Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID;
  console.log("🔁 Google client ID:", clientId);

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
          console.log("✅ Firebase signed in as:", userCred.user?.email);

          const backendUser = await createOrFetchUser(userCred.user);
          console.log("✅ Backend user:", backendUser);

          setUser({ firebase: userCred.user, backend: backendUser });
        } catch (err) {
          console.error("❌ Firebase sign-in or backend sync failed:", err);
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
