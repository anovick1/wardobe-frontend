import React from "react";
import { Modal, View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function ProcessingModal({ visible }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" />
          <Text style={styles.text}>Processing image...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  box: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: "#333",
  },
});
