import React, { useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useGoogleAuth } from "../auth/useGoogleAuth";
import { useFacebookAuth } from "../auth/useFacebookAuth";
import { AuthContext } from "../auth/AuthContext";

export default function LoginScreen() {
  const { setUser } = useContext(AuthContext);

  const { login: loginWithGoogle } = useGoogleAuth(setUser);
  const { login: loginWithFacebook } = useFacebookAuth(setUser); // make sure this is returned

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={loginWithGoogle}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          console.log("👉 Facebook Login Pressed");
          loginWithFacebook();
        }}
      >
        <Text style={styles.buttonText}>Sign in with Facebook</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007aff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
