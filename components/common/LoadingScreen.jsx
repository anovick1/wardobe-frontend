import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shirt-outline" size={64} color={colors.primary} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  iconContainer: {
    marginBottom: 10,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 16,
  },
});

