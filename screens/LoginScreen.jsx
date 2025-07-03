import React, { useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useGoogleAuth } from "../auth/useGoogleAuth";
import { useFacebookAuth } from "../auth/useFacebookAuth";
import { AuthContext } from "../auth/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import typography from "../styles/typography";
import globalStyles from "../styles/global";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LoadingScreen from "../components/common/LoadingScreen";
// If you have a local Google G icon, import it here:
// import GoogleG from "../assets/google_g.png";

export default function LoginScreen() {
  const { setUser } = useContext(AuthContext);

  const { login: loginWithGoogle, signingIn: googleSigningIn } = useGoogleAuth(setUser);
  const { login: loginWithFacebook, signingIn: facebookSigningIn } = useFacebookAuth(setUser);

  const isSigningIn = googleSigningIn || facebookSigningIn;

  if (isSigningIn) {
    return <LoadingScreen message="Signing you in..." />;
  }

  return (
    <SafeAreaView
      style={[globalStyles.container, styles.container]}
      edges={["top", "left", "right"]}
    >
      <Text style={[typography.title, { marginBottom: 40 }]}>
        Sign in to Wardrobe
      </Text>
      <TouchableOpacity
        style={[
          styles.button, 
          styles.googleButton,
          isSigningIn && styles.buttonDisabled
        ]}
        onPress={loginWithGoogle}
        disabled={isSigningIn}
      >
        {/* Use local Google G icon if available, else fallback to icon */}
        {/* <Image source={GoogleG} style={styles.googleIcon} /> */}
        {googleSigningIn ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <Icon
            name="google"
            size={22}
            color="#4285F4"
            style={styles.googleIcon}
          />
        )}
        <Text style={styles.googleButtonText}>
          {googleSigningIn ? "Signing in..." : "Sign in with Google"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button, 
          styles.facebookButton,
          isSigningIn && styles.buttonDisabled
        ]}
        onPress={loginWithFacebook}
        disabled={isSigningIn}
      >
        {facebookSigningIn ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon
            name="facebook"
            size={22}
            color="#fff"
            style={styles.buttonIcon}
          />
        )}
        <Text style={styles.buttonText}>
          {facebookSigningIn ? "Signing in..." : "Sign in with Facebook"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginVertical: 10,
    width: 260,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dadce0",
  },
  googleButtonText: {
    color: "#3c4043",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  googleIcon: {
    marginRight: 2,
    marginLeft: -4,
  },
  facebookButton: {
    backgroundColor: "#1877f3",
    borderWidth: 0,
    borderColor: "transparent",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
