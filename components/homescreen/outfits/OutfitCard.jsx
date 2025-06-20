import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useWeather } from "../../../contexts/WeatherContext";

export default function OutfitCard({
  imageUrl,
  title,
  explanation,
  onNewLook,
  loading = false,
}) {
  const { weather, city } = useWeather();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Ensemble</Text>

      <View style={styles.weatherInfo}>
        <Text style={styles.weatherEmoji}>☀️</Text>
        <Text style={styles.weatherText}>
          {city || "Your location"} • {weather?.weather_description || "Clear"},{" "}
          {weather?.temperature || "22"}°{weather?.temperature ? "F" : "C"}
        </Text>
      </View>

      <View style={styles.outfitContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.outfitImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Generating outfit...</Text>
          </View>
        )}

        <Text style={styles.outfitTitle}>{title || "Perfect Daily Look"}</Text>

        <Text style={styles.outfitDescription}>
          {explanation ||
            "Comfortable and stylish for a casual day. Perfect outfit tailored for today's weather and your schedule."}
        </Text>

        <TouchableOpacity
          style={[styles.wearButton, loading && styles.wearButtonDisabled]}
          onPress={onNewLook}
          disabled={loading}
        >
          <Text style={styles.wearButtonText}>
            {loading ? "Generating..." : "New Look"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Complete the Look section removed per design update */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    alignSelf: "stretch",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  weatherEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  weatherText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  outfitContainer: {},
  outfitImage: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderText: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "500",
  },
  outfitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  outfitDescription: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 18,
    marginBottom: 16,
  },
  wearButton: {
    backgroundColor: "#1f2937",
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  wearButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  wearButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
