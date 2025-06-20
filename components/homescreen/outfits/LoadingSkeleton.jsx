import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function LoadingSkeleton({ text = "Loading..." }) {
  return (
    <View style={styles.container}>
      <View style={styles.imageSkeletonContainer}>
        <View style={styles.imageSkeleton}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.loadingText}>{text}</Text>
        <View style={styles.textSkeleton} />
        <View style={[styles.textSkeleton, { width: "70%" }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    alignSelf: "stretch",
  },
  imageSkeletonContainer: {
    marginBottom: 16,
  },
  imageSkeleton: {
    width: "100%",
    height: 200,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  textSkeleton: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    width: "100%",
  },
});
