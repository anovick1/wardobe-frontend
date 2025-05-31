// ✅ useGoogleAuth.js
import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import Constants from "expo-constants";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();
export const useGoogleAuth = (setUser) => {
  const redirectUri = makeRedirectUri({
    scheme: Constants.expoConfig.scheme,
    useProxy: false,
  });
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID,
    redirectUri,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    const authenticate = async () => {
      if (response?.type === "success") {
        const { authentication } = response;

        if (!authentication?.idToken) {
          console.warn("\u274C No ID token from Google");
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

          // Merge both into context (up next in step 3)
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
