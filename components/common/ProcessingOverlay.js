// components/common/ProcessingOverlay.js
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function ProcessingOverlay() {
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Processing image…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // always on top
  },
  box: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  text: { marginTop: 15, fontSize: 16 },
});
