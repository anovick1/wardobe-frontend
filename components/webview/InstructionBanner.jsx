import React from "react";
import { View, Text, StyleSheet } from "react-native";

const InstructionBanner = ({ text }) => (
  <View style={styles.instructionBanner}>
    <Text style={styles.instructionText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  instructionBanner: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  instructionText: {
    color: "#333",
    fontSize: 15,
    textAlign: "center",
  },
});

export default InstructionBanner;
