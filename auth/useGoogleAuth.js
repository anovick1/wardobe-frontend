import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (setUser) => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    const authenticate = async () => {
      if (response?.type === "success") {
        const { authentication } = response;

        if (!authentication?.idToken) {
          console.warn("❌ No ID token in response");
          return;
        }

        const credential = GoogleAuthProvider.credential(
          authentication.idToken
        );
        const userCred = await signInWithCredential(auth, credential);
        console.log("🔥 Firebase signed in:", userCred.user?.email);
        setUser(userCred.user);
      }
    };

    authenticate();
  }, [response]);

  return {
    login: () => promptAsync(),
    ready: !!request,
  };
};
