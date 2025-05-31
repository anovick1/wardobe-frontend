// import { useEffect } from "react";
// import * as WebBrowser from "expo-web-browser";
// import * as Google from "expo-auth-session/providers/google";
// import { makeRedirectUri } from "expo-auth-session";
// import Constants from "expo-constants";

// WebBrowser.maybeCompleteAuthSession();

// export const useGoogleAuth = (setUser) => {
//   const redirectUri = makeRedirectUri({
//     scheme: Constants.expoConfig.scheme,
//     useProxy: false,
//   });

//   console.log("🧪 init values:");
//   console.log(
//     "→ iosClientId:",
//     Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID
//   );
//   console.log("→ redirectUri:", redirectUri);

//   const [request, response, promptAsync] = Google.useAuthRequest({
//     iosClientId: Constants.expoConfig.extra.IOS_GOOGLE_CLIENT_ID,
//     redirectUri,
//     scopes: ["profile", "email"],
//   });

//   console.log("🧪 request:", request);
//   console.log("🧪 response:", response);

//   useEffect(() => {
//     if (!response) return;

//     console.log("🧪 Google response:", response);

//     if (response.type === "error") {
//       console.error("❌ Google sign-in error:", response.error);
//     }

//     if (response.type === "success") {
//       const { authentication } = response;
//       console.log("✅ Got auth response:", authentication);

//       if (!authentication?.idToken) {
//         console.warn("❌ Missing idToken in authentication response");
//         return;
//       }
//     }
//   }, [response]);

//   return {
//     login: () => promptAsync(),
//     ready: !!request,
//   };
// };

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
          console.log("\u2705 Firebase signed in as:", userCred.user?.email);
          setUser(userCred.user);
        } catch (err) {
          console.error("\u274C Firebase sign-in failed:", err);
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
