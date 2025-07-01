import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Facebook from "expo-auth-session/providers/facebook";
import { FacebookAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import { createOrFetchUser } from "../api/user";

WebBrowser.maybeCompleteAuthSession();

export const useFacebookAuth = (setUser) => {
  const isAndroid = Platform.OS === "android";

  // const redirectUri = "https://auth.expo.io/@averynov/wardrobe-frontend";
  // const redirectUri = "https://wardrobe-35d51.firebaseapp.com/__/auth/handler";
  // const redirectUri = makeRedirectUri({
  //   scheme: "wardrobe",
  //   path: "redirect",
  //   useProxy: false,
  // });
  // const redirectUri = makeRedirectUri({
  //   scheme: "https://wardrobe-35d51.firebaseapp.com/__/auth/handler",
  // });
  const clientId = Constants.expoConfig.extra.FACEBOOK_APP_ID;
  const redirectUri = makeRedirectUri({
    native: `fb${clientId}://authorize`, // <- NOT wardrobe://…
    useProxy: false, // we’re skipping auth.expo.io
  });

  const [request, response, promptAsync] = Facebook.useAuthRequest(
    {
      clientId: Constants.expoConfig.extra.FACEBOOK_APP_ID,
      scopes: ["public_profile", "email"],
      redirectUri,
    },
    {
      useProxy: false,
      preferEphemeralSession: true,
    }
  );

  useEffect(() => {
    const authenticate = async () => {
      if (response?.type === "success") {
        const { authentication } = response;
        if (!authentication?.accessToken) {
          console.warn("❌ No Facebook access token");
          return;
        }

        try {
          const credential = FacebookAuthProvider.credential(
            authentication.accessToken
          );
          const userCred = await signInWithCredential(auth, credential);
          const backendUser = await createOrFetchUser(userCred.user);

          setUser({ firebase: userCred.user, backend: backendUser });
        } catch (err) {
          console.error("Firebase sign-in failed:", err);
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
