// ✅ LoginScreen.jsx
import React, { useContext } from "react";
import { View, Button, StyleSheet } from "react-native";
import { useGoogleAuth } from "../auth/useGoogleAuth";
import { AuthContext } from "../auth/AuthContext";

export default function LoginScreen() {
  const { setUser } = useContext(AuthContext);
  const { login } = useGoogleAuth(setUser);

  return (
    <View style={styles.container}>
      <Button title="Sign in with Google" onPress={login} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
